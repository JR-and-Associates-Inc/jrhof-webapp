import { eventLinks } from '../config/site';

export { eventLinks };

export type EventType = 'golf' | 'induction-banquet';
export type EventStatus =
  | 'scheduled'
  | 'registration-open'
  | 'completed'
  | 'gallery-published'
  | 'archived';

export interface EventDocument {
  label: string;
  url?: string;
  status: 'available' | 'pending' | 'unavailable';
}

export interface EventGallery {
  status: 'published' | 'prepared' | 'pending' | 'unavailable';
  manifest?: 'golf-2024' | 'golf-2025' | 'golf-2026' | 'banquet-2026';
  mediaPath?: string;
  count?: number;
}

export interface EventSponsor {
  name: string;
  url?: string;
}

export interface EventPhotographer {
  name: string;
  person?: string;
  url?: string;
}

export interface EventRegistration {
  status: 'not-open' | 'open' | 'closed';
  url?: string;
  note?: string;
}

export interface EventRecord {
  id: string;
  eventType: EventType;
  year: number;
  slug: string;
  canonicalPath: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  status: EventStatus;
  startDate?: string;
  endDate?: string;
  displayDate: string;
  venueName?: string;
  venueAddress?: string;
  location?: string;
  description: string;
  recap?: string;
  heroImage?: string;
  flyer?: EventDocument;
  program?: EventDocument;
  registration?: EventRegistration;
  gallery?: EventGallery;
  sponsors: EventSponsor[];
  photographer?: EventPhotographer;
  inductees: string[];
  documents: EventDocument[];
  seoTitle: string;
  seoDescription: string;
}

const leBaronPortraits: EventPhotographer = {
  name: 'LeBaron Portraits',
  person: 'Scott LeBaron',
  url: 'https://www.lebaronportraits.com/',
};

const kskSponsor: EventSponsor = { name: 'KSK' };

