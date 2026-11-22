/**
 * Keeps a Render free-tier service awake.
 *
 * Render puts a free web service to sleep after ~15 minutes without an incoming request.
 * While the service is awake it calls its own PUBLIC url (RENDER_EXTERNAL_URL, which Render
 * sets automatically) every few minutes, so that traffic goes through Render's router and
 * counts as activity. It cannot wake a service that is already asleep — pair it with an
 * external monitor (UptimeRobot) or the paid Starter plan for a hard guarantee.
 */
export function startKeepAlive({ url, intervalMs, fetchImpl = globalThis.fetch, log = () => {} }) {
  if (!url || !fetchImpl) return null;
  const target = `${String(url).replace(/\/+$/, '')}/api/health`;
  const tick = async () => {
    try {
      const res = await fetchImpl(target, { headers: { 'User-Agent': 'quiz-platform-keepalive' }, signal: AbortSignal.timeout(20000) });
      log(`keep-alive ping ${res.status}`);
    } catch (err) {
      log(`keep-alive ping failed: ${err.message}`);
    }
  };
  const timer = setInterval(tick, intervalMs);
  timer.unref?.(); // never keeps the process alive on its own
  return { stop: () => clearInterval(timer), tick, target };
}
