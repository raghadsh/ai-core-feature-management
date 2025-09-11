# AI Core Feature Management System

A comprehensive feature management system built with Node.js, SQLite, and Tailwind CSS. This system allows users to submit feature requests, vote on features, and track development progress through a transparent roadmap.

## 🎨 Color Palette

The system uses a beautiful custom color palette:
- **Thistle**: `#C7BFD0` - Soft purple for accents
- **Seasalt**: `#FAFAFA` - Clean white for backgrounds
- **Tekhelet**: `#5F1796` - Deep purple for primary actions
- **Silver**: `#B5B6B8` - Neutral gray for text

## 🚀 Features

### For Users
- ✅ Submit feature requests
- ✅ Vote on existing features
- ✅ View transparent roadmap
- ✅ Track feature status
- ✅ Beautiful, responsive UI

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/ai-core-features.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your repository
   - Deploy!

### Deploy to Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

### Deploy to Render

1. **Connect GitHub repository**
2. **Set build command**: `npm install`
3. **Set start command**: `node server.js`
4. **Deploy!**

### For Admins
- ✅ Update feature status
- ✅ Add admin features directly
- ✅ Full CRUD operations
- ✅ Real-time statistics

### Feature Statuses
- 💡 **Requested** - User-submitted requests
- 🗓️ **In Roadmap** - Planned for future development
- 👀 **We're Watching** - Under consideration
- ⚡ **In Progress** - Currently being developed
- 🚀 **Shipped** - Completed features

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database
- **CORS** - Cross-origin resource sharing
- **Body Parser** - Request parsing

### Frontend
- **HTML5** - Markup
- **Tailwind CSS** - Styling framework
- **Vanilla JavaScript** - No frameworks, pure JS
- **Custom Color Palette** - Beautiful design system

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd featurs_vote
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **For development (with auto-restart)**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🗄️ Database

The system uses SQLite for data persistence with two main tables:

### Features Table
- `id` - Primary key
- `title` - Feature title
- `description` - Feature description
- `votes` - Vote count
- `status` - Current status
- `added_by` - User or admin
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Votes Table
- `id` - Primary key
- `feature_id` - Foreign key to features
- `user_id` - Unique user identifier
- `created_at` - Vote timestamp

## 🔌 API Endpoints

### Features
- `GET /api/features` - Get all features
- `GET /api/features/status/:status` - Get features by status
- `GET /api/features/stats` - Get feature statistics
- `POST /api/features` - Create new feature
- `PUT /api/features/:id/status` - Update feature status
- `POST /api/features/:id/vote` - Vote on feature
- `DELETE /api/features/:id` - Delete feature

## 🎯 Usage

### Adding Features
1. Fill out the "Add New Feature" form in the sidebar
2. Click "Add Feature" to submit
3. Feature will appear in the "Requested" status

### Voting
1. Click the up arrow (↑) button next to any feature
2. Your vote will be counted and the button will highlight
3. Click again to remove your vote

### Admin Functions
1. Click the "🔧 Admin" button in the top-left
2. Switch to admin mode
3. Use the admin panel to update feature statuses
4. Add admin features directly with predefined status

### Roadmap View
1. Click "🗺️ Roadmap" in the navigation
2. View features organized by status
3. See statistics and progress tracking

## 🎨 Design Features

- **Glass Morphism** - Beautiful translucent effects
- **Floating Particles** - Animated background elements
- **Gradient Backgrounds** - Smooth color transitions
- **Responsive Design** - Works on all screen sizes
- **Dark Theme** - Easy on the eyes
- **Smooth Animations** - Polished user experience

## 🔧 Configuration

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## 📱 Mobile Support

The system is fully responsive and works great on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Variables
- `PORT` - Server port (default: 3000)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🎉 Features in Action

- **Real-time Updates** - All changes reflect immediately
- **Persistent Storage** - Data survives server restarts
- **User Management** - Unique user identification
- **Admin Controls** - Full feature management
- **Beautiful UI** - Modern, professional design
- **Fast Performance** - Optimized for speed

---

Built with ❤️ for AI Core
