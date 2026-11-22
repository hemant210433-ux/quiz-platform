import { SITE_URL } from '@/lib/siteApi.js';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/result/', '/quiz/*/attempt'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
