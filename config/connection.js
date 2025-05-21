const mysql = require('mysql');

const state = {
  connection: null
};

module.exports.connect = function(done) {
  const config = {
    host: 'localhost',
    user: 'root',
    password: '18102006',
    database: 'mhv'
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

