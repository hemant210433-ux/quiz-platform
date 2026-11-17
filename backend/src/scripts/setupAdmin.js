/**
 * Create or reset the single admin account.
 *
 *   npm run setup-admin                       (interactive prompts)
 *   ADMIN_USERNAME=x ADMIN_PASSWORD=y npm run setup-admin   (non-interactive)
 */
import readline from 'node:readline';
import { initStorage, closeStorage, describeStorage } from '../storage/jsonStorage.js';
import { setAdminCredentials, getAdmin } from '../services/authService.js';

function ask(rl, q, { hidden = false } = {}) {
  return new Promise((resolve) => {
    if (!hidden) return rl.question(q, resolve);
    const out = rl.output;
    const origWrite = out.write.bind(out);
    rl.question(q, (ans) => {
      out.write = origWrite;
      out.write('\n');
      resolve(ans);
    });
    out.write = (s) => (s.includes(q) ? origWrite(s) : origWrite(''));
  });
}

async function main() {
  await initStorage();
  let { ADMIN_USERNAME: username, ADMIN_PASSWORD: password } = process.env;
  const existing = await getAdmin();

  if (!username || !password) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    console.log(`Storage: ${describeStorage()}`);
    if (existing) console.log(`An admin already exists ("${existing.username}"). Continuing will REPLACE it.`);
    username = (await ask(rl, 'Admin username: ')).trim();
    password = await ask(rl, 'Admin password (min 10 chars, letters + numbers): ', { hidden: true });
    const confirm = await ask(rl, 'Confirm password: ', { hidden: true });
    rl.close();
    if (password !== confirm) {
      console.error('Passwords do not match.');
      process.exit(1);
    }
  }

  try {
    const r = await setAdminCredentials(username, password);
    console.log(`Admin "${r.username}" saved (password stored as a bcrypt hash). All sessions were signed out.`);
  } catch (err) {
    const msg = err.issues ? err.issues.map((i) => i.message).join(' ') : err.message;
    console.error(`Could not save admin: ${msg}`);
    process.exit(1);
  }
}

main().finally(() => closeStorage());
