/**
 * Restore from a backup bundle file. STOP the server first.
 *   npm run restore -- /path/to/backup-file.json [--include-admin]
 */
import fs from 'node:fs/promises';
import { initStorage, closeStorage } from '../storage/jsonStorage.js';
import { restoreBundle } from '../services/backupService.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run restore -- <backup-file.json> [--include-admin]');
  process.exit(1);
}
await initStorage();
const bundle = JSON.parse(await fs.readFile(file, 'utf8'));
try {
  const r = await restoreBundle(bundle, { includeAdmin: process.argv.includes('--include-admin') });
  console.log(`Restored ${r.restoredFiles} files. A safety backup of the previous state was saved as ${r.safetyBackup}.`);
} catch (err) {
  console.error(`Restore failed: ${err.message}`);
  process.exit(1);
}
await closeStorage();
