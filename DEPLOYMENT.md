# Deploy to Render

## Prerequisites
1. GitHub account
2. Render account (free at render.com)
3. Your code pushed to GitHub

## Steps to Deploy

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Deploy on Render

1. **Go to Render.com** and sign up/login
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `ai-core-feature-management`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

5. **Click "Create Web Service"**

### 3. Environment Variables (Optional)
If you need any environment variables, add them in the Render dashboard under "Environment" tab.

### 4. Access Your App
Once deployed, Render will give you a URL like:
`https://ai-core-feature-management.onrender.com`

## Features Included
- ✅ Public feature voting
- ✅ Admin panel for feature management
- ✅ CoE board for internal work items
- ✅ Cohere collaboration items
- ✅ Card conversion functionality
- ✅ SQLite database (persistent on Render)

## Notes
- **Free tier**: App sleeps after 15 minutes of inactivity
- **Database**: SQLite file is persistent across deployments
- **Custom domain**: Available on paid plans
- **Auto-deploy**: Enabled by default (deploys on every push to main branch)
