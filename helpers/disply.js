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

    delete updatedData.playerSelect;
    delete updatedData.matchNumber;

    // 🔒 protect immutable fields
    delete updatedData.No;
    delete updatedData.date;

    // 🔢 enforce numeric types
    const NUMERIC_FIELDS = ['goals', 'scorFor', 'scorAgainst', 'mnt'];
    NUMERIC_FIELDS.forEach(field => {
      if (updatedData[field] !== undefined) {
        const n = Number(updatedData[field]);
        updatedData[field] = Number.isNaN(n) ? 0 : n;
      }
    });

    const filteredData = Object.entries(updatedData).filter(
      ([, value]) => value !== null && value !== undefined && value !== ''
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
  formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return `${day}/${month}/${year}`;
  },
  getStatsPaginated: (table, limit, offset, callback) => {
    const dataQuery = `
    SELECT * FROM \`${table}\`
    LIMIT ? OFFSET ?
  `;

    const countQuery = `
    SELECT COUNT(*) AS total FROM \`${table}\`
  `;

    db.get().query(countQuery, (err, countResult) => {
      if (err) return callback(err);

      const total = countResult[0].total;

      db.get().query(dataQuery, [limit, offset], (err, rows) => {
        if (err) return callback(err);

        callback(null, { rows, total });
      });
    });
  }
  ,
  getStatsPaginatedSorted: (table, sort, order, limit, offset, callback) => {
    const countQuery = `SELECT COUNT(*) AS total FROM \`${table}\``;

    const dataQuery = `
    SELECT * FROM \`${table}\`
    ORDER BY ${sort} ${order}
    LIMIT ? OFFSET ?
  `;

    db.get().query(countQuery, (err, countResult) => {
      if (err) return callback(err);

      const total = countResult[0].total;

      db.get().query(dataQuery, [limit, offset], (err, rows) => {
        if (err) return callback(err);
        callback(null, { rows, total });
      });
    });
  },
  /**
  * Professional Forward Rating Engine (2024-25 Industry Standard)
  * Logic: Base + Per-Game Performance + Comp-Weighted Bonuses + Efficiency Curves
  */
  calculateSeasonRating: (player) => {
    const num = v => parseFloat(v) || 0;
    const games = num(player.Games);

    // 1. Floor protection: If they haven't played, they get a baseline 
    if (games === 0) return (5.00).toFixed(2);

    // 2. Performance-to-Game Ratios
    const gpg = num(player.Goals) / games;
    const apg = num(player.Assists) / games;
    const bccpg = num(player.BCC) / games; // Big Chances Created
    const ccpg = num(player.CC) / games;   // Chances Created
    const spg = num(player.Shot) / games;
    const dpg = num(player.dribbles) / games;

    // 3. The Core Score (Weighted Per-Game)
    // Industry standard: Goals/Assists/BCC are the "Holy Trinity" for Forwards
    let score = (gpg * 4.0) + (apg * 2.5) + (bccpg * 1.5) + (ccpg * 0.5);

    // 4. Activity & Volume (Secondary factors)
    score += (spg * 0.15) + (dpg * 0.25);

    // 5. Efficiency Adjustment (Goal Conversion)
    // Instead of adding GoalRatio directly, we treat 0.20 (20%) as the baseline.
    // This rewards clinical finishers without inflating the score.
    const goalRatio = num(player.GoalRatio);
    const efficiencyBonus = (goalRatio - 0.15) * 2; // + points for >15% conversion
    score += Math.max(-0.5, Math.min(0.5, efficiencyBonus));

    // 6. Elite Competition & "Clutch" Weighted Bonuses
    // We use "Total" stats here to reward season-long dominance in hard cups
    const uclImpact = (num(player.uclGoals) * 0.1) + (num(player.uclAssists) * 0.05);
    const wcImpact = (num(player.wcGoals) * 0.15) + (num(player.wcAssists) * 0.08);
    const clutchImpact = (num(player.finalGoals) * 0.2) + (num(player.finalAssists) * 0.1);
    const milestoneImpact = (num(player.hattrick) * 0.1) + (num(player.braces) * 0.03);

    // 7. Assemble & Normalize
    // Start with a professional 6.0 (Average pro starter performance)
    let finalRating = 6.0 + score + uclImpact + wcImpact + clutchImpact + milestoneImpact;

    // 8. Dynamic Sample Size Penalty (Logarithmic)
    // Instead of a hard 10-game cutoff, we use a curve so 1-3 games are heavily 
    // penalized, but 5-9 games start approaching their true rating.
    const reliabilityWeight = games < 1 ? 0 : Math.min(1, Math.log10(games + 1) / Math.log10(11));

    // Apply reliability to the deviation from the mean (6.0)
    finalRating = 6.0 + ((finalRating - 6.0) * reliabilityWeight);

    // 9. Hard Clamp (1.0 to 10.0)
    return Math.max(1, Math.min(10, finalRating)).toFixed(2);
  },


  // ✅ Add the email function to module.exports
  sendUniversalEmail
};
