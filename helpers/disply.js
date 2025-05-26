const db = require('../config/connection');

module.exports = {

   getStats: function (tableNames, callback) {
  const validTables = ['all_time', 'club_comp', 'int_comp'];
  const results = {};

  // If tableNames is a string, convert it to an array
  if (typeof tableNames === 'string') {
    tableNames = [tableNames];
  }

  let completed = 0;

  for (const table of tableNames) {
    if (!validTables.includes(table)) {
      return callback(new Error('Invalid table name: ' + table), null);
    }

    const query = `SELECT * FROM ${table}`;
    db.get().query(query, (err, rows) => {
      if (err) {
        return callback(err, null);
      }

      results[table] = rows;
      completed++;

      if (completed === tableNames.length) {
        // If only one table, return just that result for backward compatibility
        if (tableNames.length === 1) {
          return callback(null, rows);
        } else {
          return callback(null, results);
        }
      }
    });
  }
},
    updateStats: function (tableName, data, callback) {
        const playerName = data.Name;
        const statPrefix = data.statname;

        delete data.Name;
        delete data.statname;

        const fields = Object.keys(data).map(key => `${statPrefix}${key}`);
        const values = Object.values(data);

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const sql = `UPDATE ${tableName} SET ${setClause} WHERE Name = ?`;

        db.get().query(sql, [...values, playerName], (err, result) => {
            if (err) return callback(err);
            callback(null, result);

            console.log('Table:', tableName);
            console.log('Player Name:', playerName);
            console.log('Stat Prefix:', statPrefix);
            console.log('Fields:', fields);
            console.log('Values:', values);

        });
    }

}