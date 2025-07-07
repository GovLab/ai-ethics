const fs = require('fs');
const path = require('path');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// API configuration
const API_BASE = 'https://directus.thegovlab.com/ai-ethics';

// Enhanced endpoints with proper field expansion
const API_ENDPOINTS = {
  'intro_elements': {
    fields: '*.*'
  },
  'webinars': {
    fields: '*.*,faculty.*,faculty.faculty_junction_id.*,faculty.faculty_junction_id.headshot.*,readings.*,readings.reading_junction_id.*,webinar_transcript.*,icon.*'
  },
  'lecture': {
    fields: '*.*,faculty.*,faculty.faculty_junction_id.*,faculty.faculty_junction_id.headshot.*,readings.*,readings.reading_junction_id.*,lecture_transcript.*,icon.*'
  },
  'about': {
    fields: '*.*'
  },
  'instructor_panel': {
    fields: '*.*,instructor_panel_people.*,instructor_panel_people.people_id.*,instructor_panel_people.people_id.headshot.*'
  },
  'people': {
    fields: '*.*,headshot.*'
  },
  'alert_banner': {
    fields: '*.*'
  },
  'supporters': {
    fields: '*.*'
  },
  // Junction tables - these are crucial for the relationships
  'faculty_junction': {
    fields: '*.*,headshot.*'
  },
  'readings_junction': {
    fields: '*.*'
  },
  'instructor_panel_people': {
    fields: '*.*'
  }
};

// Function to fetch data from Directus API with enhanced fields
async function fetchData(endpoint, fields) {
  const url = `${API_BASE}/items/${endpoint}?fields=${fields}`;
  console.log(`Fetching: ${url}`);
  
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
  console.log(`✓ Saved ${endpoint}.json (${data.data ? data.data.length : 'N/A'} items)`);
}

// Main function to download all data
async function downloadAllData() {
  console.log('Starting enhanced data download from Directus API...\n');
  console.log('This will download all data with proper relationship expansion including junction tables.\n');
  
  for (const [endpoint, config] of Object.entries(API_ENDPOINTS)) {
    console.log(`Downloading ${endpoint}...`);
    const data = await fetchData(endpoint, config.fields);
    
    if (data) {
      saveData(endpoint, data);
    } else {
      console.log(`✗ Failed to download ${endpoint}`);
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\nEnhanced data download complete!');
  console.log(`Files saved in: ${dataDir}`);
  console.log('\nThis includes:');
  console.log('- All main collections with expanded relationships');
  console.log('- Junction tables (faculty_junction, readings_junction, instructor_panel_people)');
  console.log('- Proper field expansion for many-to-many relationships');
}

// Run the download
downloadAllData().catch(console.error); 