import { readAttribution, type Attribution } from '../src/lib/registration-attribution.ts';
import type { RegistrationConfig, RegistrationMeal } from '../src/data/registrations.ts';
import type { Metadata } from './stripe.ts';

// Adapted from the tested validation on feature/banquet-registration-checkout
// (tag archive/banquet-registration-checkout-2026-08-05), reworked for a plain
// HTML form post so registration still works when JavaScript fails.

const EMAIL_PATTERN = /^[^\s@"\\]+@[^\s@"\\]+\.[^\s@"\\]+$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/u;
const GA_CLIENT_ID = /^\d{1,12}\.\d{1,12}$/;

export const LIMITS = { name: 100, email: 254, phone: 30, dietary: 200, seatingRequest: 300 } as const;

export interface Guest {
  name: string;
  meal: string;
  dietary: string;
  email: string;
  phone: string;
}

export interface Registration {
  purchaser: { name: string; email: string; phone: string };
  guests: Guest[];
  seatingRequest: string;
  donationCents: number;
  gaClientId: string | null;
  attribution: Attribution;
}

export class ValidationError extends Error {
  field: string;
  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export function cleanText(value: FormDataEntryValue | string | null | undefined, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL_CHARACTERS, ' ').normalize('NFKC').replace(/\s+/g, ' ').trim().slice(0, max + 1);
}

function requireText(form: URLSearchParams, field: string, label: string, min: number, max: number): string {
  const value = cleanText(form.get(field), max);
  if (value.length < min) throw new ValidationError(field, `Please enter ${label}.`);
  if (value.length > max) throw new ValidationError(field, `${capitalize(label)} must be ${max} characters or fewer.`);
  return value;
}

function optionalText(form: URLSearchParams, field: string, label: string, max: number): string {
  const value = cleanText(form.get(field), max);
  if (value.length > max) throw new ValidationError(field, `${capitalize(label)} must be ${max} characters or fewer.`);
  return value;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function findMeal(event: RegistrationConfig, value: string): RegistrationMeal | undefined {
  const key = value.trim().toLowerCase();
  return event.meals.find((meal) => meal.id === key || meal.name.toLowerCase() === key);
}

/** Reads guest rows guest_1_* … guest_N_*; blank rows are skipped. */
export function parseGuests(form: URLSearchParams, event: RegistrationConfig, maxSeats: number): Guest[] {
  const guests: Guest[] = [];
  for (let index = 1; index <= event.maxSeatsPerOrder; index += 1) {
    const prefix = `guest_${index}`;
    const name = cleanText(form.get(`${prefix}_name`), LIMITS.name);
    const mealValue = cleanText(form.get(`${prefix}_meal`), 64);
    const dietary = cleanText(form.get(`${prefix}_dietary`), LIMITS.dietary);
    const email = cleanText(form.get(`${prefix}_email`), LIMITS.email).toLowerCase();
    const phone = cleanText(form.get(`${prefix}_phone`), LIMITS.phone);
    if (!name && !mealValue && !dietary && !email && !phone) continue;

    const label = `guest ${index}`;
    if (name.length < 2) throw new ValidationError(`${prefix}_name`, `Please enter the full name for ${label}.`);
    if (name.length > LIMITS.name) throw new ValidationError(`${prefix}_name`, `The name for ${label} must be ${LIMITS.name} characters or fewer.`);
    const meal = findMeal(event, mealValue);
    if (!meal) throw new ValidationError(`${prefix}_meal`, `Please choose a meal for ${label}.`);
    if (dietary.length > LIMITS.dietary) throw new ValidationError(`${prefix}_dietary`, `The dietary note for ${label} must be ${LIMITS.dietary} characters or fewer.`);
    if (!dietary) throw new ValidationError(`${prefix}_dietary`, `Please enter dietary needs for ${label}, or “No dietary restrictions”.`);
    if (email && (email.length > LIMITS.email || !EMAIL_PATTERN.test(email))) throw new ValidationError(`${prefix}_email`, `Please enter a valid email address for ${label}, or leave it blank.`);
    const digits = phone.replace(/\D/g, '');
    if (phone && (phone.length > LIMITS.phone || digits.length < 7 || digits.length > 15)) throw new ValidationError(`${prefix}_phone`, `Please enter a valid phone number for ${label}, or leave it blank.`);
    guests.push({ name, meal: meal.name, dietary, email, phone });
  }
  if (!guests.length) throw new ValidationError('guest_1_name', 'Please add at least one guest.');
  if (guests.length > maxSeats) {
    throw new ValidationError('guest_1_name', `One registration can include up to ${maxSeats} ${maxSeats === 1 ? 'guest' : 'guests'}.`);
  }
  return guests;
}

export function parseDonationCents(raw: string, maxCents: number): number {
  const value = raw.replace(/[$,\s]/g, '');
  if (!value) return 0;
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value)) throw new ValidationError('donation', 'Please enter the donation as a dollar amount, such as 25.');
  const [dollars, cents = ''] = value.split('.');
  const total = Number(dollars) * 100 + Number(cents.padEnd(2, '0'));
  if (total > maxCents) throw new ValidationError('donation', `Online donations are limited to $${(maxCents / 100).toLocaleString('en-US')}. Please contact us about a larger gift.`);
  if (total > 0 && total < 100) throw new ValidationError('donation', 'Donations must be at least $1.');
  return total;
}

