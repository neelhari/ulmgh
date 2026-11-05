const router = require('express').Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authLimiter } = require('../utils/rateLimiter');

// Unified auth middleware supporting both Customer and Vendor tokens
function unifiedAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'vendor') {
      req.auth = {
        userType: 'vendor',
        id: decoded.id
      };
    } else if (decoded.id) {
      req.auth = {
        userType: 'customer',
        id: decoded.id
      };
    } else {
      return res.status(401).json({ error: 'Unauthorized: Invalid token claims' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

/**
 * POST /api/notifications/register-token
 * Body: { token, platform, appVersion, deviceModel, userType }
 */
router.post('/register-token', authLimiter, unifiedAuthMiddleware, async (req, res) => {
  const { token, platform = 'android', appVersion, deviceModel, userType } = req.body;

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return res.status(400).json({ error: 'Valid FCM token is required' });
  }

  // Ensure requested userType matches authenticated identity
  if (userType && userType !== req.auth.userType) {
    return res.status(403).json({
      error: `Forbidden: Authenticated as ${req.auth.userType}, cannot register for ${userType}`
    });
  }

  const effectiveUserType = req.auth.userType;
  const effectiveUserId = req.auth.id;

  try {
    const query = `
      INSERT INTO fcm_device_tokens (user_type, user_id, fcm_token, platform, app_version, device_model, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (fcm_token)
      DO UPDATE SET
        user_type = EXCLUDED.user_type,
        user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        app_version = EXCLUDED.app_version,
        device_model = EXCLUDED.device_model,
        updated_at = NOW()
      RETURNING id, user_type, user_id, platform;
    `;

    const result = await pool.query(query, [
      effectiveUserType,
      effectiveUserId,
      token.trim(),
      platform,
      appVersion || null,
      deviceModel || null
    ]);

    res.json({
      success: true,
      message: 'FCM device token registered successfully',
      data: {
        id: result.rows[0].id,
        userType: result.rows[0].user_type,
        userId: result.rows[0].user_id
      }
    });
  } catch (err) {
    console.error('Error registering FCM device token:', err);
    res.status(500).json({ error: 'Failed to register device token' });
  }
});

/**
 * POST /api/notifications/unregister-token
 * Body: { token }
 */
router.post('/unregister-token', authLimiter, unifiedAuthMiddleware, async (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Valid FCM token is required' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM fcm_device_tokens
       WHERE fcm_token = $1 AND user_type = $2 AND user_id = $3
       RETURNING id`,
      [token.trim(), req.auth.userType, req.auth.id]
    );

    res.json({
      success: true,
      message: result.rowCount > 0 ? 'Device token unregistered successfully' : 'Token was not registered or already removed'
    });
  } catch (err) {
    console.error('Error unregistering FCM device token:', err);
    res.status(500).json({ error: 'Failed to unregister device token' });
  }
});

module.exports = router;
module.exports.unifiedAuthMiddleware = unifiedAuthMiddleware;

