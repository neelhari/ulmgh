const { z } = require('zod');

/**
 * Express middleware to validate request body against a Zod schema.
 * Rejects invalid requests with 400 and clear error messages.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues || [];
    const firstError = issues[0]?.message || 'Invalid input data';
    return res.status(400).json({ error: firstError });
  }
  next();
};

// Lenient Signup Schema: requires basic fields, allows passthrough
const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().min(1, 'Phone is required'),
  password: z.string().min(1, 'Password is required'),
}).passthrough();

// Lenient Login Schema
const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
}).passthrough();

// Lenient Address Schema
const addressSchema = z.object({
  name: z.string().optional().nullable(),
  line1: z.string().optional().nullable(),
  line2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  is_default: z.boolean().optional(),
}).passthrough();

// Lenient Order Schema: checks items array is non-empty, allows address object/string
const orderSchema = z.object({
  items: z.array(z.any()).min(1, 'Cart is empty'),
  address: z.any().optional(),
  coupon_code: z.string().optional().nullable(),
  couponCode: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  razorpay_order_id: z.string().optional().nullable(),
  razorpay_payment_id: z.string().optional().nullable(),
  razorpay_signature: z.string().optional().nullable(),
}).passthrough();

module.exports = {
  validate,
  signupSchema,
  loginSchema,
  addressSchema,
  orderSchema,
};
