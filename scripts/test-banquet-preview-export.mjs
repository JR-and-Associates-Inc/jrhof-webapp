import assert from 'node:assert/strict';
import {
  CSV_COLUMNS,
  centsToDollars,
  escapeCsvCell,
  protectSpreadsheetCell,
  rowsToCsv,
} from './export-banquet-preview.mjs';

const sampleRows = [1, 2].map((attendeePosition) => ({
  reservation_id: 'res_preview_123',
  status: 'paid',
  purchaser_name: '=DANGEROUS()',
  purchaser_email: 'preview@example.test',
  purchaser_phone: '+1 555 0100',
  attendee_count: 2,
  attendee_position: attendeePosition,
  attendee_name: attendeePosition === 1 ? 'Person, "One"' : '  @DANGEROUS',
  meal_choice: attendeePosition === 1 ? 'chicken' : 'steak',
  ticket_unit_amount_cents: 8500,
  ticket_subtotal_cents: 17000,
  donation_amount_cents: 125,
  amount_paid_cents: 17125,
  currency: 'usd',
  seating_notes: 'Line one\nLine two',
  created_at: '2026-07-08T12:00:00.000Z',
  payment_verified_at: '2026-07-08T12:01:00.000Z',
}));

assert.equal(centsToDollars(0), '0.00');
assert.equal(centsToDollars(8500), '85.00');
assert.equal(centsToDollars(17125), '171.25');
assert.throws(() => centsToDollars(1.5), /Invalid integer-cent value/u);

assert.equal(protectSpreadsheetCell('=SUM(A1:A2)'), "'=SUM(A1:A2)");
assert.equal(protectSpreadsheetCell('  @command'), "'  @command");
assert.equal(protectSpreadsheetCell('+1 555 0100'), "'+1 555 0100");
assert.equal(protectSpreadsheetCell('ordinary'), 'ordinary');
assert.equal(escapeCsvCell('Person, "One"'), '"Person, ""One"""');

const csv = rowsToCsv(sampleRows);
const lines = csv.split('\r\n');
assert.equal(lines[0], CSV_COLUMNS.map(escapeCsvCell).join(','));
assert.equal(lines.length, 4);
assert.match(csv, /"'=DANGEROUS\(\)"/u);
assert.match(csv, /"'  @DANGEROUS"/u);
assert.match(csv, /"Person, ""One"""/u);
assert.match(csv, /"85\.00"/u);
assert.match(csv, /"170\.00"/u);
assert.match(csv, /"1\.25"/u);
assert.match(csv, /"171\.25"/u);
assert.match(csv, /"Line one\nLine two"/u);

assert.throws(
  () => rowsToCsv(sampleRows.slice(0, 1)),
  /does not have its expected attendee rows/u,
);
assert.throws(
  () => rowsToCsv([{ ...sampleRows[0], status: 'pending' }, sampleRows[1]]),
  /is not server-verified as paid/u,
);

console.log('Validated preview banquet CSV formatting and export safety checks.');
