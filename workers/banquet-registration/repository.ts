import type {
  BanquetEventConfig,
  PendingReservation,
  ReservationRow,
  ValidatedRegistration,
} from './types';

interface EventConfigRow {
  id: string;
  title: string;
  configuration_status: 'preview_unapproved';
  registration_open: number;
  capacity: number;
  ticket_unit_amount_cents: number;
  donation_min_cents: number;
  donation_max_cents: number;
  currency: 'usd';
  checkout_ttl_seconds: number;
}

export class CapacityUnavailableError extends Error {
  constructor() {
    super('capacity_unavailable');
    this.name = 'CapacityUnavailableError';
  }
}

export class DuplicateWebhookError extends Error {
  constructor() {
    super('duplicate_webhook');
    this.name = 'DuplicateWebhookError';
  }
}

const isUniqueConstraintError = (error: unknown) => (
  error instanceof Error && /unique constraint failed/i.test(error.message)
);

export async function getEventConfig(db: D1Database, eventId: string): Promise<BanquetEventConfig | null> {
  const row = await db.prepare(`
    SELECT
      id,
      title,
      configuration_status,
      registration_open,
      capacity,
      ticket_unit_amount_cents,
      donation_min_cents,
      donation_max_cents,
      currency,
      checkout_ttl_seconds
    FROM banquet_events
    WHERE id = ?
  `).bind(eventId).first<EventConfigRow>();

  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    configurationStatus: row.configuration_status,
    registrationOpen: row.registration_open === 1,
    capacity: row.capacity,
    ticketUnitAmountCents: row.ticket_unit_amount_cents,
    donationMinCents: row.donation_min_cents,
    donationMaxCents: row.donation_max_cents,
    currency: row.currency,
    checkoutTtlSeconds: row.checkout_ttl_seconds,
  };
}

export async function createPendingReservation(
  db: D1Database,
  event: BanquetEventConfig,
  registration: ValidatedRegistration,
): Promise<PendingReservation> {
  const id = crypto.randomUUID();
  const attendeeCount = registration.attendees.length;
  const ticketSubtotalCents = event.ticketUnitAmountCents * attendeeCount;
  const expectedTotalCents = ticketSubtotalCents + registration.donationAmountCents;
  const checkoutExpiresAt = new Date(Date.now() + event.checkoutTtlSeconds * 1000).toISOString();

  const reservationStatement = db.prepare(`
    INSERT INTO banquet_reservations (
      id,
      event_id,
      status,
      contact_name,
      contact_email,
      contact_phone,
      attendee_count,
      seating_notes,
      ticket_unit_amount_cents,
      ticket_subtotal_cents,
      donation_amount_cents,
      expected_total_cents,
      currency,
      checkout_expires_at
    )
    SELECT ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE (
      SELECT COALESCE(SUM(attendee_count), 0)
      FROM banquet_reservations
      WHERE event_id = ?
        AND (
          status = 'paid'
          OR (status = 'pending' AND checkout_expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
    ) + ? <= ?
    RETURNING id
  `).bind(
    id,
    event.id,
    registration.contact.name,
    registration.contact.email,
    registration.contact.phone,
    attendeeCount,
    registration.seatingNotes,
    event.ticketUnitAmountCents,
    ticketSubtotalCents,
    registration.donationAmountCents,
    expectedTotalCents,
    event.currency,
    checkoutExpiresAt,
    event.id,
    attendeeCount,
    event.capacity,
  );

  const attendeeStatements = registration.attendees.map((attendee, index) => db.prepare(`
    INSERT INTO banquet_attendees (
      id,
      reservation_id,
      attendee_position,
      full_name,
      meal_choice
    )
    SELECT ?, ?, ?, ?, ?
    WHERE EXISTS (SELECT 1 FROM banquet_reservations WHERE id = ?)
    RETURNING id
  `).bind(
    crypto.randomUUID(),
    id,
    index + 1,
    attendee.fullName,
    attendee.mealChoice,
    id,
  ));

  const results = await db.batch<{ id: string }>([reservationStatement, ...attendeeStatements]);
  if (results[0]?.results.length !== 1) throw new CapacityUnavailableError();
  if (results.slice(1).some((result) => result.results.length !== 1)) {
    throw new Error('attendee_insert_failed');
  }

  return {
    id,
    eventId: event.id,
    attendeeCount,
    ticketUnitAmountCents: event.ticketUnitAmountCents,
    ticketSubtotalCents,
    donationAmountCents: registration.donationAmountCents,
    expectedTotalCents,
    currency: event.currency,
    checkoutExpiresAt,
  };
}

