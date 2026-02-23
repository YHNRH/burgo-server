const mysql = require('mysql');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = require('./constants');

// Создаём пул соединений (лучше, чем одно соединение)
const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    connectionLimit: 5
});

module.exports = pool;