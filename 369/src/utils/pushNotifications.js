import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

let isInitialized = false;

export async function initPushNotifications() {
  if (isInitialized) return;
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Check and request notification permissions (Required on Android 13+)
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[FCM] Notification permission not granted:', permStatus.receive);
      return;
    }

    // 2. Add notification listeners
    await PushNotifications.addListener('registration', (token) => {
      console.log('[FCM] Registration Success. Device Token:', token.value);
      localStorage.setItem('fcm_token', token.value);
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[FCM] Registration Error:', error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[FCM] Notification Received in foreground:', notification);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('[FCM] Notification action performed (tapped):', notification);
    });

    // 3. Register device with FCM
    await PushNotifications.register();
    isInitialized = true;
    console.log('[FCM] Push notifications initialized successfully.');
  } catch (err) {
    console.error('[FCM] Failed to initialize push notifications:', err);
  }
}
