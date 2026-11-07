const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// MIME types for proper file serving
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf'
};

// Middleware to set proper MIME types
app.use((req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  if (mimeTypes[ext]) {
    res.setHeader('Content-Type', mimeTypes[ext]);
  }
  next();
});

// Handle slug-based routing for webinars
app.get('/webinars/:slug', (req, res) => {
  // Check if there's a webinar.html in root, otherwise use webinars/index.html
  const webinarPath = path.join(__dirname, 'webinar.html');
  const indexPath = path.join(__dirname, 'webinars', 'index.html');
  
  if (fs.existsSync(webinarPath)) {
    res.sendFile(webinarPath);
  } else if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Webinar not found');
  }
});

// Handle slug-based routing for lectures
app.get('/lectures/:slug', (req, res) => {
  // Check if there's a lecture.html in root, otherwise use lectures/index.html
  const lecturePath = path.join(__dirname, 'lecture.html');
  const indexPath = path.join(__dirname, 'lectures', 'index.html');
  
  if (fs.existsSync(lecturePath)) {
    res.sendFile(lecturePath);
  } else if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Lecture not found');
  }
});

// Serve root index.html for the homepage
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Homepage not found');
  }
});

// Handle other HTML pages
app.get('/:page.html', (req, res) => {
  const pagePath = path.join(__dirname, req.params.page + '.html');
  if (fs.existsSync(pagePath)) {
    res.sendFile(pagePath);
  } else {
    res.status(404).send('Page not found');
  }
});

// Fallback for any other requests - serve static files
app.use((req, res) => {
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

app.listen(PORT, () => {
  console.log(`AI Ethics server running on http://localhost:${PORT}`);
  console.log(`Webinar pages: http://localhost:${PORT}/webinars/[slug]`);
  console.log(`Lecture pages: http://localhost:${PORT}/lectures/[slug]`);
}); 