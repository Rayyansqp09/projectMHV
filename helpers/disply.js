const db = require('../config/connection');
const validTables = require('../config/table'); // your table list

module.exports = {

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

      // Use backticks around table name for safety
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