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

// Function to clean Directus asset URLs (remove query parameters)
function cleanDirectusUrl(url) {
  return url.split('?')[0];
}

// Function to find all Directus URLs in an object
function findDirectusUrls(obj, urls = new Set()) {
  if (typeof obj !== 'object' || obj === null) {
    return urls;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach(item => findDirectusUrls(item, urls));
    return urls;
  }
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.includes('directus.thegovlab.com')) {
      urls.add(value);
    } else if (typeof value === 'object') {
      findDirectusUrls(value, urls);
    }
  }
  
  return urls;
}

// Function to update image references in data
function updateImageReferences(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => updateImageReferences(item));
  }
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.includes('directus.thegovlab.com')) {
      // This is a Directus asset URL
      const filename = getFilenameFromUrl(value);
      const localPath = `img/${filename}`;
      result[key] = localPath;
    } else if (typeof value === 'object') {
      result[key] = updateImageReferences(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// Function to download all images
async function downloadAllImages() {
  const dataDir = path.join(__dirname, 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.error('Data directory not found. Run download-api-data.js first.');
    return;
  }
  
  const jsonFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json') && file !== 'sample-structure.json');
  
  console.log('Finding all Directus image URLs...\n');
  
  // Collect all Directus URLs from all JSON files
  const allUrls = new Set();
  for (const jsonFile of jsonFiles) {
    const filePath = path.join(dataDir, jsonFile);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    findDirectusUrls(data, allUrls);
  }
  
  console.log(`Found ${allUrls.size} unique Directus URLs to download.\n`);
  
  // Download all images
  let successCount = 0;
  let failCount = 0;
  
  for (const url of allUrls) {
    const filename = getFilenameFromUrl(url);
    const imagePath = path.join(imagesDir, filename);
    
    // Skip if already exists
    if (fs.existsSync(imagePath)) {
      console.log(`✓ Already exists: ${filename}`);
      successCount++;
      continue;
    }
    
    // Try to download without query parameters
    const cleanUrl = cleanDirectusUrl(url);
    
    try {
      await downloadFile(cleanUrl, imagePath);
      console.log(`✓ Downloaded: ${filename}`);
      successCount++;
    } catch (err) {
      console.log(`✗ Failed: ${filename} - ${err.message}`);
      failCount++;
    }
    
    // Small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`\nDownload summary:`);
  console.log(`  Successfully downloaded: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Total: ${allUrls.size}`);
  
  // Update all JSON files to use local paths
  console.log('\nUpdating JSON files to use local image paths...');
  
  for (const jsonFile of jsonFiles) {
    console.log(`Processing ${jsonFile}...`);
    
    const filePath = path.join(dataDir, jsonFile);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Update the data to use local image paths
    const updatedData = updateImageReferences(data);
    
    // Save the updated data
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
    console.log(`✓ Updated ${jsonFile}`);
  }
  
  console.log('\nAll image processing complete!');
  console.log(`Images saved in: ${imagesDir}`);
}

// Run the download
downloadAllImages().catch(console.error); 