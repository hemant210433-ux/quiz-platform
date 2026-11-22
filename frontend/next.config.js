/** @type {import('next').NextConfig} */

// The Express backend (Render). Server-side only. No trailing slash.
// Browsers only ever call relative /api/... URLs on this site; Next proxies them
// to the backend, so the admin cookie stays first-party (no CORS, no cross-site cookies).
const raw = (process.env.BACKEND_URL || '').trim().replace(/\/+$/, '');
const { PHASE_PRODUCTION_BUILD } = require('next/constants');

function check(phase) {
  if (phase === PHASE_PRODUCTION_BUILD && !raw) {
  throw new Error(
      '\n\n[BACKEND_URL missing] Set the BACKEND_URL environment variable (e.g. https://your-service.onrender.com, no trailing slash) ' +
        'in Vercel -> Project -> Settings -> Environment Variables, then redeploy.\n',
    );
  }
  if (raw && !/^https?:\/\/[^/]+$/.test(raw)) {
    throw new Error(`[BACKEND_URL invalid] "${raw}" must look like https://your-service.onrender.com (no path, no trailing slash).`);
  }
}

const BACKEND_URL = raw || 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

module.exports = (phase) => {
  check(phase);
  return nextConfig;
};
