import type { RegistrationConfig } from '../src/data/registrations.ts';
import type { StripeCharge, StripeCheckoutSession, StripeClient, StripePaymentIntent } from './stripe.ts';
import { readGuests, type Guest } from './validation.ts';

// Stripe is the system of record. Every board view, the CSV export, and the
// capacity check are computed from Checkout Sessions on each request, so a
// refund or correction made in Stripe shows up immediately.

export type OrderStatus = 'paid' | 'partially_refunded' | 'refunded' | 'disputed' | 'processing' | 'in_checkout' | 'not_completed';

export const statusLabels: Record<OrderStatus, string> = {
  paid: 'Paid',
  partially_refunded: 'Partly refunded',
  refunded: 'Refunded',
  disputed: 'Disputed',
  processing: 'Payment processing',
  in_checkout: 'In checkout',
  not_completed: 'Did not finish',
};

/** Orders whose guests count toward attendance and the kitchen count. */
export const ATTENDING: readonly OrderStatus[] = ['paid', 'partially_refunded', 'disputed'];
/** Orders that hold seats until Stripe finishes or expires them. */
const HOLDING: readonly OrderStatus[] = ['processing', 'in_checkout'];

export interface Order {
  sessionId: string;
  paymentIntentId: string | null;
  created: number;
  status: OrderStatus;
  purchaserName: string;
  purchaserEmail: string;
  purchaserPhone: string;
  guests: Guest[];
  seatsPurchased: number;
  seatingRequest: string;
  amountPaidCents: number;
  amountRefundedCents: number;
  donationCents: number;
  livemode: boolean;
}

const expanded = <T extends object>(value: T | string | null): T | null => (value && typeof value === 'object' ? value : null);

export function toOrder(session: StripeCheckoutSession, event: RegistrationConfig, now: number): Order | null {
  if (session.metadata?.event_id !== event.id) return null;
  // Every session this Worker creates records `seats`. Sessions without it came
  // from the retired D1 prototype (Stripe test mode only) and have no guests here.
  if (!session.metadata.seats) return null;
  const paymentIntent = expanded<StripePaymentIntent>(session.payment_intent);
  const charge = paymentIntent ? expanded<StripeCharge>(paymentIntent.latest_charge) : null;
  const metadata = { ...session.metadata, ...paymentIntent?.metadata };

  let status: OrderStatus;
  if (session.status === 'complete' && session.payment_status === 'paid') {
    if (charge?.disputed) status = 'disputed';
    else if (charge && (charge.refunded || charge.amount_refunded >= charge.amount)) status = 'refunded';
    else if (charge && charge.amount_refunded > 0) status = 'partially_refunded';
    else status = 'paid';
  } else if (session.status === 'complete') {
    status = 'processing';
  } else if (session.status === 'open' && session.expires_at > now / 1000) {
    status = 'in_checkout';
  } else {
    status = 'not_completed';
  }

  const paid = ['paid', 'partially_refunded', 'refunded', 'disputed'].includes(status);
  return {
    sessionId: session.id,
    paymentIntentId: paymentIntent?.id ?? (typeof session.payment_intent === 'string' ? session.payment_intent : null),
    created: session.created,
    status,
    purchaserName: metadata.purchaser_name || session.customer_details?.name || '',
    purchaserEmail: session.customer_details?.email || session.customer_email || '',
    purchaserPhone: metadata.purchaser_phone || '',
    guests: paymentIntent ? readGuests(paymentIntent.metadata, event) : [],
    seatsPurchased: Number.parseInt(metadata.seats ?? '0', 10) || 0,
    seatingRequest: metadata.seating_request || '',
    amountPaidCents: paid ? session.amount_total ?? 0 : 0,
    amountRefundedCents: charge?.amount_refunded ?? 0,
    donationCents: Number.parseInt(metadata.donation_cents ?? '0', 10) || 0,
    livemode: session.livemode,
  };
}

export async function loadOrders(stripe: StripeClient, event: RegistrationConfig, now = Date.now()): Promise<Order[]> {
  // Include sessions from well before opening so test-mode rehearsals show up.
  const since = Math.floor(Date.parse(event.opensAt) / 1000) - 180 * 24 * 60 * 60;
  const sessions = await stripe.listCheckoutSessions(since);
  return sessions
    .map((session) => toOrder(session, event, now))
    .filter((order): order is Order => order !== null)
    .sort((a, b) => b.created - a.created);
}

