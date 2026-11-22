import { ImageResponse } from 'next/og';

export const alt = 'O Level Mock Test – free practice tests, Hindi and English';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 90px', background: '#800020', color: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: 84, border: '12px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 36, background: '#d4af5a' }} />
          </div>
          <div style={{ marginLeft: 28, fontSize: 40, fontWeight: 700 }}>O Level Mock Test</div>
        </div>
        <div style={{ marginTop: 44, fontSize: 84, fontWeight: 800, lineHeight: 1.1 }}>Free O Level online mock tests</div>
        <div style={{ marginTop: 28, fontSize: 38, color: '#f0d9a0' }}>Hindi and English  |  M1-R5  M2-R5  M3-R5  M4-R5</div>
        <div style={{ marginTop: 40, fontSize: 26, color: '#ffffffcc' }}>Independent practice platform. Not affiliated with NIELIT.</div>
      </div>
    ),
    size,
  );
}
