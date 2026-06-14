const mysql = require('mysql2');
require('dotenv').config();
const log = require('./logger');

const state = {
  pool: null,
  connection: null
};

module.exports.connect = function (done) {
  if (state.pool) return done(); // already connected

  console.log({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
  });

  // Create a MySQL connection pool
  state.pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    connectTimeout: 60000,
    acquireTimeout: 60000
  });

  // Test connection once
  state.pool.getConnection((err, connection) => {
    if (err) {
      console.error("❌ MySQL connection error:", err);
      return done(err);
    }

    // Save one connection for backward compatibility
    state.connection = connection;

    log("✅ MySQL pool connected");
    connection.release(); // return to pool

    done();
  });
};

// Old API support
module.exports.get = function () {
  return state.pool;
};