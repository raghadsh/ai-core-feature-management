const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Connect to local database
const db = new sqlite3.Database('./features.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to local database for export');
});

// Export data function
function exportData() {
    const exportData = {
        features: [],
        internal_work_items: [],
        cohere_items: [],
        votes: []
    };

    // Export features
    db.all("SELECT * FROM features", (err, rows) => {
        if (err) {
            console.error('Error exporting features:', err);
            return;
        }
        exportData.features = rows;
        console.log(`Exported ${rows.length} features`);

        // Export internal work items
        db.all("SELECT * FROM internal_work_items", (err, rows) => {
            if (err) {
                console.error('Error exporting work items:', err);
                return;
            }
            exportData.internal_work_items = rows;
            console.log(`Exported ${rows.length} work items`);

            // Export cohere items
            db.all("SELECT * FROM cohere_items", (err, rows) => {
                if (err) {
                    console.error('Error exporting cohere items:', err);
                    return;
                }
                exportData.cohere_items = rows;
                console.log(`Exported ${rows.length} cohere items`);

                // Export votes
                db.all("SELECT * FROM votes", (err, rows) => {
                    if (err) {
                        console.error('Error exporting votes:', err);
                        return;
                    }
                    exportData.votes = rows;
                    console.log(`Exported ${rows.length} votes`);

                    // Write to file
                    fs.writeFileSync('./sample-data.json', JSON.stringify(exportData, null, 2));
                    console.log('✅ Data exported to sample-data.json');
                    
                    db.close();
                });
            });
        });
    });
}

exportData();
