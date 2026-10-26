import { SocialLogin } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';

let isInitialized = false;

export async function initializeSocialLogin() {
  if (isInitialized) return;
  if (!Capacitor.isNativePlatform()) return;

  const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    console.warn('VITE_GOOGLE_WEB_CLIENT_ID is not configured');
    return;
  }

  try {
    await SocialLogin.initialize({
      google: {
        webClientId,
      },
    });
    isInitialized = true;
  } catch (err) {
    console.error('Failed to initialize Google SocialLogin:', err);
  }
}

export async function performGoogleLogin() {
  await initializeSocialLogin();

  const response = await SocialLogin.login({
    provider: 'google',
    options: {
      scopes: ['email', 'profile'],
    },
  });

  const idToken = response?.result?.idToken || response?.idToken;
  if (!idToken) {
    throw new Error('No ID token received from Google sign-in');
  }

  return idToken;
}
