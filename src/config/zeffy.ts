// Zeffy forms embedded on jrhof.org: event registration (ADR-017) and
// donations (ADR-019). If a form is renamed, copied or replaced in Zeffy,
// update its slug here. See docs/operations/ZEFFY.md.

export const zeffyOrigin = 'https://www.zeffy.com';
export const zeffyEmbedScript = `${zeffyOrigin}/embed/v2/zeffy-embed.js`;

export interface ZeffyForm {
  kind: 'ticketing' | 'donation-form';
  slug: string;
  title: string;
}

export const zeffyForms = {
  banquet2027: {
    kind: 'ticketing',
    slug: '2027-hall-of-fame-induction-banquet',
    title: '2027 Hall of Fame Induction Banquet registration',
  },
  donation: {
    kind: 'donation-form',
    slug: 'help-preserve-colorados-umpiring-legacy',
    title: 'Donate to the Joe Rossi Umpires Hall of Fame',
  },
} as const satisfies Record<string, ZeffyForm>;

/** Path the embed script resolves against https://www.zeffy.com. */
export const zeffyEmbedPath = (form: ZeffyForm) => `/embed/${form.kind}/${form.slug}`;

/** Full-page Zeffy form, offered when the embed cannot load. */
export const zeffyHostedUrl = (form: ZeffyForm) => `${zeffyOrigin}/en-US/${form.kind}/${form.slug}`;
