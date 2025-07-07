const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DATA_DIR = path.join(__dirname, 'data');
const IMG_DIR = path.join(__dirname, 'img');

// Ensure img directory exists
if (!fs.existsSync(IMG_DIR)) {
  fs.mkdirSync(IMG_DIR, { recursive: true });
}

// Load webinar data
const webinarDataPath = path.join(DATA_DIR, 'webinars.json');
if (!fs.existsSync(webinarDataPath)) {
  console.error('❌ webinars.json not found.');
  process.exit(1);
}

const webinarData = JSON.parse(fs.readFileSync(webinarDataPath, 'utf8'));

console.log('Starting webinar image download...');
console.log(`Found ${webinarData.data.length} webinars`);

let downloadedCount = 0;
let failedCount = 0;
let skippedCount = 0;
const failedDownloads = [];

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }

      const filePath = path.join(IMG_DIR, filename);
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

async function processWebinars() {
  for (const webinar of webinarData.data) {
    // Check thumbnail
    if (webinar.thumbnail && webinar.thumbnail.filename_disk) {
      const filename = webinar.thumbnail.filename_disk;
      const fullUrl = `https://directus.thegovlab.com/uploads/ai-ethics/originals/${filename}`;
      const filePath = path.join(IMG_DIR, filename);
      
      // Check if file exists and has content
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        console.log(`⏭️  Skipping ${filename} (already exists)`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`📥 Downloading thumbnail for: ${webinar.title}...`);
        await downloadImage(fullUrl, filename);
        console.log(`✅ Downloaded: ${filename}`);
        downloadedCount++;
      } catch (error) {
        console.log(`❌ Failed to download thumbnail for ${webinar.title}: ${error.message}`);
        failedCount++;
        failedDownloads.push({
          title: webinar.title,
          url: fullUrl,
          filename: filename,
          error: error.message
        });
      }
    }

    // Check for any other image fields (icon, etc.)
    if (webinar.icon && webinar.icon.filename_disk) {
      const filename = webinar.icon.filename_disk;
      const fullUrl = `https://directus.thegovlab.com/uploads/ai-ethics/originals/${filename}`;
      const filePath = path.join(IMG_DIR, filename);
      
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        console.log(`⏭️  Skipping ${filename} (already exists)`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`📥 Downloading icon for: ${webinar.title}...`);
        await downloadImage(fullUrl, filename);
        console.log(`✅ Downloaded: ${filename}`);
        downloadedCount++;
      } catch (error) {
        console.log(`❌ Failed to download icon for ${webinar.title}: ${error.message}`);
        failedCount++;
        failedDownloads.push({
          title: webinar.title,
          url: fullUrl,
          filename: filename,
          error: error.message
        });
      }
    }
  }
}

async function main() {
  try {
    await processWebinars();
    
    console.log('\n=== Download Summary ===');
    console.log(`✅ Successfully downloaded: ${downloadedCount} images`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} images`);
    console.log(`❌ Failed downloads: ${failedCount}`);
    
    if (failedDownloads.length > 0) {
      console.log('\nFailed downloads:');
      failedDownloads.forEach(item => {
        console.log(`  - ${item.title}: ${item.error}`);
      });
    }
    
    console.log(`\nImages saved in: ${IMG_DIR}`);
    
  } catch (error) {
    console.error('Error during download:', error);
  }
}

main(); 