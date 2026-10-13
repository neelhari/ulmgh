import { create } from 'zustand';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const MOCK_CATEGORIES = [
  { id: 1, name: 'Mobiles', image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80' },
  { id: 2, name: 'Electronics', image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80' },
  { id: 3, name: 'Fashion', image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&q=80' },
  { id: 4, name: 'Home & Furniture', image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80' },
  { id: 5, name: 'Appliances', image_url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&q=80' },
  { id: 6, name: 'Grocery', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80' }
];

const MOCK_PRODUCTS = [
  { id: '1', name: 'APPLE iPhone 15 (Black, 128 GB)', description: 'Dynamic Island bubbles up alerts and Live Activities. 48MP Main camera with 2x Telephoto. USB-C connector.', price: 72999, sizes: [{size: '128GB', price: 72999}, {size: '256GB', price: 82999}], category: 'Mobiles', is_bestseller: true, is_trending: true, is_offer: true, images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&q=80'] },
  { id: '2', name: 'SAMSUNG Galaxy S24 Ultra 5G (Titanium Gray, 256 GB)', description: 'Galaxy AI is here. 200MP camera, 100x Space Zoom, built-in S Pen.', price: 129999, sizes: [{size: '256GB', price: 129999}, {size: '512GB', price: 139999}], category: 'Mobiles', is_bestseller: false, is_trending: true, is_offer: false, images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&q=80'] },
  
  { id: '3', name: 'Apple MacBook Air M2', description: 'Supercharged by M2 chip. 13.6-inch Liquid Retina display, 8GB RAM, 256GB SSD.', price: 99990, sizes: [{size: '256GB', price: 99990}], category: 'Electronics', is_bestseller: true, is_trending: true, is_offer: true, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80'] },
  { id: '4', name: 'SONY WH-1000XM5 Bluetooth Headset', description: 'Industry leading noise cancellation, 30 hours battery life, multipoint connection.', price: 29990, sizes: [{size: 'Standard', price: 29990}], category: 'Electronics', is_bestseller: true, is_trending: false, is_offer: false, images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80'] },
  
  { id: '5', name: 'Men Striped Round Neck Cotton Blend T-Shirt', description: 'Comfortable everyday casual t-shirt for men. 100% premium cotton blend.', price: 499, sizes: [{size: 'M', price: 499}, {size: 'L', price: 499}], category: 'Fashion', is_bestseller: true, is_trending: true, is_offer: true, images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80'] },
  { id: '6', name: 'Women Printed Cotton Blend Kurta', description: 'Elegant ethnic wear for women. Perfect for festive occasions and casual wear.', price: 799, sizes: [{size: 'S', price: 799}, {size: 'M', price: 799}], category: 'Fashion', is_bestseller: false, is_trending: true, is_offer: true, images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&q=80'] },
  
  { id: '7', name: 'Bharat Lifestyle 5 Seater Fabric Sofa Set', description: 'Premium 3+1+1 brown fabric sofa set. Durable and comfortable.', price: 15999, sizes: [{size: 'Standard', price: 15999}], category: 'Home & Furniture', is_bestseller: true, is_trending: false, is_offer: true, images: ['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&q=80'] },
  { id: '8', name: 'SAMSUNG 236 L Frost Free Double Door Refrigerator', description: 'Digital Inverter Compressor, 3 Star Energy Rating, Frost Free.', price: 23490, sizes: [{size: 'Standard', price: 23490}], category: 'Appliances', is_bestseller: true, is_trending: true, is_offer: false, images: ['https://images.unsplash.com/photo-1584269600519-112d00e42a1f?w=500&q=80'] },
  
  { id: '9', name: 'Happilo Premium 100% Natural California Almonds', description: 'Premium quality raw almonds. High in protein and fiber.', price: 649, sizes: [{size: '500g', price: 649}], category: 'Grocery', is_bestseller: true, is_trending: false, is_offer: true, images: ['https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=500&q=80'] }
];

export const useStoreData = create((set) => ({
  products: [],
  categories: [],
  offers: [],
  banners: [],
  loading: true,
  fetchData: async () => {
    try {
      set({ loading: true });
      const [prodRes, catRes, offerRes, bannerRes] = await Promise.all([
        fetch(`${BACKEND_URL}/general/products`),
        fetch(`${BACKEND_URL}/general/categories`),
        fetch(`${BACKEND_URL}/offers/active`).catch(() => null),
        fetch(`${BACKEND_URL}/general/banners`).catch(() => null),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      const offerData = offerRes ? await offerRes.json() : {};
      const bannerData = bannerRes ? await bannerRes.json() : {};
      
      set({ 
        products: prodData.products || [], 
        categories: catData.categories || [],
        offers: offerData.offers || [],
        banners: bannerData.banners || [],
        loading: false 
      });
    } catch (err) {
      console.warn("Backend API unavailable. Loading mock data...");
      set({ 
        products: MOCK_PRODUCTS, 
        categories: MOCK_CATEGORIES,
        offers: [],
        banners: [],
        loading: false 
      });
    }
  }
}));
