const fs = require('fs');
const path = require('path');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// API configuration
const API_BASE = 'https://directus.thegovlab.com/ai-ethics';
const API_ENDPOINTS = [
  'intro_elements',
  'webinars', 
  'lecture',
  'about',
  'instructor_panel',
  'people',
  'alert_banner',
  'supporters'
];

// Function to fetch data from Directus API
async function fetchData(endpoint) {
  const url = `${API_BASE}/items/${endpoint}?fields=*.*,faculty.*,faculty.faculty_id,faculty.faculty_junction_id.headshot`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    return null;
  }
}

// Function to save data to JSON file
function saveData(endpoint, data) {
  const filePath = path.join(dataDir, `${endpoint}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved ${endpoint}.json`);
}

// Main function to download all data
async function downloadAllData() {
  console.log('Starting data download from Directus API...\n');
  
  for (const endpoint of API_ENDPOINTS) {
    console.log(`Downloading ${endpoint}...`);
    const data = await fetchData(endpoint);
    
    if (data) {
      saveData(endpoint, data);
    } else {
      console.log(`✗ Failed to download ${endpoint}`);
    }
  }
  
  console.log('\nData download complete!');
  console.log(`Files saved in: ${dataDir}`);
}

// Run the download
downloadAllData().catch(console.error); 