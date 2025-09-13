#!/bin/bash

echo "🚀 Preparing for Render deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Add all files
echo "📁 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy to Render - $(date)"

# Check if remote exists
if ! git remote | grep -q origin; then
    echo "⚠️  No remote origin found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    echo "   git push -u origin main"
    exit 1
fi

# Push to GitHub
echo "🌐 Pushing to GitHub..."
git push origin main

echo "✅ Code pushed to GitHub!"
echo "📋 Next steps:"
echo "   1. Go to https://render.com"
echo "   2. Sign up/login with GitHub"
echo "   3. Click 'New +' → 'Web Service'"
echo "   4. Select your repository"
echo "   5. Use these settings:"
echo "      - Build Command: npm install"
echo "      - Start Command: npm start"
echo "      - Plan: Free"
echo "   6. Click 'Create Web Service'"
echo ""
echo "🎉 Your app will be available at: https://YOUR_APP_NAME.onrender.com"
