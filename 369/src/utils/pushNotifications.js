import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from 'react-toastify';

let isInitialized = false;

const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

/**
 * Synchronize the current device FCM token with backend
 */
export async function syncDeviceToken(userType = 'customer', tokenOverride = null) {
  try {
    const fcmToken = tokenOverride || localStorage.getItem('fcm_token');
    if (!fcmToken) return;

    const authToken = userType === 'vendor' 
      ? localStorage.getItem('vendor_token') 
      : localStorage.getItem('token');

    if (!authToken) {
      console.log(`[FCM] Postponing token registration: no ${userType} auth token found.`);
      return;
    }

    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/notifications/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        token: fcmToken,
        platform: Capacitor.getPlatform() || 'android',
        userType
      })
    });

    if (res.ok) {
      console.log(`[FCM] Device token registered successfully for ${userType}.`);
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn(`[FCM] Failed to register device token for ${userType}:`, errData.error || res.statusText);
    }
  } catch (err) {
    console.error('[FCM] Error synchronizing device token with backend:', err);
  }
}

/**
 * Unregister the current device token on logout
 */
export async function unregisterCurrentDeviceToken(userType = 'customer') {
  try {
    const fcmToken = localStorage.getItem('fcm_token');
    const authToken = userType === 'vendor'
      ? localStorage.getItem('vendor_token')
      : localStorage.getItem('token');

    if (!fcmToken || !authToken) return;

    const baseUrl = getApiBaseUrl();
    await fetch(`${baseUrl}/notifications/unregister-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ token: fcmToken })
    });
    console.log(`[FCM] Device token unregistered for ${userType}.`);
  } catch (err) {
    console.error('[FCM] Error unregistering device token on logout:', err);
  }
}

/**
 * Initialize Push Notifications listeners and permissions
 */
export async function initPushNotifications(userType = 'customer') {
  if (isInitialized) {
    // If already initialized, still ensure token sync with current user session
    syncDeviceToken(userType);
    return;
  }

  if (!Capacitor.isNativePlatform()) {
    console.log('[FCM] Push notifications disabled: Not running on a native platform.');
    return;
  }

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
      syncDeviceToken(userType, token.value);
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[FCM] Registration Error:', error);
    });

    // Foreground notification: Show toast
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[FCM] Notification Received in foreground:', notification);
      const title = notification.title || 'ULMGH 369';
      const body = notification.body || '';
      toast.info(
        `${title}: ${body}`,
        {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true
        }
      );
    });

    // Background/killed click action: Navigate to relevant screen
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[FCM] Notification action performed (tapped):', action);
      const data = action?.notification?.data || {};

      if (data.screen === 'vendor-orders' || data.type === 'new_order') {
        window.location.href = '/vendor/orders';
      } else if (data.orderNumber) {
        window.location.href = `/order-confirmation/${data.orderNumber}`;
      } else if (data.orderId || data.screen === 'order-tracking') {
        window.location.href = '/my-orders';
      }
    });

    // 3. Register device with FCM
    await PushNotifications.register();
    isInitialized = true;
    console.log(`[FCM] Push notifications initialized successfully for ${userType}.`);
  } catch (err) {
    console.error('[FCM] Failed to initialize push notifications:', err);
  }
}
