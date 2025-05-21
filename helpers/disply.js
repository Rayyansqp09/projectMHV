const db = require('../config/connection');

module.exports = {

    getStats: function (tableName, callback) {
        // Whitelist valid table names to avoid SQL injection
        const validTables = ['all_time', 'club_comp', 'int_comp'];
        if (!validTables.includes(tableName)) {
            return callback(new Error('Invalid table name'), null);
        }

        const query = `SELECT * FROM ${tableName}`; // Safe now after validation

        db.get().query(query, (err, results) => {
            if (err) {
                console.error(`Error fetching data from ${tableName}:`, err);
                return callback(err, null);
            }
            callback(null, results);
        });
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