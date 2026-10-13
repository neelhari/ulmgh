const { rateLimit } = require('express-rate-limit');
const { Redis } = require('@upstash/redis');

let redisClient = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('✅ Upstash Redis connected for distributed serverless rate limiting');
  } catch (err) {
    console.warn('⚠️ Upstash Redis initialization error, using in-memory store:', err.message);
  }
}

/**
 * Upstash Redis store for express-rate-limit
 */
class UpstashRedisStore {
  constructor(windowMs, prefix = 'rl:') {
    this.windowMs = windowMs;
    this.prefix = prefix;
  }

  async increment(key) {
    const fullKey = `${this.prefix}${key}`;
    const windowSeconds = Math.ceil(this.windowMs / 1000);
    const count = await redisClient.incr(fullKey);
    if (count === 1) {
      await redisClient.expire(fullKey, windowSeconds);
    }
    const ttl = await redisClient.ttl(fullKey);
    const resetTime = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : this.windowMs));
    return {
      totalHits: count,
      resetTime,
    };
  }

  async decrement(key) {
    const fullKey = `${this.prefix}${key}`;
    await redisClient.decr(fullKey);
  }

  async resetKey(key) {
    const fullKey = `${this.prefix}${key}`;
    await redisClient.del(fullKey);
  }
}

function createLimiter({ windowMs, max, message, prefix }) {
  const options = {
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message || 'Too many requests. Please try again later.' },
  };

  if (redisClient) {
    options.store = new UpstashRedisStore(windowMs, prefix);
  }

  return rateLimit(options);
}

// Strict limiter for authentication & OTP routes: 5 attempts per 15 minutes per IP
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  prefix: 'rl:auth:'
});

// Generous general limiter for all API traffic: 300 requests per 15 minutes per IP
const generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests from this IP. Please slow down.',
  prefix: 'rl:gen:'
});

module.exports = {
  authLimiter,
  generalLimiter,
  isDistributed: !!redisClient,
};
