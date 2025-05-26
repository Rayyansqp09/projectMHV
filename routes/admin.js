var express = require('express');
var router = express.Router();
const multer = require('multer');
const upload = multer(); // For parsing multipart/form-data
const displayHelper = require('../helpers/disply');
const db = require('../config/connection');



/* GET users listing. */
router.get('/', function (req, res, next) {
   console.log('Admin route /admin accessed');
  displayHelper.getStats('all_time', (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }
    const mbappe = stats.find(p => p.Name === 'Mbappe');
    const haaland = stats.find(p => p.Name === 'Haaland');
    const vini = stats.find(p => p.Name === 'Vinicius');
    res.render('index', { admin: true, mbappe, haaland, vini }); // Pass stats to the frontend
    
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

router.get('/alltime', function (req, res, next) {
  displayHelper.getStats('all_time', (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }
    const mbappe = stats.find(p => p.Name === 'Mbappe');
    const haaland = stats.find(p => p.Name === 'Haaland');
    const vini = stats.find(p => p.Name === 'Vinicius');
    res.render('user/alltime', { admin:true, mbappe, haaland, vini }); // Pass stats to the frontend
    
  });
});
router.get('/club-stats', function (req, res, next) {
  displayHelper.getStats('all_time', (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }
    const mbappe = stats.find(p => p.Name === 'Mbappe');
    const haaland = stats.find(p => p.Name === 'Haaland');
    const vini = stats.find(p => p.Name === 'Vinicius');
    res.render('user/club-stats', { admin:true, mbappe, haaland, vini }); // Pass stats to the frontend
    
  });
});
router.get('/int-stats', function (req, res, next) {
  displayHelper.getStats('all_time', (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }
    const mbappe = stats.find(p => p.Name === 'Mbappe');
    const haaland = stats.find(p => p.Name === 'Haaland');
    const vini = stats.find(p => p.Name === 'Vinicius');
    res.render('user/int-stats', { admin:true, mbappe, haaland, vini }); // Pass stats to the frontend
    
  });
});
router.get('/club-stats/:comp', function (req, res, next) {
  const comp = req.params.comp;

  // List of supported competitions
  const allowedComps = ['ucl', 'wc', 'laliga']; // add more if needed
  if (!allowedComps.includes(comp)) {
    return res.status(404).send('Competition not found');
  }

  displayHelper.getStats('all_time', (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    const mbappe = stats.find(p => p.Name === 'Mbappe');
    const haaland = stats.find(p => p.Name === 'Haaland');
    const vini = stats.find(p => p.Name === 'Vinicius');

    // Dynamically render the matching .hbs page like user/ucl.hbs, user/wc.hbs, etc.
    res.render(`user/${comp}`, {
      admin: true,
      mbappe,
      haaland,
      vini
    });
  });
});
router.get('/int-stats/:comp', function (req, res, next) {
  const comp = req.params.comp;

  // List of supported competitions
  const allowedComps = ['wc', 'copa/euro']; // add more if needed
  if (!allowedComps.includes(comp)) {
    return res.status(404).send('Competition not found');
  }

  displayHelper.getStats('all_time', (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    const mbappe = stats.find(p => p.Name === 'Mbappe');
    const haaland = stats.find(p => p.Name === 'Haaland');
    const vini = stats.find(p => p.Name === 'Vinicius');

    // Dynamically render the matching .hbs page like user/ucl.hbs, user/wc.hbs, etc.
    res.render(`user/${comp}`, {
      admin: true,
      mbappe,
      haaland,
      vini
    });
  });
});
router.get('/:time', function (req, res, next) {
  const time = req.params.time;

  // Allowed dynamic pages
  const allowedTimes = ['season', 'year', 'age']; // Add more if needed
  if (!allowedTimes.includes(time)) {
    return res.status(404).send('Page not found');
  }

  displayHelper.getStats('all_time', (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    const mbappe = stats.find(p => p.Name === 'Mbappe');
    const haaland = stats.find(p => p.Name === 'Haaland');
    const vini = stats.find(p => p.Name === 'Vinicius');

    res.render(`user/${time}`, {
      admin: true,
      mbappe,
      haaland,
      vini
    });
  });
});

module.exports = router;
