const fs = require('fs');
const path = require('path');

// HTML files to update
const htmlFiles = [
  'index.html',
  'webinars/index.html',
  'lectures/index.html',
  'modules.html',
  'instructors.html',
  'instructor-panels.html',
  'partners.html',
  'contact.html',
  'suggest.html',
  'thankyou.html',
  'webinar-series.html'
];

// Function to update HTML file
function updateHtmlFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Remove Directus SDK script
  const directusPattern = /<script src="https:\/\/unpkg\.com\/@directus\/sdk-js@[^"]*"><\/script>/g;
  if (directusPattern.test(content)) {
    content = content.replace(directusPattern, '');
    updated = true;
    console.log(`✓ Removed Directus SDK from ${filePath}`);
  }

  // Update script references to offline versions
  const scriptUpdates = [
    { from: 'js/ai-ethics.js', to: 'js/ai-ethics-offline.js' },
    { from: 'js/ai-ethics-webinar.js', to: 'js/ai-ethics-webinar-offline.js' },
    { from: 'js/lecture.js', to: 'js/lecture-offline.js' },
    { from: '../js/ai-ethics.js', to: '../js/ai-ethics-offline.js' },
    { from: '../js/ai-ethics-webinar.js', to: '../js/ai-ethics-webinar-offline.js' },
    { from: '../js/lecture.js', to: '../js/lecture-offline.js' }
  ];

  for (const update of scriptUpdates) {
    if (content.includes(update.from)) {
      content = content.replace(new RegExp(update.from, 'g'), update.to);
      updated = true;
      console.log(`✓ Updated script reference in ${filePath}: ${update.from} → ${update.to}`);
    }
  }

  // Update image references to be relative
  const imageUpdates = [
    { from: 'https://aiethicscourse.org/img/', to: 'img/' },
    { from: 'https://aiethicscourse.org/img/', to: '../img/' }
  ];

  for (const update of imageUpdates) {
    if (content.includes(update.from)) {
      content = content.replace(new RegExp(update.from, 'g'), update.to);
      updated = true;
      console.log(`✓ Updated image reference in ${filePath}: ${update.from} → ${update.to}`);
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated ${filePath}`);
  } else {
    console.log(`- No changes needed for ${filePath}`);
  }
}

// Main function to update all HTML files
function updateAllHtmlFiles() {
  console.log('Updating HTML files for offline use...\n');
  
  for (const htmlFile of htmlFiles) {
    updateHtmlFile(htmlFile);
  }
  
  console.log('\nHTML files updated successfully!');
}

// Run the update
updateAllHtmlFiles(); 