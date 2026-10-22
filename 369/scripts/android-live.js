import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const androidDir = path.resolve(projectRoot, 'android');

console.log('[LIVE] Starting Android Live build sync...');
process.env.CAP_LIVE = 'true';

// 1. Sync capacitor with CAP_LIVE=true
console.log('[LIVE] Running: npx cap sync android (with CAP_LIVE=true)');
execSync('npx cap sync android', {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env, CAP_LIVE: 'true' }
});

// 2. Build debug APK
console.log('[LIVE] Building debug APK with Gradle...');
const javaHome = process.env.JAVA_HOME || 'C:\\Program Files\\Android\\Android Studio\\jbr';
const androidHome = process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA || '', 'Android\\Sdk');
const gradlew = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';

const gradleEnv = {
  ...process.env,
  JAVA_HOME: javaHome,
  ANDROID_HOME: androidHome,
  PATH: `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.PATH}`
};

execSync(`${gradlew} :app:assembleDebug -x lint`, {
  cwd: androidDir,
  stdio: 'inherit',
  env: gradleEnv
});

// 3. Install on connected device
const apkPath = path.resolve(androidDir, 'app/build/outputs/apk/debug/app-debug.apk');
const adbPath = path.join(androidHome, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');

console.log(`[LIVE] Installing APK to connected device (${apkPath})...`);
try {
  execSync(`"${adbPath}" -d install -r "${apkPath}"`, {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  console.log('[LIVE] Successfully installed Live Server APK on phone!');
} catch (err) {
  console.log('[LIVE] Note: If adb install paused or timed out, approve the prompt on your phone screen.');
}
