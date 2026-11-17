import { z } from 'zod';
import { readJson, updateJson } from '../storage/jsonStorage.js';
import * as backup from '../services/backupService.js';
import { parseOrThrow } from '../utils/helpers.js';

const settingsSchema = z.object({
  siteName: z.string().trim().min(1).max(100),
  publicBaseUrl: z.union([z.string().url().max(300), z.literal('')]).optional().default(''),
});

export async function getSettings(req, res) {
  const s = await readJson('settings.json', {});
  res.json({ settings: { siteName: s.siteName || 'Quiz Platform', publicBaseUrl: s.publicBaseUrl || '' } });
}

export async function updateSettings(req, res) {
  const body = parseOrThrow(settingsSchema, req.body);
  const settings = await updateJson('settings.json', {}, (s, ctx) => {
    Object.assign(s, body, { updatedAt: new Date().toISOString() });
    ctx.result = s;
  });
  res.json({ settings });
}

/** Public, non-sensitive site info (name) for the student pages. */
export async function publicSite(req, res) {
  const s = await readJson('settings.json', {});
  res.json({ siteName: s.siteName || 'Quiz Platform' });
}

export async function downloadBackup(req, res) {
  const bundle = await backup.createBackupBundle();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="quiz-platform-backup-${bundle.createdAt.slice(0, 10)}.json"`);
  res.send(JSON.stringify(bundle));
}

export async function createServerBackup(req, res) {
  const name = await backup.saveBackupToDisk('manual');
  res.status(201).json({ name, backups: await backup.listBackups() });
}

export async function listServerBackups(req, res) {
  res.json({ backups: await backup.listBackups() });
}

const restoreSchema = z.union([
  z.object({ bundle: z.record(z.string(), z.unknown()), includeAdmin: z.boolean().optional() }),
  z.object({ name: z.string().max(200), includeAdmin: z.boolean().optional() }),
]);

export async function restore(req, res) {
  const body = parseOrThrow(restoreSchema, req.body);
  const bundle = body.bundle || (await backup.readBackupFromDisk(body.name));
  const out = await backup.restoreBundle(bundle, { includeAdmin: !!body.includeAdmin });
  res.json({ ok: true, ...out });
}
