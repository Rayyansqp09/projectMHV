var express = require('express');
var router = express.Router();
const db = require('../config/connection'); // adjust to your DB connection
const tableList = require('../config/table'); // your table list
const displayHelper = require('../helpers/disply');
const { v4: uuidv4 } = require('uuid');
const votedIPs = new Set(); // Temporary memory; use DB/IP logs in production
const isTesting = true; // Change to false when deploying live
const Razorpay = require("razorpay");


const razorpay = new Razorpay({
  key_id: "rzp_test_41qaGoGnSDVd5u",
  key_secret: "ocb2j8L3oFTm6K9PJlqXOhjt",
});

const nodemailer = require('nodemailer');

// Replace these with your actual email and app password or token
const transporter = nodemailer.createTransport({
  service: 'gmail', // or 'zoho', 'hotmail', etc.
  auth: {
    user: 'mhdrayyan86@gmail.com',
    pass: 'omcbanpfsyumxqdt' // Use an app-specific password if using Gmail
  }
});



/* GET home page. */
router.get('/', function (req, res, next) {
  const seasons = ['2024_25', 'all_time'];

  displayHelper.getStats(seasons, (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

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
      admin: false,
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
      admin: false,
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
  res.render('user/policy', { header: false }); // Make sure views/policy.ejs (or .pug, .hbs) exists
});
router.get('/about', (req, res) => {
  res.render('user/About', { header: false }); // Make sure views/policy.ejs (or .pug, .hbs) exists
});

router.post('/send-advert', async (req, res) => {
  const { email, name, details } = req.body;

  const subject = "📢 New Advertise Inquiry";
  const text = `From: ${email}\nName: ${name}\n\nDetails:\n${details}`;

  try {
    await displayHelper.sendUniversalEmail({ from: email, subject, text });
    res.json({ success: true });
  } catch (err) {
    console.error("Email send failed:", err);
    res.status(500).json({ success: false, error: "Email failed to send" });
  }
});


router.get('/feedback', (req, res) => {
  res.render('user/feedback', { header: false });
});

// Route for Feedback form (Report an Issue)
router.post('/send-feedback', async (req, res) => {
  try {
    const { email, message } = req.body;

    const subject = 'New Feedback Received';
    const text = `Feedback from: ${email}\n\nMessage:\n${message}`;

    await displayHelper.sendUniversalEmail({
      from: email,
      subject,
      text
    });

    res.json({ success: true, message: 'Feedback sent successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route for Inaccurate Statistics report form
router.post('/send-inaccurate-report', async (req, res) => {
  try {
    const { email, statTitle, currentStat, correctStat, extra } = req.body;

    const subject = 'Inaccurate Statistics Report';
    const text = `Report from: ${email}\n\nInaccurate Stat Title: ${statTitle}\nCurrent Stat: ${currentStat}\nCorrect Stat: ${correctStat}\nExtra Details: ${extra || 'N/A'}`;

    await displayHelper.sendUniversalEmail({
      from: email,
      subject,
      text
    });

    res.json({ success: true, message: 'Report sent successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


router.get('/pay', (req, res) => {
  res.render('user/pay', { header: false }); // Make sure views/policy.ejs (or .pug, .hbs) exists
});

router.post("/pay", async (req, res) => {
  const amount = req.body.amount; // amount in paise
  const currency = "INR";

  if (!amount || amount < 100) {
    return res.status(400).send("Invalid amount");
  }

  const options = {
    amount,
    currency,
    receipt: "receipt_" + Date.now(),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id });
  } catch (err) {
    console.error("Razorpay Error:", err);
    res.status(500).send("Payment order creation failed");
  }
});



router.get('/vote', function (req, res, next) {
  displayHelper.getStats('votes', (err, votes) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    const voteCounts = { Mbappe: 0, Haaland: 0, Vinicius: 0 };
    votes.forEach(row => {
      const name = row.player_name;
      if (voteCounts[name] !== undefined) voteCounts[name]++;
    });

    const totalVotes = voteCounts.Mbappe + voteCounts.Haaland + voteCounts.Vinicius;

    const voteData = {
      Mbappe: {
        count: voteCounts.Mbappe,
        percentage: totalVotes ? ((voteCounts.Mbappe / totalVotes) * 100).toFixed(1) : 0
      },
      Haaland: {
        count: voteCounts.Haaland,
        percentage: totalVotes ? ((voteCounts.Haaland / totalVotes) * 100).toFixed(1) : 0
      },
      Vinicius: {
        count: voteCounts.Vinicius,
        percentage: totalVotes ? ((voteCounts.Vinicius / totalVotes) * 100).toFixed(1) : 0
      }
    };

    res.render('user/vote', {
      admin: false,
      voteData,
      totalVotes
    });
  });
});


router.post('/vote', (req, res) => {
  const { player_name } = req.body;
  const ip = req.ip;

  if (!isTesting && votedIPs.has(ip)) {
    return res.status(403).json({ success: false, message: 'Already voted' });
  }

  if (isTesting) {
    console.log('TESTING MODE: Allowing vote for IP:', ip);
  }


  // Optional: validate player_name
  if (!['Mbappe', 'Haaland', 'Vinicius'].includes(player_name)) {
    return res.status(400).json({ success: false, message: 'Invalid player' });
  }

  db.get().query('INSERT INTO votes (player_name) VALUES (?)', [player_name], (err) => {
    if (err) {
      console.error('DB insert error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    votedIPs.add(ip); // Prevent duplicate votes in memory

    // Now re-fetch and recalculate voteData
    displayHelper.getStats('votes', (err, votes) => {
      if (err) return res.status(500).json({ success: false });

      const counts = { Mbappe: 0, Haaland: 0, Vinicius: 0 };
      votes.forEach(row => {
        if (counts[row.player_name] !== undefined) {
          counts[row.player_name]++;
        }
      });

      const total = counts.Mbappe + counts.Haaland + counts.Vinicius;
      const voteData = {
        Mbappe: {
          count: counts.Mbappe,
          percentage: total ? ((counts.Mbappe / total) * 100).toFixed(1) : 0
        },
        Haaland: {
          count: counts.Haaland,
          percentage: total ? ((counts.Haaland / total) * 100).toFixed(1) : 0
        },
        Vinicius: {
          count: counts.Vinicius,
          percentage: total ? ((counts.Vinicius / total) * 100).toFixed(1) : 0
        }
      };

      res.json({ success: true, voteData });
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
      admin: false,
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
      admin: false,
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
    // console.log(stats)
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
      admin: false,
      ...data
    });
  });
});




module.exports = router;
