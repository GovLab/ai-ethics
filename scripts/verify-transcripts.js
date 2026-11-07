const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const IMG_DIR = path.join(__dirname, 'img');

console.log('Verifying all transcript PDFs exist in img/ folder...');

// Load lecture data
const lectureDataPath = path.join(DATA_DIR, 'lecture.json');
if (!fs.existsSync(lectureDataPath)) {
  console.error('❌ lecture.json not found.');
  process.exit(1);
}

const lectureData = JSON.parse(fs.readFileSync(lectureDataPath, 'utf8'));

let totalTranscripts = 0;
let existingTranscripts = 0;
let missingTranscripts = [];
let extraTranscripts = [];

// Check each lecture for transcripts
for (const lecture of lectureData.data) {
  if (lecture.lecture_transcript) {
    totalTranscripts++;
    const filename = lecture.lecture_transcript.filename_disk;
    const filePath = path.join(IMG_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      existingTranscripts++;
      console.log(`✅ ${lecture.title}: ${filename}`);
    } else {
      missingTranscripts.push({
        title: lecture.title,
        filename: filename
      });
      console.log(`❌ ${lecture.title}: ${filename} - MISSING`);
    }
  } else {
    console.log(`⚠️  ${lecture.title}: No transcript`);
  }
}

// Check for extra PDFs in img folder that aren't referenced
const jsonFilenames = new Set();
lectureData.data.forEach(lecture => {
  if (lecture.lecture_transcript) {
    jsonFilenames.add(lecture.lecture_transcript.filename_disk);
  }
});

const imgFiles = fs.readdirSync(IMG_DIR).filter(file => file.endsWith('.pdf'));
imgFiles.forEach(filename => {
  if (!jsonFilenames.has(filename)) {
    extraTranscripts.push(filename);
  }
});

console.log('\n=== Verification Summary ===');
console.log(`📊 Total lectures with transcripts in JSON: ${totalTranscripts}`);
console.log(`✅ Existing PDFs in img/ folder: ${existingTranscripts}`);
console.log(`❌ Missing PDFs: ${missingTranscripts.length}`);
console.log(`📁 Extra PDFs in img/ folder: ${extraTranscripts.length}`);

if (missingTranscripts.length > 0) {
  console.log('\n❌ Missing transcripts:');
  missingTranscripts.forEach(item => {
    console.log(`  - ${item.title}: ${item.filename}`);
  });
}

if (extraTranscripts.length > 0) {
  console.log('\n📁 Extra PDFs in img/ folder (not referenced in JSON):');
  extraTranscripts.forEach(filename => {
    console.log(`  - ${filename}`);
  });
}

if (missingTranscripts.length === 0 && extraTranscripts.length === 0) {
  console.log('\n🎉 Perfect! All transcript PDFs are present and accounted for.');
} else if (missingTranscripts.length === 0) {
  console.log('\n✅ All referenced transcripts exist, but there are some extra PDFs.');
} else {
  console.log('\n⚠️  Some transcripts are missing and need to be downloaded.');
} 