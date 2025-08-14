var express = require('express');
var router = express.Router();
const db = require('../config/connection'); // adjust to your DB connection
const tableList = require('../config/table'); // your table list
const displayHelper = require('../helpers/disply');
const { v4: uuidv4 } = require('uuid');
const votedIPs = new Set(); // Temporary memory; use DB/IP logs in production
const isTesting = true; // Change to false when deploying live
const Razorpay = require("razorpay");
const nodemailer = require('nodemailer');
require('dotenv').config();
const NodeCache = require('node-cache');
const pageCache = new NodeCache({ stdTTL: 900 }); // Cache for 5 minutes




const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



/* GET home page. */
router.get('/', function (req, res, next) {
  const cachedPage = pageCache.get('/');
  if (cachedPage) return res.send(cachedPage);

  const seasons = ['2024_25', 'all_time'];

  displayHelper.getStats(seasons, (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    // console.log(stats)

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
      canonical: '<link rel="canonical" href="https://mhvstats.xyz/" />',

      mbappe,
      haaland,
      vini,
      [`mbappe_${cleanKey}`]: mbappeSeason,
      [`haaland_${cleanKey}`]: haalandSeason,
      [`vinicius_${cleanKey}`]: viniciusSeason,
      [`season_${cleanKey}`]: seasonStats
    };

    res.render('index', data, (err, html) => {
      if (err) return res.status(500).send('Error rendering page');
      pageCache.set('/', html);   // 🔥 Cache it!
      res.send(html);
    });
  });
});

router.get('/alltime', function (req, res, next) {
  const cachedPage = pageCache.get('/alltime');
  if (cachedPage) return res.send(cachedPage);

  displayHelper.getStats('all_time', (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }
    const mbappe = stats.find(p => p.Name === 'Mbappe');
    const haaland = stats.find(p => p.Name === 'Haaland');
    const vini = stats.find(p => p.Name === 'Vinicius');
    res.render('user/alltime', {
      title: 'All-Time Goal Scoring Stats | Mbappe vs Haaland vs Vinicius',
      description: 'Compare all-time goal stats: hattricks, pokers, free-kick goals, and final match goals of Mbappe, Haaland, and Vinicius.',
      admin: false, mbappe, haaland, vini
    }, (err, html) => {
      if (err) return res.status(500).send('Error rendering page');
      pageCache.set('/alltime', html);   // 🔥 Cache the rendered HTML
      res.send(html);
    });
  });
});
router.get('/club-stats', function (req, res, next) {
  const cachedPage = pageCache.get('/club-stats');
  if (cachedPage) return res.send(cachedPage);

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

    // console.log('Mbappe All-Time:', mbappe_all);
    // console.log('Mbappe Club:', mbappe_club);

    // console.log('Haaland All-Time:', haaland_all);
    // console.log('Haaland Club:', haaland_club);

    // console.log('Vinicius All-Time:', vini_all);
    // console.log('Vinicius Club:', vini_club);


    res.render('user/club-stats', {
      title: 'Mbappe vs Haaland vs Vinicius | Club Stats',
      description: 'View and compare Club football stats of Mbappe, Haaland, and Vinicius across all competitions.',
      canonical: '<link rel="canonical" href="https://mhvstats.xyz/club-stats" />',
      admin: false,
      mbappe_all,
      mbappe_club,
      haaland_all,
      haaland_club,
      vini_all,
      vini_club
    }, (err, html) => {
      if (err) return res.status(500).send('Error rendering page');
      pageCache.set('/club-stats', html); // Cache the rendered HTML
      res.send(html);
    });
  });
});

