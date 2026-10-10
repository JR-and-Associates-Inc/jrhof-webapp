import type { RegistrationConfig, RegistrationMeal } from '../src/data/registrations.ts';
import type { Metadata } from './stripe.ts';

// Adapted from the tested validation on feature/banquet-registration-checkout
// (tag archive/banquet-registration-checkout-2026-08-05), reworked for a plain
// HTML form post so registration still works when JavaScript fails.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/u;
const GA_CLIENT_ID = /^\d{1,12}\.\d{1,12}$/;

export const LIMITS = { name: 100, email: 254, phone: 30, dietary: 200, seatingRequest: 300 } as const;

export interface Guest {
  name: string;
  meal: string;
  dietary: string;
}

export interface Registration {
  purchaser: { name: string; email: string; phone: string };
  guests: Guest[];
  seatingRequest: string;
  donationCents: number;
  gaClientId: string | null;
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
    if (!name && !mealValue && !dietary) continue;

    const label = `guest ${index}`;
    if (name.length < 2) throw new ValidationError(`${prefix}_name`, `Please enter the full name for ${label}.`);
    if (name.length > LIMITS.name) throw new ValidationError(`${prefix}_name`, `The name for ${label} must be ${LIMITS.name} characters or fewer.`);
    const meal = findMeal(event, mealValue);
    if (!meal) throw new ValidationError(`${prefix}_meal`, `Please choose a meal for ${label}.`);
    if (dietary.length > LIMITS.dietary) throw new ValidationError(`${prefix}_dietary`, `The dietary note for ${label} must be ${LIMITS.dietary} characters or fewer.`);
    guests.push({ name, meal: meal.name, dietary });
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
    purchaser: { name, email, phone },
    guests,
    seatingRequest,
    donationCents,
    gaClientId: GA_CLIENT_ID.test(gaClientId) ? gaClientId : null,
  };
}

// Guests are stored on the Stripe PaymentIntent as guest_1_name, guest_1_meal,
// guest_1_dietary, … so they stay readable in the Stripe Dashboard and export.

export function guestMetadata(guests: Guest[], slots: number): Metadata {
  const metadata: Metadata = {};
  for (let index = 1; index <= slots; index += 1) {
    const guest = guests[index - 1];
    metadata[`guest_${index}_name`] = guest?.name ?? '';
    metadata[`guest_${index}_meal`] = guest?.meal ?? '';
    metadata[`guest_${index}_dietary`] = guest?.dietary ?? '';
  }
  return metadata;
}

export function readGuests(metadata: Metadata, event: RegistrationConfig): Guest[] {
  const guests: Guest[] = [];
  for (let index = 1; index <= event.maxSeatsPerOrder; index += 1) {
    const name = metadata[`guest_${index}_name`]?.trim();
    if (!name) continue;
    const mealValue = metadata[`guest_${index}_meal`] ?? '';
    guests.push({
      name,
      meal: findMeal(event, mealValue)?.name ?? (mealValue.trim() || 'Not chosen'),
      dietary: metadata[`guest_${index}_dietary`]?.trim() ?? '',
    });
  }
  return guests;
}