export const events: EventRecord[] = [
  {
    id: 'banquet-2027',
    eventType: 'induction-banquet',
    year: 2027,
    slug: '2027-hall-of-fame-induction-banquet',
    canonicalPath: '/events/induction-banquet/2027-hall-of-fame-induction-banquet/',
    title: '2027 Hall of Fame Induction Banquet',
    shortTitle: '2027 Induction Banquet',
    subtitle: 'Honoring Colorado’s baseball umpiring legacy',
    status: 'scheduled',
    startDate: '2027-02-06',
    displayDate: 'Saturday, February 6, 2027',
    description: 'The Joe Rossi Umpires Hall of Fame will gather for its annual induction banquet on Saturday, February 6, 2027.',
    recap: 'Registration is not yet open. Additional venue, schedule, honoree, and registration details will be published when finalized.',
    registration: {
      status: 'not-open',
      note: 'Registration is not yet open. Additional details will be published when finalized.',
    },
    gallery: { status: 'unavailable' },
    sponsors: [],
    inductees: [],
    documents: [],
    seoTitle: '2027 Hall of Fame Induction Banquet',
    seoDescription: 'The 2027 Joe Rossi Umpires Hall of Fame Induction Banquet is scheduled for Saturday, February 6, 2027. Registration is not yet open.',
  },
  {
    id: 'golf-2026',
    eventType: 'golf',
    year: 2026,
    slug: '2026-umpires-cup-iv',
    canonicalPath: '/events/golf/2026-umpires-cup-iv/',
    title: '2026 Joe Rossi Umpires Hall of Fame Presents – The Umpire’s Cup IV',
    shortTitle: 'The Umpire’s Cup IV',
    subtitle: 'The Hall of Fame’s annual summer golf fundraiser',
    status: 'gallery-published',
    startDate: '2026-06-27T08:00:00-06:00',
    displayDate: 'Saturday, June 27, 2026',
    venueName: 'Applewood Golf Club',
    venueAddress: '14001 W. 32nd Ave., Golden, CO 80401',
    location: 'Golden, Colorado',
    description: 'The Umpire’s Cup IV brought golfers, sponsors, donors, volunteers, and Hall of Fame supporters together for the annual summer fundraiser.',
    recap: 'The photography archive follows the day from arrivals and group portraits through play on the course.',
    flyer: {
      label: '2026 Tournament Flyer',
      url: 'https://cdn.jrhof.org/events/golf-tournament/2026/golf_tournament_flyer_2026.pdf',
      status: 'available',
    },
    registration: { status: 'closed' },
    gallery: {
      status: 'published',
      manifest: 'golf-2026',
      mediaPath: 'events/golf/2026/umpires-cup-iv/v1/',
      count: 176,
    },
    sponsors: [kskSponsor],
    photographer: leBaronPortraits,
    inductees: [],
    documents: [],
    seoTitle: '2026 Umpire’s Cup IV',
    seoDescription: 'Relive the completed 2026 Joe Rossi Umpires Hall of Fame Umpire’s Cup IV at Applewood Golf Club.',
  },
  {
    id: 'banquet-2026',
    eventType: 'induction-banquet',
    year: 2026,
    slug: '2026-hall-of-fame-induction-banquet',
    canonicalPath: '/events/induction-banquet/2026-hall-of-fame-induction-banquet/',
    title: '2026 Hall of Fame Induction Banquet',
    shortTitle: '2026 Induction Banquet',
    subtitle: 'Celebrating the Hall of Fame Class of 2026',
    status: 'gallery-published',
    startDate: '2026-01-31T18:00:00-07:00',
    displayDate: 'Saturday, January 31, 2026',
    venueName: 'Holiday Inn Denver–Lakewood',
    venueAddress: '7390 W. Hampden Ave., Lakewood, CO 80227',
    location: 'Lakewood, Colorado',
    description: 'The annual banquet brought inductees, family members, friends, and the umpiring community together to recognize service, achievement, and lasting contributions to baseball in Colorado.',
    recap: 'The Joe Rossi Umpires Hall of Fame honored Terry Angell, George Demetriou, and Fred Zuercher as the Class of 2026.',
    heroImage: 'https://media.jrhof.org/events/induction-banquet/2026-hall-of-fame-induction-banquet/hero.webp',
    program: { label: '2026 Banquet Program', status: 'pending' },
    registration: { status: 'closed' },
    gallery: {
      status: 'published',
      manifest: 'banquet-2026',
      mediaPath: 'events/induction-banquet/2026-hall-of-fame-induction-banquet/',
      count: 139,
    },
    sponsors: [],
    inductees: ['Terry Angell', 'George Demetriou', 'Fred Zuercher'],
    documents: [],
    seoTitle: '2026 Hall of Fame Induction Banquet',
    seoDescription: 'Recap and full photo gallery from the 2026 Joe Rossi Umpires Hall of Fame Induction Banquet honoring Terry Angell, George Demetriou, and Fred Zuercher.',
  },
  {
    id: 'golf-2025',
    eventType: 'golf',
    year: 2025,
    slug: '2025-umpires-cup-iii',
    canonicalPath: '/events/golf/2025-umpires-cup-iii/',
    title: '2025 Joe Rossi Umpires Hall of Fame Presents – The Umpire’s Cup III',
    shortTitle: 'The Umpire’s Cup III',
    subtitle: 'The third annual Umpire’s Cup golf fundraiser',
    status: 'gallery-published',
    displayDate: '2025 · Exact date not yet recorded',
    description: 'The 2025 tournament continued the Hall of Fame’s summer tradition: a day of golf, fellowship, and fundraising in support of Colorado’s baseball umpiring legacy.',
    recap: 'The complete approved tournament photography collection is available below.',
    registration: { status: 'closed' },
    gallery: {
      status: 'published',
      manifest: 'golf-2025',
      mediaPath: 'events/golf/2025/umpires-cup-iii/v1/',
      count: 244,
    },
    sponsors: [kskSponsor],
    photographer: leBaronPortraits,
    inductees: [],
    documents: [],
    seoTitle: '2025 Umpire’s Cup III',
    seoDescription: 'Explore the 2025 Joe Rossi Umpires Hall of Fame Umpire’s Cup III golf tournament photography archive.',
  },
  {
    id: 'banquet-2025',
    eventType: 'induction-banquet',
    year: 2025,
    slug: '2025-hall-of-fame-induction-banquet',
    canonicalPath: '/events/induction-banquet/2025-hall-of-fame-induction-banquet/',
    title: '2025 Hall of Fame Induction Banquet',
    shortTitle: '2025 Induction Banquet',
    subtitle: 'An immutable record in the Hall of Fame banquet archive',
    status: 'archived',
    displayDate: '2025 · Exact date not yet recorded',
    description: 'This annual record preserves the 2025 Hall of Fame Induction Banquet in the banquet archive.',
    recap: 'Additional verified details, photographs, and documents will be added to this page as archival materials are digitized and approved.',
    program: { label: '2025 Banquet Program', status: 'pending' },
    registration: { status: 'closed' },
    gallery: { status: 'unavailable' },
    sponsors: [],
    inductees: [],
    documents: [],
    seoTitle: '2025 Hall of Fame Induction Banquet',
    seoDescription: 'Archive record for the 2025 Joe Rossi Umpires Hall of Fame Induction Banquet.',
  },
  {
    id: 'golf-2024',
    eventType: 'golf',
    year: 2024,
    slug: '2024-umpires-cup-ii',
    canonicalPath: '/events/golf/2024-umpires-cup-ii/',
    title: '2024 Joe Rossi Hall of Fame Presents – The Umpire’s Cup II',
    shortTitle: 'The Umpire’s Cup II',
    subtitle: 'A summer tradition preserved in photographs',
    status: 'gallery-published',
    displayDate: '2024 · Exact date not yet recorded',
    description: 'The Umpire’s Cup brought golfers, umpires, sponsors, and friends together for a day supporting the Hall of Fame’s work.',
    recap: 'This archive follows the tournament from arrival and opening shots through the groups, course moments, and community around the event.',
    registration: { status: 'closed' },
    gallery: {
      status: 'published',
      manifest: 'golf-2024',
      mediaPath: 'events/golf/2024/umpires-cup-ii/',
      count: 158,
    },
    sponsors: [kskSponsor],
    photographer: leBaronPortraits,
    inductees: [],
    documents: [],
    seoTitle: '2024 Umpire’s Cup II',
    seoDescription: 'View the optimized 2024 Joe Rossi Hall of Fame Umpire’s Cup II golf tournament gallery, sponsored by KSK with photography by LeBaron Portraits.',
  },
];

export const eventTypeLabels: Record<EventType, string> = {
  golf: 'Umpire’s Cup Golf Tournament',
  'induction-banquet': 'Hall of Fame Induction Banquet',
};

export const eventTypePaths: Record<EventType, string> = {
  golf: '/events/golf/',
  'induction-banquet': '/events/induction-banquet/',
};

export const eventStatusLabels: Record<EventStatus, string> = {
  scheduled: 'Scheduled',
  'registration-open': 'Registration Open',
  completed: 'Completed',
  'gallery-published': 'Completed · Gallery Published',
  archived: 'Archived',
};

export const banquetEvents = events.filter((event) => event.eventType === 'induction-banquet');
export const golfEvents = events.filter((event) => event.eventType === 'golf');
export const upcomingEvents = events.filter((event) => ['scheduled', 'registration-open'].includes(event.status));
export const completedEvents = events.filter((event) => ['completed', 'gallery-published'].includes(event.status));
export const galleryEvents = events.filter((event) => event.gallery?.status === 'published');

export function getEvent(id: string) {
  const event = events.find((record) => record.id === id);
  if (!event) throw new Error(`Unknown event: ${id}`);
  return event;
}
