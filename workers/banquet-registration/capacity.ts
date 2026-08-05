export const CAPACITY_HELD_PAYMENT_REVIEW_SQL = [
  "status = 'payment_review'",
  "payment_status IN ('unpaid', 'paid', 'disputed', 'partially_refunded')",
].join(' AND ');
