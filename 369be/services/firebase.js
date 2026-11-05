const admin = require('firebase-admin');
const pool = require('../db');

let firebaseApp = null;
let mockMessagingInstance = null;

// Initialize Firebase Admin SDK safely
function initFirebase() {
  if (firebaseApp) return firebaseApp;

  try {
    let credential = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        credential = admin.credential.cert(serviceAccount);
      } catch (parseErr) {
        console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', parseErr.message);
      }
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    }

    if (credential) {
      firebaseApp = admin.initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID || 'ulmgh-369-e90b5'
      });
      console.log('✅ [Firebase] Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('⚠️ [Firebase] No valid Firebase service account credentials found. Push notifications will be logged/mocked.');
    }
  } catch (err) {
    console.error('❌ [Firebase] Initialization error:', err.message);
  }

  return firebaseApp;
}

// Ensure init is run once on load
initFirebase();

function setMockMessaging(mock) {
  mockMessagingInstance = mock;
}

function getMessaging() {
  if (mockMessagingInstance) {
    return mockMessagingInstance;
  }
  if (!firebaseApp) {
    initFirebase();
  }
  if (firebaseApp) {
    return admin.messaging(firebaseApp);
  }
  return null;
}

/**
 * Clean up invalid or unregistered tokens from database
 */
async function removeInvalidTokens(tokensToRemove) {
  if (!tokensToRemove || tokensToRemove.length === 0) return;
  try {
    await pool.query(
      'DELETE FROM fcm_device_tokens WHERE fcm_token = ANY($1)',
      [tokensToRemove]
    );
    console.log(`[Firebase] Pruned ${tokensToRemove.length} stale/invalid FCM tokens.`);
  } catch (err) {
    console.error('[Firebase] Error pruning stale tokens:', err.message);
  }
}

/**
 * Core send routine with idempotency and token management
 */
