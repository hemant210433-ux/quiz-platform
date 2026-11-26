import RAW from './guess.json';

/**
 * Guess paper: important one-liner questions with answers, unit by unit. Generated from the site owner's own
 * documents by tools/build_guess.py. These are practice questions for revision. They are NOT official NIELIT
 * questions, are not a promise of what will be asked, and say nothing about the exam pattern.
 */
export const GUESS_UPDATED = '2026-11-24';

export const buildUnits = (raw) => raw.map((u) => ({ ...u, count: u.items.length }));
export const staticUnits = (mod) => RAW[mod.slug] || [];
export const unitsOf = (mod) => buildUnits(staticUnits(mod));
export const totalOf = (mod) => unitsOf(mod).reduce((a, u) => a + u.count, 0);
