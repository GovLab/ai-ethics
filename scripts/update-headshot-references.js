const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const IMAGES_DIR = path.join(__dirname, 'images');

console.log('Updating headshot references in JSON data files...');

// Function to recursively update headshot references in an object
function updateHeadshotReferences(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => updateHeadshotReferences(item));
  }

  const updated = { ...obj };

  // If this object has a headshot field with data.full_url, update it
  if (updated.headshot && updated.headshot.data && updated.headshot.data.full_url) {
    const filename = updated.headshot.filename_download || updated.headshot.filename_disk;
    if (filename) {
      // Update the full_url to point to local image
      updated.headshot.data.full_url = `/images/${filename}`;
      updated.headshot.data.url = `/images/${filename}`;
      
      // Also update thumbnail URLs to point to local image
      if (updated.headshot.data.thumbnails) {
        updated.headshot.data.thumbnails.forEach(thumb => {
          thumb.url = `/images/${filename}`;
          thumb.relative_url = `/images/${filename}`;
        });
      }
    }
  }

  // Recursively update nested objects
  for (const [key, value] of Object.entries(updated)) {
    if (typeof value === 'object' && value !== null) {
      updated[key] = updateHeadshotReferences(value);
    }
  }

  return updated;
}

// Process all JSON files in the data directory
async function updateAllFiles() {
  const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
  
  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    console.log(`Processing ${file}...`);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const updatedData = updateHeadshotReferences(data);
      
      // Write back the updated data
      fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
      console.log(`✅ Updated ${file}`);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
}

// Also update the lecture and webinar data to reference local headshot paths
async function updateLectureWebinarData() {
  const lecturePath = path.join(DATA_DIR, 'lecture.json');
  const webinarsPath = path.join(DATA_DIR, 'webinars.json');
  
  // Update lecture data
  if (fs.existsSync(lecturePath)) {
    console.log('Updating lecture data headshot references...');
    const lectureData = JSON.parse(fs.readFileSync(lecturePath, 'utf8'));
    
    // Update faculty headshot references in lectures
    lectureData.data.forEach(lecture => {
      if (lecture.faculty) {
        lecture.faculty.forEach(facultyMember => {
          if (facultyMember.faculty_junction_id && facultyMember.faculty_junction_id.headshot) {
            const headshot = facultyMember.faculty_junction_id.headshot;
            const filename = headshot.filename_download || headshot.filename_disk;
            if (filename) {
              headshot.data.full_url = `/images/${filename}`;
              headshot.data.url = `/images/${filename}`;
            }
          }
        });
      }
    });
    
    fs.writeFileSync(lecturePath, JSON.stringify(lectureData, null, 2));
    console.log('✅ Updated lecture.json');
  }
  
  // Update webinar data (if it exists)
  if (fs.existsSync(webinarsPath)) {
    console.log('Updating webinar data headshot references...');
    const webinarData = JSON.parse(fs.readFileSync(webinarsPath, 'utf8'));
    
    // Update faculty headshot references in webinars
    webinarData.data.forEach(webinar => {
      if (webinar.faculty) {
        webinar.faculty.forEach(facultyMember => {
          if (facultyMember.faculty_junction_id && facultyMember.faculty_junction_id.headshot) {
            const headshot = facultyMember.faculty_junction_id.headshot;
            const filename = headshot.filename_download || headshot.filename_disk;
            if (filename) {
              headshot.data.full_url = `/images/${filename}`;
              headshot.data.url = `/images/${filename}`;
            }
          }
        });
      }
    });
    
    fs.writeFileSync(webinarsPath, JSON.stringify(webinarData, null, 2));
    console.log('✅ Updated webinars.json');
  }
}

async function main() {
  try {
    await updateAllFiles();
    await updateLectureWebinarData();
    
    console.log('\n✅ All headshot references updated successfully!');
    console.log('Headshot images now reference local paths: /images/[filename]');
    
  } catch (error) {
    console.error('Error updating headshot references:', error);
  }
}

main(); 