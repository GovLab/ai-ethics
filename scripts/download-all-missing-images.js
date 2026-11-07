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

console.log('Finding and downloading all missing images...');

let downloadedCount = 0;
let failedCount = 0;
let skippedCount = 0;
const failedDownloads = [];
const allImageFiles = new Set();

// Function to download image
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

// Function to process image field
async function processImageField(imageData, context) {
  if (!imageData || !imageData.filename_disk) return;
  
  const filename = imageData.filename_disk;
  const fullUrl = `https://directus.thegovlab.com/uploads/ai-ethics/originals/${filename}`;
  const filePath = path.join(IMG_DIR, filename);
  
  // Check if file exists and has content
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
    console.log(`⏭️  Skipping ${filename} (already exists)`);
    skippedCount++;
    return;
  }

  try {
    console.log(`📥 Downloading ${context}: ${filename}`);
    await downloadImage(fullUrl, filename);
    console.log(`✅ Downloaded: ${filename}`);
    downloadedCount++;
  } catch (error) {
    console.log(`❌ Failed to download ${context} ${filename}: ${error.message}`);
    failedCount++;
    failedDownloads.push({
      context: context,
      url: fullUrl,
      filename: filename,
      error: error.message
    });
  }
}

// Function to recursively find image fields in an object
async function findAndDownloadImages(obj, context = '') {
  if (typeof obj !== 'object' || obj === null) return;
  
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      await findAndDownloadImages(obj[i], `${context}[${i}]`);
    }
    return;
  }

  // Check for common image field names
  const imageFields = ['thumbnail', 'icon', 'headshot', 'image', 'photo', 'picture'];
  
  for (const fieldName of imageFields) {
    if (obj[fieldName]) {
      await processImageField(obj[fieldName], `${context}.${fieldName}`);
    }
  }

  // Recursively check nested objects
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      await findAndDownloadImages(value, context ? `${context}.${key}` : key);
    }
  }
}

// Process all JSON files
async function processAllData() {
  const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
  
  for (const file of files) {
    console.log(`\n📁 Processing ${file}...`);
    const filePath = path.join(DATA_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    await findAndDownloadImages(data, file);
  }
}

async function main() {
  try {
    await processAllData();
    
    console.log('\n=== Download Summary ===');
    console.log(`✅ Successfully downloaded: ${downloadedCount} images`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} images`);
    console.log(`❌ Failed downloads: ${failedCount}`);
    
    if (failedDownloads.length > 0) {
      console.log('\nFailed downloads:');
      failedDownloads.forEach(item => {
        console.log(`  - ${item.context} ${item.filename}: ${item.error}`);
      });
    }
    
    console.log(`\nImages saved in: ${IMG_DIR}`);
    
  } catch (error) {
    console.error('Error during download:', error);
  }
}

main(); 