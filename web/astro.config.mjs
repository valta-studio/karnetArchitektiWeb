// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://karnet.archi',
  integrations: [sitemap()],
  image: {
    domains: ['cdn.sanity.io'],
  },
});
