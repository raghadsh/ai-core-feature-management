const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Admin route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Database setup
const db = new sqlite3.Database('./features.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS features (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            votes INTEGER DEFAULT 0,
            status TEXT DEFAULT 'requested',
            added_by TEXT DEFAULT 'user',
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
}

// API Routes

// Get all features
app.get('/api/features', (req, res) => {
    const { sort = 'votes', status } = req.query;
    
    let query = `
        SELECT f.*, 
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
            updatedAt: row.updated_at
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
            updatedAt: row.updated_at
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

// Create a new feature
app.post('/api/features', (req, res) => {
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

// Update feature status
app.put('/api/features/:id/status', (req, res) => {
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

// Delete a feature
app.delete('/api/features/:id', (req, res) => {
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
