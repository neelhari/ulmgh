const fs = require('fs');
const path = require('path');

const files = [
  'AdminProductsPage.jsx',
  'AdminOrdersPage.jsx',
  'AdminCouponsPage.jsx',
  'AdminBannersPage.jsx'
];

const dir = '/Users/hemanthkancharla/Documents/zewotech/multi/src/pages/admin';

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find classNames that have bg-white border border-gray-100 but don't have a text- color yet.
    content = content.replace(/bg-white border border-gray-100/g, 'bg-white border border-gray-100 text-gray-900');
    
    // Let's also fix inputs with border-gray-200 just in case
    content = content.replace(/bg-white border border-gray-200/g, 'bg-white border border-gray-200 text-gray-900');
    
    // We don't want duplicate text-gray-900 text-gray-900 so we dedupe just in case
    content = content.replace(/text-gray-900 text-gray-900/g, 'text-gray-900');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
