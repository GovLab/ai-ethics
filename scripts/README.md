# AI Ethics - Utility Scripts

This folder contains utility scripts for setting up and maintaining the offline AI Ethics site.

## 🚀 Setup Scripts

### `setup-offline.sh`
Complete automation script that runs all setup steps:
- Downloads API data
- Downloads images
- Updates HTML files for offline use
- Sets up the Node.js server

**Usage:** `./setup-offline.sh`

## 📥 Download Scripts

### `download-api-data.js`
Downloads basic API data from Directus.

### `download-enhanced-api-data.js`
Downloads complete API data with full field expansions for junction tables.

### `download-all-missing-images.js`
Comprehensive script that finds and downloads all missing images from all JSON data files.

### `download-headshots-from-people.js`
Downloads faculty headshot images using file information from people.json.

### `download-transcripts.js`
Downloads all lecture transcript PDFs.

### `download-webinar-images.js`
Downloads images specifically for webinar modules.

## 🔧 Update Scripts

### `update-html-for-offline.js`
Updates HTML files to remove Directus SDK references and use offline JavaScript.

### `update-headshot-references.js`
Updates JSON data to reference local headshot image paths instead of Directus URLs.

### `update-transcript-references.js`
Updates JSON data to reference local transcript PDF paths instead of Directus URLs.

### `fix-transcript-references.js`
Fixes transcript references to point to the correct img/ folder location.

### `fix-filename-mapping.js`
Renames downloaded files from human-readable names to UUID names to match JSON references.

## ✅ Verification Scripts

### `verify-transcripts.js`
Verifies that all PDF transcripts referenced in JSON data actually exist in the img/ folder.

## 🧪 Test Files

### `simple-test.html`
Simple test page for debugging.

### `test-lecture.html`
Test page for lecture functionality.

## 📝 Usage Notes

- Most scripts require the Directus API to be accessible
- Run scripts from the project root directory
- Check console output for success/failure messages
- Some scripts may need to be run multiple times if downloads fail

## 🔄 Maintenance

These scripts are primarily for initial setup and maintenance. For regular use, only the main server (`node server.js`) is needed. 