export function validateRegistration(form: URLSearchParams, event: RegistrationConfig): Registration {
  const name = requireText(form, 'purchaser_name', 'your full name', 2, LIMITS.name);
  const email = requireText(form, 'purchaser_email', 'your email address', 3, LIMITS.email).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new ValidationError('purchaser_email', 'Please enter a valid email address.');
  const phone = requireText(form, 'purchaser_phone', 'a phone number', 7, LIMITS.phone);
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) throw new ValidationError('purchaser_phone', 'Please enter a valid phone number.');

  const guests = parseGuests(form, event, event.maxSeatsPerOrder);
  const seatingRequest = optionalText(form, 'seating_request', 'the seating request', LIMITS.seatingRequest);
  const donationCents = event.donation.enabled
    ? parseDonationCents(cleanText(form.get('donation'), 20), event.donation.maxCents)
    : 0;

  if (form.get('agree') !== 'yes') {
    throw new ValidationError('agree', 'Please confirm that you have read the refund policy.');
  }

  const gaClientId = cleanText(form.get('ga_client_id'), 40);
  return {
    attribution: readAttribution(form),
    purchaser: { name, email, phone },
    guests,
    seatingRequest,
    donationCents,
    gaClientId: GA_CLIENT_ID.test(gaClientId) ? gaClientId : null,
  };
}

// Guests are stored on the Stripe PaymentIntent as guest_1_name, guest_1_meal,
// guest_1_dietary and guest_1_contact (email/phone JSON). Combining contact
// fields keeps a full eight-guest order below Stripe’s 50 metadata-key limit.

export function guestMetadata(guests: Guest[], slots: number): Metadata {
  const metadata: Metadata = {};
  for (let index = 1; index <= slots; index += 1) {
    const guest = guests[index - 1];
    metadata[`guest_${index}_name`] = guest?.name ?? '';
    metadata[`guest_${index}_meal`] = guest?.meal ?? '';
    metadata[`guest_${index}_dietary`] = guest?.dietary ?? '';
    metadata[`guest_${index}_contact`] = guest && (guest.email || guest.phone) ? JSON.stringify({ email: guest.email, phone: guest.phone }) : '';
  }
  return metadata;
}

export function readGuests(metadata: Metadata, event: RegistrationConfig): Guest[] {
  const guests: Guest[] = [];
  for (let index = 1; index <= event.maxSeatsPerOrder; index += 1) {
    const name = metadata[`guest_${index}_name`]?.trim();
    if (!name) continue;
    const mealValue = metadata[`guest_${index}_meal`] ?? '';
    let contact: { email?: unknown; phone?: unknown } = {};
    try { const value = JSON.parse(metadata[`guest_${index}_contact`] ?? '{}'); if (value && typeof value === 'object') contact = value; } catch { /* Older orders have no guest contact record. */ }
    guests.push({
      name,
      meal: findMeal(event, mealValue)?.name ?? (mealValue.trim() || 'Not chosen'),
      dietary: metadata[`guest_${index}_dietary`]?.trim() ?? '',
      email: typeof contact.email === 'string' ? cleanText(contact.email, LIMITS.email) : '',
      phone: typeof contact.phone === 'string' ? cleanText(contact.phone, LIMITS.phone) : '',
    });
  }
  return guests;
}
