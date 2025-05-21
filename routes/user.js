var express = require('express');
var router = express.Router();
const displayHelper = require('../helpers/disply');

/* GET home page. */
router.get('/', function (req, res, next) {
  displayHelper.getStats('all_time', (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }
    const mbappe = stats.find(p => p.Name === 'Mbappe');
    const haaland = stats.find(p => p.Name === 'Haaland');
    const vini = stats.find(p => p.Name === 'Vinicius');
    res.render('index', { admin: false, mbappe, haaland, vini }); // Pass stats to the frontend
    
  });
});




module.exports = router;
