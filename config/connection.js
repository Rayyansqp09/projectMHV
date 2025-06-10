const mysql = require('mysql');
require('dotenv').config();

const state = {
  connection: null
};

module.exports.connect = function(done) {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };

  const connection = mysql.createConnection(config);

  connection.connect(function(err) {
    if (err) return done(err);
    state.connection = connection;
    console.log('MySQL connected to database mhv');
    done();
  });
};

module.exports.get = function() {
  return state.connection;
};

