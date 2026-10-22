import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('[RELEASE-CHECK] Checking configuration for accidental live server.url...');

let hasError = false;

// 1. Check android/app/src/main/assets/capacitor.config.json
const androidConfigJsonPath = path.resolve(projectRoot, 'android/app/src/main/assets/capacitor.config.json');
if (fs.existsSync(androidConfigJsonPath)) {
  try {
    const raw = fs.readFileSync(androidConfigJsonPath, 'utf8');
    const json = JSON.parse(raw);
    if (json.server && json.server.url) {
      console.error(`[ERROR] Synced Android config (${androidConfigJsonPath}) contains server.url: ${json.server.url}`);
      hasError = true;
    }
  } catch (err) {
    console.error(`[WARN] Failed to read ${androidConfigJsonPath}:`, err.message);
  }
}

// 2. Check capacitor.config.ts defaults
delete process.env.CAP_LIVE;
const capConfigFile = path.resolve(projectRoot, 'capacitor.config.ts');
const capConfigContent = fs.readFileSync(capConfigFile, 'utf8');

if (/url:\s*['"`]http/i.test(capConfigContent) && !/isLive|CAP_LIVE/.test(capConfigContent)) {
  console.error('[ERROR] capacitor.config.ts has unconditional server.url without CAP_LIVE check!');
  hasError = true;
}

if (hasError) {
  console.error('\n[FAIL] Release check FAILED! A development live server URL was found.');
  console.error('Run "npm run android:sync" to sync production configuration before building for release.\n');
  process.exit(1);
} else {
  console.log('[PASS] Release check passed! No live server.url present in release config.\n');
  process.exit(0);
}
