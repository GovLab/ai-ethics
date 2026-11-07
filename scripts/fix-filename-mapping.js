const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const IMAGES_DIR = path.join(__dirname, 'images');

console.log('Fixing filename mapping to match JSON data references...');

// Load people data to get the mapping
const peopleDataPath = path.join(DATA_DIR, 'people.json');
if (!fs.existsSync(peopleDataPath)) {
  console.error('❌ people.json not found.');
  process.exit(1);
}

const peopleData = JSON.parse(fs.readFileSync(peopleDataPath, 'utf8'));

// Create mapping from filename_download to filename_disk
const filenameMapping = {};

for (const person of peopleData.data) {
  if (person.headshot && person.headshot.filename_download && person.headshot.filename_disk) {
    filenameMapping[person.headshot.filename_download] = person.headshot.filename_disk;
  }
}

console.log(`Found ${Object.keys(filenameMapping).length} filename mappings`);

let renamedCount = 0;
let skippedCount = 0;
let errorCount = 0;

// Rename files
for (const [downloadName, diskName] of Object.entries(filenameMapping)) {
  const oldPath = path.join(IMAGES_DIR, downloadName);
  const newPath = path.join(IMAGES_DIR, diskName);
  
  if (fs.existsSync(oldPath)) {
    try {
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Renamed: ${downloadName} → ${diskName}`);
      renamedCount++;
    } catch (error) {
      console.log(`❌ Error renaming ${downloadName}: ${error.message}`);
      errorCount++;
    }
  } else {
    console.log(`⏭️  Skipping ${downloadName} (not found)`);
    skippedCount++;
  }
}

console.log('\n=== Rename Summary ===');
console.log(`✅ Successfully renamed: ${renamedCount} files`);
console.log(`⏭️  Skipped (not found): ${skippedCount} files`);
console.log(`❌ Errors: ${errorCount} files`);

// Also check for any remaining files that might need renaming
console.log('\nChecking for any remaining files with special characters...');
const allFiles = fs.readdirSync(IMAGES_DIR);
const specialCharFiles = allFiles.filter(file => /[áéíóúñüö]/i.test(file));

if (specialCharFiles.length > 0) {
  console.log(`Found ${specialCharFiles.length} files with special characters that might need manual attention:`);
  specialCharFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
} else {
  console.log('✅ No files with special characters found.');
} 