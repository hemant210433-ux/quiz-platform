import { PRACTICALS, getPractical } from '@/content/practicals.js';

const ASSET = /(["'])(college\.svg|go\.svg|logo\.svg|shapes\.svg|poster\.svg|clip\.wav|clip\.mp4)\1/g;

/** The HTML that the output iframe loads for one file of one practical (asset names -> /practical-assets/). */
export function previewHtml(id, file) {
  const p = getPractical(id);
  const f = p?.files.find((x) => x.name === file);
  if (!f) return null;
  return f.code.replace(ASSET, '$1/practical-assets/$2$1');
}

export const previewParams = () => PRACTICALS.flatMap((p) => p.files.map((f) => ({ id: p.id, file: f.name })));
