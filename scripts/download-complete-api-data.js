const fs = require('fs');
const path = require('path');
const https = require('https');

const API_BASE = 'https://directus.thegovlab.com/ai-ethics';
const API_TOKEN = 'your_token_here'; // You'll need to provide the actual token

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Function to make API request
function makeApiRequest(endpoint, fields = '*.*') {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/items/${endpoint}?fields=${fields}`;
    console.log(`Fetching: ${url}`);
    
    const options = {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    https.get(url, options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`JSON parse error: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Define the collections and their field expansions
const collections = {
  'lecture': {
    fields: '*.*,faculty.*,faculty.faculty_junction_id.*,readings.*,readings.reading_junction_id.*,lecture_transcript.*,icon.*'
  },
  'webinars': {
    fields: '*.*,faculty.*,faculty.faculty_junction_id.*,readings.*,readings.reading_junction_id.*,webinar_transcript.*,icon.*'
  },
  'people': {
    fields: '*.*,headshot.*'
  },
  'instructor_panel': {
    fields: '*.*,instructor_panel_people.*,instructor_panel_people.people_id.*'
  },
  'about': {
    fields: '*.*'
  },
  'alert_banner': {
    fields: '*.*'
  },
  'intro_elements': {
    fields: '*.*'
  },
  'supporters': {
    fields: '*.*'
  },
  // Junction tables
  'faculty_junction': {
    fields: '*.*'
  },
  'readings_junction': {
    fields: '*.*'
  },
  'instructor_panel_people': {
    fields: '*.*'
  }
};

async function downloadAllData() {
  console.log('Starting comprehensive API data download...\n');
  
  for (const [collectionName, config] of Object.entries(collections)) {
    try {
      console.log(`Downloading ${collectionName}...`);
      const data = await makeApiRequest(collectionName, config.fields);
      
      const filePath = path.join(dataDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      
      console.log(`✓ Downloaded ${collectionName}: ${data.data ? data.data.length : 'N/A'} items`);
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`✗ Failed to download ${collectionName}: ${error.message}`);
    }
  }
  
  console.log('\nDownload complete!');
  console.log(`Data saved in: ${dataDir}`);
}

// Run the download
downloadAllData().catch(console.error); 