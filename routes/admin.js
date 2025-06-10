var express = require('express');
var router = express.Router();
const multer = require('multer');
const upload = multer(); // For parsing multipart/form-data
const displayHelper = require('../helpers/disply');
const db = require('../config/connection');
require('dotenv').config();



/* GET users listing. */
/* GET home page. */
router.get('/', function (req, res, next) {
    console.log('Admin route /admin accessed');
  const seasons = ['2024_25', 'all_time'];

  displayHelper.getStats(seasons, (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    console.log(stats)

    // All-time stats
    const allTimeStats = stats['all_time'] || [];
    const mbappe = allTimeStats.find(p => p.Name === 'Mbappe') || {};
    const haaland = allTimeStats.find(p => p.Name === 'Haaland') || {};
    const vini = allTimeStats.find(p => p.Name === 'Vinicius') || {};

    // Latest season stats (2024_25)
    const season = '2024_25';
    const cleanKey = season.replace('_', '');
    const seasonStats = stats[season] || [];

    const mbappeSeason = seasonStats.find(p => p.Name === 'Mbappe') || {};
    const haalandSeason = seasonStats.find(p => p.Name === 'Haaland') || {};
    const viniciusSeason = seasonStats.find(p => p.Name === 'Vinicius') || {};

    // Construct final data
    const data = {
      admin: true,
      mbappe,
      haaland,
      vini,
      [`mbappe_${cleanKey}`]: mbappeSeason,
      [`haaland_${cleanKey}`]: haalandSeason,
      [`vinicius_${cleanKey}`]: viniciusSeason,
      [`season_${cleanKey}`]: seasonStats
    };

    res.render('index', data);
  });
});

// router.get('/sts-update', function(req, res) {
//   res.send('GET /sts-update route');
// });

router.post('/sts-update', upload.none(), function (req, res) {
  const formData = req.body;
  console.log(`[${new Date().toISOString()}] 🛠️ Admin requested stats update:`, formData);

  const tableName = formData.tablename;
  delete formData.tablename;

  displayHelper.updateStats(tableName, formData, function (err, result) {
    if (err) {
      console.error(`[${new Date().toISOString()}] ❌ Failed to update stats for table "${tableName}":`, err);
      return res.status(500).send('Database update failed.');
    }

    // ✅ Successful update log
    console.log(`[${new Date().toISOString()}] ✅ Admin updated stats for "${tableName}" from IP: ${req.ip}`);

    db.get().query(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) {
        console.error(`[${new Date().toISOString()}] ❌ Failed to fetch updated data from "${tableName}":`, err);
        return res.status(500).send('Failed to fetch updated data.');
      }

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
    res.render('user/alltime', { admin: true, mbappe, haaland, vini }); // Pass stats to the frontend

  });
});
router.get('/club-stats', function (req, res, next) {
  displayHelper.getStats(['all_time', 'club'], (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    const mbappe_all = stats.all_time.find(p => p.Name === 'Mbappe');
    const mbappe_club = stats.club.find(p => p.Name === 'Mbappe');

    const haaland_all = stats.all_time.find(p => p.Name === 'Haaland');
    const haaland_club = stats.club.find(p => p.Name === 'Haaland');

    const vini_all = stats.all_time.find(p => p.Name === 'Vinicius');
    const vini_club = stats.club.find(p => p.Name === 'Vinicius');

    console.log('Mbappe All-Time:', mbappe_all);
    console.log('Mbappe Club:', mbappe_club);

    console.log('Haaland All-Time:', haaland_all);
    console.log('Haaland Club:', haaland_club);

    console.log('Vinicius All-Time:', vini_all);
    console.log('Vinicius Club:', vini_club);

    res.render('user/club-stats', {
      admin: true,
      mbappe_all,
      mbappe_club,
      haaland_all,
      haaland_club,
      vini_all,
      vini_club
    });
  });
});
router.get('/int-stats', function (req, res, next) {
  displayHelper.getStats(['all_time', 'intr'], (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }
    const mbappe_all = stats.all_time.find(p => p.Name === 'Mbappe');
    const mbappe_intr = stats.intr.find(p => p.Name === 'Mbappe');

    const haaland_all = stats.all_time.find(p => p.Name === 'Haaland');
    const haaland_intr = stats.intr.find(p => p.Name === 'Haaland');

    const vini_all = stats.all_time.find(p => p.Name === 'Vinicius');
    const vini_intr = stats.intr.find(p => p.Name === 'Vinicius');

    console.log('Mbappe All-Time:', mbappe_all);
    console.log('Mbappe Intr:', mbappe_intr);

    console.log('Haaland All-Time:', haaland_all);
    console.log('Haaland Intr:', haaland_intr);

    console.log('Vinicius All-Time:', vini_all);
    console.log('Vinicius Intr:', vini_intr);

    res.render('user/int-stats', {
      admin: true,
      mbappe_all,
      mbappe_intr,
      haaland_all,
      haaland_intr,
      vini_all,
      vini_intr
    });
  });
});

