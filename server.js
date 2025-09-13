const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Blog routes
app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog', 'index.html'));
});

app.get('/blog/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog-viewer.html'));
});

app.get('/blog/:slug.mdx', (req, res) => {
    const slug = req.params.slug;
    const filePath = path.join(__dirname, 'public', 'blog', `${slug}.mdx`);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Blog post not found');
    }
});

// Session middleware
app.use(session({
    secret: 'ai-core-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Simple authentication middleware
function requireAuth(req, res, next) {
    // Check if user is authenticated via session
    if (req.session && req.session.authenticated) {
        return next();
    }
    
    // Check for Basic Auth header (for initial login)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        // Redirect to custom login page instead of showing browser dialog
        return res.redirect('/login');
    }
    
    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    
    // Simple hardcoded credentials (you can change these)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aicore2024';
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Set session as authenticated
        req.session.authenticated = true;
        req.session.username = username;
        next();
    } else {
        // Redirect to custom login page instead of showing browser dialog
        return res.redirect('/login');
    }
}

// Login route
app.get('/login', (req, res) => {
    // If already authenticated, redirect to admin
    if (req.session && req.session.authenticated) {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login API endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Simple hardcoded credentials (you can change these)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aicore2024';
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Set session as authenticated
        req.session.authenticated = true;
        req.session.username = username;
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

// Admin route
app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// CoE route
app.get('/coe', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'coe.html'));
});

// Database setup - use persistent path for Render
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/features.db'  // Use /tmp directory which persists on Render
    : './features.db';    // Local development

// Ensure the directory exists for production
if (process.env.NODE_ENV === 'production') {
    const fs = require('fs');
    const path = require('path');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        console.log('Database path:', dbPath);
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    // Create all tables first
    db.run(`
        CREATE TABLE IF NOT EXISTS features (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            votes INTEGER DEFAULT 0,
            status TEXT DEFAULT 'requested',
            added_by TEXT DEFAULT 'user',
            ai_core_comment TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feature_id INTEGER,
            user_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (feature_id) REFERENCES features (id),
            UNIQUE(feature_id, user_id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS internal_work_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT DEFAULT 'medium',
            impact TEXT DEFAULT 'medium',
            timeline TEXT,
            target_date TEXT,
            status TEXT DEFAULT 'research',
            meeting_discussion INTEGER DEFAULT 0,
            updates TEXT DEFAULT '',
            link TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS cohere_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            status TEXT NOT NULL,
            link TEXT,
            target_date TEXT,
            meeting_discussion INTEGER DEFAULT 0,
            updates TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ Database tables created successfully');
    
    // Populate with sample data if available
    setTimeout(() => {
        const { exec } = require('child_process');
        exec('node populate-database.js', (error, stdout, stderr) => {
            if (error) {
                console.log('No sample data to populate or error:', error.message);
                return;
            }
            console.log(stdout);
        });
    }, 2000); // Wait 2 seconds for tables to be fully created
}

// API Routes

// Get all features
app.get('/api/features', (req, res) => {
    const { sort = 'votes', status } = req.query;
    
    let query = `
        SELECT f.id, f.title, f.description, f.votes, f.status, f.added_by, f.created_at, f.updated_at, f.ai_core_comment,
               COUNT(v.id) as vote_count,
               GROUP_CONCAT(v.user_id) as voted_by
        FROM features f
        LEFT JOIN votes v ON f.id = v.feature_id
    `;
    
    const params = [];
    
    if (status) {
        query += ' WHERE f.status = ?';
        params.push(status);
    }
    
    query += ' GROUP BY f.id';
    
    switch (sort) {
        case 'votes':
            query += ' ORDER BY vote_count DESC, f.created_at DESC';
            break;
        case 'newest':
            query += ' ORDER BY f.created_at DESC';
            break;
        case 'oldest':
            query += ' ORDER BY f.created_at ASC';
            break;
        default:
            query += ' ORDER BY vote_count DESC';
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const features = rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            votes: row.vote_count || 0,
            votedBy: row.voted_by ? row.voted_by.split(',') : [],
            status: row.status,
            addedBy: row.added_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            ai_core_comment: row.ai_core_comment || ''
        }));
        
        res.json(features);
    });
});

// Get features by status
app.get('/api/features/status/:status', (req, res) => {
    const { status } = req.params;
    
    const query = `
        SELECT f.*, 
               COUNT(v.id) as vote_count,
               GROUP_CONCAT(v.user_id) as voted_by
        FROM features f
        LEFT JOIN votes v ON f.id = v.feature_id
        WHERE f.status = ?
        GROUP BY f.id
        ORDER BY vote_count DESC, f.created_at DESC
    `;
    
    db.all(query, [status], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const features = rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            votes: row.vote_count || 0,
            votedBy: row.voted_by ? row.voted_by.split(',') : [],
            status: row.status,
            addedBy: row.added_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            ai_core_comment: row.ai_core_comment || ''
        }));
        
        res.json(features);
    });
});

// Get feature statistics
app.get('/api/features/stats', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
            SUM(CASE WHEN status = 'progress' THEN 1 ELSE 0 END) as progress,
            SUM(CASE WHEN status = 'roadmap' THEN 1 ELSE 0 END) as roadmap,
            SUM(CASE WHEN status = 'watching' THEN 1 ELSE 0 END) as watching,
            SUM(CASE WHEN status = 'requested' THEN 1 ELSE 0 END) as requested
        FROM features
    `;
    
    db.get(query, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        res.json({
            total: row.total,
            shipped: row.shipped,
            progress: row.progress,
            roadmap: row.roadmap,
            watching: row.watching,
            requested: row.requested
        });
    });
});

