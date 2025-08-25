const db = require('../config/connection');
const validTables = require('../config/table');
const nodemailer = require("nodemailer");

// Define the email sending function
async function sendUniversalEmail({ from, subject, text }) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from,
    to: "helpmhv@gmail.com",
    subject,
    text
  });
}

module.exports = {

  // Get stats from one or multiple tables
  getStats: function (tableNames, callback) {
    const results = {};

    if (typeof tableNames === 'string') {
      tableNames = [tableNames];
    }

    let completed = 0;

    for (const table of tableNames) {
      if (!validTables.includes(table)) {
        return callback(new Error('Invalid table name: ' + table), null);
      }

      const query = `SELECT * FROM \`${table}\``;

      db.get().query(query, (err, rows) => {
        if (err) return callback(err, null);

        results[table] = rows;
        completed++;

        if (completed === tableNames.length) {
          return callback(null, tableNames.length === 1 ? rows : results);
        }
      });
    }
  },

  updateStats: function (tableName, data, callback) {
    const playerName = data.Name;
    const statPrefix = data.statname;

    delete data.Name;
    delete data.statname;

    // ✅ Remove helper inputs (NOT real columns)
    delete data.customStatName;
    delete data.customStatValue;

    // ✅ Filter out empty fields
    const filteredData = Object.entries(data).filter(([key, value]) => {
      return value !== null && value !== undefined && value !== '';
    });

    if (filteredData.length === 0) {
      return callback(new Error('No valid fields to update'));
    }

    const fields = filteredData.map(([key]) => `\`${statPrefix}${key}\``); // ⛑ Backtick-protected
    const values = filteredData.map(([, value]) => value);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE \`${tableName}\` SET ${setClause} WHERE Name = ?`;

    db.get().query(sql, [...values, playerName], (err, result) => {
      if (err) return callback(err);
      callback(null, result);

      console.log('✅ SQL:', sql);
      console.log('➡️ Values:', values);
    });
  },

  addMatch: function (tableName, data, callback) {
    // Filter out empty/null/undefined fields
    const filteredData = Object.entries(data).filter(([key, value]) => {
      return value !== null && value !== undefined && value !== '';
    });

    if (filteredData.length === 0) {
      return callback(new Error('No valid fields to insert'));
    }

    const fields = filteredData.map(([key]) => `\`${key}\``); // Protect column names
    const values = filteredData.map(([, value]) => value);
    const placeholders = values.map(() => '?').join(', ');

    const sql = `INSERT INTO \`${tableName}\` (${fields.join(', ')}) VALUES (${placeholders})`;

    db.get().query(sql, values, (err, result) => {
      if (err) return callback(err);
      callback(null, result);

      console.log('✅ SQL:', sql);
      console.log('➡️ Values:', values);
    });
  },

  // Modify a match by match number
  modifyMatch: function (tableName, matchNumber, updatedData, callback) {
    if (!matchNumber) return callback(new Error("Match number (No) is required"));
    if (!tableName) return callback(new Error("Table name is required"));

    // Remove playerSelect and matchNumber from updatedData
    delete updatedData.playerSelect;
    delete updatedData.matchNumber;

    // Remove empty or undefined fields
    const filteredData = Object.entries(updatedData).filter(
      ([key, value]) => value !== null && value !== undefined && value !== ''
    );

    if (filteredData.length === 0)
      return callback(new Error("No valid fields to update"));

    const fields = filteredData.map(([key]) => `\`${key}\``);
    const values = filteredData.map(([, value]) => value);

    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const sql = `UPDATE \`${tableName}\` SET ${setClause} WHERE \`No\` = ?`;

    db.get().query(sql, [...values, matchNumber], (err, result) => {
      if (err) return callback(err);
      callback(null, result);

      console.log('✅ Modify SQL:', sql);
      console.log('➡️ Values:', values);
    });
  }
  ,

  // Delete a match by match number
  deleteMatch: function (tableName, matchNumber, callback) {
    if (!matchNumber) return callback(new Error("Match number (No) is required"));
    if (!tableName) return callback(new Error("Table name is required"));

    const sql = `DELETE FROM \`${tableName}\` WHERE \`No\` = ?`;

    db.get().query(sql, [matchNumber], (err, result) => {
      if (err) return callback(err);
      callback(null, result);

      console.log('✅ Delete SQL:', sql);
    });
  }
  ,

  // ✅ Add the email function to module.exports
  sendUniversalEmail
};
