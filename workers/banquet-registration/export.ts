import type { BoardAccessIdentity } from './types';

const EVENT_ID = 'banquet-2027';
const FORMULA_PREFIX = /^[\s]*[=+\-@]/u;

export type BoardExportType = 'registrations' | 'seating-plan';

interface ExportRow {
  reservation_id: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  registration_status: string;
  payment_status: string;
  refund_status: string;
  purchaser_name: string;
  purchaser_email: string;
  purchaser_phone: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  attendee_count: number;
  attendee_position: number;
  attendee_name: string;
  meal_id: string;
  meal_name: string | null;
  dietary_notes: string | null;
  seating_request: string | null;
  ticket_unit_amount_cents: number;
  ticket_subtotal_cents: number;
  donation_amount_cents: number;
  expected_total_cents: number;
  amount_paid_cents: number | null;
  amount_refunded_cents: number | null;
  currency: string;
  created_at: string;
  payment_verified_at: string | null;
  paid_at: string | null;
  refunded_at: string | null;
}

const REGISTRATION_COLUMNS = [
  'registration_reference',
  'stripe_payment_intent_id',
  'stripe_checkout_session_id',
  'registration_status',
  'payment_status',
  'refund_status',
  'purchaser_name',
  'purchaser_email',
  'purchaser_phone',
  'attendee_count',
  'attendee_names',
  'meal_selections',
  'attendee_dietary_or_accommodation_notes',
  'registration_seating_or_group_notes',
  'ticket_unit_amount',
  'ticket_subtotal',
  'donation',
  'expected_total',
  'total_paid',
  'amount_refunded',
  'currency',
  'created_at',
  'payment_verified_at',
  'paid_at',
  'refunded_at',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

const SEATING_COLUMNS = [
  'registration_reference',
  'stripe_payment_intent_id',
  'stripe_checkout_session_id',
  'registration_status',
  'payment_status',
  'refund_status',
  'purchaser_name',
  'purchaser_email',
  'purchaser_phone',
  'attendee_count',
  'attendee_position',
  'attendee_name',
  'meal_id',
  'meal',
  'attendee_dietary_or_accommodation_note',
  'registration_seating_or_group_notes',
  'checked_in',
  'table_assignment',
  'ticket_unit_amount',
  'ticket_subtotal',
  'donation',
  'expected_total',
  'total_paid',
  'amount_refunded',
  'currency',
  'created_at',
  'payment_verified_at',
  'paid_at',
  'refunded_at',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export const protectSpreadsheetCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value);
  return FORMULA_PREFIX.test(text) || /^[\t\r\n]/u.test(text) ? `'${text}` : text;
};

const escapeCsvCell = (value: unknown) => `"${protectSpreadsheetCell(value).replaceAll('"', '""')}"`;

const centsToDollars = (value: number | null) => (
  value === null ? '' : (value / 100).toFixed(2)
);

const mealLabel = (row: ExportRow) => row.meal_name || `[legacy preview choice: ${row.meal_id}]`;

const baseOutput = (row: ExportRow) => ({
  registration_reference: row.reservation_id,
  stripe_payment_intent_id: row.stripe_payment_intent_id,
  stripe_checkout_session_id: row.stripe_checkout_session_id,
  registration_status: row.registration_status,
  payment_status: row.payment_status,
  refund_status: row.refund_status,
  purchaser_name: row.purchaser_name,
  purchaser_email: row.purchaser_email,
  purchaser_phone: row.purchaser_phone,
  utm_source: row.utm_source,
  utm_medium: row.utm_medium,
  utm_campaign: row.utm_campaign,
  utm_content: row.utm_content,
  utm_term: row.utm_term,
  registration_seating_or_group_notes: row.seating_request,
  ticket_unit_amount: centsToDollars(row.ticket_unit_amount_cents),
  ticket_subtotal: centsToDollars(row.ticket_subtotal_cents),
  donation: centsToDollars(row.donation_amount_cents),
  expected_total: centsToDollars(row.expected_total_cents),
  total_paid: centsToDollars(row.amount_paid_cents),
  amount_refunded: centsToDollars(row.amount_refunded_cents),
  currency: row.currency,
  created_at: row.created_at,
  payment_verified_at: row.payment_verified_at,
  paid_at: row.paid_at,
  refunded_at: row.refunded_at,
});

const csvFromRecords = <T extends readonly string[]>(columns: T, records: Array<Record<T[number], unknown>>) => {
  const lines = [
    columns.map(escapeCsvCell).join(','),
    ...records.map((record) => columns.map((column) => (
      escapeCsvCell((record as Record<string, unknown>)[column])
    )).join(',')),
  ];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
};

