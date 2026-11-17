import { MongoClient } from 'mongodb';
import config from '../config/index.js';
import { withLock } from './fileLock.js';
import logger from '../utils/logger.js';

/**
 * MongoDB-backed storage with the SAME API as the file store.
 *
 * Every former "JSON file" is one document in the `kv` collection:
 *   { _id: "<relative path>", v: <the JSON value>, ver: <int>, size: <bytes>, updatedAt: Date }
 *
 *  - updateJson is a read-modify-write protected by (a) the in-process keyed lock and
 *    (b) optimistic versioning (`ver`) so even several server instances never lose updates.
 *  - "directories" are simply key prefixes (attempts/<quizId>/...).
 */

let client = null;
let col = null;

const MAX_RETRIES = 25;
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

function checkKey(relPath) {
  if (typeof relPath !== 'string' || !relPath || relPath.includes('..') || relPath.startsWith('/')) {
    throw new Error(`Invalid storage key: ${relPath}`);
  }
}

const sizeOf = (relPath, value) => (relPath.startsWith('backups/') ? Buffer.byteLength(JSON.stringify(value)) : undefined);

export function getDataDir() {
  return describeStorage();
}
export function setDataDir() {
  /* no-op for MongoDB */
}
export function describeStorage() {
  try {
    const u = new URL(config.mongoUri);
    return `MongoDB (${u.hostname}, db "${config.mongoDbName}")`;
  } catch {
    return `MongoDB (db "${config.mongoDbName}")`;
  }
}

export async function initStorage() {
  if (!col) {
    client = new MongoClient(config.mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      maxPoolSize: 20,
      retryWrites: true,
    });
    await client.connect();
    col = client.db(config.mongoDbName).collection('kv');
    await client.db(config.mongoDbName).command({ ping: 1 });
    logger.info('Connected to MongoDB.');
  }
  await insertIfMissing('quizzes.json', []);
  await insertIfMissing('settings.json', { siteName: 'Quiz Platform', createdAt: new Date().toISOString() });
}

/** Create a default document unless it already exists (safe if two instances start together). */
async function insertIfMissing(key, value) {
  try {
    await col.insertOne({ _id: key, v: value, ver: 1, updatedAt: new Date() });
  } catch (err) {
    if (err.code !== 11000) throw err;
  }
}

export async function closeStorage() {
  if (client) await client.close();
  client = null;
  col = null;
}

export async function readJson(relPath, fallback = null) {
  checkKey(relPath);
  const doc = await col.findOne({ _id: relPath });
  return doc ? doc.v : clone(fallback);
}

export async function writeJson(relPath, data, { schema } = {}) {
  checkKey(relPath);
  const valid = clone(validate(data, schema, relPath));
  return withLock(`mongo:${relPath}`, async () => {
    const set = { v: valid, updatedAt: new Date() };
    const size = sizeOf(relPath, valid);
    if (size !== undefined) set.size = size;
    await col.updateOne({ _id: relPath }, { $set: set, $inc: { ver: 1 } }, { upsert: true });
  });
}

export async function updateJson(relPath, fallback, mutator, { schema } = {}) {
  checkKey(relPath);
  return withLock(`mongo:${relPath}`, async () => {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const doc = await col.findOne({ _id: relPath });
      const current = doc ? doc.v : clone(fallback);
      const ctx = {};
      const returned = await mutator(current, ctx);
      const next = returned === undefined ? current : returned;
      if (ctx.skipWrite) return ctx.result;
      const valid = clone(validate(next, schema, relPath));
      const set = { v: valid, updatedAt: new Date() };
      const size = sizeOf(relPath, valid);
      if (size !== undefined) set.size = size;

      try {
        if (doc) {
          const r = await col.updateOne({ _id: relPath, ver: doc.ver }, { $set: set, $inc: { ver: 1 } });
          if (r.matchedCount === 1) return ctx.result;
        } else {
          await col.insertOne({ _id: relPath, ...set, ver: 1 });
          return ctx.result;
        }
      } catch (err) {
        if (err.code !== 11000) throw err; // duplicate key => someone inserted first, retry
      }
      // Lost a race with another instance: back off briefly and retry with fresh data.
      await new Promise((r) => setTimeout(r, Math.min(200, 5 * (attempt + 1)) + Math.random() * 10));
    }
    throw new Error(`Could not update ${relPath}: too much write contention. Please retry.`);
  });
}

export async function deletePath(relPath) {
  checkKey(relPath);
  await col.deleteMany({ $or: [{ _id: relPath }, { _id: { $regex: `^${escapeRe(relPath)}/` } }] });
}

export async function exists(relPath) {
  checkKey(relPath);
  return (await col.countDocuments({ _id: relPath }, { limit: 1 })) > 0;
}

export async function listJsonFiles(relDir) {
  const re = `^${escapeRe(relDir)}/([^/]+\\.json)$`;
  const docs = await col.find({ _id: { $regex: re } }, { projection: { _id: 1 } }).toArray();
  return docs.map((d) => d._id.slice(relDir.length + 1));
}

/** Every data document (sessions and backups excluded), keyed by relative path. */
export async function collectDataFiles() {
  const out = {};
  const cursor = col.find({ _id: { $not: { $regex: '^backups/' }, $ne: 'sessions.json' } });
  for await (const d of cursor) out[d._id] = d.v;
  return out;
}

export async function listFilesMeta(relDir, { prefix = '', suffix = '' } = {}) {
  const re = `^${escapeRe(relDir)}/${escapeRe(prefix)}[^/]*${escapeRe(suffix)}$`;
  const docs = await col.find({ _id: { $regex: re } }, { projection: { size: 1, updatedAt: 1 } }).toArray();
  return docs.map((d) => ({
    name: d._id.slice(relDir.length + 1),
    size: d.size || 0,
    createdAt: new Date(d.updatedAt).toISOString(),
  }));
}

export async function clearDirs(dirs) {
  for (const d of dirs) await col.deleteMany({ _id: { $regex: `^${escapeRe(d)}/` } });
}