router.get('/club-stats/:comp', function (req, res, next) {
  const comp = req.params.comp;

  // List of supported competitions
  const allowedComps = ['ucl', 'laliga']; // add more if needed
  if (!allowedComps.includes(comp)) {
    return res.status(404).send('Competition not found');
  }

  displayHelper.getStats('ucl', (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    const mbappe = stats.find(p => p.Name === 'Mbappe');
    const haaland = stats.find(p => p.Name === 'Haaland');
    const vini = stats.find(p => p.Name === 'Vinicius');

    console.log(mbappe, haaland, vini)

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

  // List of supported competition views
  const allowedComps = ['wc', 'copa-euro'];
  if (!allowedComps.includes(comp)) {
    return res.status(404).send('Competition not found');
  }

  // Always fetch both stats
  displayHelper.getStats(['wc', 'copa_euro'], (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    const mbappe_wc = stats.wc.find(p => p.Name === 'Mbappe');
    const haaland_wc = stats.wc.find(p => p.Name === 'Haaland');
    const vini_wc = stats.wc.find(p => p.Name === 'Vinicius');

    const mbappe_cu = stats.copa_euro.find(p => p.Name === 'Mbappe');
    const haaland_cu = stats.copa_euro.find(p => p.Name === 'Haaland');
    const vini_cu = stats.copa_euro.find(p => p.Name === 'Vinicius');

    console.log(mbappe_wc, haaland_wc, vini_wc, mbappe_cu, haaland_cu, vini_cu)

    res.render(`user/${comp}`, {
      admin: true,
      mbappe_wc,
      haaland_wc,
      vini_wc,
      mbappe_cu,
      haaland_cu,
      vini_cu
    });
  });
});
router.get('/:time', function (req, res, next) {
  const time = req.params.time;

  const allowedTimes = ['season', 'year', 'age'];
  if (!allowedTimes.includes(time)) {
    return res.status(404).send('Page not found');
  }

  const seasons = [
    '2015_16',
    '2016_17',
    '2017_18',
    '2018_19',
    '2019_20',
    '2020_21',
    '2021_22',
    '2022_23',
    '2023_24',
    '2024_25'
  ];

  displayHelper.getStats(seasons, (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }
    console.log(stats)
    const data = {};

    for (const season of seasons) {
      const cleanKey = season.replace('_', ''); // e.g., 2024_25 → 202425
      const table = stats[season];


      // Fallback to empty object if not found
      const mbappe = table.find(p => p.Name === 'Mbappe') || {};
      const haaland = table.find(p => p.Name === 'Haaland') || {};
      const vinicius = table.find(p => p.Name === 'Vinicius') || {};

      data[`mbappe_${cleanKey}`] = mbappe;
      data[`haaland_${cleanKey}`] = haaland;
      data[`vinicius_${cleanKey}`] = vinicius;

      data[`season_${cleanKey}`] = table; // optional full table
    }

    res.render(`user/${time}`, {
      admin: true,
      ...data
    });
  });
});

module.exports = router;
