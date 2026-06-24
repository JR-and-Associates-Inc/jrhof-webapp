export type EventType = 'banquet' | 'golf';
export type EventDateStatus = 'confirmed' | 'tentative' | 'unknown';
export type EventStatus =
  | 'Save the Date'
  | 'Registration Open'
  | 'Completed'
  | 'Photos Pending'
  | 'Gallery Available'
  | 'Gallery Migration Planned'
  | 'Program Pending Scan'
  | 'Details Coming Soon';
export type GalleryStatus = 'available-at-source' | 'migration-planned' | 'pending' | 'none-known';
export type ArchiveAssetStatus = 'available' | 'pending-scan' | 'pending-upload' | 'none-known';
export type PhotoStatus = 'available' | 'pending' | 'none-known';

export interface EventArchiveRecord {
  id: string;
  year: number;
  eventType: EventType;
  title: string;
  date?: string;
  dateLabel?: string;
  dateStatus: EventDateStatus;
  status: EventStatus[];
  summary: string;
  venueName?: string;
  venueAddress?: string;
  inductees?: string[];
  registrationUrl?: string;
  donationUrl?: string;
  raffleUrl?: string;
  mulliganUrl?: string;
  sourceGalleryUrl?: string;
  galleryStatus: GalleryStatus;
  programStatus: ArchiveAssetStatus;
  flyerStatus: ArchiveAssetStatus;
  photoStatus: PhotoStatus;
  detailPath?: string;
  sourceNotes?: string;
}

export const eventLinks = {
  golfRegistration: 'https://www.eventbrite.com/e/joe-rossi-hof-golf-tournament-2026-tickets-1985644019715',
  raffleTickets: 'https://buy.stripe.com/7sYdR84L01mG0F64wO93y02',
  mulligans: 'https://buy.stripe.com/5kQ3cuelA6H04VmbZg93y03',
  donate: 'https://donate.stripe.com/00w5kC7Xc4yS1Jagfw93y01',
} as const;

export const eventArchive: EventArchiveRecord[] = [
  {
    id: 'banquet-2027',
    year: 2027,
    eventType: 'banquet',
    title: '2027 Induction Banquet',
    date: '2027-02-06',
    dateLabel: 'February 6, 2027',
    dateStatus: 'tentative',
    status: ['Save the Date'],
    summary: 'JRHOF is planning its next annual induction banquet. The date remains tentative, and registration is not open.',
    galleryStatus: 'none-known',
    programStatus: 'none-known',
    flyerStatus: 'none-known',
    photoStatus: 'none-known',
    sourceNotes: 'Tentative date supplied by JRHOF; publish as confirmed only after an approved source is available.',
  },
  {
    id: 'golf-2026',
    year: 2026,
    eventType: 'golf',
    title: 'The Umpire’s Cup IV',
    date: '2026-06-27',
    dateLabel: 'Saturday, June 27, 2026',
    dateStatus: 'confirmed',
    status: ['Registration Open'],
    summary: 'JRHOF’s active 2026 summer fundraiser at Applewood Golf Club.',
    venueName: 'Applewood Golf Club',
    venueAddress: '14001 W. 32nd Ave., Golden, CO 80401',
    registrationUrl: eventLinks.golfRegistration,
    donationUrl: eventLinks.donate,
    raffleUrl: eventLinks.raffleTickets,
    mulliganUrl: eventLinks.mulligans,
    galleryStatus: 'none-known',
    programStatus: 'none-known',
    flyerStatus: 'available',
    photoStatus: 'none-known',
    detailPath: '/events/golf-tournament/',
  },
  {
    id: 'banquet-2026',
    year: 2026,
    eventType: 'banquet',
    title: '2026 Hall of Fame Induction Banquet',
    date: '2026-01-31',
    dateLabel: 'Saturday, January 31, 2026',
    dateStatus: 'confirmed',
    status: ['Completed', 'Photos Pending', 'Program Pending Scan'],
    summary: 'JRHOF honored Terry Angell, George Demetriou, and Fred Zuercher as the Class of 2026.',
    venueName: 'Holiday Inn Denver–Lakewood',
    venueAddress: '7390 W. Hampden Ave., Lakewood, CO 80227',
    inductees: ['Terry Angell', 'George Demetriou', 'Fred Zuercher'],
    galleryStatus: 'pending',
    programStatus: 'pending-scan',
    flyerStatus: 'pending-upload',
    photoStatus: 'pending',
    detailPath: '/events/induction-banquet/',
  },
  {
    id: 'golf-2025',
    year: 2025,
    eventType: 'golf',
    title: 'The Umpire’s Cup III',
    dateStatus: 'unknown',
    status: ['Completed', 'Gallery Available', 'Gallery Migration Planned'],
    summary: 'A source gallery remains available on the current JRHOF site. An optimized archive gallery will be migrated later.',
    sourceGalleryUrl: 'https://jrhof.org/2025-joe-rossi-hall-of-fame-presents-the-umpires-cup-iii/',
    galleryStatus: 'migration-planned',
    programStatus: 'none-known',
    flyerStatus: 'none-known',
    photoStatus: 'available',
    sourceNotes: 'Source page retained for later gallery migration; images have not been imported.',
  },
  {
    id: 'banquet-2025',
    year: 2025,
    eventType: 'banquet',
    title: '2025 Hall of Fame Induction Banquet',
    dateStatus: 'unknown',
    status: ['Completed', 'Program Pending Scan'],
    summary: 'Archive record started. Details will be added as historical materials are digitized and approved.',
    galleryStatus: 'none-known',
    programStatus: 'pending-scan',
    flyerStatus: 'pending-upload',
    photoStatus: 'none-known',
  },
  {
    id: 'golf-2024',
    year: 2024,
    eventType: 'golf',
    title: 'The Umpire’s Cup II',
    dateStatus: 'unknown',
    status: ['Completed', 'Gallery Available', 'Gallery Migration Planned'],
    summary: 'A source gallery remains available on the current JRHOF site. An optimized archive gallery will be migrated later.',
    sourceGalleryUrl: 'https://jrhof.org/2024-joe-rossi-hall-of-fame-presents-the-umpires-cup-ii/',
    galleryStatus: 'migration-planned',
    programStatus: 'none-known',
    flyerStatus: 'none-known',
    photoStatus: 'available',
    sourceNotes: 'Source page retained for later gallery migration; images have not been imported.',
  },
  {
    id: 'banquet-2024',
    year: 2024,
    eventType: 'banquet',
    title: '2024 Hall of Fame Induction Banquet',
    dateStatus: 'unknown',
    status: ['Completed', 'Program Pending Scan'],
    summary: 'Archive record started. Details will be added as historical materials are digitized and approved.',
    galleryStatus: 'none-known',
    programStatus: 'pending-scan',
    flyerStatus: 'pending-upload',
    photoStatus: 'none-known',
  },
];

export const banquetEvents = eventArchive.filter((event) => event.eventType === 'banquet');
export const golfEvents = eventArchive.filter((event) => event.eventType === 'golf');

export const golf2026 = {
  title: '2026 Joe Rossi Umpires Hall of Fame Presents – The Umpire’s Cup IV',
  shortTitle: eventArchive.find((event) => event.id === 'golf-2026')!.title,
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

export const golfGalleryArchive = golfEvents
  .filter((event) => event.sourceGalleryUrl)
  .map((event) => ({
    year: event.year,
    title: event.title,
    status: 'Gallery source available · Migration planned',
    source: event.sourceGalleryUrl!,
  }));
