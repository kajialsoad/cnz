const mysql = require('mysql2/promise');
require('dotenv').config();

async function addAudioUrlColumn() {
  let connection;
  
  try {
    // Parse DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }
    
    const [, user, password, host, port, database] = match;
    
    console.log('Connecting to database:', database);
    
    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      database
    });
    
    console.log('Connected successfully!');
    
    // Check if audioUrl column exists
    const [columns] = await connection.execute(
      'SHOW COLUMNS FROM Complaint LIKE "audioUrl"'
    );
    
    if (columns.length > 0) {
      console.log('✓ audioUrl column already exists');
      return;
    }
    
    console.log('Adding audioUrl column...');
    
    await connection.execute(
      'ALTER TABLE Complaint ADD COLUMN audioUrl TEXT NULL AFTER imageUrl'
    );
    
    console.log('✓ Successfully added audioUrl column!');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addAudioUrlColumn();
