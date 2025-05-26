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
router.get('/alltime', function (req, res, next) {
  displayHelper.getStats('all_time', (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }
    const mbappe = stats.find(p => p.Name === 'Mbappe');
    const haaland = stats.find(p => p.Name === 'Haaland');
    const vini = stats.find(p => p.Name === 'Vinicius');
    res.render('user/alltime', { admin: false, mbappe, haaland, vini }); // Pass stats to the frontend
    
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
    res.render('user/club-stats', { admin: false, mbappe, haaland, vini }); // Pass stats to the frontend
    
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
    res.render('user/int-stats', { admin: false, mbappe, haaland, vini }); // Pass stats to the frontend
    
  });
});
router.get('/policy', (req, res) => {
  res.render('user/policy',{header:true}); // Make sure views/policy.ejs (or .pug, .hbs) exists
});

router.get('/club-stats/:comp', function (req, res, next) {
  const comp = req.params.comp;

  // List of supported competitions
  const allowedComps = ['ucl','laliga']; // add more if needed
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
      admin: false,
      mbappe,
      haaland,
      vini
    });
  });
});

router.get('/int-stats/:comp', function (req, res, next) {
  const comp = req.params.comp;

  // List of supported competitions
  const allowedComps = ['wc', 'copa-euro']; // add more if needed
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
      admin: false,
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
      admin: false,
      mbappe,
      haaland,
      vini
    });
  });
});



module.exports = router;
