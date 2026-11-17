/**
 * In-process keyed mutex. Every write (and read-modify-write) to a given JSON
 * file is serialized through a promise chain keyed by the absolute file path,
 * so concurrent requests can never interleave partial writes.
 *
 * NOTE: this protects a single Node.js process. Run exactly ONE backend
 * instance against a data directory (see README – "Scaling limitations").
 */
const chains = new Map();

export async function withLock(key, fn) {
  const previous = chains.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const chained = previous.then(() => current);
  chains.set(key, chained);

  await previous;
  try {
    return await fn();
  } finally {
    release();
    // Clean up when nobody queued after us.
    if (chains.get(key) === chained) chains.delete(key);
  }
}

export function pendingLocks() {
  return chains.size;
}
