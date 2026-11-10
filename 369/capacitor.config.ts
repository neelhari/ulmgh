import type { CapacitorConfig } from '@capacitor/cli';

const isLive = process.env.CAP_LIVE === 'true';
const liveHost = process.env.CAP_LIVE_IP || '192.168.1.3';
const isVendor = process.env.APP_TARGET === 'vendor';

const config: CapacitorConfig = isVendor
  ? {
      appId: 'com.ulmgh.vendor',
      appName: 'ULMGH Vendor',
      webDir: 'dist-vendor',
      server: {
        androidScheme: 'https',
        allowNavigation: [
          '*.razorpay.com',
          'api.razorpay.com',
          'checkout.razorpay.com',
        ],
      },
      android: {
        path: 'android-vendor',
      },
      plugins: {
        SocialLogin: {
          providers: {
            google: false,
            facebook: false,
            apple: false,
            twitter: false,
          },
        },
      },
    }
  : {
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
            allowNavigation: [
              '*.razorpay.com',
              'api.razorpay.com',
              'checkout.razorpay.com',
            ],
          },
      android: {
        path: 'android',
      },
      plugins: {
        SocialLogin: {
          providers: {
            google: true,
            facebook: false,
            apple: false,
            twitter: false,
          },
        },
      },
    };

export default config;
