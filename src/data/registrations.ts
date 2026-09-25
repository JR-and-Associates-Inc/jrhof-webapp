// Online registration settings, shared by the registration form (Astro) and the
// checkout Worker (worker/). Prices here are the only prices Stripe ever sees:
// the Worker ignores any amount sent by the browser.
//
// To reuse this for the golf tournament, add another record with its own id,
// seat label, meals (or a single "Golfer" option), and dates, then give its
// event page a registration.url. See docs/operations/EVENT_REGISTRATION.md.

export interface RegistrationMeal {
  id: string;
  name: string;
  description?: string;
}

export interface RegistrationConfig {
  /** Stable id stored in Stripe metadata. Never rename after the first sale. */
  id: string;
  /** Matches the EventRecord id in src/data/events.ts. */
  eventRecordId: string;
  title: string;
  eventPath: string;
  registerPath: string;
  displayDate: string;
  seatLabel: string;
  seatPriceCents: number;
  /**
   * False until the board records approval of seatPriceCents. While false,
   * public event pages do not state the price and the Worker refuses live-mode
   * (real money) checkout. Stripe test mode keeps working for reviewers.
   */
  priceApproved: boolean;
  capacity: number;
  maxSeatsPerOrder: number;
  meals: RegistrationMeal[];
  donation: { enabled: boolean; maxCents: number };
  /** ISO instants. Registration accepts orders from opensAt until closesAt. */
  opensAt: string;
  closesAt: string;
  opensDisplay: string;
  closesDisplay: string;
  refundPolicy: string;
}

export const registrations: RegistrationConfig[] = [
  {
    id: 'banquet-2027',
    eventRecordId: 'banquet-2027',
    title: '2027 Hall of Fame Induction Banquet',
    eventPath: '/events/induction-banquet/2027-hall-of-fame-induction-banquet/',
    registerPath: '/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/',
    displayDate: 'Saturday, February 6, 2027',
    seatLabel: 'Banquet seat',
    // $50 is the proposed price for review; not yet approved by the board.
    seatPriceCents: 5000,
    priceApproved: false,
    capacity: 300,
    maxSeatsPerOrder: 8,
    meals: [
      { id: 'chicken', name: 'Chicken' },
      { id: 'steak', name: 'Steak' },
    ],
    donation: { enabled: true, maxCents: 500000 },
    // Midnight Mountain Standard Time on Monday, November 16, 2026, through the
    // end of Friday, January 29, 2027.
    opensAt: '2026-11-16T00:00:00-07:00',
    closesAt: '2027-01-30T00:00:00-07:00',
    opensDisplay: 'Monday, November 16, 2026',
    closesDisplay: 'Friday, January 29, 2027',
    refundPolicy:
      'Full refunds are available until registration closes on Friday, January 29, 2027. After that, tickets are non-refundable, but you can transfer a seat to another guest by contacting us.',
  },
];

export function findRegistration(id: string): RegistrationConfig | undefined {
  return registrations.find((registration) => registration.id === id);
}

export function formatUsd(cents: number): string {
  const dollars = cents / 100;
  return `$${Number.isInteger(dollars) ? dollars.toLocaleString('en-US') : dollars.toFixed(2)}`;
}
