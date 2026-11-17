/**
 * Create a backup bundle (stored in <DATA_DIR>/backups or in MongoDB) and optionally
 * save a copy to a local folder.
 *   npm run backup
 *   npm run backup -- /path/to/offsite/folder
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { initStorage, closeStorage, describeStorage } from '../storage/jsonStorage.js';
import { saveBackupToDisk, readBackupFromDisk } from '../services/backupService.js';

await initStorage();
const name = await saveBackupToDisk('cli');
console.log(`Backup created: ${name}  [${describeStorage()}]`);
const target = process.argv[2];
if (target) {
  const bundle = await readBackupFromDisk(name);
  await fs.mkdir(target, { recursive: true });
  const dest = path.join(target, name);
  await fs.writeFile(dest, JSON.stringify(bundle));
  console.log(`Copied to: ${dest}`);
}
await closeStorage();
