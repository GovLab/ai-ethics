const fs = require('fs');
const path = require('path');
const https = require('https');

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'img');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
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

// Function to find all headshot IDs in faculty data
function findHeadshotIds(data) {
  const headshotIds = new Set();
  
  function extractHeadshots(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }
    
    if (Array.isArray(obj)) {
      obj.forEach(item => extractHeadshots(item));
      return;
    }
    
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'headshot' && typeof value === 'number') {
        headshotIds.add(value);
      } else if (typeof value === 'object') {
        extractHeadshots(value);
      }
    }
  }
  
  extractHeadshots(data);
  return Array.from(headshotIds);
}

// Function to download headshot images
async function downloadHeadshots(headshotIds) {
  console.log(`Found ${headshotIds.length} unique headshot IDs to download.\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const headshotId of headshotIds) {
    const filename = `${headshotId}`;
    const imagePath = path.join(imagesDir, filename);
    
    // Skip if already exists
    if (fs.existsSync(imagePath)) {
      console.log(`✓ Already exists: ${filename}`);
      successCount++;
      continue;
    }
    
    // Try to download without query parameters
    const cleanUrl = `https://directus.thegovlab.com/ai-ethics/assets/${headshotId}`;
    
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
  
  console.log(`\nHeadshot download summary:`);
  console.log(`  Successfully downloaded: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Total: ${headshotIds.length}`);
  
  return successCount;
}

// Function to update faculty data with local headshot paths
function updateFacultyHeadshots(data) {
  function updateHeadshots(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => updateHeadshots(item));
    }
    
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'headshot' && typeof value === 'number') {
        // Update headshot reference to local path
        result[key] = `img/${value}`;
      } else if (typeof value === 'object') {
        result[key] = updateHeadshots(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  return updateHeadshots(data);
}

// Main function
async function processHeadshots() {
  console.log('Processing headshot images and updating faculty data...\n');
  
  // Load faculty_junction data
  const facultyJunctionPath = path.join(dataDir, 'faculty_junction.json');
  if (!fs.existsSync(facultyJunctionPath)) {
    console.error('faculty_junction.json not found. Run download-enhanced-api-data.js first.');
    return;
  }
  
  const facultyData = JSON.parse(fs.readFileSync(facultyJunctionPath, 'utf8'));
  
  // Find all headshot IDs
  const headshotIds = findHeadshotIds(facultyData);
  console.log('Headshot IDs found:', headshotIds);
  
  // Download headshot images
  await downloadHeadshots(headshotIds);
  
  // Update faculty data with local headshot paths
  console.log('\nUpdating faculty data with local headshot paths...');
  const updatedFacultyData = updateFacultyHeadshots(facultyData);
  
  // Save updated faculty data
  fs.writeFileSync(facultyJunctionPath, JSON.stringify(updatedFacultyData, null, 2));
  console.log('✓ Updated faculty_junction.json');
  
  // Also update people.json if it exists
  const peoplePath = path.join(dataDir, 'people.json');
  if (fs.existsSync(peoplePath)) {
    console.log('Updating people.json...');
    const peopleData = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));
    const updatedPeopleData = updateFacultyHeadshots(peopleData);
    fs.writeFileSync(peoplePath, JSON.stringify(updatedPeopleData, null, 2));
    console.log('✓ Updated people.json');
  }
  
  console.log('\nHeadshot processing complete!');
  console.log(`Images saved in: ${imagesDir}`);
}

// Run the processing
processHeadshots().catch(console.error); 