// Create a new feature (admin only)
app.post('/api/features', requireAuth, (req, res) => {
    const { title, description = 'No additional details provided', status = 'requested', addedBy = 'user' } = req.body;
    
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }
    
    const query = `
        INSERT INTO features (title, description, status, added_by)
        VALUES (?, ?, ?, ?)
    `;
    
    db.run(query, [title, description, status, addedBy], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        res.json({
            id: this.lastID,
            title,
            description,
            votes: 0,
            votedBy: [],
            status,
            addedBy,
            createdAt: new Date().toISOString()
        });
    });
});

// Update feature (admin only)
app.put('/api/features/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { title, description, status, ai_core_comment } = req.body;
    
    let query, params;
    
    if (title && description && status) {
        // Update all fields
        query = `
            UPDATE features 
            SET title = ?, description = ?, status = ?, ai_core_comment = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        params = [title, description, status, ai_core_comment || '', id];
    } else if (status) {
        // Update only status
        query = `
            UPDATE features 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        params = [status, id];
    } else {
        return res.status(400).json({ error: 'At least one field (title, description, or status) is required' });
    }
    
    db.run(query, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Feature not found' });
        }
        
        res.json({ 
            message: 'Feature updated successfully',
            changes: this.changes 
        });
    });
});

// Update feature status (admin only)
app.put('/api/features/:id/status', requireAuth, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    const query = `
        UPDATE features 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, [status, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Feature not found' });
        }
        
        res.json({ message: 'Feature status updated successfully' });
    });
});

// Update feature ai_core_comment (admin only)
app.put('/api/features/:id/comment', requireAuth, (req, res) => {
    const { id } = req.params;
    const { ai_core_comment } = req.body;
    
    const query = `
        UPDATE features 
        SET ai_core_comment = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, [ai_core_comment || '', id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Feature not found' });
        }
        
        res.json({ message: 'AI Core comment updated successfully' });
    });
});

// Delete a feature
app.delete('/api/features/:id', (req, res) => {
    const { id } = req.params;
    
    // First delete all votes for this feature
    const deleteVotesQuery = 'DELETE FROM votes WHERE feature_id = ?';
    
    db.run(deleteVotesQuery, [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Then delete the feature
        const deleteFeatureQuery = 'DELETE FROM features WHERE id = ?';
        
        db.run(deleteFeatureQuery, [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (this.changes === 0) {
                res.status(404).json({ error: 'Feature not found' });
            } else {
                res.json({ message: 'Feature deleted successfully' });
            }
        });
    });
});

// Vote on a feature
app.post('/api/features/:id/vote', (req, res) => {
    const { id } = req.params;
    const { userId, action = 'toggle' } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Check if user already voted
    const checkQuery = 'SELECT id FROM votes WHERE feature_id = ? AND user_id = ?';
    
    db.get(checkQuery, [id, userId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (row) {
            // User already voted, remove vote
            const deleteQuery = 'DELETE FROM votes WHERE feature_id = ? AND user_id = ?';
            db.run(deleteQuery, [id, userId], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: 'Vote removed', voted: false });
            });
        } else {
            // User hasn't voted, add vote
            const insertQuery = 'INSERT INTO votes (feature_id, user_id) VALUES (?, ?)';
            db.run(insertQuery, [id, userId], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: 'Vote added', voted: true });
            });
        }
    });
});

