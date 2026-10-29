import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('[VENDOR-SYNC] 1. Building vendor web app to dist-vendor...');
execSync('npx vite build --mode vendor --outDir dist-vendor', {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env, APP_TARGET: 'vendor' }
});

console.log('[VENDOR-SYNC] 2. Running Capacitor sync for vendor app...');
execSync('npx cap sync android', {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env, APP_TARGET: 'vendor' }
});

console.log('\n[VENDOR-SYNC] Successfully synchronized vendor web assets into android-vendor!\n');

