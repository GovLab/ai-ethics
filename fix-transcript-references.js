const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

console.log('Fixing transcript references to point to img/ folder...');

// Function to recursively update transcript references in an object
function fixTranscriptReferences(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => fixTranscriptReferences(item));
  }

  const updated = { ...obj };

  // If this object has a lecture_transcript field with data.full_url, update it
  if (updated.lecture_transcript && updated.lecture_transcript.data && updated.lecture_transcript.data.full_url) {
    const filename = updated.lecture_transcript.filename_disk; // Use the disk filename
    if (filename) {
      // Update the full_url to point to img folder
      updated.lecture_transcript.data.full_url = `/img/${filename}`;
      updated.lecture_transcript.data.url = `/img/${filename}`;
    }
  }

  // If this object has a webinar_transcript field with data.full_url, update it
  if (updated.webinar_transcript && updated.webinar_transcript.data && updated.webinar_transcript.data.full_url) {
    const filename = updated.webinar_transcript.filename_disk; // Use the disk filename
    if (filename) {
      // Update the full_url to point to img folder
      updated.webinar_transcript.data.full_url = `/img/${filename}`;
      updated.webinar_transcript.data.url = `/img/${filename}`;
    }
  }

  // Recursively update nested objects
  for (const [key, value] of Object.entries(updated)) {
    if (typeof value === 'object' && value !== null) {
      updated[key] = fixTranscriptReferences(value);
    }
  }

  return updated;
}

// Process lecture.json specifically
async function fixLectureData() {
  const lecturePath = path.join(DATA_DIR, 'lecture.json');
  
  if (fs.existsSync(lecturePath)) {
    console.log('Fixing lecture transcript references...');
    const lectureData = JSON.parse(fs.readFileSync(lecturePath, 'utf8'));
    
    const updatedData = fixTranscriptReferences(lectureData);
    
    // Write back the updated data
    fs.writeFileSync(lecturePath, JSON.stringify(updatedData, null, 2));
    console.log('✅ Fixed lecture.json');
  }
}

// Process webinars.json specifically (if it has transcripts)
async function fixWebinarData() {
  const webinarsPath = path.join(DATA_DIR, 'webinars.json');
  
  if (fs.existsSync(webinarsPath)) {
    console.log('Fixing webinar transcript references...');
    const webinarData = JSON.parse(fs.readFileSync(webinarsPath, 'utf8'));
    
    const updatedData = fixTranscriptReferences(webinarData);
    
    // Write back the updated data
    fs.writeFileSync(webinarsPath, JSON.stringify(updatedData, null, 2));
    console.log('✅ Fixed webinars.json');
  }
}

async function main() {
  try {
    await fixLectureData();
    await fixWebinarData();
    
    console.log('\n✅ All transcript references fixed!');
    console.log('Transcript PDFs now reference correct paths: /img/[filename]');
    
  } catch (error) {
    console.error('Error fixing transcript references:', error);
  }
}

main(); 