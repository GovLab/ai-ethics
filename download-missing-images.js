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

// Function to find files with 0 bytes
function findEmptyFiles(dir) {
  const files = fs.readdirSync(dir);
  const emptyFiles = [];
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile() && stats.size === 0) {
      emptyFiles.push(file);
    }
  }
  
  return emptyFiles;
}

// Function to extract filename from URL
function getFilenameFromUrl(url) {
  const urlParts = url.split('/');
  const filename = urlParts[urlParts.length - 1].split('?')[0];
  return filename;
}

async function downloadMissingImages() {
  console.log('Finding empty image files...\n');
  
  const emptyFiles = findEmptyFiles(imagesDir);
  console.log(`Found ${emptyFiles.length} empty files:`, emptyFiles);
  
  if (emptyFiles.length === 0) {
    console.log('No empty files found!');
    return;
  }
  
  // For each empty file, try to download it from Directus
  for (const filename of emptyFiles) {
    console.log(`\nTrying to download: ${filename}`);
    
    // Remove file extension to get the asset ID
    const assetId = filename.split('.')[0];
    const cleanUrl = `https://directus.thegovlab.com/ai-ethics/assets/${assetId}`;
    
    const imagePath = path.join(imagesDir, filename);
    
    try {
      await downloadFile(cleanUrl, imagePath);
      console.log(`✓ Successfully downloaded: ${filename}`);
    } catch (err) {
      console.log(`✗ Failed to download: ${filename} - ${err.message}`);
    }
  }
  
  console.log('\nDownload attempts complete!');
}

// Run the download
downloadMissingImages().catch(console.error); 