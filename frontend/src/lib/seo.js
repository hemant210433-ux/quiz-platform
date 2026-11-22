/** One place for page metadata so every page gets its own title, description, canonical and share card. */
export const SITE_NAME = 'O Level Mock Test';
const OG_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: 'O Level Mock Test – free practice tests' };
export const currentYear = () => new Date().getFullYear();

export function pageMeta({ title, description, path = '/', noindex = false }) {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: { type: 'website', locale: 'hi_IN', siteName: SITE_NAME, title, description, url: path, images: [OG_IMAGE] },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE.url] },
  };
}