async function sendNotification({
  recipientType, // 'customer' | 'vendor'
  recipientId,
  eventType,
  referenceId,
  title,
  body,
  data = {},
  idempotencyKey = null
}) {
  try {
    if (!recipientType || !recipientId || !title || !body) {
      console.warn('[Firebase] Missing required notification fields', { recipientType, recipientId, title });
      return { success: false, reason: 'missing_fields' };
    }

    // 1. Check idempotency if a key was provided
    if (idempotencyKey) {
      const existing = await pool.query(
        'SELECT id, status FROM notification_logs WHERE idempotency_key = $1',
        [idempotencyKey]
      );
      if (existing.rows.length > 0 && ['sent', 'mocked'].includes(existing.rows[0].status)) {
        console.log(`[Firebase] Skipping duplicate notification with idempotencyKey: ${idempotencyKey}`);
        return { success: true, duplicate: true };
      }
    }

    // 2. Fetch device tokens for the recipient
    const tokenResult = await pool.query(
      'SELECT fcm_token FROM fcm_device_tokens WHERE user_type = $1 AND user_id = $2',
      [recipientType, recipientId]
    );

    const tokens = tokenResult.rows.map(r => r.fcm_token).filter(Boolean);

    if (tokens.length === 0) {
      console.log(`[Firebase] No active tokens found for ${recipientType} ID ${recipientId}.`);
      if (idempotencyKey) {
        await pool.query(
          `INSERT INTO notification_logs (recipient_type, recipient_id, event_type, reference_id, title, body, status, idempotency_key, error_message)
           VALUES ($1, $2, $3, $4, $5, $6, 'no_tokens', $7, 'No registered device tokens')
           ON CONFLICT (idempotency_key) DO NOTHING`,
          [recipientType, recipientId, eventType || 'generic', referenceId || null, title, body, idempotencyKey]
        );
      }
      return { success: false, reason: 'no_tokens' };
    }

    // Convert all data object values to strings (FCM requirement)
    const stringifiedData = {};
    for (const [k, v] of Object.entries(data)) {
      stringifiedData[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
    stringifiedData.recipientType = recipientType;
    stringifiedData.eventType = eventType || '';
    if (referenceId) stringifiedData.referenceId = String(referenceId);

    const messaging = getMessaging();

    if (!messaging) {
      console.warn(`[Firebase Mock] Would send to ${tokens.length} tokens of ${recipientType} #${recipientId}: [${title}] ${body}`);
      // Record simulated success in logs
      if (idempotencyKey) {
        await pool.query(
          `INSERT INTO notification_logs (recipient_type, recipient_id, event_type, reference_id, title, body, status, idempotency_key)
           VALUES ($1, $2, $3, $4, $5, $6, 'mocked', $7)
           ON CONFLICT (idempotency_key) DO UPDATE SET status = 'mocked'`,
          [recipientType, recipientId, eventType || 'generic', referenceId || null, title, body, idempotencyKey]
        );
      }
      return { success: true, mocked: true, tokensCount: tokens.length };
    }

    // 3. Build multicast payload
    const multicastMessage = {
      notification: {
        title,
        body
      },
      data: stringifiedData,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true
        }
      },
      tokens
    };

    const response = await messaging.sendEachForMulticast(multicastMessage);
    const staleTokens = [];
    let successCount = 0;

    response.responses.forEach((resp, idx) => {
      if (resp.success) {
        successCount++;
      } else if (resp.error) {
        const code = resp.error.code || '';
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/mismatched-credential'
        ) {
          staleTokens.push(tokens[idx]);
        }
      }
    });

    // 4. Prune any stale tokens identified
    if (staleTokens.length > 0) {
      await removeInvalidTokens(staleTokens);
    }

    // 5. Record dispatch log
    const finalStatus = successCount > 0 ? 'sent' : 'failed';
    const errorMsg = response.failureCount > 0 ? `${response.failureCount} tokens failed out of ${tokens.length}` : null;

    if (idempotencyKey) {
      await pool.query(
        `INSERT INTO notification_logs (recipient_type, recipient_id, event_type, reference_id, title, body, status, idempotency_key, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (idempotency_key) DO UPDATE SET status = $7, error_message = $9`,
        [recipientType, recipientId, eventType || 'generic', referenceId || null, title, body, finalStatus, idempotencyKey, errorMsg]
      );
    }

    return {
      success: successCount > 0,
      sentCount: successCount,
      failureCount: response.failureCount,
      prunedTokens: staleTokens.length
    };
  } catch (err) {
    console.error(`[Firebase] Send notification failed for ${recipientType} ${recipientId}:`, err.message);
    if (idempotencyKey) {
      try {
        await pool.query(
          `INSERT INTO notification_logs (recipient_type, recipient_id, event_type, reference_id, title, body, status, idempotency_key, error_message)
           VALUES ($1, $2, $3, $4, $5, $6, 'error', $7, $8)
           ON CONFLICT (idempotency_key) DO UPDATE SET status = 'error', error_message = $8`,
          [recipientType, recipientId, eventType || 'generic', referenceId || null, title, body, idempotencyKey, err.message]
        );
      } catch (logErr) {
        console.error('[Firebase] Failed to write error to notification_logs:', logErr.message);
      }
    }
    return { success: false, error: err.message };
  }
}

// Helper methods for Customer and Vendor
async function sendPushToCustomer(userId, payload = {}, argIdempotencyKey = null, argRefId = null, argEventType = null) {
  const {
    title,
    body,
    data = {},
    eventType = argEventType || 'order_event',
    referenceId = argRefId || null,
    idempotencyKey = argIdempotencyKey || null
  } = payload;

  return sendNotification({
    recipientType: 'customer',
    recipientId: userId,
    eventType: argEventType || eventType,
    referenceId: argRefId || referenceId,
    title,
    body,
    data,
    idempotencyKey: argIdempotencyKey || idempotencyKey
  });
}

async function sendPushToVendor(vendorId, payload = {}, argIdempotencyKey = null, argRefId = null, argEventType = null) {
  const {
    title,
    body,
    data = {},
    eventType = argEventType || 'vendor_order_event',
    referenceId = argRefId || null,
    idempotencyKey = argIdempotencyKey || null
  } = payload;

  return sendNotification({
    recipientType: 'vendor',
    recipientId: vendorId,
    eventType: argEventType || eventType,
    referenceId: argRefId || referenceId,
    title,
    body,
    data,
    idempotencyKey: argIdempotencyKey || idempotencyKey
  });
}

module.exports = {
  initFirebase,
  setMockMessaging,
  getMessaging,
  sendNotification,
  sendPushToCustomer,
  sendPushToVendor,
  removeInvalidTokens
};
