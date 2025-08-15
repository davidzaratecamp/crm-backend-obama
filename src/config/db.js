// backend/src/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Nokialumia9810',
    database: process.env.DB_NAME || 'obama_crm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Prueba opcional de conexión
pool.getConnection()
    .then(connection => {
        console.log('✅ Pool de conexiones activo y funcional');
        connection.release(); 
    })
    .catch(err => {
        console.error('❌ Error al obtener conexión del pool:', err.message);
        console.error('🔹 Código:', err.code);
    });

module.exports = pool;