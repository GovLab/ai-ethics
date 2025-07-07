const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const TRANSCRIPTS_DIR = path.join(__dirname, 'transcripts');

console.log('Updating transcript references in JSON data files...');

// Function to recursively update transcript references in an object
function updateTranscriptReferences(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => updateTranscriptReferences(item));
  }

  const updated = { ...obj };

  // If this object has a lecture_transcript field with data.full_url, update it
  if (updated.lecture_transcript && updated.lecture_transcript.data && updated.lecture_transcript.data.full_url) {
    const filename = updated.lecture_transcript.filename_download || updated.lecture_transcript.filename_disk;
    if (filename) {
      // Update the full_url to point to local transcript
      updated.lecture_transcript.data.full_url = `/transcripts/${filename}`;
      updated.lecture_transcript.data.url = `/transcripts/${filename}`;
    }
  }

  // If this object has a webinar_transcript field with data.full_url, update it
  if (updated.webinar_transcript && updated.webinar_transcript.data && updated.webinar_transcript.data.full_url) {
    const filename = updated.webinar_transcript.filename_download || updated.webinar_transcript.filename_disk;
    if (filename) {
      // Update the full_url to point to local transcript
      updated.webinar_transcript.data.full_url = `/transcripts/${filename}`;
      updated.webinar_transcript.data.url = `/transcripts/${filename}`;
    }
  }

  // Recursively update nested objects
  for (const [key, value] of Object.entries(updated)) {
    if (typeof value === 'object' && value !== null) {
      updated[key] = updateTranscriptReferences(value);
    }
  }

  return updated;
}

// Process lecture.json specifically
async function updateLectureData() {
  const lecturePath = path.join(DATA_DIR, 'lecture.json');
  
  if (fs.existsSync(lecturePath)) {
    console.log('Updating lecture transcript references...');
    const lectureData = JSON.parse(fs.readFileSync(lecturePath, 'utf8'));
    
    const updatedData = updateTranscriptReferences(lectureData);
    
    // Write back the updated data
    fs.writeFileSync(lecturePath, JSON.stringify(updatedData, null, 2));
    console.log('✅ Updated lecture.json');
  }
}

// Process webinars.json specifically (if it has transcripts)
async function updateWebinarData() {
  const webinarsPath = path.join(DATA_DIR, 'webinars.json');
  
  if (fs.existsSync(webinarsPath)) {
    console.log('Updating webinar transcript references...');
    const webinarData = JSON.parse(fs.readFileSync(webinarsPath, 'utf8'));
    
    const updatedData = updateTranscriptReferences(webinarData);
    
    // Write back the updated data
    fs.writeFileSync(webinarsPath, JSON.stringify(updatedData, null, 2));
    console.log('✅ Updated webinars.json');
  }
}

async function main() {
  try {
    await updateLectureData();
    await updateWebinarData();
    
    console.log('\n✅ All transcript references updated successfully!');
    console.log('Transcript PDFs now reference local paths: /transcripts/[filename]');
    
  } catch (error) {
    console.error('Error updating transcript references:', error);
  }
}

main(); 