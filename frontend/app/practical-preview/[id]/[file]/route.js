import { previewHtml, previewParams } from '@/lib/practicalPreview.js';

export const dynamicParams = false;
export const generateStaticParams = previewParams;

// Output frame for the HTML practical lab. Never indexed; only embedded by the practical pages.
export function GET(_req, { params }) {
  const html = previewHtml(params.id, params.file);
  if (!html) return new Response('Not found', { status: 404 });
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
