import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import config from '../config/index.js';
import { withLock } from './fileLock.js';
import logger from '../utils/logger.js';

/**
 * Safe JSON file storage.
 *  - Atomic replacement: data is written to a temp file, fsync'd, then renamed over the target.
 *  - Serialized writes: every write / read-modify-write goes through a per-file lock (queue).
 *  - Backups: the previous version of every file is kept as <file>.bak.
 *  - Corruption handling: an unparsable file is moved aside (<file>.corrupt-<ts>) and the
 *    .bak copy is used instead.
 *  - Optional validation: pass a Zod schema; invalid data is never written.
 */

let dataDir = config.dataDir;

export function getDataDir() {
  return dataDir;
}

/** Used by tests to point storage at a temporary directory. */
export function setDataDir(dir) {
  dataDir = path.resolve(dir);
}

export function resolvePath(relPath) {
  const full = path.resolve(dataDir, relPath);
  if (full !== dataDir && !full.startsWith(dataDir + path.sep)) {
    throw new Error(`Refusing to access path outside data directory: ${relPath}`);
  }
  return full;
}

export async function ensureDir(relDir) {
  await fs.mkdir(resolvePath(relDir), { recursive: true });
}

export async function initStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  for (const d of ['questions', 'attempts', 'results', 'backups']) {
    await ensureDir(d);
  }
  if (!fsSync.existsSync(resolvePath('quizzes.json'))) await writeJson('quizzes.json', []);
  if (!fsSync.existsSync(resolvePath('settings.json'))) {
    await writeJson('settings.json', { siteName: 'Quiz Platform', createdAt: new Date().toISOString() });
  }
}

async function readRaw(full) {
  const text = await fs.readFile(full, 'utf8');
  return JSON.parse(text.replace(/^﻿/, ''));
}

async function readUnlocked(relPath, fallback) {
  const full = resolvePath(relPath);
  try {
    return await readRaw(full);
  } catch (err) {
    if (err.code === 'ENOENT') return clone(fallback);
    if (!(err instanceof SyntaxError)) throw err;
    // Corrupt JSON: preserve it for inspection and fall back to the backup.
    const aside = `${full}.corrupt-${Date.now()}`;
    logger.error(`Corrupt JSON in ${relPath}; moved to ${path.basename(aside)}`);
    await fs.rename(full, aside).catch(() => {});
    try {
      const restored = await readRaw(`${full}.bak`);
      logger.warn(`Recovered ${relPath} from .bak copy`);
      await atomicWrite(full, restored, false);
      return restored;
    } catch {
      logger.error(`No usable backup for ${relPath}; starting from default value`);
      return clone(fallback);
    }
  }
}

function clone(v) {
  return v === undefined ? undefined : structuredClone(v);
}

async function atomicWrite(full, data, keepBackup = true) {
  await fs.mkdir(path.dirname(full), { recursive: true });
  const json = JSON.stringify(data, null, 2);
  const tmp = `${full}.tmp-${process.pid}-${crypto.randomBytes(6).toString('hex')}`;
  const handle = await fs.open(tmp, 'w');
  try {
    await handle.writeFile(json, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  if (keepBackup) {
    try {
      await fs.copyFile(full, `${full}.bak`);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
  await fs.rename(tmp, full);
}

function validate(data, schema, relPath) {
  if (!schema) return data;
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const err = new Error(`Refusing to save invalid data to ${relPath}`);
    err.details = parsed.error.issues;
    throw err;
  }
  return parsed.data;
}

/** Read a JSON file. Returns `fallback` if the file does not exist. */
export async function readJson(relPath, fallback = null) {
  // Reads go through the lock as well so we never observe a half-finished rename sequence.
  return withLock(resolvePath(relPath), () => readUnlocked(relPath, fallback));
}

/** Atomically replace a JSON file. */
export async function writeJson(relPath, data, { schema, backup = true } = {}) {
  const full = resolvePath(relPath);
  const valid = validate(data, schema, relPath);
  return withLock(full, () => atomicWrite(full, valid, backup));
}

/**
 * Read-modify-write under a single lock. `mutator` receives the current value
 * and returns the new value (or mutates in place and returns undefined).
 * Returns { value, result } where result is whatever `mutator` put on ctx.result.
 */
export async function updateJson(relPath, fallback, mutator, { schema, backup = true } = {}) {
  const full = resolvePath(relPath);
  return withLock(full, async () => {
    const current = await readUnlocked(relPath, fallback);
    const ctx = {};
    const returned = await mutator(current, ctx);
    const next = returned === undefined ? current : returned;
    if (ctx.skipWrite) return ctx.result;
    const valid = validate(next, schema, relPath);
    await atomicWrite(full, valid, backup);
    return ctx.result;
  });
}

export async function deletePath(relPath) {
  const full = resolvePath(relPath);
  return withLock(full, async () => {
    await fs.rm(full, { recursive: true, force: true });
    await fs.rm(`${full}.bak`, { force: true });
  });
}

/** Describe where data lives (for logs). */
export function describeStorage() {
  return `local files in ${dataDir}`;
}

export async function closeStorage() {}

/** List files (name, size, createdAt) in a directory whose names match prefix/suffix. */
export async function listFilesMeta(relDir, { prefix = '', suffix = '' } = {}) {
  const dir = resolvePath(relDir);
  try {
    const names = (await fs.readdir(dir)).filter((n) => n.startsWith(prefix) && n.endsWith(suffix));
    const out = [];
    for (const n of names) {
      const st = await fs.stat(path.join(dir, n));
      out.push({ name: n, size: st.size, createdAt: st.mtime.toISOString() });
    }
    return out;
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

/** Remove everything under the given top-level directories and recreate them empty. */
export async function clearDirs(dirs) {
  for (const d of dirs) {
    await fs.rm(resolvePath(d), { recursive: true, force: true });
    await fs.mkdir(resolvePath(d), { recursive: true });
  }
}

export async function exists(relPath) {
  try {
    await fs.access(resolvePath(relPath));
    return true;
  } catch {
    return false;
  }
}

export async function listJsonFiles(relDir) {
  try {
    const entries = await fs.readdir(resolvePath(relDir));
    return entries.filter((f) => f.endsWith('.json'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

/** Recursively collect every *.json data file (skipping backups, temp and corrupt files). */
export async function collectDataFiles() {
  const out = {};
  async function walk(rel) {
    let entries;
    try {
      entries = await fs.readdir(resolvePath(rel || '.'), { withFileTypes: true });
    } catch (err) {
      if (err.code === 'ENOENT') return;
      throw err;
    }
    for (const e of entries) {
      const childRel = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (childRel === 'backups') continue;
        await walk(childRel);
      } else if (e.name.endsWith('.json') && childRel !== 'sessions.json') {
        out[childRel] = await readJson(childRel, null);
      }
    }
  }
  await walk('');
  return out;
}
