/**
 * Cheap deterrent against bulk question harvesting: requests to the attempt/result endpoints that identify
 * themselves as command-line or scraping tools are refused. Browsers (including phones) never match.
 * A determined person can fake a browser User-Agent, so this only removes the laziest scrapers.
 * Switch off with BLOCK_BOT_UA=false.
 */
const BOT_UA = /(curl|wget|python-requests|python-urllib|aiohttp|httpx|scrapy|libwww|postman|insomnia|httpie|headless|phantomjs|selenium|puppeteer|playwright)/i;

export function botGuard(req, res, next) {
  if (process.env.BLOCK_BOT_UA === 'false') return next();
  const ua = String(req.get('user-agent') || '');
  if (BOT_UA.test(ua)) {
    return res.status(403).json({ error: { code: 'AUTOMATED_ACCESS', message: 'Automated access to quiz questions is not allowed.' } });
  }
  return next();
}
