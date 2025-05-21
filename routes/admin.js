var express = require('express');
var router = express.Router();
const multer = require('multer');
const upload = multer(); // For parsing multipart/form-data
const displayHelper = require('../helpers/disply');
const db = require('../config/connection');

/* GET users listing. */
router.get('/', function (req, res, next) {
  displayHelper.getStats('all_time', (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }
    const mbappe = stats.find(p => p.Name === 'Mbappe');
    const haaland = stats.find(p => p.Name === 'Haaland');
    const vini = stats.find(p => p.Name === 'Vinicius');
    res.render('admin/admin', { admin: false, mbappe, haaland, vini }); // Pass stats to the frontend

  });
});
// router.get('/sts-update', function(req, res) {
//   res.send('GET /sts-update route');
// });

router.post('/sts-update', upload.none(), function (req, res) {
  const formData = req.body;
  console.log(req.body)

  const tableName = 'all_time';

  displayHelper.updateStats(tableName, formData, function (err, result) {
    if (err) {
      return res.status(500).send('Database update failed.');
    }

    // Send back updated data for all players (if needed)
    db.get().query('SELECT * FROM all_time', (err, rows) => {
      if (err) return res.status(500).send('Failed to fetch updated data.');
      res.status(200).json(rows);
    });
  });
});


module.exports = router;
