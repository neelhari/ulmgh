const fs = require('fs');
const path = require('path');

const files = [
  'AdminDashboardPage.jsx',
  'AdminProductsPage.jsx',
  'AdminOrdersPage.jsx',
  'AdminCategoriesPage.jsx',
  'AdminCouponsPage.jsx',
  'AdminBannersPage.jsx',
  'AdminReportsPage.jsx'
];

const dir = path.join(__dirname, 'src', 'pages', 'admin');

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Header texts
    content = content.replace(/font-serif text-2xl sm:text-3xl font-bold text-brand-orange/g, 'text-2xl font-bold text-gray-900');
    content = content.replace(/font-serif text-xl font-bold text-brand-orange/g, 'text-xl font-bold text-gray-900');
    
    // Panel styling
    content = content.replace(/border-brand-orange\/10/g, 'border-gray-100');
    content = content.replace(/border-brand-orange\/20/g, 'border-gray-200');
    content = content.replace(/bg-brand-green\/10/g, 'bg-gray-50');
    content = content.replace(/bg-brand-green\/5/g, 'bg-gray-50');
    content = content.replace(/bg-brand-green/g, 'bg-white');
    
    // Text colors
    content = content.replace(/text-brand-orange\/50/g, 'text-gray-500');
    content = content.replace(/text-brand-orange\/70/g, 'text-gray-700');
    content = content.replace(/text-brand-orange\/40/g, 'text-gray-400');
    content = content.replace(/text-brand-orange/g, 'text-gray-900');
    
    // Typography
    content = content.replace(/font-serif/g, '');
    content = content.replace(/font-sans/g, '');
    
    // Buttons
    content = content.replace(/bg-white text-gray-900/g, 'bg-[#fe6603] text-white hover:bg-[#e55c02]'); // this is tricky, wait...
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
