const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds timeout for serverless reliability
let cachedToken = null;
let tokenExpiry = null;

async function authenticate() {
  if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
    return cachedToken;
  }

  const email = typeof process.env.SHIPROCKET_EMAIL === 'string' ? process.env.SHIPROCKET_EMAIL.trim() : '';
  const password = typeof process.env.SHIPROCKET_PASSWORD === 'string' ? process.env.SHIPROCKET_PASSWORD.trim() : '';

  if (!email || !password) {
    throw new Error('Shiprocket credentials missing: SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD is not configured');
  }

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    }, {
      timeout: DEFAULT_TIMEOUT_MS
    });
    
    cachedToken = response.data.token;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 9);
    tokenExpiry = expiry;
    
    return cachedToken;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || 'Invalid credentials or network failure';
    console.error('Shiprocket login failed:', errMsg);
    throw new Error(`Shiprocket login failed: ${errMsg}`);
  }
}

async function createCustomOrder(orderData) {
  const token = await authenticate();

  const payload = {
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
    ...orderData,
  };
  if (!payload.pickup_location && process.env.SHIPROCKET_PICKUP_LOCATION) {
    payload.pickup_location = process.env.SHIPROCKET_PICKUP_LOCATION;
  }

  try {
    const response = await axios.post(`${BASE_URL}/orders/create/adhoc`, payload, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: DEFAULT_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    console.error('Shiprocket Create Order Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create order in Shiprocket');
  }
}

async function assignAWB(shipmentId) {
  const token = await authenticate();

  try {
    const response = await axios.post(`${BASE_URL}/courier/assign/awb`, {
      shipment_id: shipmentId
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: DEFAULT_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    console.error('Shiprocket AWB Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to generate AWB');
  }
}

async function requestPickup(shipmentId) {
  const token = await authenticate();

  try {
    const response = await axios.post(`${BASE_URL}/courier/generate/pickup`, {
      shipment_id: [shipmentId]
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: DEFAULT_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    console.error('Shiprocket Pickup Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to request pickup');
  }
}

async function generateLabel(shipmentId) {
  const token = await authenticate();

  try {
    const response = await axios.post(`${BASE_URL}/courier/generate/label`, {
      shipment_id: [shipmentId]
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: DEFAULT_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    console.error('Shiprocket Label Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to generate shipping label');
  }
}

async function getPickupLocations() {
  const token = await authenticate();

  try {
    const response = await axios.get(`${BASE_URL}/settings/company/pickup`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: DEFAULT_TIMEOUT_MS
    });
    return response.data?.data?.shipping_address || [];
  } catch (error) {
    console.error('Shiprocket Get Pickups Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch pickup locations from Shiprocket');
  }
}

async function registerPickupLocation(pickupData) {
  const token = await authenticate();

  try {
    const response = await axios.post(`${BASE_URL}/settings/company/addpickup`, pickupData, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: DEFAULT_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    console.error('Shiprocket Add Pickup Error:', error.response?.data || error.message);
    const errMsg = error.response?.data?.message || (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : error.message);
    throw new Error(errMsg || 'Failed to register pickup location in Shiprocket');
  }
}

async function cancelShipment(awbs) {
  const token = await authenticate();
  const awbList = Array.isArray(awbs) ? awbs : [awbs];

  try {
    const response = await axios.post(`${BASE_URL}/orders/cancel/shipment/awbs`, {
      awbs: awbList
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: DEFAULT_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    console.error('Shiprocket Cancel Shipment Error:', error.response?.data || error.message);
    const errMsg = error.response?.data?.message || error.message;
    throw new Error(errMsg || 'Failed to cancel shipment in Shiprocket');
  }
}

async function cancelOrder(orderIds) {
  const token = await authenticate();
  const idList = Array.isArray(orderIds) ? orderIds : [orderIds];

  try {
    const response = await axios.post(`${BASE_URL}/orders/cancel`, {
      ids: idList
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: DEFAULT_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    console.error('Shiprocket Cancel Order Error:', error.response?.data || error.message);
    const errMsg = error.response?.data?.message || error.message;
    throw new Error(errMsg || 'Failed to cancel order in Shiprocket');
  }
}

async function getTrackingByAwb(awbCode) {
  const token = await authenticate();

  try {
    const response = await axios.get(`${BASE_URL}/courier/track/awb/${encodeURIComponent(awbCode)}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: DEFAULT_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    console.error('Shiprocket Track AWB Error:', error.response?.data || error.message);
    const errMsg = error.response?.data?.message || error.message;
    throw new Error(errMsg || 'Failed to fetch tracking details from Shiprocket');
  }
}

async function getOrderDetails(orderId) {
  const token = await authenticate();

  try {
    const response = await axios.get(`${BASE_URL}/orders/show/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: DEFAULT_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    console.error('Shiprocket Get Order Error:', error.response?.data || error.message);
    const errMsg = error.response?.data?.message || error.message;
    throw new Error(errMsg || 'Failed to fetch order details from Shiprocket');
  }
}

module.exports = {
  authenticate,
  createCustomOrder,
  assignAWB,
  requestPickup,
  generateLabel,
  getPickupLocations,
  registerPickupLocation,
  cancelShipment,
  cancelOrder,
  getTrackingByAwb,
  getOrderDetails
};
