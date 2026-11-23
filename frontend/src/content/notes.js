import RAW from './notes.json';

/**
 * Chapter-wise one-liner notes (Hindi + English). The text lives in notes.json, which is generated from the
 * site owner's own note documents by tools/parse_notes_docx.py. Notes are for revision only: they are not
 * exam questions and say nothing about the exam pattern.
 */
export const NOTES_UPDATED = '2026-11-23';

const HI_TITLES = {
  'm1-r5': ['कंप्यूटर का परिचय', 'ऑपरेटिंग सिस्टम का परिचय', 'वर्ड प्रोसेसिंग (LibreOffice Writer)', 'स्प्रेडशीट (LibreOffice Calc)', 'प्रेजेंटेशन (LibreOffice Impress)', 'इंटरनेट और WWW का परिचय', 'ईमेल, सोशल नेटवर्किंग और ई-गवर्नेंस', 'डिजिटल वित्तीय टूल्स और एप्लिकेशन', 'साइबर सुरक्षा की रूपरेखा', 'फ्यूचर स्किल्स और AI की रूपरेखा'],
  'm2-r5': ['वेब डिज़ाइन का परिचय', 'एडिटर', 'HTML की मूल बातें', 'CSS (कैस्केडिंग स्टाइल शीट्स)', 'CSS फ्रेमवर्क (W3.CSS)', 'JavaScript और AngularJS', 'फ़ोटो एडिटर', 'वेब पब्लिशिंग और ब्राउज़िंग'],
  'm3-r5': ['प्रोग्रामिंग का परिचय', 'एल्गोरिदम और फ़्लोचार्ट', 'Python का परिचय', 'ऑपरेटर, एक्सप्रेशन और Python स्टेटमेंट', 'सीक्वेंस डेटा टाइप', 'फ़ंक्शन', 'फ़ाइल प्रोसेसिंग', 'स्कोप और मॉड्यूल', 'NumPy की मूल बातें'],
  'm4-r5': ['इंटरनेट ऑफ़ थिंग्स (IoT) का परिचय', 'थिंग्स और कनेक्शन', 'सेंसर, एक्चुएटर और माइक्रोकंट्रोलर', 'IoT एप्लिकेशन बनाना', 'IoT सुरक्षा और IoT का भविष्य', 'सॉफ़्ट स्किल्स'],
};

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const cache = new Map();

/** Chapters of a module with numbered points and section anchors. */
export function chaptersOf(mod) {
  if (cache.has(mod.slug)) return cache.get(mod.slug);
  const list = (RAW[mod.slug] || []).map((c, i) => {
    let no = 0;
    const sections = c.sections.map((s, k) => ({
      id: `s${k + 1}`,
      hi: s.hi,
      en: s.en,
      blocks: s.blocks.map((b) => (b.p ? { p: b.p, no: ++no } : b)),
    }));
    return {
      n: c.n,
      slug: `${c.n}-${slugify(c.title)}`,
      en: c.title,
      hi: HI_TITLES[mod.slug]?.[i] || c.title,
      sections,
      points: no,
    };
  });
  cache.set(mod.slug, list);
  return list;
}

export const totalPoints = (mods) => mods.reduce((a, m) => a + chaptersOf(m).reduce((x, c) => x + c.points, 0), 0);
export const totalChapters = (mods) => mods.reduce((a, m) => a + chaptersOf(m).length, 0);
