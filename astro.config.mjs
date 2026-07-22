import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const productionSite = 'https://jrhof.org';
const site = new URL(process.env.PUBLIC_SITE_URL?.trim() || productionSite).origin;
const sitemapExclusions = new Set([
  `${site}/404/`,
  `${site}/donate/return/`,
  `${site}/donate/thank-you/`,
  `${site}/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/`,
]);

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({
    filter: (page) => !sitemapExclusions.has(page),
  })],
});
