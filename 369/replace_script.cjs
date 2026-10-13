const fs = require('fs');
const path = require('path');

const targetDirs = ['src', 'public'];
const targetFiles = ['index.html', 'package.json', 'README.md'];

function replaceInFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    const ext = path.extname(filePath);
    if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg'].includes(ext)) return; // Skip images
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Ordered from most specific to least specific
    const replacements = [
        [/Swabhivar Shoppers/gi, 'ULMGH369'],
        [/Swabhivar Shopper/gi, 'ULMGH369'],
        [/SWABHIVAR SHOPPER/gi, 'ULMGH369'],
        [/swabhivarshoppers/gi, 'ulmgh369'],
        [/Swabhivar/g, 'ULMGH369'],
        [/SWABHIVAR/g, 'ULMGH369'],
        [/swabhivar/g, 'ulmgh369']
    ];

    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            replaceInFile(fullPath);
        }
    }
}

// Process single files
for (const file of targetFiles) {
    replaceInFile(path.join(__dirname, file));
}

// Process directories
for (const dir of targetDirs) {
    walkDir(path.join(__dirname, dir));
}

console.log('Replacement complete.');
