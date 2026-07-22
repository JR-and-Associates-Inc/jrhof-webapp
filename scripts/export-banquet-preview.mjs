import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPOSITORY_ROOT = fileURLToPath(new URL('../', import.meta.url));
const WRANGLER_CLI = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const PREVIEW_CONFIG = 'wrangler.banquet-remote-preview.jsonc';
const PREVIEW_DATABASE_BINDING = 'BANQUET_DB';
const PREVIEW_EVENT_ID = 'banquet-2027';

export const CSV_COLUMNS = [
  'reservation_id',
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
  'meal_name',
  'dietary_note',
  'ticket_unit_amount',
  'ticket_subtotal',
  'donation_amount',
  'total_paid',
  'amount_refunded',
  'currency',
  'seating_notes',
  'created_at',
  'payment_verified_at',
];

export function buildExportQuery({ paidOnly = false } = {}) {
  const paidOnlyClause = paidOnly
    ? `
  AND reservations.payment_status = 'paid'
  AND reservations.refund_status = 'not_refunded'
  AND reservations.payment_verified_at IS NOT NULL
  AND reservations.amount_paid_cents IS NOT NULL
  AND reservations.amount_paid_cents = reservations.expected_total_cents`
    : '';

  return `
SELECT
  reservations.id AS reservation_id,
  reservations.status AS registration_status,
  reservations.payment_status,
  reservations.refund_status,
  reservations.contact_name AS purchaser_name,
  reservations.contact_email AS purchaser_email,
  reservations.contact_phone AS purchaser_phone,
  reservations.attendee_count,
  attendees.attendee_position,
  attendees.full_name AS attendee_name,
  attendees.meal_id,
  attendees.meal_name_snapshot AS meal_name,
  attendees.dietary_notes AS dietary_note,
  reservations.ticket_unit_amount_cents,
  reservations.ticket_subtotal_cents,
  reservations.donation_amount_cents,
  reservations.amount_paid_cents,
  reservations.amount_refunded_cents,
  reservations.currency,
  reservations.seating_notes,
  reservations.created_at,
  reservations.payment_verified_at
FROM banquet_reservations AS reservations
LEFT JOIN banquet_attendees AS attendees
  ON attendees.reservation_id = reservations.id
WHERE reservations.event_id = '${PREVIEW_EVENT_ID}'
${paidOnlyClause}
ORDER BY
  reservations.created_at,
  reservations.id,
  attendees.attendee_position
`.trim();
}

const FORMULA_PREFIX = /^[\s]*[=+\-@]/u;

export function protectSpreadsheetCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return FORMULA_PREFIX.test(text) || /^[\t\r\n]/u.test(text) ? `'${text}` : text;
}

export function escapeCsvCell(value) {
  return `"${protectSpreadsheetCell(value).replaceAll('"', '""')}"`;
}

