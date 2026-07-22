import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  CSV_COLUMNS,
  buildExportQuery,
  centsToDollars,
  escapeCsvCell,
  nullableCentsToDollars,
  parseCliOptions,
  protectSpreadsheetCell,
  rowsToCsv,
  writeCsvFile,
} from './export-banquet-preview.mjs';

const sampleRows = [1, 2].map((attendeePosition) => ({
  reservation_id: 'res_preview_123',
  registration_status: 'paid',
  payment_status: 'paid',
  refund_status: 'not_refunded',
  purchaser_name: '=DANGEROUS()',
  purchaser_email: 'preview@example.test',
  purchaser_phone: '+1 555 0100',
  attendee_count: 2,
  attendee_position: attendeePosition,
  attendee_name: attendeePosition === 1 ? 'Person, "One"' : '  @DANGEROUS',
  meal_id: attendeePosition === 1 ? 'preview-option-a' : 'preview-option-b',
  meal_name: attendeePosition === 1 ? 'Preview option A' : 'Preview option B',
  dietary_note: attendeePosition === 1 ? null : 'Vegetarian accommodation',
  ticket_unit_amount_cents: 8500,
  ticket_subtotal_cents: 17000,
  donation_amount_cents: 125,
  amount_paid_cents: 17125,
  amount_refunded_cents: null,
  currency: 'usd',
  seating_notes: 'Line one\nLine two',
  created_at: '2026-07-08T12:00:00.000Z',
  payment_verified_at: '2026-07-08T12:01:00.000Z',
}));

assert.equal(centsToDollars(0), '0.00');
assert.equal(centsToDollars(8500), '85.00');
assert.equal(centsToDollars(17125), '171.25');
assert.throws(() => centsToDollars(1.5), /Invalid integer-cent value/u);
assert.equal(nullableCentsToDollars(null), '');
assert.equal(nullableCentsToDollars(250), '2.50');

assert.equal(protectSpreadsheetCell('=SUM(A1:A2)'), "'=SUM(A1:A2)");
assert.equal(protectSpreadsheetCell('  @command'), "'  @command");
assert.equal(protectSpreadsheetCell('+1 555 0100'), "'+1 555 0100");
assert.equal(protectSpreadsheetCell('ordinary'), 'ordinary');
assert.equal(escapeCsvCell('Person, "One"'), '"Person, ""One"""');

const csv = rowsToCsv(sampleRows);
const lines = csv.split('\r\n');
assert.equal(lines[0], `\uFEFF${CSV_COLUMNS.map(escapeCsvCell).join(',')}`);
assert.equal(lines.length, 4);
assert.match(csv, /"'=DANGEROUS\(\)"/u);
assert.match(csv, /"'  @DANGEROUS"/u);
assert.match(csv, /"Person, ""One"""/u);
assert.match(csv, /"85\.00"/u);
assert.match(csv, /"170\.00"/u);
assert.match(csv, /"1\.25"/u);
assert.match(csv, /"171\.25"/u);
assert.match(csv, /"Line one\nLine two"/u);

const pendingRows = sampleRows.map((row) => ({
  ...row,
  registration_status: 'pending',
  payment_status: 'unpaid',
  amount_paid_cents: null,
  payment_verified_at: null,
}));
const pendingCsv = rowsToCsv(pendingRows);
assert.match(pendingCsv, /"pending"/u);
assert.match(pendingCsv, /"1\.25","",/u);

assert.throws(
  () => rowsToCsv(sampleRows.slice(0, 1)),
  /does not have its expected attendee rows/u,
);
assert.throws(
  () => rowsToCsv([{ ...sampleRows[0], registration_status: '' }, sampleRows[1]]),
  /has an invalid status/u,
);

assert.deepEqual(parseCliOptions([]), { overwrite: false, paidOnly: false });
assert.deepEqual(parseCliOptions(['--overwrite']), { overwrite: true, paidOnly: false });
assert.deepEqual(parseCliOptions(['--paid-only', '--overwrite']), { overwrite: true, paidOnly: true });
assert.throws(() => parseCliOptions(['--unknown']), /Unknown option/u);

const allStatusQuery = buildExportQuery();
const paidOnlyQuery = buildExportQuery({ paidOnly: true });
assert.doesNotMatch(allStatusQuery, /AND reservations\.payment_status = 'paid'/u);
assert.match(paidOnlyQuery, /AND reservations\.payment_status = 'paid'/u);
assert.match(paidOnlyQuery, /amount_paid_cents = reservations\.expected_total_cents/u);

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'banquet-preview-export-'));
const temporaryCsv = path.join(temporaryDirectory, 'preview.csv');
try {
  await writeCsvFile(temporaryCsv, 'first');
  await assert.rejects(
    () => writeCsvFile(temporaryCsv, 'second'),
    (error) => error?.code === 'EEXIST',
  );
  await writeCsvFile(temporaryCsv, 'second', { overwrite: true });
  assert.equal(await readFile(temporaryCsv, 'utf8'), 'second');
  assert.equal((await stat(temporaryCsv)).mode & 0o777, 0o600);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

console.log('Validated preview banquet CSV formatting and export safety checks.');
