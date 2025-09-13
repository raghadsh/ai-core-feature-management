const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Connect to database
const db = new sqlite3.Database('./features.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to database for population');
});

// Load your local data
let sampleData;
try {
    const data = fs.readFileSync('./sample-data.json', 'utf8');
    sampleData = JSON.parse(data);
    console.log('✅ Your local data loaded');
} catch (err) {
    console.log('No local data found, skipping population');
    process.exit(0);
}

// Check if data already exists
function checkIfDataExists() {
    db.get("SELECT COUNT(*) as count FROM features", (err, row) => {
        if (err) {
            console.error('Error checking existing data:', err);
            return;
        }
        
        if (row.count > 0) {
            console.log('✅ Database already has data, skipping population');
            db.close();
            return;
        }
        
        console.log('📊 Database is empty, populating with local data...');
        populateDatabase();
    });
}

// Populate database function
function populateDatabase() {
    let completed = 0;
    const total = 4;

    function checkComplete() {
        completed++;
        if (completed === total) {
            console.log('✅ Database population completed with your local data');
            db.close();
        }
    }

    // Insert features
    if (sampleData.features && sampleData.features.length > 0) {
        const featuresStmt = db.prepare(`
            INSERT OR IGNORE INTO features (id, title, description, votes, status, added_by, ai_core_comment, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        sampleData.features.forEach(feature => {
            featuresStmt.run([
                feature.id,
                feature.title,
                feature.description,
                feature.votes,
                feature.status,
                feature.added_by,
                feature.ai_core_comment || '',
                feature.created_at,
                feature.updated_at
            ]);
        });
        featuresStmt.finalize();
        console.log(`✅ Inserted ${sampleData.features.length} features`);
    }
    checkComplete();

    // Insert internal work items
    if (sampleData.internal_work_items && sampleData.internal_work_items.length > 0) {
        const workItemsStmt = db.prepare(`
            INSERT OR IGNORE INTO internal_work_items 
            (id, title, description, category, priority, impact, timeline, target_date, status, meeting_discussion, updates, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        sampleData.internal_work_items.forEach(item => {
            workItemsStmt.run([
                item.id,
                item.title,
                item.description,
                item.category,
                item.priority,
                item.impact,
                item.timeline,
                item.target_date,
                item.status,
                item.meeting_discussion || 0,
                item.updates || '',
                item.created_at,
                item.updated_at
            ]);
        });
        workItemsStmt.finalize();
        console.log(`✅ Inserted ${sampleData.internal_work_items.length} work items`);
    }
    checkComplete();

    // Insert cohere items
    if (sampleData.cohere_items && sampleData.cohere_items.length > 0) {
        const cohereItemsStmt = db.prepare(`
            INSERT OR IGNORE INTO cohere_items 
            (id, title, description, category, status, link, target_date, meeting_discussion, updates, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        sampleData.cohere_items.forEach(item => {
            cohereItemsStmt.run([
                item.id,
                item.title,
                item.description,
                item.category,
                item.status,
                item.link,
                item.target_date,
                item.meeting_discussion || 0,
                item.updates || '',
                item.created_at,
                item.updated_at
            ]);
        });
        cohereItemsStmt.finalize();
        console.log(`✅ Inserted ${sampleData.cohere_items.length} cohere items`);
    }
    checkComplete();

    // Insert votes
    if (sampleData.votes && sampleData.votes.length > 0) {
        const votesStmt = db.prepare(`
            INSERT OR IGNORE INTO votes (id, feature_id, user_id, created_at)
            VALUES (?, ?, ?, ?)
        `);
        
        sampleData.votes.forEach(vote => {
            votesStmt.run([
                vote.id,
                vote.feature_id,
                vote.user_id,
                vote.created_at
            ]);
        });
        votesStmt.finalize();
        console.log(`✅ Inserted ${sampleData.votes.length} votes`);
    }
    checkComplete();
}

// Check if data exists first, then populate if needed
checkIfDataExists();
