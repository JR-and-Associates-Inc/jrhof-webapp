import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const productionSite = 'https://jrhof.org';
const site = new URL(process.env.PUBLIC_SITE_URL?.trim() || productionSite).origin;
const sitemapExclusions = new Set([
  `${site}/404/`,
  `${site}/donate/return/`,
  `${site}/donate/thank-you/`,
  `${site}/registration/confirmed/`,
]);

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({
    // Registration forms are transactional and noindex; event pages are the landing pages.
    filter: (page) => !sitemapExclusions.has(page) && !page.endsWith('/register/'),
  })],
});
