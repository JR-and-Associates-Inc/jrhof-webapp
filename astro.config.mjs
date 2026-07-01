import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const productionSite = 'https://jrhof.org';
const site = new URL(process.env.PUBLIC_SITE_URL?.trim() || productionSite).origin;

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({
    filter: (page) => page !== `${site}/404/`,
  })],
});
