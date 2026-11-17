/**
 * One-time import of the old JSON data folder into MongoDB.
 *
 *   MONGODB_URI="mongodb+srv://..." npm run migrate-to-mongo
 *   MONGODB_URI="..." DATA_DIR=./data npm run migrate-to-mongo -- --force
 *
 * Without --force the script refuses to run if the database already contains quizzes,
 * so you can never overwrite live data by accident.
 */
import config from '../config/index.js';
import * as fileStore from '../storage/fileStore.js';
import * as mongoStore from '../storage/mongoStore.js';
import { SAFE_REL } from '../services/backupService.js';

if (!config.mongoUri) {
  console.error('MONGODB_URI is not set. Example:\n  MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/" npm run migrate-to-mongo');
  process.exit(1);
}
const force = process.argv.includes('--force');

try {
  await mongoStore.initStorage();
  const existing = await mongoStore.readJson('quizzes.json', []);
  if (Array.isArray(existing) && existing.length > 0 && !force) {
    console.error(`The database already contains ${existing.length} quiz(zes). Re-run with --force to overwrite.`);
    process.exit(1);
  }

  await fileStore.initStorage();
  const files = await fileStore.collectDataFiles();
  const keys = Object.keys(files).filter((k) => SAFE_REL.test(k) && files[k] != null);
  console.log(`Source: ${fileStore.getDataDir()}`);
  console.log(`Found ${keys.length} data files. Importing into ${mongoStore.describeStorage()} ...`);

  let n = 0;
  for (const k of keys) {
    await mongoStore.writeJson(k, files[k]);
    n++;
  }
  const quizzes = await mongoStore.readJson('quizzes.json', []);
  const admin = await mongoStore.readJson('admin.json', null);
  console.log(`Done. Imported ${n} files (${quizzes.length} quizzes). Admin account ${admin ? `"${admin.username}" imported` : 'NOT found (set ADMIN_USERNAME/ADMIN_PASSWORD on the server)'}.`);
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoStore.closeStorage();
}
