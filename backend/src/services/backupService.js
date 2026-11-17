import { z } from 'zod';
import config from '../config/index.js';
import { collectDataFiles, writeJson, readJson, deletePath, listFilesMeta, clearDirs } from '../storage/jsonStorage.js';
import { badRequest } from '../utils/helpers.js';
import { withLock } from '../storage/fileLock.js';

const BACKUP_FORMAT = 'quiz-platform-backup';
export const SAFE_REL = /^(?:admin|quizzes|settings)\.json$|^(?:questions|results)\/[a-z0-9]{6,20}(?:\.stats)?\.json$|^attempts\/[a-z0-9]{6,20}\/(?:index|[a-z0-9]{6,20}-[A-Za-z0-9_-]{16,64})\.json$/;

const bundleSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(1),
  createdAt: z.string(),
  files: z.record(z.string(), z.unknown()),
});

/** Global lock so backups/restores never interleave with each other. */
const BACKUP_LOCK = '__backup_restore__';

/** Build a single-JSON backup bundle of every data file (sessions excluded). */
export async function createBackupBundle() {
  return withLock(BACKUP_LOCK, async () => {
    const files = await collectDataFiles();
    for (const k of Object.keys(files)) if (!SAFE_REL.test(k)) delete files[k];
    return { format: BACKUP_FORMAT, version: 1, createdAt: new Date().toISOString(), files };
  });
}

/** Save a bundle into data/backups/ and prune old ones. Returns the file name. */
export async function saveBackupToDisk(label = 'manual') {
  const bundle = await createBackupBundle();
  const name = `backup-${bundle.createdAt.replace(/[:.]/g, '-')}-${label.replace(/[^a-z0-9-]/gi, '')}.json`;
  // Stored as a list of { path, content }: databases dislike '.' inside object keys.
  const fileList = Object.entries(bundle.files).map(([path, content]) => ({ path, content }));
  await writeJson(`backups/${name}`, { ...bundle, files: fileList }, { backup: false });
  await pruneBackups();
  return name;
}

export async function listBackups() {
  const out = await listFilesMeta('backups', { prefix: 'backup-', suffix: '.json' });
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function pruneBackups() {
  const all = await listBackups();
  for (const b of all.slice(config.maxBackups)) {
    await deletePath(`backups/${b.name}`);
  }
}

export async function readBackupFromDisk(name) {
  if (!/^backup-[A-Za-z0-9-]+\.json$/.test(name)) throw badRequest('Invalid backup name.');
  const stored = await readJson(`backups/${name}`, null);
  if (!stored) throw badRequest('Backup not found.');
  // Accept both the list format ({ path, content }) and the older object-map format.
  const files = Array.isArray(stored.files) ? Object.fromEntries(stored.files.map((f) => [f.path, f.content])) : stored.files;
  return { ...stored, files };
}

/**
 * Restore a bundle. The current state is backed up first ("pre-restore"), then
 * questions/attempts/results are cleared and every file in the bundle is written atomically.
 * The admin account is kept unless `includeAdmin` is true.
 */
export async function restoreBundle(bundle, { includeAdmin = false } = {}) {
  const parsed = bundleSchema.safeParse(bundle);
  if (!parsed.success) throw badRequest('This file is not a valid Quiz Platform backup.');
  const files = parsed.data.files;
  const bad = Object.keys(files).filter((k) => !SAFE_REL.test(k));
  if (bad.length) throw badRequest('Backup contains unexpected file paths.', bad.slice(0, 10));
  if (!Array.isArray(files['quizzes.json'])) throw badRequest('Backup is missing quizzes.json.');

  const safety = await saveBackupToDisk('pre-restore');
  await withLock(BACKUP_LOCK, async () => {
    await clearDirs(['questions', 'attempts', 'results']);
    for (const [rel, content] of Object.entries(files)) {
      if (rel === 'admin.json' && !includeAdmin) continue;
      await writeJson(rel, content);
    }
  });
  return { restoredFiles: Object.keys(files).length, safetyBackup: safety };
}
