const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'img');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Function to download a file
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const file = fs.createWriteStream(filepath);
    protocol.get(url, (response) => {
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

// Function to process image references in data
function processImageReferences(obj, processedUrls = new Set()) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => processImageReferences(item, processedUrls));
  }
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.includes('directus.thegovlab.com')) {
      // This is a Directus asset URL
      const filename = getFilenameFromUrl(value);
      const localPath = `img/${filename}`;
      result[key] = localPath;
      
      // Download the image if we haven't already
      if (!processedUrls.has(value)) {
        processedUrls.add(value);
        const imagePath = path.join(imagesDir, filename);
        
        if (!fs.existsSync(imagePath)) {
          console.log(`Downloading: ${filename} from ${value}`);
          downloadFile(value, imagePath)
            .then(() => console.log(`✓ Downloaded: ${filename}`))
            .catch(err => console.error(`✗ Failed to download ${filename}:`, err.message));
        } else {
          console.log(`✓ Already exists: ${filename}`);
        }
      }
    } else if (typeof value === 'object') {
      result[key] = processImageReferences(value, processedUrls);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// Function to process all JSON files
async function processAllJsonFiles() {
  const dataDir = path.join(__dirname, 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.error('Data directory not found. Run download-api-data.js first.');
    return;
  }
  
  const jsonFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json') && file !== 'sample-structure.json');
  
  console.log('Processing JSON files for image references...\n');
  
  for (const jsonFile of jsonFiles) {
    console.log(`Processing ${jsonFile}...`);
    
    const filePath = path.join(dataDir, jsonFile);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Process the data to update image references
    const processedData = processImageReferences(data);
    
    // Save the updated data
    fs.writeFileSync(filePath, JSON.stringify(processedData, null, 2));
    console.log(`✓ Updated ${jsonFile}`);
  }
  
  console.log('\nImage processing complete!');
  console.log(`Images saved in: ${imagesDir}`);
}

// Run the image processing
processAllJsonFiles().catch(console.error); 