// Delete a feature (admin only)
app.delete('/api/features/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM features WHERE id = ?';
    
    db.run(query, [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Feature not found' });
        }
        
        res.json({ message: 'Feature deleted successfully' });
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Internal Work Items API Routes

// Get all internal work items
app.get('/api/internal-work-items', (req, res) => {
    db.all('SELECT * FROM internal_work_items ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add new internal work item (admin only)
app.post('/api/internal-work-items', requireAuth, (req, res) => {
    const { title, description, category, priority = 'medium', impact = 'medium', timeline = null, target_date = null, status = 'research', link = '' } = req.body;
    
    if (!title || !description || !category) {
        return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    const sql = `INSERT INTO internal_work_items (title, description, category, priority, impact, timeline, target_date, status, link) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [title, description, category, priority, impact, timeline, target_date, status, link], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Return the created item
        db.get('SELECT * FROM internal_work_items WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json(row);
        });
    });
});

// Update internal work item (admin only)
app.put('/api/internal-work-items/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { title, description, category, priority, impact, timeline, target_date, status, link } = req.body;
    
    if (!title || !description || !category) {
        return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    const sql = `UPDATE internal_work_items 
                 SET title = ?, description = ?, category = ?, priority = ?, impact = ?, target_date = ?, status = ?, link = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`;
    
    db.run(sql, [title, description, category, priority, impact, target_date, status, link || '', id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Work item not found' });
        }
        
        // Return the updated item
        db.get('SELECT * FROM internal_work_items WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(row);
        });
    });
});

// Update meeting discussion status (admin only)
app.put('/api/internal-work-items/:id/meeting', requireAuth, (req, res) => {
    const { id } = req.params;
    const { meeting_discussion } = req.body;
    
    const sql = `UPDATE internal_work_items 
                 SET meeting_discussion = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`;
    
    db.run(sql, [meeting_discussion ? 1 : 0, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Work item not found' });
        }
        
        res.json({ message: 'Meeting status updated successfully' });
    });
});

// Update internal work item status (admin only)
app.put('/api/internal-work-items/:id/status', requireAuth, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['evaluation', 'tools', 'adoption'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    db.run('UPDATE internal_work_items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
           [status, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Work item not found' });
        }
        
        res.json({ message: 'Status updated successfully' });
    });
});

// Delete internal work item (admin only)
app.delete('/api/internal-work-items/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM internal_work_items WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Work item not found' });
        }
        
        res.json({ message: 'Work item deleted successfully' });
    });
});

// Update work item updates (admin only)
app.put('/api/internal-work-items/:id/updates', requireAuth, (req, res) => {
    const { id } = req.params;
    const { updates } = req.body;
    
    const sql = `UPDATE internal_work_items 
                 SET updates = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`;
    
    db.run(sql, [updates || '', id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Work item not found' });
        }
        
        res.json({ message: 'Updates saved successfully' });
    });
});

// Cohere Items API Routes

// Get all cohere items
app.get('/api/cohere-items', (req, res) => {
    db.all('SELECT * FROM cohere_items ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add new cohere item (admin only)
app.post('/api/cohere-items', requireAuth, (req, res) => {
    const { title, description, category, status, link = null, target_date = null } = req.body;
    
    if (!title || !category || !status) {
        return res.status(400).json({ error: 'Title, category, and status are required' });
    }

    const sql = `INSERT INTO cohere_items (title, description, category, status, link, target_date) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [title, description, category, status, link, target_date], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Return the created item
        db.get('SELECT * FROM cohere_items WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json(row);
        });
    });
});

// Update cohere item status (admin only)
app.put('/api/cohere-items/:id/status', requireAuth, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    db.run('UPDATE cohere_items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
           [status, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Cohere item not found' });
        }
        
        res.json({ message: 'Status updated successfully' });
    });
});

// Update cohere item (admin only)
app.put('/api/cohere-items/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { title, description, category, status, link, target_date } = req.body;
    
    if (!title || !category || !status) {
        return res.status(400).json({ error: 'Title, category, and status are required' });
    }

    const sql = `UPDATE cohere_items 
                 SET title = ?, description = ?, category = ?, status = ?, link = ?, target_date = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`;
    
    db.run(sql, [title, description, category, status, link, target_date, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Cohere item not found' });
        }
        
        // Return the updated item
        db.get('SELECT * FROM cohere_items WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(row);
        });
    });
});

// Update cohere item meeting discussion status (admin only)
app.put('/api/cohere-items/:id/meeting', requireAuth, (req, res) => {
    const { id } = req.params;
    const { meeting_discussion } = req.body;
    
    const sql = `UPDATE cohere_items 
                 SET meeting_discussion = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`;
    
    db.run(sql, [meeting_discussion ? 1 : 0, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Cohere item not found' });
        }
        
        res.json({ message: 'Meeting status updated successfully' });
    });
});

// Update cohere item updates (admin only)
app.put('/api/cohere-items/:id/updates', requireAuth, (req, res) => {
    const { id } = req.params;
    const { updates } = req.body;
    
    const sql = `UPDATE cohere_items 
                 SET updates = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`;
    
    db.run(sql, [updates || '', id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Cohere item not found' });
        }
        
        res.json({ message: 'Updates saved successfully' });
    });
});

// Delete cohere item (admin only)
app.delete('/api/cohere-items/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM cohere_items WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Cohere item not found' });
        }
        
        res.json({ message: 'Cohere item deleted successfully' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api/features`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});
