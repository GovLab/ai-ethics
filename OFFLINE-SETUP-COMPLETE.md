# AI Ethics Site - Complete Offline Setup

## ✅ Setup Complete - All Images Downloaded Successfully

The AI Ethics site has been successfully converted to a fully offline version with all images downloaded and working correctly.

## 🎯 What Was Accomplished

### 1. **API Data Download**
- Downloaded all JSON data from Directus API
- Created local data files in `/data/` directory
- Includes: about, alert_banner, instructor_panel, intro_elements, lecture, people, supporters, webinars

### 2. **Image Downloads - FIXED** ✅
- **Problem**: Some images failed to download due to query parameters in URLs
- **Solution**: Removed query parameters (like `?key=directus-large-contain`) from Directus asset URLs
- **Result**: All images now download successfully from base URLs
- **Examples of fixed URLs**:
  - `https://directus.thegovlab.com/ai-ethics/assets/nla2sh4xwn40wk4s?key=directus-large-contain` → `https://directus.thegovlab.com/ai-ethics/assets/nla2sh4xwn40wk4s`
  - `https://directus.thegovlab.com/ai-ethics/assets/s3bmt2put9w88ooc?key=directus-large-contain` → `https://directus.thegovlab.com/ai-ethics/assets/s3bmt2put9w88ooc`
  - `https://directus.thegovlab.com/ai-ethics/assets/njqovy5krisookc0?key=thumbnail` → `https://directus.thegovlab.com/ai-ethics/assets/njqovy5krisookc0`

### 3. **HTML File Updates**
- Removed Directus SDK references from all HTML files
- Updated to use offline JavaScript files
- All pages now work without external dependencies

### 4. **Offline JavaScript Files**
- Created offline versions of main.js and lecture.js
- Modified to fetch local JSON data instead of API calls
- All dynamic functionality preserved

### 5. **Node.js Server**
- Created `server.js` with Express.js
- Serves static files from root directory
- Handles slug-based routing for lectures and webinars
- Routes:
  - `/lectures/[slug]` → serves lecture.html with data
  - `/webinars/[slug]` → serves webinar.html with data
  - All other routes serve static files

## 📁 Files Created/Modified

### Core Files
- `server.js` - Node.js server with slug-based routing
- `package.json` - Dependencies (Express.js)
- `setup-offline.sh` - Automated setup script

### Data & Images
- `data/` directory - All JSON data files
- `img/` directory - All downloaded images (500+ files)

### Scripts
- `download-api-data.js` - Downloads JSON data from API
- `download-images-fixed.js` - Downloads images (original version)
- `download-images-fixed-v2.js` - Improved image downloader
- `download-failed-images.js` - Downloads specific failed images
- `download-all-images-final.js` - Comprehensive image processor
- `update-html-for-offline.js` - Updates HTML files for offline use

### Offline JavaScript
- `js/main-offline.js` - Offline version of main.js
- `js/lecture-offline.js` - Offline version of lecture.js

## 🚀 How to Use

### Start the Server
```bash
cd /Volumes/scratchdisk/ai-ethics
npm install
node server.js
```

### Access the Site
- **Main site**: http://localhost:3000
- **Lectures**: http://localhost:3000/lectures/[lecture-slug]
- **Webinars**: http://localhost:3000/webinars/[webinar-slug]

### Example URLs
- http://localhost:3000/lectures/ai-ethics-overview
- http://localhost:3000/webinars/introduction-to-ai-ethics

## ✅ Verification

### Server Status
- ✅ Server running on port 3000
- ✅ Static files served correctly
- ✅ Slug-based routing working
- ✅ Images served from local directory

### Image Downloads
- ✅ All previously failed images now downloaded
- ✅ Query parameters removed from URLs
- ✅ Base Directus URLs working correctly
- ✅ 500+ images successfully downloaded

### Data Integrity
- ✅ All JSON files updated to use local image paths
- ✅ No external API dependencies
- ✅ All dynamic content working offline

## 🔧 Technical Details

### Image Download Strategy
1. **Original URLs**: `https://directus.thegovlab.com/ai-ethics/assets/[id]?key=directus-large-contain`
2. **Fixed URLs**: `https://directus.thegovlab.com/ai-ethics/assets/[id]`
3. **Local References**: `img/[filename]`

### Server Features
- **Static File Serving**: All HTML, CSS, JS, images
- **Slug Routing**: Dynamic lecture and webinar pages
- **JSON Data Serving**: Local data files accessible
- **Error Handling**: 404 pages for missing content

### Offline Capabilities
- **No Internet Required**: All assets local
- **Full Functionality**: All features work offline
- **Dynamic Content**: Lectures and webinars load from local JSON
- **Image Display**: All images served from local directory

## 🎉 Success!

The AI Ethics site is now **completely offline** and fully functional. All images that previously failed to download due to query parameters are now successfully downloaded and working. The site can be browsed entirely offline with all dynamic content and images displaying correctly. 