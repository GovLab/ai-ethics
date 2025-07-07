const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DATA_DIR = path.join(__dirname, 'data');
const TRANSCRIPTS_DIR = path.join(__dirname, 'transcripts');

// Ensure transcripts directory exists
if (!fs.existsSync(TRANSCRIPTS_DIR)) {
  fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
}

// Load lecture data
const lectureDataPath = path.join(DATA_DIR, 'lecture.json');
if (!fs.existsSync(lectureDataPath)) {
  console.error('❌ lecture.json not found. Please run download-enhanced-api-data.js first.');
  process.exit(1);
}

const lectureData = JSON.parse(fs.readFileSync(lectureDataPath, 'utf8'));

console.log('Starting lecture transcript download...');
console.log(`Found ${lectureData.data.length} lectures`);

let downloadedCount = 0;
let failedCount = 0;
const failedDownloads = [];

async function downloadTranscript(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }

      const filePath = path.join(TRANSCRIPTS_DIR, filename);
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

async function processLectures() {
  for (const lecture of lectureData.data) {
    if (!lecture.lecture_transcript) {
      console.log(`⚠️  No transcript for lecture: ${lecture.title}`);
      continue;
    }

    const transcript = lecture.lecture_transcript;
    const filename = transcript.filename_download || transcript.filename_disk;
    const fullUrl = transcript.data?.full_url;

    if (!fullUrl) {
      console.log(`⚠️  No URL for transcript of lecture: ${lecture.title}`);
      continue;
    }

    try {
      console.log(`📥 Downloading transcript for: ${lecture.title}...`);
      await downloadTranscript(fullUrl, filename);
      console.log(`✅ Downloaded: ${filename}`);
      downloadedCount++;
    } catch (error) {
      console.log(`❌ Failed to download transcript for ${lecture.title}: ${error.message}`);
      failedCount++;
      failedDownloads.push({
        title: lecture.title,
        url: fullUrl,
        filename: filename,
        error: error.message
      });
    }
  }
}

async function main() {
  try {
    await processLectures();
    
    console.log('\n=== Download Summary ===');
    console.log(`✅ Successfully downloaded: ${downloadedCount} transcripts`);
    console.log(`❌ Failed downloads: ${failedCount}`);
    
    if (failedDownloads.length > 0) {
      console.log('\nFailed downloads:');
      failedDownloads.forEach(item => {
        console.log(`  - ${item.title}: ${item.error}`);
      });
    }
    
    console.log(`\nTranscripts saved in: ${TRANSCRIPTS_DIR}`);
    
  } catch (error) {
    console.error('Error during download:', error);
  }
}

main(); 