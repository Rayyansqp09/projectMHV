var express = require('express');
var router = express.Router();
const db = require('../config/connection'); // adjust to your DB connection
const displayHelper = require('../helpers/disply');
const { v4: uuidv4 } = require('uuid');
const votedIPs = new Set(); // Temporary memory; use DB/IP logs in production
const isTesting = true; // Change to false when deploying live
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: "rzp_test_41qaGoGnSDVd5u",
  key_secret: "ocb2j8L3oFTm6K9PJlqXOhjt",
});




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
  res.render('user/policy',{header:false}); // Make sure views/policy.ejs (or .pug, .hbs) exists
});

router.get('/pay', (req, res) => {
  res.render('user/pay',{header:false}); // Make sure views/policy.ejs (or .pug, .hbs) exists
});

router.post("/pay", async (req, res) => {
  const amount = 10000; // Rs. 100 in paise
  const currency = "INR";

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
