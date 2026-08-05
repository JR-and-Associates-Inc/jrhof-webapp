import type { BanquetEventConfig, BoardAccessIdentity } from './types';
import { CAPACITY_HELD_PAYMENT_REVIEW_SQL } from './capacity';

const EVENT_ID = 'banquet-2027';

interface StatusRow {
  status: string;
  registrations: number;
  attendees: number;
}

interface TotalsRow {
  registrations: number;
  attendees: number;
  paid_registrations: number;
  paid_attendees: number;
  active_pending_registrations: number;
  active_pending_attendees: number;
  canceled_registrations: number;
  canceled_attendees: number;
  review_registrations: number;
  capacity_held_attendees: number;
  gross_collected_cents: number;
  refunded_cents: number;
  donation_collected_cents: number;
}

interface MealRow {
  meal_id: string;
  meal_name: string;
  attendees: number;
}

interface AttributionRow {
  source: string;
  medium: string;
  registrations: number;
  attendees: number;
  paid_registrations: number;
  collected_cents: number;
}

interface DailyRow {
  date: string;
  registrations: number;
  attendees: number;
  paid_registrations: number;
}

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const auditDashboardAccess = async (db: D1Database, identity: BoardAccessIdentity) => {
  await db.prepare(`
    INSERT INTO banquet_board_access_audit (
      id, event_id, access_type, actor_subject_sha256
    ) VALUES (?, ?, 'dashboard', ?)
  `).bind(crypto.randomUUID(), EVENT_ID, await sha256Hex(identity.subject)).run();
};

