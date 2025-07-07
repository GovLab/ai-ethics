# AI Ethics: Global Perspectives - Offline Version

A fully offline version of the AI Ethics course website with all content, images, and transcripts downloaded locally.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   node server.js
   ```

3. **Visit the site:**
   - Main site: http://localhost:3000
   - Lectures: http://localhost:3000/lectures/[slug]
   - Webinars: http://localhost:3000/webinars/[slug]

## 📁 Project Structure

```
ai-ethics/
├── README.md                 # This file
├── server.js                 # Node.js static server
├── package.json              # Dependencies
├── index.html               # Main homepage
├── lecture.html             # Lecture template
├── webinar.html             # Webinar template
├── instructor-panels.html   # Instructor panels page
├── css/                     # Stylesheets
│   └── styles.css
├── js/                      # JavaScript files
│   ├── ai-ethics-offline.js
│   ├── lecture-offline.js
│   └── ai-ethics-webinar-offline.js
├── data/                    # JSON data files
│   ├── lecture.json
│   ├── webinars.json
│   ├── people.json
│   └── ...
├── images/                  # All images (headshots, icons, etc.)
├── img/                     # PDF transcripts and other assets
├── lectures/                # Lecture pages
│   └── index.html
├── webinars/                # Webinar pages
│   └── index.html
└── scripts/                 # Setup and utility scripts
    ├── setup-offline.sh
    ├── download-*.js
    ├── update-*.js
    └── ...
```

## 🎯 Features

- ✅ **Fully Offline** - No internet connection required
- ✅ **Complete Content** - All 63 lectures with transcripts
- ✅ **All Images** - 223 images including faculty headshots
- ✅ **Slug-based Routing** - Dynamic lecture and webinar pages
- ✅ **Material Icons** - Properly loaded and working
- ✅ **PDF Transcripts** - All lecture transcripts available

## 📊 Content Summary

- **Lectures:** 63 modules with full transcripts
- **Webinars:** 5 webinar series
- **Faculty:** 69 instructors with headshots
- **Images:** 223 total images
- **Transcripts:** 63 PDF files

## 🔧 Server Features

- Static file serving
- Slug-based routing for lectures and webinars
- Proper MIME type support (HTML, CSS, JS, JSON, images, PDFs)
- CORS headers for local development

## 🛠️ Development

### Adding New Content

1. Update the JSON data files in `/data/`
2. Add corresponding images to `/images/` or `/img/`
3. Restart the server

### Modifying Styles

Edit `/css/styles.css` for styling changes.

### Updating JavaScript

- `/js/ai-ethics-offline.js` - Main site functionality
- `/js/lecture-offline.js` - Lecture page functionality
- `/js/ai-ethics-webinar-offline.js` - Webinar page functionality

## 📝 Scripts (in `/scripts/` folder)

The following utility scripts are available for maintenance:

- `setup-offline.sh` - Complete setup automation
- `download-*.js` - API data and image downloaders
- `update-*.js` - Data reference updaters
- `fix-*.js` - File mapping and reference fixes
- `verify-*.js` - Content verification scripts

## 🌐 Deployment

This site can be deployed to any static hosting service:

- **Netlify:** Upload all files (except `/scripts/`)
- **Vercel:** Connect repository and deploy
- **GitHub Pages:** Push to repository and enable Pages

## 📄 License

This work is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License.

## 🤝 Contributing

For content updates or bug fixes, please:
1. Update the relevant JSON data files
2. Add any new images to the appropriate folders
3. Test locally with `node server.js`
4. Deploy to your hosting platform

---

**Original Course:** AI Ethics: Global Perspectives  
**Institution:** TUM Institute for Ethics in Artificial Intelligence (IEAI)  
**Website:** https://aiethicscourse.org/
