import type { CapacitorConfig } from '@capacitor/cli';

const isLive = process.env.CAP_LIVE === 'true';
const liveHost = process.env.CAP_LIVE_IP || '192.168.1.3';

const config: CapacitorConfig = {
  appId: 'com.ulmgh.store',
  appName: 'ULMGH369',
  webDir: 'dist',
  server: isLive
    ? {
        url: `http://${liveHost}:5173`,
        cleartext: true,
      }
    : {
        androidScheme: 'https',
      },
};

export default config;
