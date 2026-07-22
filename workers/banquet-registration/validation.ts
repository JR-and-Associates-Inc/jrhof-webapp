import type { BanquetEventConfig, MealOption, ValidatedAttendee, ValidatedRegistration } from './types';

const MAX_JSON_BYTES = 16_384;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/u;
const MEAL_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

export class RequestValidationError extends Error {
  constructor(
    readonly code: string,
    readonly status: 400 | 413 | 415 | 503 = 400,
  ) {
    super(code);
    this.name = 'RequestValidationError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const hasExactKeys = (value: Record<string, unknown>, allowedKeys: readonly string[]) => {
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...allowedKeys].sort();
  return actualKeys.length === expectedKeys.length
    && actualKeys.every((key, index) => key === expectedKeys[index]);
};

export const normalizePlainText = (value: unknown, min: number, max: number, code: string) => {
  if (typeof value !== 'string') throw new RequestValidationError(code);
  if (CONTROL_CHARACTER_PATTERN.test(value)) throw new RequestValidationError(code);
  const normalized = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (normalized.length < min || normalized.length > max) throw new RequestValidationError(code);
  return normalized;
};

const optionalPlainText = (value: unknown, max: number, code: string) => {
  if (value === null || value === '') return null;
  return normalizePlainText(value, 1, max, code);
};

export function parseMealConfiguration(
  value: unknown,
  { requireDescriptions = false }: { requireDescriptions?: boolean } = {},
): MealOption[] {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new RequestValidationError('invalid_meal_configuration', 503);
    }
  }
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 12) {
    throw new RequestValidationError('invalid_meal_configuration', 503);
  }

  const ids = new Set<string>();
  const meals = parsed.map<MealOption>((meal) => {
    if (!isRecord(meal) || !hasExactKeys(meal, [
      'id',
      'name',
      'description',
      'available',
      'accommodationNote',
    ])) throw new RequestValidationError('invalid_meal_configuration', 503);

    const id = normalizePlainText(meal.id, 1, 64, 'invalid_meal_configuration');
    if (!MEAL_ID_PATTERN.test(id) || ids.has(id)) {
      throw new RequestValidationError('invalid_meal_configuration', 503);
    }
    ids.add(id);
    const name = normalizePlainText(meal.name, 2, 80, 'invalid_meal_configuration');
    const description = optionalPlainText(meal.description, 240, 'invalid_meal_configuration');
    const accommodationNote = optionalPlainText(meal.accommodationNote, 200, 'invalid_meal_configuration');
    if (typeof meal.available !== 'boolean' || (requireDescriptions && !description)) {
      throw new RequestValidationError('invalid_meal_configuration', 503);
    }
    return { id, name, description, available: meal.available, accommodationNote };
  });

  if (!meals.some((meal) => meal.available)) {
    throw new RequestValidationError('invalid_meal_configuration', 503);
  }
  return meals;
}

export function assertProductionLaunchReady(event: BanquetEventConfig): void {
  if (
    event.configurationStatus !== 'production_approved'
    || !event.registrationOpen
    || !event.refundPolicyVersion
  ) throw new RequestValidationError('production_launch_not_approved', 503);
  parseMealConfiguration(event.meals, { requireDescriptions: true });
}

export async function readBoundedText(request: Request, maxBytes: number): Promise<string> {
  const declaredLength = request.headers.get('content-length');
  if (declaredLength) {
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length) || length < 0 || length > maxBytes) {
      throw new RequestValidationError('request_too_large', 413);
    }
  }

  if (!request.body) throw new RequestValidationError('body_required');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new RequestValidationError('request_too_large', 413);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(bytes);
}

export async function readBoundedJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (contentType !== 'application/json') throw new RequestValidationError('content_type_required', 415);

  const rawBody = await readBoundedText(request, MAX_JSON_BYTES);
  try {
    return JSON.parse(rawBody);
  } catch {
    throw new RequestValidationError('invalid_json');
  }
}

export function readEventId(value: unknown): string {
  if (!isRecord(value) || typeof value.eventId !== 'string') {
    throw new RequestValidationError('invalid_event_id');
  }
  return value.eventId;
}

export function validateRegistration(
  value: unknown,
  event: BanquetEventConfig,
): ValidatedRegistration {
  if (!isRecord(value) || !hasExactKeys(value, [
    'eventId',
    'contact',
    'attendees',
    'seatingNotes',
    'donationAmountCents',
    'acknowledgements',
  ])) {
    throw new RequestValidationError('invalid_request_shape');
  }

  if (value.eventId !== event.id) throw new RequestValidationError('invalid_event_id');
  if (!event.registrationOpen || event.configurationStatus !== 'preview_unapproved') {
    throw new RequestValidationError('registration_not_open');
  }

  if (!isRecord(value.contact) || !hasExactKeys(value.contact, ['name', 'email', 'phone'])) {
    throw new RequestValidationError('invalid_contact');
  }
  const name = normalizePlainText(value.contact.name, 2, 100, 'invalid_contact_name');
  const email = normalizePlainText(value.contact.email, 3, 254, 'invalid_contact_email').toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new RequestValidationError('invalid_contact_email');
  const phone = normalizePlainText(value.contact.phone, 7, 30, 'invalid_contact_phone');
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    throw new RequestValidationError('invalid_contact_phone');
  }

  if (!Array.isArray(value.attendees) || value.attendees.length < 1 || value.attendees.length > 8) {
    throw new RequestValidationError('invalid_attendee_count');
  }
  const attendees = value.attendees.map<ValidatedAttendee>((attendee) => {
    if (!isRecord(attendee) || !hasExactKeys(attendee, ['fullName', 'mealId', 'dietaryNotes'])) {
      throw new RequestValidationError('invalid_attendee');
    }
    const fullName = normalizePlainText(attendee.fullName, 2, 100, 'invalid_attendee_name');
    const mealId = normalizePlainText(attendee.mealId, 1, 64, 'invalid_meal_choice');
    const meal = event.meals.find((option) => option.id === mealId && option.available);
    if (!meal) throw new RequestValidationError('invalid_meal_choice');
    const dietaryNotes = optionalPlainText(attendee.dietaryNotes, 300, 'invalid_dietary_notes');
    return { fullName, mealId: meal.id, mealName: meal.name, dietaryNotes };
  });

  let seatingNotes: string | null = null;
  if (value.seatingNotes !== null && value.seatingNotes !== '') {
    seatingNotes = normalizePlainText(value.seatingNotes, 1, 300, 'invalid_seating_notes');
  }

  if (!Number.isSafeInteger(value.donationAmountCents)) {
    throw new RequestValidationError('invalid_donation_amount');
  }
  const donationAmountCents = value.donationAmountCents as number;
  if (donationAmountCents < event.donationMinCents || donationAmountCents > event.donationMaxCents) {
    throw new RequestValidationError('invalid_donation_amount');
  }

  if (!isRecord(value.acknowledgements) || !hasExactKeys(value.acknowledgements, [
    'terms',
    'privacy',
    'informationAccuracy',
    'refundPolicy',
  ]) || value.acknowledgements.terms !== true
    || value.acknowledgements.privacy !== true
    || value.acknowledgements.informationAccuracy !== true
    || value.acknowledgements.refundPolicy !== true) {
    throw new RequestValidationError('acknowledgements_required');
  }

  return {
    eventId: event.id,
    contact: { name, email, phone },
    attendees,
    seatingNotes,
    donationAmountCents,
    acknowledgements: {
      terms: true,
      privacy: true,
      informationAccuracy: true,
      refundPolicy: true,
    },
  };
}
