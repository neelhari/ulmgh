export const orders = [
  {
    id: 'PS12345678',
    date: '20 May 2024',
    total: 1596,
    status: 'Out for Delivery',
    items: [
      { name: 'Premium Brass Diya (Handcrafted)', variant: 'Small', qty: 1, price: 199, image: 'https://placehold.co/400x400/E8630A/FFF8EE?text=Brass+Diya' },
      { name: 'Silver Pooja Thali', variant: 'Medium', qty: 1, price: 1299, image: 'https://placehold.co/400x400/C0C0C0/4A2C1D?text=Silver+Plate' },
      { name: 'Camphor', variant: '100g', qty: 2, price: 49, image: 'https://placehold.co/400x400/FFF8EE/4A2C1D?text=Camphor' }
    ],
    timeline: [
      { title: 'Order Confirmed', date: '20 May 2024, 10:30 AM', status: 'completed' },
      { title: 'Packed', date: '20 May 2024, 02:15 PM', status: 'completed' },
      { title: 'Shipped', date: '21 May 2024, 09:20 AM', status: 'completed' },
      { title: 'Out for Delivery', date: '22 May 2024, 08:30 AM', status: 'in-progress' },
      { title: 'Delivered', date: 'Expected on 22 May 2024', status: 'pending' }
    ]
  }
];
