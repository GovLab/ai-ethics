const fs = require('fs');
const path = require('path');
const https = require('https');

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'img');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Function to download a file
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file async
      reject(err);
    });
  });
}

// Function to extract filename from URL
function getFilenameFromUrl(url) {
  const urlParts = url.split('/');
  const filename = urlParts[urlParts.length - 1].split('?')[0];
  return filename;
}

// List of failed images to retry
const failedImages = [
  'https://directus.thegovlab.com/ai-ethics/assets/nla2sh4xwn40wk4s?key=directus-large-contain',
  'https://directus.thegovlab.com/ai-ethics/assets/s3bmt2put9w88ooc?key=directus-large-contain',
  'https://directus.thegovlab.com/ai-ethics/assets/njqovy5krisookc0?key=thumbnail'
];

async function downloadFailedImages() {
  console.log('Downloading previously failed images...\n');
  
  for (const originalUrl of failedImages) {
    const filename = getFilenameFromUrl(originalUrl);
    const imagePath = path.join(imagesDir, filename);
    
    // Remove query parameters
    const cleanUrl = originalUrl.split('?')[0];
    
    console.log(`Trying to download: ${filename}`);
    console.log(`  Original URL: ${originalUrl}`);
    console.log(`  Clean URL: ${cleanUrl}`);
    
    try {
      await downloadFile(cleanUrl, imagePath);
      console.log(`✓ Successfully downloaded: ${filename}`);
    } catch (err) {
      console.log(`✗ Failed to download: ${filename} - ${err.message}`);
    }
    
    console.log('');
  }
  
  console.log('Download attempts complete!');
}

// Run the download
downloadFailedImages().catch(console.error); 