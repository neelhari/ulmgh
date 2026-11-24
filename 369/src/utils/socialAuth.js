import { SocialLogin } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';

let isInitialized = false;

export async function initializeSocialLogin() {
  if (isInitialized) return;
  if (!Capacitor.isNativePlatform()) return;

  const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
  const iOSClientId = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID || '370340388630-hadsam3l9860ut6263cf8dqvhcau98da.apps.googleusercontent.com';

  const initConfig = {
    apple: {},
  };

  if (webClientId) {
    initConfig.google = {
      webClientId,
      iOSClientId,
      iOSServerClientId: webClientId,
    };
  }

  try {
    await SocialLogin.initialize(initConfig);
    isInitialized = true;
  } catch (err) {
    console.error('Failed to initialize SocialLogin:', err);
  }
}

export async function performGoogleLogin() {
  await initializeSocialLogin();

  const response = await SocialLogin.login({
    provider: 'google',
    options: {},
  });

  const idToken = response?.result?.idToken || response?.result?.identityToken || response?.idToken || response?.identityToken;
  if (!idToken) {
    throw new Error('No ID token received from Google sign-in');
  }

  return idToken;
}

export async function performAppleLogin() {
  await initializeSocialLogin();

  const response = await SocialLogin.login({
    provider: 'apple',
    options: {
      scopes: ['email', 'name'],
    },
  });

  const idToken = response?.result?.idToken || response?.result?.identityToken || response?.idToken || response?.identityToken;
  if (!idToken) {
    throw new Error('No ID token received from Apple sign-in');
  }

  return {
    idToken,
    raw: response?.result || response,
  };
}
