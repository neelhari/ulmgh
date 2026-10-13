const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Global accent replacements
  content = content.replace(/#C16E4F/gi, '#00671c'); // Primary accent to green
  content = content.replace(/#A0522D/gi, '#004012'); // Dark hover accent to dark green
  content = content.replace(/#8B4513/gi, '#004012'); // Another dark hover

  // Explicit icon color replacements in Header
  if (filePath.endsWith('Header.jsx')) {
    // Desktop icons
    content = content.replace(/<Heart className="w-5 h-5 text-gray-700"/g, '<Heart className="w-5 h-5 text-[#fe6000]"');
    content = content.replace(/<ShoppingCart className="w-5 h-5 text-gray-700"/g, '<ShoppingCart className="w-5 h-5 text-[#00671c]"');
    
    // Also mobile sidebar might have them or other places using generic text-gray-700
    // But the exact string `<Heart className="w-5 h-5 text-gray-700"` should cover header.
    // Ensure the badge uses orange for wishlist instead of green (which it got from the global replace)
    // Wait, the global replace changed bg-[#C16E4F] to bg-[#00671c]. We can leave Wishlist badge as orange:
    // We'll just let the badge be green for now, or replace it.
  }

  // Explicit Wishlist icon in ProductCard
  if (filePath.endsWith('ProductCard.jsx')) {
    // Heart active fill/text is currently green because of global replace. Let's make it orange.
    content = content.replace(/fill-\[#00671c\] text-\[#00671c\]/g, 'fill-[#fe6000] text-[#fe6000]');
  }

  // Explicit Wishlist page Heart icon
  if (filePath.endsWith('WishlistPage.jsx')) {
    content = content.replace(/text-\[#00671c\] fill-\[#00671c\]/g, 'text-[#fe6000] fill-[#fe6000]');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css') || fullPath.endsWith('.html')) {
      replaceInFile(fullPath);
    }
  }
}

traverseDir(path.join(__dirname, 'src'));