export function centsToDollars(value, fieldName = 'amount') {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid integer-cent value for ${fieldName}.`);
  }
  return (value / 100).toFixed(2);
}

export function nullableCentsToDollars(value, fieldName = 'amount') {
  return value === null || value === undefined ? '' : centsToDollars(value, fieldName);
}

export function parseCliOptions(argumentsList) {
  const options = { overwrite: false, paidOnly: false };

  for (const argument of argumentsList) {
    if (argument === '--overwrite') options.overwrite = true;
    else if (argument === '--paid-only') options.paidOnly = true;
    else throw new Error(`Unknown option: ${argument}`);
  }

  return options;
}

function validateAndGroupRows(rows) {
  const reservations = new Map();

  for (const row of rows) {
    if (!row || typeof row !== 'object') throw new Error('Remote D1 returned an invalid row.');
    if (typeof row.reservation_id !== 'string' || !row.reservation_id) {
      throw new Error('Remote D1 returned a row without a reservation ID.');
    }
    if (typeof row.registration_status !== 'string' || !row.registration_status
      || typeof row.payment_status !== 'string' || !row.payment_status
      || typeof row.refund_status !== 'string' || !row.refund_status) {
      throw new Error(`Reservation ${row.reservation_id} has an invalid status.`);
    }
    if (!Number.isSafeInteger(row.attendee_count) || row.attendee_count < 1 || row.attendee_count > 8) {
      throw new Error(`Reservation ${row.reservation_id} has an invalid attendee count.`);
    }
    if (!Number.isSafeInteger(row.attendee_position)
      || row.attendee_position < 1
      || row.attendee_position > row.attendee_count
      || typeof row.attendee_name !== 'string'
      || !row.attendee_name
      || typeof row.meal_id !== 'string'
      || !row.meal_id
      || (row.meal_name !== null && typeof row.meal_name !== 'string')
      || (row.dietary_note !== null && typeof row.dietary_note !== 'string')) {
      throw new Error(`Reservation ${row.reservation_id} has incomplete attendee data.`);
    }

    const positions = reservations.get(row.reservation_id) ?? new Set();
    if (positions.has(row.attendee_position)) {
      throw new Error(`Reservation ${row.reservation_id} has a duplicate attendee position.`);
    }
    positions.add(row.attendee_position);
    reservations.set(row.reservation_id, positions);
  }

  for (const row of rows) {
    if (reservations.get(row.reservation_id)?.size !== row.attendee_count) {
      throw new Error(`Reservation ${row.reservation_id} does not have its expected attendee rows.`);
    }
  }
}

export function rowsToCsv(rows) {
  validateAndGroupRows(rows);

  const lines = [
    CSV_COLUMNS.map(escapeCsvCell).join(','),
    ...rows.map((row) => {
      const output = {
        reservation_id: row.reservation_id,
        registration_status: row.registration_status,
        payment_status: row.payment_status,
        refund_status: row.refund_status,
        purchaser_name: row.purchaser_name,
        purchaser_email: row.purchaser_email,
        purchaser_phone: row.purchaser_phone,
        attendee_count: row.attendee_count,
        attendee_position: row.attendee_position,
        attendee_name: row.attendee_name,
        meal_id: row.meal_id,
        meal_name: row.meal_name,
        dietary_note: row.dietary_note,
        ticket_unit_amount: centsToDollars(row.ticket_unit_amount_cents, 'ticket_unit_amount_cents'),
        ticket_subtotal: centsToDollars(row.ticket_subtotal_cents, 'ticket_subtotal_cents'),
        donation_amount: centsToDollars(row.donation_amount_cents, 'donation_amount_cents'),
        total_paid: nullableCentsToDollars(row.amount_paid_cents, 'amount_paid_cents'),
        amount_refunded: nullableCentsToDollars(row.amount_refunded_cents, 'amount_refunded_cents'),
        currency: row.currency,
        seating_notes: row.seating_notes,
        created_at: row.created_at,
        payment_verified_at: row.payment_verified_at,
      };
      return CSV_COLUMNS.map((column) => escapeCsvCell(output[column])).join(',');
    }),
  ];

  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

function parseWranglerRows(stdout) {
  let payload;
  try {
    payload = JSON.parse(stdout);
  } catch {
    throw new Error('Wrangler returned an unreadable response.');
  }

  const statements = Array.isArray(payload) ? payload : [payload];
  if (!statements.length || statements.some((statement) => statement?.success !== true)) {
    throw new Error('The remote preview D1 query did not succeed.');
  }

  return statements.flatMap((statement) => (
    Array.isArray(statement.results) ? statement.results : []
  ));
}

function queryRemotePreview({ paidOnly }) {
  const result = spawnSync(process.execPath, [
    WRANGLER_CLI,
    'd1',
    'execute',
    PREVIEW_DATABASE_BINDING,
    '--remote',
    '--config',
    PREVIEW_CONFIG,
    '--command',
    buildExportQuery({ paidOnly }),
    '--json',
  ], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      NO_COLOR: '1',
      WRANGLER_SEND_METRICS: 'false',
    },
    maxBuffer: 64 * 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    throw new Error('Unable to read the remote preview D1 database. Confirm Cloudflare authentication and preview access.');
  }

  return parseWranglerRows(result.stdout);
}

export async function writeCsvFile(outputPath, csv, { overwrite = false } = {}) {
  await mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  await writeFile(outputPath, csv, {
    encoding: 'utf8',
    flag: overwrite ? 'w' : 'wx',
    mode: 0o600,
  });
  await chmod(outputPath, 0o600);
}

async function run() {
  const options = parseCliOptions(process.argv.slice(2));
  const rows = queryRemotePreview(options);
  const exportDate = new Date().toISOString().slice(0, 10);
  const relativeOutputPath = path.join('exports', `banquet-registrations-preview-${exportDate}.csv`);
  const outputPath = path.join(REPOSITORY_ROOT, relativeOutputPath);
  const csv = rowsToCsv(rows);

  await writeCsvFile(outputPath, csv, options);

  const reservationCount = new Set(rows.map((row) => row.reservation_id)).size;
  const scope = options.paidOnly ? 'paid/verified' : 'all-status';
  console.log(`Exported ${reservationCount} ${scope} preview reservation(s) and ${rows.length} attendee row(s).`);
  console.log(`Wrote ${relativeOutputPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Preview export failed.');
    process.exitCode = 1;
  });
}
