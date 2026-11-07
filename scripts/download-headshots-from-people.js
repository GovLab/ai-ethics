const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DATA_DIR = path.join(__dirname, 'data');
const IMAGES_DIR = path.join(__dirname, 'images');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Load people data
const peopleDataPath = path.join(DATA_DIR, 'people.json');
if (!fs.existsSync(peopleDataPath)) {
  console.error('❌ people.json not found. Please run download-enhanced-api-data.js first.');
  process.exit(1);
}

const peopleData = JSON.parse(fs.readFileSync(peopleDataPath, 'utf8'));

console.log('Starting headshot download from people data...');
console.log(`Found ${peopleData.data.length} people records`);

let downloadedCount = 0;
let failedCount = 0;
const failedDownloads = [];

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }

      const filePath = path.join(IMAGES_DIR, filename);
      const fileStream = fs.createWriteStream(filePath);
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file if there was an error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function processPeople() {
  for (const person of peopleData.data) {
    if (!person.headshot) {
      console.log(`⚠️  No headshot for ${person.name}`);
      continue;
    }

    const headshot = person.headshot;
    const filename = headshot.filename_download || headshot.filename_disk;
    const fullUrl = headshot.data?.full_url;

    if (!fullUrl) {
      console.log(`⚠️  No URL for headshot of ${person.name}`);
      continue;
    }

    try {
      console.log(`📥 Downloading headshot for ${person.name}...`);
      await downloadImage(fullUrl, filename);
      console.log(`✅ Downloaded: ${filename}`);
      downloadedCount++;
    } catch (error) {
      console.log(`❌ Failed to download headshot for ${person.name}: ${error.message}`);
      failedCount++;
      failedDownloads.push({
        name: person.name,
        url: fullUrl,
        filename: filename,
        error: error.message
      });
    }
  }
}

async function main() {
  try {
    await processPeople();
    
    console.log('\n=== Download Summary ===');
    console.log(`✅ Successfully downloaded: ${downloadedCount} headshots`);
    console.log(`❌ Failed downloads: ${failedCount}`);
    
    if (failedDownloads.length > 0) {
      console.log('\nFailed downloads:');
      failedDownloads.forEach(item => {
        console.log(`  - ${item.name}: ${item.error}`);
      });
    }
    
    console.log(`\nHeadshots saved in: ${IMAGES_DIR}`);
    
  } catch (error) {
    console.error('Error during download:', error);
  }
}

main(); 