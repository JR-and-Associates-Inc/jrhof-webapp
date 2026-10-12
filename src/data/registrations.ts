// Banquet registration settings shown on the public event and register pages.
// Zeffy charges the card, so the live prices, questions and limits are
// configured in the Zeffy campaign; keep these values in step with it, changing
// this file first (docs/operations/ZEFFY.md). No server code reads them.

export interface RegistrationMeal {
  id: string;
  /** Must match the Zeffy meal answer exactly; reports and kitchen counts use it. */
  name: string;
  /** Optional menu description from the venue, shown under the name on the event and register pages (MealChoices.astro). */
  description?: string;
}

export interface RegistrationConfig {
  /** Stable id for this registration. Never rename it. */
  id: string;
  /** Matches the EventRecord id in src/data/events.ts. */
  eventRecordId: string;
  title: string;
  eventPath: string;
  registerPath: string;
  displayDate: string;
  seatLabel: string;
  seatPriceCents: number;
  /** Exclusive end instant: December 14 at midnight includes all of December 13. */
  earlyBird?: { seatPriceCents: number; endsAt: string; endsDisplay: string };
  /** False until the board approves the price; until then public pages do not state it. */
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
    displayDate: 'Saturday, February 6, 2027 · noon–4 p.m.',
    seatLabel: 'Banquet seat',
    // $50 is the proposed price for review; not yet approved by the board.
    seatPriceCents: 5000,
    earlyBird: { seatPriceCents: 4300, endsAt: '2026-12-14T00:00:00-07:00', endsDisplay: 'December 13, 2026' },
    priceApproved: true,
    capacity: 300,
    maxSeatsPerOrder: 24,
    // Descriptions: the venue's menu wording, supplied by Vicki on October 12, 2026.
    // The same wording is in the Zeffy campaign and ticket descriptions.
    meals: [
      {
        id: 'pasta-carbonara',
        name: 'Pasta Carbonara',
        description: 'Fettuccine, smoked bacon, onions, garlic, Italian sausage and seasonings. Vegetarian available.',
      },
      {
        id: 'chicken-piccata',
        name: 'Chicken Piccata',
        description: 'Grilled chicken breast with lemon caper sauce, served with pasta and fresh steamed broccoli.',
      },
    ],
    donation: { enabled: true, maxCents: 500000 },
    // Midnight Mountain Standard Time on Monday, November 16, 2026, through the
    // end of Friday, January 29, 2027.
    opensAt: '2026-11-16T00:00:00-07:00',
    closesAt: '2027-01-30T00:00:00-07:00',
    // Public wording until the board announces the date; opensAt still decides
    // when registration actually opens.
    opensDisplay: 'soon',
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

/** The server clock selects the price; browser amounts never set a charge. */
export function seatPriceAt(event: RegistrationConfig, now: number): { amountCents: number; label: string } {
  if (event.earlyBird && now < Date.parse(event.earlyBird.endsAt)) {
    return { amountCents: event.earlyBird.seatPriceCents, label: 'Early bird' };
  }
  return { amountCents: event.seatPriceCents, label: 'Regular' };
}
