const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const peopleDataPath = path.join(DATA_DIR, 'people.json');

if (!fs.existsSync(peopleDataPath)) {
  console.error('❌ people.json not found.');
  process.exit(1);
}

const peopleData = JSON.parse(fs.readFileSync(peopleDataPath, 'utf8'));

let updated = 0;
for (const person of peopleData.data) {
  if (person.headshot && person.headshot.filename_disk) {
    const uuidPath = `/images/${person.headshot.filename_disk}`;
    if (person.headshot.data) {
      person.headshot.data.full_url = uuidPath;
      person.headshot.data.url = uuidPath;
      if (Array.isArray(person.headshot.data.thumbnails)) {
        for (let thumb of person.headshot.data.thumbnails) {
          thumb.url = uuidPath;
          thumb.relative_url = uuidPath;
        }
      }
      updated++;
    }
  }
}

fs.writeFileSync(peopleDataPath, JSON.stringify(peopleData, null, 2));
console.log(`✅ Updated headshot URLs for ${updated} people.`); 