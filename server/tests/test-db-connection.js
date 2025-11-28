const mysql = require('mysql2/promise');

async function testConnection() {
    const config = {
        host: 'ultra.webfastdns.com',
        user: 'cleancar_munna',
        password: 'mylovema2',
        database: 'cleancar_munna', // Corrected based on screenshot
        port: 3306
    };

    console.log('Testing connection with config:', { ...config, password: '****' });

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Connection successful!');
        await connection.end();
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

testConnection();
