import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://dak-portfolio-gray.vercel.app',
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })]
});