router.get('/int-stats', function (req, res, next) {
  const cachedPage = pageCache.get('/int-stats');
  if (cachedPage) return res.send(cachedPage);

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

    // console.log('Mbappe All-Time:', mbappe_all);
    // console.log('Mbappe Intr:', mbappe_intr);

    // console.log('Haaland All-Time:', haaland_all);
    // console.log('Haaland Intr:', haaland_intr);

    // console.log('Vinicius All-Time:', vini_all);
    // console.log('Vinicius Intr:', vini_intr);

    res.render('user/int-stats', {
      title: 'International Stats | Mbappe vs Haaland vs Vinicius',
      description: 'View and compare international football stats of Mbappe, Haaland, and Vinicius across all competitions.',
      canonical: '<link rel="canonical" href="https://mhvstats.xyz/int-Stats/" />',
      admin: false,
      mbappe_all,
      mbappe_intr,
      haaland_all,
      haaland_intr,
      vini_all,
      vini_intr
    }, (err, html) => {
      if (err) return res.status(500).send('Error rendering page');
      pageCache.set('/int-stats', html); // Store in cache
      res.send(html);
    });
  });
});
router.get('/policy', (req, res) => {
  res.render('user/policy', {
    title: 'Privacy Policy | MHVStats',
    description: 'Read the privacy policy of MHVStats. Learn how we handle your data and respect your privacy while you use our site.',
    header: false
  }); // Make sure views/policy.ejs (or .pug, .hbs) exists
});
router.get('/about', (req, res) => {
  res.render('user/About', {
    title: 'About MHVStats | Behind the Project',
    description: 'Learn about the creator of MHVStats and the mission behind comparing the careers of Mbappe, Haaland, and Vinicius.',
    header: false
  }); // Make sure views/policy.ejs (or .pug, .hbs) exists
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
  res.render('user/feedback', {
    title: 'Give Feedback | MHVStats',
    description: 'Send your feedback about Mbappe vs Haaland vs Vinicius stats. Help us improve accuracy and add features you care about.',
    header: false
  });
});

router.get('/mhv', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const competitionFilter = req.query.competition || '';
  const stageFilter = req.query.stage || '';
  const resultFilter = req.query.result || '';
  const seasonFilter = req.query.season || 'All';
  const yearFilter = req.query.year || 'All';
  const minCC = parseInt(req.query.CC) || 0;           // Chances Created
  const minDribbles = parseInt(req.query.dribbles) || 0;
  const minMnt = parseInt(req.query.mnt) || 0;         // Minutes Played
  const forTeamFilter = req.query.forTeam || 'All';
  const againstTeamFilter = req.query.againstTeam || '';




  const minGoals = parseInt(req.query.minGoals) || 0;
  const minAssists = parseInt(req.query.minAssists) || 0;
  const goalTypes = req.query.goalTypes ? req.query.goalTypes.split(',') : [];

  displayHelper.getStats('matches', (err, matches) => {
    if (err) return res.status(500).send('Error loading matches');

    matches.sort((a, b) => new Date(b.date) - new Date(a.date));
    matches.forEach(m => m.dateFormatted = new Date(m.date).toLocaleDateString('en-GB'));

    let filteredMatches = matches;

    if (competitionFilter && competitionFilter !== 'All') {
      filteredMatches = filteredMatches.filter(m => m.competition === competitionFilter);
    }

    if (stageFilter && stageFilter !== 'All') {
      const stageLower = stageFilter.toLowerCase().trim();

      const knockoutStages = [
        'round of 16',
        'quarter final',
        'semi final',
        'playoffs',
        'final',
        '3rd place',
        'preliminary round'
      ];

      if (stageLower === 'knockout') {
        // Show all knockout games
        filteredMatches = filteredMatches.filter(m => {
          const mStage = (m.stage || '').toLowerCase().trim();
          return knockoutStages.includes(mStage);
        });

      } else if (stageLower === 'league stage') {
        // Show all league matches (matchweek or any league stage)
        filteredMatches = filteredMatches.filter(m => {
          const mStage = (m.stage || '').toLowerCase().trim();
          // Matchweek detection
          const isMatchweek = /^matchweek\s*\d+$/i.test(m.stage || '');
          // Not knockout, not group stage
          return isMatchweek || (!knockoutStages.includes(mStage) && mStage !== 'group stage');
        });

      } else {
        // Normal exact match
        filteredMatches = filteredMatches.filter(m =>
          (m.stage || '').toLowerCase().trim() === stageLower
        );
      }
    }

    if (seasonFilter && seasonFilter !== 'All') {
      filteredMatches = filteredMatches.filter(m =>
        (m.season || '').toLowerCase().trim() === seasonFilter.toLowerCase().trim()
      );
    }

    if (minGoals > 0) {
      filteredMatches = filteredMatches.filter(m => m.goals >= minGoals);
    }

    if (minAssists > 0) {
      filteredMatches = filteredMatches.filter(m => m.assists >= minAssists);
    }

    if (resultFilter && resultFilter !== 'All') {
      filteredMatches = filteredMatches.filter(m =>
        (m.result || '').toLowerCase().trim() === resultFilter.toLowerCase().trim()
      );
    }

    if (yearFilter && yearFilter !== 'All') {
      filteredMatches = filteredMatches.filter(m => {
        const matchYear = new Date(m.date).getFullYear().toString();
        return matchYear === yearFilter;
      });
    }

    if (minCC > 0) {
      filteredMatches = filteredMatches.filter(m => m.CC >= minCC);
    }

    if (minDribbles > 0) {
      filteredMatches = filteredMatches.filter(m => m.dribbles >= minDribbles);
    }

    if (minMnt > 0) {
      filteredMatches = filteredMatches.filter(m => m.mnt >= minMnt);
    }

    if (forTeamFilter && forTeamFilter !== 'All') {
      filteredMatches = filteredMatches.filter(m =>
        (m.forTeam || '').toLowerCase().trim() === forTeamFilter.toLowerCase().trim()
      );
    }

    if (againstTeamFilter && againstTeamFilter.trim() !== '') {
      filteredMatches = filteredMatches.filter(m =>
        (m.againstTeam || '').toLowerCase().trim().includes(againstTeamFilter.toLowerCase().trim())
      );
    }

    if (goalTypes.length > 0) {
      filteredMatches = filteredMatches.filter(m => {
        const matchGoalTypes = Array.isArray(m.goalTypes)
          ? m.goalTypes
          : (m.goalTypes || '').split(',').map(t => t.trim());

        // Convert everything to lowercase for comparison
        const lowerMatchGoals = matchGoalTypes.map(t => t.toLowerCase());
        const lowerSelectedGoals = goalTypes.map(t => t.toLowerCase());

        // Must contain ALL selected goal types
        return lowerSelectedGoals.every(type => lowerMatchGoals.includes(type));
      });
    }


    const paginatedMatches = filteredMatches.slice(offset, offset + limit);
    // console.log(matches)
    res.render('user/mh-v', {
      matches: paginatedMatches,
      offset: offset + limit,
      limit,
      hasMore: offset + limit < filteredMatches.length,
      layout: 'layout'
    });
  });
});