export interface Summary {
  seatsSold: number;
  seatsHeld: number;
  seatsRemaining: number;
  paidOrders: number;
  meals: { name: string; count: number }[];
  dietaryNotes: { guest: string; meal: string; note: string; purchaser: string }[];
  collectedCents: number;
  refundedCents: number;
  donationCents: number;
  needsAttention: Order[];
}

export function summarize(orders: Order[], event: RegistrationConfig): Summary {
  const attending = orders.filter((order) => ATTENDING.includes(order.status));
  const guests = attending.flatMap((order) => order.guests.map((guest) => ({ guest, order })));
  const seatsSold = guests.length;
  const seatsHeld = orders.filter((order) => HOLDING.includes(order.status)).reduce((total, order) => total + order.seatsPurchased, 0);
  const knownMeals = event.meals.map((meal) => meal.name);
  const otherMeals = [...new Set(guests.map(({ guest }) => guest.meal).filter((meal) => !knownMeals.includes(meal)))];
  const paidOrders = orders.filter((order) => order.amountPaidCents > 0);

  return {
    seatsSold,
    seatsHeld,
    seatsRemaining: Math.max(0, event.capacity - seatsSold - seatsHeld),
    paidOrders: attending.length,
    meals: [...knownMeals, ...otherMeals].map((name) => ({ name, count: guests.filter(({ guest }) => guest.meal === name).length })),
    dietaryNotes: guests
      .filter(({ guest }) => guest.dietary)
      .map(({ guest, order }) => ({ guest: guest.name, meal: guest.meal, note: guest.dietary, purchaser: order.purchaserName })),
    collectedCents: paidOrders.reduce((total, order) => total + order.amountPaidCents, 0),
    refundedCents: paidOrders.reduce((total, order) => total + order.amountRefundedCents, 0),
    donationCents: attending.reduce((total, order) => total + order.donationCents, 0),
    needsAttention: orders.filter((order) => needsAttention(order, event)),
  };
}

/**
 * Disputes, paid orders with no guest list, and partial refunds of at least one
 * seat where every purchased guest is still listed (someone should be removed).
 */
export function needsAttention(order: Order, event: RegistrationConfig): boolean {
  if (order.status === 'disputed') return true;
  if (order.status === 'partially_refunded') {
    return order.amountRefundedCents >= event.seatPriceCents && order.guests.length >= order.seatsPurchased;
  }
  return ATTENDING.includes(order.status) && order.guests.length === 0;
}

export function seatsTaken(orders: Order[]): number {
  return orders.reduce((total, order) => {
    if (ATTENDING.includes(order.status)) return total + order.guests.length;
    if (HOLDING.includes(order.status)) return total + order.seatsPurchased;
    return total;
  }, 0);
}

export const formatDate = (unixSeconds: number) => new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Denver',
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(unixSeconds * 1000));

const PHONE_LIKE = /^\+?[\d\s().-]+$/;

/** Quotes a CSV cell and neutralises spreadsheet formulas. */
export function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text) && !PHONE_LIKE.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

/** One row per guest, attending guests first. Refunded orders stay visible but are labeled. */
export function attendeesCsv(orders: Order[]): string {
  const header = ['Guest name', 'Meal', 'Dietary note', 'Status', 'Purchaser', 'Purchaser email', 'Purchaser phone', 'Seating request', 'Order date', 'Stripe payment'];
  const rank = (order: Order) => (ATTENDING.includes(order.status) ? 0 : 1);
  const rows = orders
    .filter((order) => order.guests.length && (ATTENDING.includes(order.status) || order.status === 'refunded'))
    .sort((a, b) => rank(a) - rank(b) || a.created - b.created)
    .flatMap((order) => order.guests.map((guest) => [
      guest.name,
      guest.meal,
      guest.dietary,
      order.status === 'refunded' ? 'Refunded - not attending' : statusLabels[order.status],
      order.purchaserName,
      order.purchaserEmail,
      order.purchaserPhone,
      order.seatingRequest,
      formatDate(order.created),
      order.paymentIntentId ?? order.sessionId,
    ]));
  return `﻿${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
