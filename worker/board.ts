import { formatUsd, type RegistrationConfig } from '../src/data/registrations.ts';
import { ATTENDING, formatDate, needsAttention, statusLabels, type Order, type Summary } from './orders.ts';
import { LIMITS } from './validation.ts';

// Server-rendered board pages. Plain HTML, no scripts, print-friendly.

export const esc = (value: string | number) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const stripePaymentUrl = (order: Order, paymentIntentId: string) => `https://dashboard.stripe.com/${order.livemode ? '' : 'test/'}payments/${paymentIntentId}`;

const boardPath = (event: RegistrationConfig) => `/board/${event.id}/`;

function page(title: string, testMode: boolean, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)} · JRHOF Board</title>
<style>
:root { --navy: #082b4c; --gold: #d1aa4e; --gold-soft: #fff7df; --ink: #1d2733; --muted: #5b6776; --line: #d9dee4; --ok: #1f6b3a; --warn: #8a4a18; --bad: #9b1c1c; }
* { box-sizing: border-box; }
body { margin: 0; color: var(--ink); background: #f5f4f0; font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
header { padding: 1rem clamp(1rem, 4vw, 2rem); color: white; background: var(--navy); border-bottom: 4px solid var(--gold); }
header p { margin: 0; color: #f3ce87; font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
header h1 { margin: .15rem 0 0; font: 700 clamp(1.4rem, 4vw, 2rem)/1.2 Georgia, serif; }
main { display: grid; gap: 1.5rem; max-width: 1180px; margin: 0 auto; padding: 1.5rem clamp(1rem, 4vw, 2rem) 3rem; }
main > * { min-width: 0; }
h2 { margin: 0 0 .75rem; color: var(--navy); font: 700 1.35rem/1.25 Georgia, serif; }
a { color: var(--navy); font-weight: 700; }
section { padding: clamp(1rem, 3vw, 1.5rem); background: white; border: 1px solid var(--line); border-radius: 10px; }
.test { padding: .75rem 1rem; color: #5b3a00; background: #ffe9a8; border: 2px dashed #c58a00; border-radius: 8px; font-weight: 700; }
.notice { padding: .75rem 1rem; background: #e8f4ec; border-left: 5px solid var(--ok); border-radius: 6px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .75rem; }
.stat { padding: 1rem; background: white; border: 1px solid var(--line); border-top: 4px solid var(--gold); border-radius: 10px; }
.stat strong { display: block; color: var(--navy); font: 700 2rem/1.1 Georgia, serif; }
.stat span { color: var(--muted); font-size: .9rem; }
.actions { display: flex; flex-wrap: wrap; gap: .6rem; }
.button { display: inline-flex; align-items: center; min-height: 44px; padding: .55rem 1rem; color: white; background: var(--navy); border: 2px solid var(--navy); border-radius: 7px; font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
.button.secondary { color: var(--navy); background: white; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .95rem; }
th, td { padding: .6rem .5rem; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); }
th { color: var(--muted); font-size: .78rem; letter-spacing: .06em; text-transform: uppercase; }
td small { display: block; color: var(--muted); }
ul.guests { margin: 0; padding: 0; list-style: none; }
.badge { display: inline-block; padding: .1rem .5rem; border-radius: 999px; font-size: .8rem; font-weight: 800; white-space: nowrap; }
.badge.paid { color: var(--ok); background: #e3f3e8; }
.badge.partially_refunded, .badge.processing, .badge.in_checkout { color: var(--warn); background: #fdf0e1; }
.badge.refunded, .badge.not_completed { color: var(--muted); background: #eceff2; }
.badge.disputed { color: var(--bad); background: #fde8e8; }
.attention { border-left: 5px solid var(--bad); }
details summary { cursor: pointer; font-weight: 700; color: var(--navy); }
.help { color: var(--muted); }
.help li { margin-bottom: .35rem; }
form.guests { display: grid; gap: 1rem; }
fieldset { display: grid; grid-template-columns: 1.4fr 1fr; gap: .75rem; margin: 0; padding: 1rem; border: 1px solid var(--line); border-radius: 8px; }
fieldset .wide { grid-column: 1 / -1; }
legend { padding: 0 .35rem; color: var(--navy); font-weight: 800; }
label { display: grid; gap: .25rem; font-weight: 700; }
input, select { width: 100%; min-height: 44px; padding: .5rem .6rem; border: 1px solid #9aa6b2; border-radius: 6px; font: inherit; }
.error { padding: .75rem 1rem; color: var(--bad); background: #fde8e8; border-radius: 6px; font-weight: 700; }
@media (max-width: 640px) {
  fieldset { grid-template-columns: 1fr; }
  .hide-sm { display: none; }
  table.orders, table.orders tbody, table.orders tr, table.orders td { display: block; }
  table.orders thead { display: none; }
  table.orders tr { padding: .75rem 0; border-bottom: 1px solid var(--line); }
  table.orders tr.attention { padding-left: .75rem; }
  table.orders td { padding: .2rem 0; border: 0; }
}
@media print { header, .actions, .no-print, .test { display: none; } body { background: white; } section { border: 0; padding: 0; } }
</style>
</head>
<body>
<header><p>JRHOF Board</p><h1>${esc(title)}</h1></header>
<main>
${testMode ? '<p class="test">TEST MODE: these are Stripe test orders. No real money has moved.</p>' : ''}
${body}
</main>
</body>
</html>`;
}

export function renderBoardIndex(events: RegistrationConfig[], testMode: boolean): string {
  return page('Event registrations', testMode, `<section><h2>Choose an event</h2><ul>${events
    .map((event) => `<li><a href="${boardPath(event)}">${esc(event.title)}</a> <small>${esc(event.displayDate)}</small></li>`)
    .join('')}</ul></section>`);
}

function guestList(order: Order): string {
  if (!order.guests.length && !ATTENDING.includes(order.status) && order.status !== 'refunded') {
    return `<em>${order.seatsPurchased} ${order.seatsPurchased === 1 ? 'seat' : 'seats'}, not paid yet</em>`;
  }
  if (!order.guests.length) return '<em>No guest list</em>';
  return `<ul class="guests">${order.guests
    .map((guest) => `<li>${esc(guest.name)}: <strong>${esc(guest.meal)}</strong>${guest.dietary ? `<small>${esc(guest.dietary)}</small>` : ''}</li>`)
    .join('')}</ul>`;
}

function orderRow(order: Order, event: RegistrationConfig): string {
  const refunded = order.amountRefundedCents ? `<small>${formatUsd(order.amountRefundedCents)} refunded</small>` : '';
  const donation = order.donationCents ? `<small>incl. ${formatUsd(order.donationCents)} donation</small>` : '';
  const canEdit = ATTENDING.includes(order.status) && order.paymentIntentId;
  return `<tr${needsAttention(order, event) ? ' class="attention"' : ''}>
<td>${esc(formatDate(order.created))}</td>
<td>${esc(order.purchaserName)}<small>${esc(order.purchaserEmail)}</small><small>${esc(order.purchaserPhone)}</small>${order.seatingRequest ? `<small>Seating: ${esc(order.seatingRequest)}</small>` : ''}</td>
<td>${guestList(order)}</td>
<td>${formatUsd(order.amountPaidCents)}${donation}${refunded}</td>
<td><span class="badge ${order.status}">${statusLabels[order.status]}</span></td>
<td class="no-print">${canEdit ? `<a href="${boardPath(event)}orders/${esc(order.sessionId)}/">Edit guests</a><br>` : ''}${order.paymentIntentId ? `<a href="${stripePaymentUrl(order, order.paymentIntentId)}" target="_blank" rel="noopener noreferrer">Open in Stripe</a>` : ''}</td>
</tr>`;
}

export function renderDashboard(event: RegistrationConfig, orders: Order[], summary: Summary, testMode: boolean, notice = ''): string {
  const completed = orders.filter((order) => ATTENDING.includes(order.status) || order.status === 'refunded');
  const pending = orders.filter((order) => order.status === 'in_checkout' || order.status === 'processing');
  const unfinished = orders.filter((order) => order.status === 'not_completed');
  const mealStats = summary.meals.map((meal) => `<div class="stat"><strong>${meal.count}</strong><span>${esc(meal.name)}</span></div>`).join('');

  const attention = summary.needsAttention.length ? `<section class="attention"><h2>Needs attention</h2><ul>${summary.needsAttention.map((order) => {
    const reason = order.status === 'disputed'
      ? 'The cardholder disputed this payment. Respond in Stripe.'
      : order.status === 'partially_refunded'
        ? 'Part of this order was refunded. If a guest cancelled, use Edit guests to remove them so the meal count stays right.'
        : 'This paid order has no guest list. Use Edit guests to add names and meals.';
    return `<li><strong>${esc(order.purchaserName || order.purchaserEmail)}</strong>: ${reason}</li>`;
  }).join('')}</ul></section>` : '';

  const table = (rows: Order[]) => `<div class="table-wrap"><table class="orders">
<thead><tr><th>Ordered</th><th>Purchaser</th><th>Guests and meals</th><th>Paid</th><th>Status</th><th class="no-print">Actions</th></tr></thead>
<tbody>${rows.map((order) => orderRow(order, event)).join('')}</tbody></table></div>`;

  return page(event.title, testMode, `
${notice ? `<p class="notice">${esc(notice)}</p>` : ''}
<div class="stats">
<div class="stat"><strong>${summary.seatsSold}</strong><span>seats sold of ${event.capacity}</span></div>
${mealStats}
<div class="stat"><strong>${summary.paidOrders}</strong><span>paid orders</span></div>
<div class="stat"><strong>${formatUsd(summary.collectedCents - summary.refundedCents)}</strong><span>collected after refunds</span></div>
<div class="stat"><strong>${formatUsd(summary.donationCents)}</strong><span>in added donations</span></div>
</div>
${summary.seatsHeld ? `<p class="help">${summary.seatsHeld} more ${summary.seatsHeld === 1 ? 'seat is' : 'seats are'} held by someone paying right now. Unpaid holds end after 30 minutes. ${summary.seatsRemaining} seats are still available.</p>` : `<p class="help">${summary.seatsRemaining} seats are still available.</p>`}
<div class="actions">
<a class="button" href="${boardPath(event)}attendees.csv">Download attendee list (CSV)</a>
<a class="button secondary" href="${boardPath(event)}kitchen/">Kitchen sheet</a>
<a class="button secondary" href="https://dashboard.stripe.com/${testMode ? 'test/' : ''}payments" target="_blank" rel="noopener noreferrer">Stripe payments</a>
</div>
${attention}
<section><h2>Orders (${completed.length})</h2>${completed.length ? table(completed) : '<p>No completed orders yet.</p>'}</section>
${pending.length ? `<section><h2>Paying right now (${pending.length})</h2>${table(pending)}</section>` : ''}
${unfinished.length ? `<section><details><summary>Started but did not finish (${unfinished.length})</summary><p class="help">These people opened the payment page but did not pay. No seats are held. You may want to follow up.</p>${table(unfinished)}</details></section>` : ''}
<section class="help no-print"><h2>How to handle changes</h2><ul>
<li><strong>Guest name or meal change:</strong> choose Edit guests on the order.</li>
<li><strong>Full refund:</strong> choose Open in Stripe, then Refund payment. The order is marked Refunded here automatically and its guests leave the meal count.</li>
<li><strong>One guest cancels:</strong> in Stripe, refund ${formatUsd(event.seatPriceCents)} (one seat). Then choose Edit guests here and remove that guest.</li>
<li><strong>Card declined or checkout abandoned:</strong> nothing to do. Stripe never created an order, and no seat is held after 30 minutes.</li>
<li><strong>Receipts:</strong> Stripe emails the purchaser a receipt for every payment and refund.</li>
</ul></section>`);
}

export function renderKitchenSheet(event: RegistrationConfig, orders: Order[], summary: Summary, testMode: boolean): string {
  const guests = orders
    .filter((order) => ATTENDING.includes(order.status))
    .flatMap((order) => order.guests.map((guest) => ({ ...guest, purchaser: order.purchaserName })))
    .sort((a, b) => a.name.localeCompare(b.name));
  return page(`${event.title}: kitchen sheet`, testMode, `
<div class="actions"><a class="button secondary" href="${boardPath(event)}">Back to dashboard</a></div>
<section><h2>Meal count (${summary.seatsSold} guests)</h2><table><tbody>${summary.meals
    .map((meal) => `<tr><th scope="row">${esc(meal.name)}</th><td><strong>${meal.count}</strong></td></tr>`).join('')}</tbody></table>
<p class="help">As of ${esc(formatDate(Math.floor(Date.now() / 1000)))}. Paid and partly refunded orders only.</p></section>
<section><h2>Dietary notes (${summary.dietaryNotes.length})</h2>${summary.dietaryNotes.length ? `<table><thead><tr><th>Guest</th><th>Meal</th><th>Note</th></tr></thead><tbody>${summary.dietaryNotes
    .map((note) => `<tr><td>${esc(note.guest)}</td><td>${esc(note.meal)}</td><td>${esc(note.note)}</td></tr>`).join('')}</tbody></table>` : '<p>None.</p>'}</section>
<section><h2>All guests</h2><table><thead><tr><th>Guest</th><th>Meal</th><th class="hide-sm">Party of</th></tr></thead><tbody>${guests
    .map((guest) => `<tr><td>${esc(guest.name)}</td><td>${esc(guest.meal)}</td><td class="hide-sm">${esc(guest.purchaser)}</td></tr>`).join('')}</tbody></table></section>`);
}

export function renderEditOrder(event: RegistrationConfig, order: Order, testMode: boolean, error = '', values?: URLSearchParams): string {
  const slots = Math.max(order.seatsPurchased, order.guests.length, 1);
  const field = (name: string, fallback: string) => values ? values.get(name) ?? '' : fallback;
  const rows = Array.from({ length: slots }, (_, index) => {
    const number = index + 1;
    const guest = order.guests[index];
    const meal = field(`guest_${number}_meal`, guest?.meal ?? '');
    return `<fieldset><legend>Guest ${number}</legend>
<label>Full name<input name="guest_${number}_name" maxlength="${LIMITS.name}" value="${esc(field(`guest_${number}_name`, guest?.name ?? ''))}" autocomplete="off"></label>
<label>Meal<select name="guest_${number}_meal"><option value="">Choose a meal</option>${event.meals
      .map((option) => `<option value="${esc(option.id)}"${option.name.toLowerCase() === meal.toLowerCase() || option.id === meal ? ' selected' : ''}>${esc(option.name)}</option>`).join('')}</select></label>
<label class="wide">Dietary note (optional)<input name="guest_${number}_dietary" maxlength="${LIMITS.dietary}" value="${esc(field(`guest_${number}_dietary`, guest?.dietary ?? ''))}" autocomplete="off"></label>
</fieldset>`;
  }).join('');

  return page(`Edit guests: ${order.purchaserName || order.purchaserEmail}`, testMode, `
<div class="actions"><a class="button secondary" href="${boardPath(event)}">Back to dashboard</a></div>
<section><p><strong>${esc(order.purchaserName)}</strong> · ${esc(order.purchaserEmail)} · ${esc(order.purchaserPhone)}<br>
Paid ${formatUsd(order.amountPaidCents)} for ${order.seatsPurchased} ${order.seatsPurchased === 1 ? 'seat' : 'seats'} on ${esc(formatDate(order.created))}. <span class="badge ${order.status}">${statusLabels[order.status]}</span></p>
<p class="help">Change a name or meal, or clear every field for a guest who cancelled. To add seats beyond what was paid for, ask the guest to register again.</p>
${error ? `<p class="error" role="alert">${esc(error)}</p>` : ''}
<form class="guests" method="post">${rows}<div class="actions"><button class="button" type="submit">Save guests</button><a class="button secondary" href="${boardPath(event)}">Cancel</a></div></form>
</section>`);
}

export function renderMessage(title: string, message: string, testMode = false, status = ''): string {
  return page(title, testMode, `<section>${status ? `<p class="help">${esc(status)}</p>` : ''}<p>${esc(message)}</p><p><a href="/board/">Back to the board</a></p></section>`);
}
