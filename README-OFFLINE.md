# AI Ethics: Global Perspectives - Offline Version

This is the offline version of the AI Ethics course website. All content is served from local JSON files and images, with no external API dependencies.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Download data and images:**
   ```bash
   npm run setup-offline
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Visit the site:**
   - Homepage: http://localhost:3000
   - Webinars: http://localhost:3000/webinars/[slug]
   - Lectures: http://localhost:3000/lectures/[slug]

## Manual Setup Steps

### 1. Download API Data
```bash
node download-api-data.js
```
This downloads all content from the Directus API and saves it as JSON files in the `data/` directory.

### 2. Download Images
```bash
node download-images.js
```
This downloads all images referenced in the JSON data and updates the JSON files to reference local image paths.

### 3. Update HTML Files
```bash
node update-html-for-offline.js
```
This removes Directus SDK references and updates script references to use offline versions.

### 4. Start the Server
```bash
node server.js
```

## File Structure

```
ai-ethics/
├── data/                    # Local JSON data files
│   ├── intro_elements.json
│   ├── webinars.json
│   ├── lecture.json
│   ├── about.json
│   ├── instructor_panel.json
│   ├── people.json
│   ├── alert_banner.json
│   └── supporters.json
├── img/                     # Local images
├── js/                      # JavaScript files
│   ├── ai-ethics-offline.js
│   ├── ai-ethics-webinar-offline.js
│   └── lecture-offline.js
├── webinars/
│   └── index.html          # Slug-based webinar pages
├── lectures/
│   └── index.html          # Slug-based lecture pages
├── server.js               # Node.js static server
├── download-api-data.js    # Script to download API data
├── download-images.js      # Script to download images
└── update-html-for-offline.js # Script to update HTML files
```

## Slug-Based Routing

The server handles slug-based routing for dynamic content:

- **Webinars:** `/webinars/[slug]` → serves `webinars/index.html`
- **Lectures:** `/lectures/[slug]` → serves `lectures/index.html`

The JavaScript files filter the local JSON data based on the slug in the URL.

## Offline Features

- ✅ All content served from local JSON files
- ✅ All images served from local `img/` directory
- ✅ No external API dependencies
- ✅ Slug-based routing for dynamic pages
- ✅ Static file serving with proper MIME types
- ✅ Works completely offline

## Troubleshooting

### Images not loading
- Check that `download-images.js` completed successfully
- Verify images exist in the `img/` directory
- Check that JSON files reference local image paths

### Pages not found
- Ensure the server is running on the correct port
- Check that HTML files exist in the expected locations
- Verify slug-based routing is working correctly

### Data not loading
- Check that `download-api-data.js` completed successfully
- Verify JSON files exist in the `data/` directory
- Check browser console for fetch errors

## Development

To make changes to the offline version:

1. Update the JSON files in `data/` directory
2. Add new images to `img/` directory
3. Update HTML files as needed
4. Restart the server

## Deployment

The offline version can be deployed to any static hosting service:

1. Run `npm run setup-offline` to prepare all files
2. Upload all files to your hosting service
3. Configure your hosting service to serve `index.html` for all routes (SPA routing)

For Netlify, add a `_redirects` file:
```
/*    /index.html   200
``` 