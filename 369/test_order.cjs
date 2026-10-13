const axios = require('axios');

async function placeOrder() {
  try {
    // 1. Login
    console.log("Logging in...");
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'kancharlahemanth89@gmail.com',
      password: 'test123'
    });
    
    const token = loginRes.data.token;
    console.log("Logged in successfully. Token obtained.");

    // 2. Place Order
    const payload = {
      items: [
        {
          product: { id: 1, name: "Premium Rudraksha", price: 599 },
          qty: 2,
          variant: { size: "Standard", price: 599 }
        }
      ],
      address: {
        name: "Hemanth Kancharla",
        line1: "123 Dev Street",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500081",
        mobile: "9876543210"
      },
      total: 1198,
      coupon_code: ""
    };

    console.log("Placing order...");
    const orderRes = await axios.post('http://localhost:5000/api/auth/orders', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("Order placed successfully:", orderRes.data.order.order_number);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

placeOrder();
