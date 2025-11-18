const mysql = require('mysql');
require('dotenv').config();

const state = {
  pool: null,
  connection: null
};

module.exports.connect = function (done) {
  if (state.pool) return done(); // already connected

  // Create a MySQL connection pool
  state.pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // Test connection once
  state.pool.getConnection((err, connection) => {
    if (err) {
      console.error("❌ MySQL connection error:", err);
      return done(err);
    }

    // Save one connection for backward compatibility
    state.connection = connection;

    console.log("✅ MySQL pool connected");
    connection.release(); // return to pool

    done();
  });
};

// Old API support
module.exports.get = function () {
  return state.pool;
};