export function parsePaidOnly(url: URL): boolean {
  const keys = [...url.searchParams.keys()];
  if (keys.some((key) => key !== 'paid-only') || url.searchParams.getAll('paid-only').length > 1) {
    throw new Error('invalid_export_filter');
  }
  const value = url.searchParams.get('paid-only');
  if (value === null || value === 'false') return false;
  if (value === 'true') return true;
  throw new Error('invalid_export_filter');
}

async function readRows(db: D1Database, paidOnly: boolean): Promise<ExportRow[]> {
  const paidClause = paidOnly
    ? "AND reservations.payment_status = 'paid' AND reservations.refund_status = 'not_refunded' AND reservations.payment_verified_at IS NOT NULL"
    : '';
  const result = await db.prepare(`
    SELECT
      reservations.id AS reservation_id,
      reservations.stripe_payment_intent_id,
      reservations.stripe_checkout_session_id,
      reservations.status AS registration_status,
      reservations.payment_status,
      reservations.refund_status,
      reservations.contact_name AS purchaser_name,
      reservations.contact_email AS purchaser_email,
      reservations.contact_phone AS purchaser_phone,
      reservations.utm_source,
      reservations.utm_medium,
      reservations.utm_campaign,
      reservations.utm_content,
      reservations.utm_term,
      reservations.attendee_count,
      attendees.attendee_position,
      attendees.full_name AS attendee_name,
      attendees.meal_id,
      attendees.meal_name_snapshot AS meal_name,
      attendees.dietary_notes,
      reservations.seating_notes AS seating_request,
      reservations.ticket_unit_amount_cents,
      reservations.ticket_subtotal_cents,
      reservations.donation_amount_cents,
      reservations.expected_total_cents,
      reservations.amount_paid_cents,
      reservations.amount_refunded_cents,
      reservations.currency,
      reservations.created_at,
      reservations.payment_verified_at,
      reservations.paid_at,
      reservations.refunded_at
    FROM banquet_reservations AS reservations
    JOIN banquet_attendees AS attendees ON attendees.reservation_id = reservations.id
    WHERE reservations.event_id = ?
      ${paidClause}
    ORDER BY reservations.created_at, reservations.id, attendees.attendee_position
  `).bind(EVENT_ID).all<ExportRow>();
  return result.results;
}

const registrationsCsv = (rows: ExportRow[]) => {
  const groups = new Map<string, ExportRow[]>();
  for (const row of rows) groups.set(row.reservation_id, [...(groups.get(row.reservation_id) || []), row]);
  const records = [...groups.values()].map((registrationRows) => {
    const first = registrationRows[0];
    if (!first) throw new Error('invalid_export_row');
    return {
      ...baseOutput(first),
      attendee_count: first.attendee_count,
      attendee_names: registrationRows.map((row) => row.attendee_name).join(' | '),
      meal_selections: registrationRows.map(mealLabel).join(' | '),
      attendee_dietary_or_accommodation_notes: registrationRows
        .map((row) => row.dietary_notes || '')
        .join(' | '),
    };
  });
  return csvFromRecords(REGISTRATION_COLUMNS, records);
};

const seatingCsv = (rows: ExportRow[]) => csvFromRecords(SEATING_COLUMNS, rows.map((row) => ({
  ...baseOutput(row),
  attendee_count: row.attendee_count,
  attendee_position: row.attendee_position,
  attendee_name: row.attendee_name,
  meal_id: row.meal_id,
  meal: mealLabel(row),
  attendee_dietary_or_accommodation_note: row.dietary_notes,
  checked_in: '',
  table_assignment: '',
})));

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

async function auditExport(
  db: D1Database,
  identity: BoardAccessIdentity,
  type: BoardExportType,
  paidOnly: boolean,
  rowCount: number,
) {
  await db.prepare(`
    INSERT INTO banquet_export_audit (
      id, event_id, export_type, paid_only, row_count, actor_subject_sha256
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    EVENT_ID,
    type,
    paidOnly ? 1 : 0,
    rowCount,
    await sha256Hex(identity.subject),
  ).run();
}

export async function buildBoardExport(
  db: D1Database,
  identity: BoardAccessIdentity,
  type: BoardExportType,
  paidOnly: boolean,
) {
  const rows = await readRows(db, paidOnly);
  const csv = type === 'registrations' ? registrationsCsv(rows) : seatingCsv(rows);
  const rowCount = type === 'registrations'
    ? new Set(rows.map((row) => row.reservation_id)).size
    : rows.length;
  await auditExport(db, identity, type, paidOnly, rowCount);
  return { csv, rowCount };
}
