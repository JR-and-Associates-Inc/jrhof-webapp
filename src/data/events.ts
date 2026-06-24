export const eventLinks = {
  golfRegistration: 'https://www.eventbrite.com/e/joe-rossi-hof-golf-tournament-2026-tickets-1985644019715',
  raffleTickets: 'https://buy.stripe.com/7sYdR84L01mG0F64wO93y02',
  mulligans: 'https://buy.stripe.com/5kQ3cuelA6H04VmbZg93y03',
  donate: 'https://donate.stripe.com/00w5kC7Xc4yS1Jagfw93y01',
} as const;

export const golf2026 = {
  title: '2026 Joe Rossi Umpires Hall of Fame Presents – The Umpire’s Cup IV',
  shortTitle: 'The Umpire’s Cup IV',
  status: 'Registration open',
  date: 'Saturday, June 27, 2026',
  dateTime: '2026-06-27T08:00:00-06:00',
  time: '8:00 a.m.',
  entryFee: '$130 per golfer',
  venue: 'Applewood Golf Club',
  address: '14001 W. 32nd Ave., Golden, CO 80401',
  page: '/events/golf-tournament/',
  flyer: 'https://jrhof.org/wp-content/uploads/2026/03/golf_tournament_flyer_2026-1-2-2.pdf',
} as const;

export const banquet2026 = {
  title: '2026 Hall of Fame Induction Banquet',
  status: 'Completed · Photos pending',
  date: 'Saturday, January 31, 2026',
  venue: 'Holiday Inn Denver–Lakewood',
  address: '7390 W. Hampden Ave., Lakewood, CO 80227',
  page: '/events/induction-banquet/',
  inductees: ['Terry Angell', 'George Demetriou', 'Fred Zuercher'],
} as const;

export const banquet2027 = {
  title: '2027 Induction Banquet',
  status: 'Save the Date',
  date: 'February 6, 2027',
  dateIsTentative: true,
} as const;

export const golfGalleryArchive = [
  {
    year: 2025,
    title: 'The Umpire’s Cup III',
    status: 'Gallery source available · Migration planned',
    source: 'https://jrhof.org/2025-joe-rossi-hall-of-fame-presents-the-umpires-cup-iii/',
  },
  {
    year: 2024,
    title: 'The Umpire’s Cup II',
    status: 'Gallery source available · Migration planned',
    source: 'https://jrhof.org/2024-joe-rossi-hall-of-fame-presents-the-umpires-cup-ii/',
  },
] as const;
