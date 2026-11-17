/**
 * Server clock. All time-based rules (deadlines, availability windows) use
 * this instead of Date.now() so tests can simulate time passing.
 */
let offsetMs = 0;

export const now = () => Date.now() + offsetMs;
export const nowIso = () => new Date(now()).toISOString();

/** Test helper: move the server clock forward/backward. */
export function advanceClock(ms) {
  offsetMs += ms;
}
export function resetClock() {
  offsetMs = 0;
}