export async function buildBoardDashboard(
  db: D1Database,
  event: BanquetEventConfig,
  identity: BoardAccessIdentity,
) {
  const [totalsResult, statusesResult, mealsResult, attributionResult, dailyResult] = await Promise.all([
    db.prepare(`
      SELECT
        COUNT(*) AS registrations,
        COALESCE(SUM(attendee_count), 0) AS attendees,
        COALESCE(SUM(CASE
          WHEN payment_status = 'paid'
            AND refund_status = 'not_refunded'
            AND payment_verified_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS paid_registrations,
        COALESCE(SUM(CASE
          WHEN payment_status = 'paid'
            AND refund_status = 'not_refunded'
            AND payment_verified_at IS NOT NULL THEN attendee_count ELSE 0 END), 0) AS paid_attendees,
        COALESCE(SUM(CASE
          WHEN status = 'pending'
            AND checkout_expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now') THEN 1 ELSE 0 END), 0) AS active_pending_registrations,
        COALESCE(SUM(CASE
          WHEN status = 'pending'
            AND checkout_expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now') THEN attendee_count ELSE 0 END), 0) AS active_pending_attendees,
        COALESCE(SUM(CASE
          WHEN status IN ('canceled', 'expired', 'checkout_failed') THEN 1 ELSE 0 END), 0) AS canceled_registrations,
        COALESCE(SUM(CASE
          WHEN status IN ('canceled', 'expired', 'checkout_failed') THEN attendee_count ELSE 0 END), 0) AS canceled_attendees,
        COALESCE(SUM(CASE WHEN status = 'payment_review' THEN 1 ELSE 0 END), 0) AS review_registrations,
        COALESCE(SUM(CASE
          WHEN status IN ('paid', 'partially_refunded') THEN attendee_count
          WHEN ${CAPACITY_HELD_PAYMENT_REVIEW_SQL} THEN attendee_count
          WHEN status = 'pending'
            AND checkout_expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now') THEN attendee_count
          ELSE 0 END), 0) AS capacity_held_attendees,
        COALESCE(SUM(CASE WHEN payment_verified_at IS NOT NULL THEN amount_paid_cents ELSE 0 END), 0) AS gross_collected_cents,
        COALESCE(SUM(amount_refunded_cents), 0) AS refunded_cents,
        COALESCE(SUM(CASE WHEN payment_verified_at IS NOT NULL THEN donation_amount_cents ELSE 0 END), 0) AS donation_collected_cents
      FROM banquet_reservations
      WHERE event_id = ?
    `).bind(EVENT_ID).first<TotalsRow>(),
    db.prepare(`
      SELECT status, COUNT(*) AS registrations, COALESCE(SUM(attendee_count), 0) AS attendees
      FROM banquet_reservations
      WHERE event_id = ?
      GROUP BY status
      ORDER BY registrations DESC, status
    `).bind(EVENT_ID).all<StatusRow>(),
    db.prepare(`
      SELECT
        attendees.meal_id,
        COALESCE(attendees.meal_name_snapshot, attendees.meal_id) AS meal_name,
        COUNT(*) AS attendees
      FROM banquet_attendees AS attendees
      JOIN banquet_reservations AS reservations ON reservations.id = attendees.reservation_id
      WHERE reservations.event_id = ?
        AND reservations.payment_verified_at IS NOT NULL
        AND (
          reservations.status IN ('paid', 'partially_refunded')
          OR (reservations.status = 'payment_review' AND reservations.amount_paid_cents IS NOT NULL)
        )
      GROUP BY attendees.meal_id, meal_name
      ORDER BY attendees DESC, meal_name
    `).bind(EVENT_ID).all<MealRow>(),
    db.prepare(`
      SELECT
        COALESCE(utm_source, 'direct') AS source,
        COALESCE(utm_medium, 'none') AS medium,
        COUNT(*) AS registrations,
        COALESCE(SUM(attendee_count), 0) AS attendees,
        COALESCE(SUM(CASE
          WHEN payment_status = 'paid'
            AND refund_status = 'not_refunded'
            AND payment_verified_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS paid_registrations,
        COALESCE(SUM(CASE WHEN payment_verified_at IS NOT NULL THEN amount_paid_cents ELSE 0 END), 0) AS collected_cents
      FROM banquet_reservations
      WHERE event_id = ?
      GROUP BY source, medium
      ORDER BY paid_registrations DESC, registrations DESC, source, medium
    `).bind(EVENT_ID).all<AttributionRow>(),
    db.prepare(`
      SELECT
        substr(created_at, 1, 10) AS date,
        COUNT(*) AS registrations,
        COALESCE(SUM(attendee_count), 0) AS attendees,
        COALESCE(SUM(CASE WHEN payment_verified_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS paid_registrations
      FROM banquet_reservations
      WHERE event_id = ?
        AND created_at >= datetime('now', '-30 days')
      GROUP BY date
      ORDER BY date
    `).bind(EVENT_ID).all<DailyRow>(),
  ]);

  const totals = totalsResult ?? {
    registrations: 0,
    attendees: 0,
    paid_registrations: 0,
    paid_attendees: 0,
    active_pending_registrations: 0,
    active_pending_attendees: 0,
    canceled_registrations: 0,
    canceled_attendees: 0,
    review_registrations: 0,
    capacity_held_attendees: 0,
    gross_collected_cents: 0,
    refunded_cents: 0,
    donation_collected_cents: 0,
  };
  const heldAttendees = totals.capacity_held_attendees;

  await auditDashboardAccess(db, identity);

  return {
    generatedAt: new Date().toISOString(),
    testMode: true,
    event: {
      id: event.id,
      title: event.title,
      capacity: event.capacity,
      ticketUnitAmountCents: event.ticketUnitAmountCents,
      currency: event.currency,
    },
    registrations: {
      total: totals.registrations,
      attendees: totals.attendees,
      paid: totals.paid_registrations,
      paidAttendees: totals.paid_attendees,
      activePending: totals.active_pending_registrations,
      activePendingAttendees: totals.active_pending_attendees,
      canceled: totals.canceled_registrations,
      canceledAttendees: totals.canceled_attendees,
      paymentReview: totals.review_registrations,
      heldAttendees,
      remainingCapacity: Math.max(0, event.capacity - heldAttendees),
    },
    financials: {
      grossCollectedCents: totals.gross_collected_cents,
      refundedCents: totals.refunded_cents,
      netCollectedCents: Math.max(0, totals.gross_collected_cents - totals.refunded_cents),
      donationCollectedCents: totals.donation_collected_cents,
    },
    statuses: statusesResult.results,
    meals: mealsResult.results,
    attribution: attributionResult.results,
    daily: dailyResult.results,
  };
}
