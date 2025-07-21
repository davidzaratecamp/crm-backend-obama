// backend/src/config/db.js
const mysql = require('mysql2/promise'); // Usar la versión de promesas
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Nokialumia9810',
    database: process.env.DB_NAME || 'obama_crm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;