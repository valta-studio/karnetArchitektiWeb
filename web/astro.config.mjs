// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://karnet.archi',
  // Prefetch HTML karet projektů (jen odkazy s data-astro-prefetch) —
  // navigace z portfolia na kartu pak nečeká na síť.
  prefetch: true,
  integrations: [sitemap()],
  image: {
    domains: ['cdn.sanity.io'],
  },
});
