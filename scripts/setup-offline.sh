#!/bin/bash

echo "🚀 Setting up AI Ethics site for offline use..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "📥 Downloading API data..."
node download-api-data.js

echo ""
echo "🖼️  Downloading images..."
node download-images.js

echo ""
echo "🔧 Updating HTML files for offline use..."
node update-html-for-offline.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 To start the server, run:"
echo "   npm start"
echo ""
echo "📱 Then visit:"
echo "   http://localhost:3000"
echo ""
echo "🎯 Slug-based pages:"
echo "   http://localhost:3000/webinars/[slug]"
echo "   http://localhost:3000/lectures/[slug]" 