// Example: routes/mhv.js

router.get('/mhv/filter', (req, res) => {
  try {
    const {
      competition,
      stage,
      season,
      year,
      minGoals,
      minAssists,
      chancesCreated,
      dribbles,
      minutesPlayed,
      forTeam,
      againstTeam,
      goalTypes,
      sortBy
    } = req.query;

    displayHelper.getStats('matches', (err, matches) => {
      if (err) {
        console.error('Error fetching matches from DB:', err);
        return res.status(500).send('Database error');
      }

      console.log("1️⃣  Total matches from DB:", matches.length);
      console.log("2️⃣  Filters received:", req.query);

      let filtered = matches.filter(m => {
        // Competition filter
        if (competition && competition !== 'All') {
          if (competition === 'International non-friendly games') {
            if (['Friendly', 'Club Friendly'].includes(m.competition)) return false;
          } else if (m.competition !== competition) return false;
        }

        // Stage filter
        if (stage && stage !== 'All') {
          if (stage === 'League Stage') {
            if (!['Group Stage', 'League Stage'].includes(m.stage)) return false;
          } else if (stage === 'Knockout') {
            if (!['Quarter-final', 'Semi-final', 'Final', 'Round of 16'].includes(m.stage)) return false;
          } else if (m.stage !== stage) return false;
        }

        if (season && season !== 'All' && m.ssn !== season) return false;
        if (year && year !== 'All' && String(new Date(m.date).getFullYear()) !== String(year)) return false;

        if (minGoals && Number(m.goals) < Number(minGoals)) return false;
        if (minAssists && Number(m.assists) < Number(minAssists)) return false;
        if (chancesCreated && Number(m.CC) < Number(chancesCreated)) return false;
        if (dribbles && Number(m.dribbles) < Number(dribbles)) return false;
        if (minutesPlayed && Number(m.mnt) < Number(minutesPlayed)) return false;

        if (forTeam && forTeam !== 'All' && m.forTeam !== forTeam) return false;
        if (againstTeam && againstTeam !== 'All' && m.againstTeam !== againstTeam) return false;

        if (goalTypes && goalTypes !== 'All') {
          const types = Array.isArray(goalTypes) ? goalTypes : [goalTypes];
          const matchGoals = (m.goalTypes || '').split(',').map(t => t.trim().toLowerCase());
          if (!types.some(type => matchGoals.includes(type.toLowerCase()))) return false;
        }

        return true;
      });

      // Sorting
      if (sortBy === 'goalsDesc') {
        filtered.sort((a, b) => b.goals - a.goals);
      } else if (sortBy === 'dateAsc') {
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
      } else {
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      console.log("3️⃣  Matches after filtering:", filtered.length);

      // Format dates
      filtered.forEach(m => m.dateFormatted = new Date(m.date).toLocaleDateString('en-GB'));
      console.log("Sending matches:", filtered);

      res.json({ matches: filtered, total: filtered.length });
    });
  } catch (err) {
    console.error('Error filtering matches:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
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
  res.render('user/pay', {
    title: 'Support the Project | Donate to MHVStats',
    description: 'Help maintain and grow MHVStats — your go-to site for comparing the stats of Mbappe, Haaland, and Vinicius. Every contribution counts!',
    header: false
  }); // Make sure views/policy.ejs (or .pug, .hbs) exists
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
  console.log(`[${new Date().toISOString()}] /vote page requested from IP: ${req.ip}`);

  displayHelper.getStats('votes', (err, votes) => {
    if (err) {
      console.error(`[${new Date().toISOString()}] Error getting stats:`, err);
      return res.status(500).send('Error loading stats');
    }

    const voteCounts = { Mbappe: 0, Haaland: 0, Vinicius: 0 };
    votes.forEach(row => {
      const name = row.player_name;
      if (voteCounts[name] !== undefined) voteCounts[name]++;
    });

    const totalVotes = voteCounts.Mbappe + voteCounts.Haaland + voteCounts.Vinicius;

    console.log(`[${new Date().toISOString()}] Vote data fetched:`, {
      Mbappe: voteCounts.Mbappe,
      Haaland: voteCounts.Haaland,
      Vinicius: voteCounts.Vinicius,
      Total: totalVotes
    });

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
      title: 'Vote for Your Favorite Player | MHVStats',
      description: 'Who is your favorite — Mbappe, Haaland, or Vinicius? Cast your vote and see who the fans support most.',
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

    // console.log(mbappe, haaland, vini)

    // Dynamically render the matching .hbs page like user/ucl.hbs, user/wc.hbs, etc.
    res.render(`user/${comp}`, {
      title: 'Mbappe vs Haaland vs Vinicius | Champions League Stats',
      description: 'Compare goals, assists, and matches in the UEFA Champions League by Mbappe, Haaland, and Vinicius.',
      canonical: '<link rel="canonical" href="https://mhvstats.xyz/club-stats/ucl" />',
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

  // SEO Title & Description
  let title = '';
  let description = '';
  let canonical = `https://mhvstats.xyz/int-Stats/${comp}`; // canonical URL

  if (comp === 'wc') {
    title = 'Mbappe vs Haaland vs Vinicius | FIFA World Cup Stats';
    description = 'Compare World Cup stats of Mbappe, Haaland, and Vinicius — including goals, assists, and appearances.';
  } else if (comp === 'copa-euro') {
    title = 'Mbappe vs Haaland vs Vinicius | Copa America & Euro Stats';
    description = 'Track and compare Copa America & Euro performances of Mbappe, Haaland, and Vinicius — goals, assists, and matches.';
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

    // console.log(mbappe_wc, haaland_wc, vini_wc, mbappe_cu, haaland_cu, vini_cu)

    res.render(`user/${comp}`, {
      title,
      description,
      canonical: `<link rel="canonical" href="${canonical}" />`,
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

    let pageTitle = '';
    let metaDescription = '';

    if (time === 'season') {
      pageTitle = 'Mbappe vs Haaland vs Vinicius | Stats by season';
      metaDescription = 'Compare football stats of Mbappe, Haaland, and Vinicius by each season from 2015-16 to 2024-25.';
    } else if (time === 'year') {
      pageTitle = 'Mbappe vs Haaland vs Vinicius | Stats by calender year';
      metaDescription = 'Yearly performance breakdown of Mbappe, Haaland, and Vinicius — goals, assists, and matches.';
    } else if (time === 'age') {
      pageTitle = 'Mbappe vs Haaland vs Vinicius | Stats by Age';
      metaDescription = 'See how Mbappe, Haaland, and Vinicius performed at different ages throughout their careers.';
    }

    res.render(`user/${time}`, {
      admin: false,
      ...data,
      title: pageTitle,
      description: metaDescription
    });
  });
});





module.exports = router;
