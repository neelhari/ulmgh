const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
let cachedToken = null;
let tokenExpiry = null;

async function authenticate() {
  if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
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
      headers: { Authorization: `Bearer ${token}` }
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
      headers: { Authorization: `Bearer ${token}` }
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
      headers: { Authorization: `Bearer ${token}` }
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
      headers: { Authorization: `Bearer ${token}` }
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
      headers: { Authorization: `Bearer ${token}` }
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
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Shiprocket Add Pickup Error:', error.response?.data || error.message);
    const errMsg = error.response?.data?.message || (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : error.message);
    throw new Error(errMsg || 'Failed to register pickup location in Shiprocket');
  }
}

module.exports = {
  authenticate,
  createCustomOrder,
  assignAWB,
  requestPickup,
  generateLabel,
  getPickupLocations,
  registerPickupLocation
};
