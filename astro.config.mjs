import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://jrhof.org',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({
    filter: (page) => page !== 'https://jrhof.org/404/',
  })],
});