export async function attachCheckoutSession(
  db: D1Database,
  reservationId: string,
  sessionId: string,
  expiresAt: number,
): Promise<void> {
  const result = await db.prepare(`
    UPDATE banquet_reservations
    SET stripe_checkout_session_id = ?,
        checkout_expires_at = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ? AND status = 'pending' AND stripe_checkout_session_id IS NULL
  `).bind(sessionId, new Date(expiresAt * 1000).toISOString(), reservationId).run();
  if (result.meta.changes !== 1) throw new Error('checkout_session_attach_failed');
}

export async function markCheckoutFailed(db: D1Database, reservationId: string): Promise<void> {
  await db.prepare(`
    UPDATE banquet_reservations
    SET status = 'checkout_failed',
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ? AND status = 'pending'
  `).bind(reservationId).run();
}

export async function getReservation(db: D1Database, reservationId: string): Promise<ReservationRow | null> {
  return db.prepare(`
    SELECT id, event_id, status, expected_total_cents, currency, stripe_checkout_session_id
    FROM banquet_reservations
    WHERE id = ?
  `).bind(reservationId).first<ReservationRow>();
}

interface WebhookRecord {
  stripeEventId: string;
  eventType: string;
  reservationId: string | null;
  payloadSha256: string;
  outcome: 'applied' | 'ignored' | 'payment_review';
  errorCode: string | null;
}

const webhookInsert = (db: D1Database, record: WebhookRecord) => db.prepare(`
  INSERT INTO banquet_webhook_events (
    stripe_event_id,
    event_type,
    livemode,
    reservation_id,
    payload_sha256,
    outcome,
    error_code
  ) VALUES (?, ?, 0, ?, ?, ?, ?)
`).bind(
  record.stripeEventId,
  record.eventType,
  record.reservationId,
  record.payloadSha256,
  record.outcome,
  record.errorCode,
);

export async function recordPaidWebhook(
  db: D1Database,
  record: WebhookRecord,
  reservation: ReservationRow,
  sessionId: string,
  paymentIntentId: string,
  amountPaidCents: number,
): Promise<void> {
  try {
    const results = await db.batch([
      webhookInsert(db, record),
      db.prepare(`
        UPDATE banquet_reservations
        SET status = 'paid',
            amount_paid_cents = ?,
            stripe_payment_intent_id = ?,
            stripe_last_event_id = ?,
            payment_verified_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
            paid_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?
          AND event_id = ?
          AND stripe_checkout_session_id = ?
          AND status IN ('pending', 'payment_review')
      `).bind(
        amountPaidCents,
        paymentIntentId,
        record.stripeEventId,
        reservation.id,
        reservation.event_id,
        sessionId,
      ),
    ]);
    if (results[1]?.meta.changes !== 1) throw new Error('paid_state_transition_failed');
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new DuplicateWebhookError();
    throw error;
  }
}

export async function recordExpiredWebhook(
  db: D1Database,
  record: WebhookRecord,
  reservation: ReservationRow,
  sessionId: string,
): Promise<void> {
  try {
    await db.batch([
      webhookInsert(db, record),
      db.prepare(`
        UPDATE banquet_reservations
        SET status = CASE WHEN status = 'pending' THEN 'expired' ELSE status END,
            stripe_last_event_id = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND stripe_checkout_session_id = ?
      `).bind(record.stripeEventId, reservation.id, sessionId),
    ]);
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new DuplicateWebhookError();
    throw error;
  }
}

export async function recordWebhookReview(
  db: D1Database,
  record: WebhookRecord,
  reason: 'amount_mismatch' | 'currency_mismatch' | 'identity_mismatch' | 'payment_status_mismatch' | 'unknown_reservation',
  reservation: ReservationRow | null,
  expectedAmountCents: number | null,
  actualAmountCents: number | null,
): Promise<void> {
  try {
    const statements: D1PreparedStatement[] = [webhookInsert(db, record)];
    if (reservation) {
      statements.push(db.prepare(`
        UPDATE banquet_reservations
        SET status = 'payment_review',
            stripe_last_event_id = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND status != 'paid'
      `).bind(record.stripeEventId, reservation.id));
    }
    statements.push(db.prepare(`
      INSERT INTO banquet_payment_alerts (
        id,
        reservation_id,
        stripe_event_id,
        reason,
        expected_amount_cents,
        actual_amount_cents
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      reservation?.id ?? null,
      record.stripeEventId,
      reason,
      expectedAmountCents,
      actualAmountCents,
    ));
    await db.batch(statements);
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new DuplicateWebhookError();
    throw error;
  }
}

export async function recordIgnoredWebhook(db: D1Database, record: WebhookRecord): Promise<void> {
  try {
    await webhookInsert(db, record).run();
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new DuplicateWebhookError();
    throw error;
  }
}
