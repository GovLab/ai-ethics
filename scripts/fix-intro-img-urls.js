const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const introDataPath = path.join(DATA_DIR, 'intro_elements.json');

if (!fs.existsSync(introDataPath)) {
  console.error('❌ intro_elements.json not found.');
  process.exit(1);
}

const introData = JSON.parse(fs.readFileSync(introDataPath, 'utf8'));

let updated = 0;
for (const intro of introData.data) {
  if (intro.image && intro.image.data && intro.image.data.full_url) {
    // Extract UUID filename from the Directus URL
    const match = intro.image.data.full_url.match(/([a-f0-9\-]+\.(jpg|jpeg|png|gif|webp))/i);
    if (match) {
      const uuidPath = `/images/${match[1]}`;
      intro.image.data.full_url = uuidPath;
      intro.image.data.url = uuidPath;
      if (Array.isArray(intro.image.data.thumbnails)) {
        for (let thumb of intro.image.data.thumbnails) {
          thumb.url = uuidPath;
          thumb.relative_url = uuidPath;
        }
      }
      updated++;
    }
  }
}

fs.writeFileSync(introDataPath, JSON.stringify(introData, null, 2));
console.log(`✅ Updated intro image URLs for ${updated} intro elements.`); 