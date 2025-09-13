#!/bin/bash

echo "🚀 Deploying with sample data..."

# Export local data
echo "📊 Exporting local data..."
node export-data.js

# Add all files except sample-data.json
echo "📁 Adding files to git..."
git add .
git reset HEAD sample-data.json

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy with data population script"

# Push to GitHub
echo "🌐 Pushing to GitHub..."
git push origin main

echo "✅ Code pushed to GitHub!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Render dashboard"
echo "2. In the Environment tab, add this environment variable:"
echo "   SAMPLE_DATA_URL=https://raw.githubusercontent.com/raghadsh/ai-core-feature-management/main/sample-data.json"
echo "3. Or manually upload sample-data.json to your Render service"
echo ""
echo "🎉 Your app will be populated with your local data!"
