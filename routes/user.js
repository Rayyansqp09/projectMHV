var express = require('express');
var router = express.Router();
const db = require('../config/connection'); // adjust to your DB connection
const tableList = require('../config/table'); // your table list
const displayHelper = require('../helpers/disply');
const graphHelper = require("../helpers/graph");
const articles = require('../helpers/articles.json');
const { v4: uuidv4 } = require('uuid');
const votedIPs = new Set(); // Temporary memory; use DB/IP logs in production
const isTesting = true; // Change to false when deploying live
const Razorpay = require("razorpay");
const nodemailer = require('nodemailer');
require('dotenv').config();
const NodeCache = require('node-cache');
const graph = require('../helpers/graph');
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

const isDev = true; // true while editing, false to enable caching


router.get('/dummy', (req, res) => {
  res.render('user/dummy'); // looks for dummy.hbs inside views/
});


/* GET home page. */
router.get('/', function (req, res, next) {
  if (!isDev) {
    const cachedPage = pageCache.get('/');
    if (cachedPage) return res.send(cachedPage);
  }

  const seasons = ['last20', 'live_2025_26', 'all_time', 'alltime', 'mhhaaland', 'mhmbappe', 'mhvinicius'];

  displayHelper.getStats(seasons, (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    const mbappeStats = graphHelper.buildPlayerStats(stats['mhmbappe'], "2025-26");
    const haalandStats = graphHelper.buildPlayerStats(stats['mhhaaland'], "2025-26");
    const viniStats = graphHelper.buildPlayerStats(stats['mhvinicius'], "2025-26");


    // Last 20 stats
    const last20Stats = stats['last20'] || [];
    const mbappe_last20 = last20Stats.find(p => p.Name === 'Mbappe') || {};
    const haaland_last20 = last20Stats.find(p => p.Name === 'Haaland') || {};
    const vini_last20 = last20Stats.find(p => p.Name === 'Vinicius') || {};

    // All-time stats
    const allTimeStats = stats['alltime'] || [];
    const mbappe = allTimeStats.find(p => p.Name === 'Mbappe') || {};
    const haaland = allTimeStats.find(p => p.Name === 'Haaland') || {};
    const vini = allTimeStats.find(p => p.Name === 'Vinicius') || {};

    // All-time stats
    const allTimeStats_ach = stats['all_time'] || [];
    const mbappe_ach = allTimeStats_ach.find(p => p.Name === 'Mbappe') || {};
    const haaland_ach = allTimeStats_ach.find(p => p.Name === 'Haaland') || {};
    const vini_ach = allTimeStats_ach.find(p => p.Name === 'Vinicius') || {};


    // Latest season stats (2024_25)
    const season = 'live_2025_26';
    const cleanKey = season.replace(/_/g, '');
    const seasonStats = stats[season] || [];

    const mbappeSeason = seasonStats.find(p => p.Name === 'Mbappe') || {};
    const haalandSeason = seasonStats.find(p => p.Name === 'Haaland') || {};
    const viniciusSeason = seasonStats.find(p => p.Name === 'Vinicius') || {};

    // 🔥 Get last 5 matches for each player
    function getLastFiveMatches(playerKey) {
      const matches = stats[playerKey] || [];
      return matches
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // latest first
        .slice(0, 5);
    }

    const mbappeMatches = getLastFiveMatches('mhmbappe');
    const haalandMatches = getLastFiveMatches('mhhaaland');
    const viniciusMatches = getLastFiveMatches('mhvinicius');

    // Final data
    const data = {
      admin: false,
      canonical: '<link rel="canonical" href="https://mhvstats.xyz/" />',

      mbappe_ach,
      haaland_ach,
      vini_ach,
      mbappe,
      haaland,
      vini,
      mbappe_last20,
      haaland_last20,
      vini_last20,
      [`mbappe_${cleanKey}`]: mbappeSeason,
      [`haaland_${cleanKey}`]: haalandSeason,
      [`vinicius_${cleanKey}`]: viniciusSeason,
      [`season_${cleanKey}`]: seasonStats,

      // 👇 last 5 matches for home page
      mbappeMatches,
      haalandMatches,
      viniciusMatches
    };



    res.render('index', {
      graph: {
        mbappe: mbappeStats,
        haaland: haalandStats,
        vinicius: viniStats
      },
      ...data
    }, (err, html) => {
      if (err) {
        console.error("❌ Error rendering index:", err);
        return res.status(500).render('error', {
          message: "Something went wrong while loading the page.",
          error: {
            status: err.status || 500,
            stack: err.stack || err.toString()
          }
        });
      }

      pageCache.set('/', html);   // 🔥 Cache it!
      res.send(html);
    });
  });
});


router.get('/alltime', function (req, res, next) {
  if (!isDev) {
    const cachedPage = pageCache.get('/alltime');
    if (cachedPage) return res.send(cachedPage);
  }

  displayHelper.getStats(['all_time', 'alltime'], (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    // === all_time table ===
    const mbappe_alltime = stats.all_time.find(p => p.Name === 'Mbappe') || {};
    const haaland_alltime = stats.all_time.find(p => p.Name === 'Haaland') || {};
    const vini_alltime = stats.all_time.find(p => p.Name === 'Vinicius') || {};

    // === alltime table ===
    const mbappe = stats.alltime.find(p => p.Name === 'Mbappe') || {};
    const haaland = stats.alltime.find(p => p.Name === 'Haaland') || {};
    const vini = stats.alltime.find(p => p.Name === 'Vinicius') || {};

    res.render('user/alltime', {
      title: 'All-Time Goal Scoring Stats | Mbappe vs Haaland vs Vinicius',
      description: 'Compare all-time goal stats: hattricks, pokers, free-kick goals, and final match goals of Mbappe, Haaland, and Vinicius.',
      admin: false,

      // alltime table
      mbappe,
      haaland,
      vini,

      // all_time table
      mbappe_alltime,
      haaland_alltime,
      vini_alltime
    }, (err, html) => {
      if (err) return res.status(500).send('Error rendering page');
      pageCache.set('/alltime', html); // Cache the rendered HTML
      res.send(html);
    });
  });
});


router.get('/club-stats', function (req, res, next) {
  if (!isDev) {
    const cachedPage = pageCache.get('/club-stats');
    if (cachedPage) return res.send(cachedPage);
  }

  displayHelper.getStats(['alltime', 'club2', 'ucl2'], (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    const mbappe_all = stats.alltime.find(p => p.Name === 'Mbappe');
    const mbappe_club = stats.club2.find(p => p.Name === 'Mbappe');
    const mbappe_ucl = stats.ucl2.find(p => p.Name === 'Mbappe');

    const haaland_all = stats.alltime.find(p => p.Name === 'Haaland');
    const haaland_club = stats.club2.find(p => p.Name === 'Haaland');
    const haaland_ucl = stats.ucl2.find(p => p.Name === 'Haaland');

    const vini_all = stats.alltime.find(p => p.Name === 'Vinicius');
    const vini_club = stats.club2.find(p => p.Name === 'Vinicius');
    const vini_ucl = stats.ucl2.find(p => p.Name === 'Vinicius');

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
      vini_club,
      mbappe_ucl, haaland_ucl, vini_ucl
    }, (err, html) => {
      if (err) return res.status(500).send('Error rendering page');
      pageCache.set('/club-stats', html); // Cache the rendered HTML
      res.send(html);
    });
  });
});

router.get('/int-stats', function (req, res, next) {
  if (!isDev) {
    const cachedPage = pageCache.get('/int-stats');
    if (cachedPage) return res.send(cachedPage);
  }

  displayHelper.getStats(['alltime', 'intr', 'intr2'], (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }
    const mbappe_all = stats.alltime.find(p => p.Name === 'Mbappe');
    const mbappe_intr = stats.intr2.find(p => p.Name === 'Mbappe');
    const mbappe_intr1 = stats.intr.find(p => p.Name === 'Mbappe');

    const haaland_all = stats.alltime.find(p => p.Name === 'Haaland');
    const haaland_intr = stats.intr2.find(p => p.Name === 'Haaland');
    const haaland_intr1 = stats.intr.find(p => p.Name === 'Haaland');


    const vini_all = stats.alltime.find(p => p.Name === 'Vinicius');
    const vini_intr = stats.intr2.find(p => p.Name === 'Vinicius');
    const vini_intr1 = stats.intr.find(p => p.Name === 'Vinicius');


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
      vini_intr,
      vini_intr1, mbappe_intr1, haaland_intr1
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


// 👇 Place this BEFORE your /Match-History/:player route
router.get('/mhv', (req, res) => {
  const player = (req.query.player || 'mbappe').toLowerCase();

  // keep query params (like offset, limit, stage, etc.)
  const query = { ...req.query };
  delete query.player; // remove old 'player' param since it's in the path now

  const queryString = new URLSearchParams(query).toString();
  const redirectUrl = `/Match-History/${player}${queryString ? '?' + queryString : ''}`;

  res.redirect(301, redirectUrl); // permanent redirect for SEO
});


router.get('/Match-History/:player', (req, res) => {
  const player = req.params.player.toLowerCase(); // <-- from path, not query
  const limit = parseInt(req.query.limit) || 0;
  const offset = parseInt(req.query.offset) || 0;

  const competitionFilter = req.query.competition || '';
  const stageFilter = req.query.stage || '';
  const resultFilter = req.query.result || '';
  const seasonFilter = req.query.season || 'All';
  const yearFilter = req.query.year || 'All';
  const minCC = parseInt(req.query.CC) || 0;
  const minDribbles = parseInt(req.query.dribbles) || 0;
  const minMnt = parseInt(req.query.mnt) || 0;
  const forTeamFilter = req.query.forTeam || 'All';
  const againstTeamFilter = req.query.againstTeam || '';
  const sortOption = req.query.sort || '';
  const minGoals = parseInt(req.query.minGoals) || 0;
  const minAssists = parseInt(req.query.minAssists) || 0;
  const goalTypes = req.query.goalTypes ? req.query.goalTypes.split(',') : [];
  // New filters
  const matchNoFilter = req.query.matchNo || '';
  const matchDateFilter = req.query.matchDate; // expected format 'YYYY-MM-DD'

  const tableMap = {
    mbappe: 'mhmbappe',
    haaland: 'mhhaaland',
    vinicius: 'mhvinicius'
  };

  const tableName = tableMap[player];

  // 👇 Add short + full names
  const playerNames = {
    mbappe: { name: 'Mbappé', full: 'Kylian Mbappé' },
    haaland: { name: 'Haaland', full: 'Erling Haaland' },
    vinicius: { name: 'Vinícius', full: 'Vinícius Júnior' }
  };

  const playerInfo = playerNames[player.toLowerCase()] || { name: 'Player', full: 'Player Stats' };


  displayHelper.getStats(tableName, (err, matches) => {
    if (err) return res.status(500).send('Error loading matches');

    matches.forEach(m => m.dateFormatted = new Date(m.date).toLocaleDateString('en-GB'));

    let filteredMatches = matches;

    // Existing filters
    if (competitionFilter && competitionFilter !== 'All') {
      const allowedCompetitions = competitionFilter.split(',').map(s => s.trim().toLowerCase());
      filteredMatches = filteredMatches.filter(m =>
        allowedCompetitions.includes((m.competition || '').toLowerCase().trim())
      );
    }

    if (stageFilter && stageFilter !== 'All') {
      const selectedStages = stageFilter.split(',').map(s => s.toLowerCase().trim());
      const knockoutStages = [
        'round of 16', 'round of 32', 'round of 64', 'round of 128',
        'quarter final', 'semi final', 'playoffs', 'play-offs', 'final',
        '3rd place', 'third-place', 'second stage', 'knockout play-offs',
        'preliminary round', 'third round', 'second round', 'play-off round',
        'first round'
      ];

      filteredMatches = filteredMatches.filter(m => {
        const mStage = (m.stage || '').toLowerCase().trim();
        return selectedStages.some(stageLower => {
          stageLower = stageLower.toLowerCase().trim();
          if (stageLower === 'knockout') {
            return knockoutStages.some(stage => stage.toLowerCase().trim() === mStage);
          }
          if (stageLower === 'league stage') {
            return /^matchweek\s*\d+$/i.test(mStage) ||
              /^matchday\s*\d+$/i.test(mStage) ||
              mStage === 'league phase';
          }
          return mStage === stageLower;


        });
      });
    }

    if (seasonFilter && seasonFilter !== 'All') {
      filteredMatches = filteredMatches.filter(m => (m.season || '').toLowerCase().trim() === seasonFilter.toLowerCase().trim());
    }

    if (minGoals > 0) filteredMatches = filteredMatches.filter(m => m.goals >= minGoals);
    if (minAssists > 0) filteredMatches = filteredMatches.filter(m => m.assists >= minAssists);
    if (resultFilter && resultFilter !== 'All') filteredMatches = filteredMatches.filter(m => (m.result || '').toLowerCase().trim() === resultFilter.toLowerCase().trim());
    if (yearFilter && yearFilter !== 'All') filteredMatches = filteredMatches.filter(m => new Date(m.date).getFullYear().toString() === yearFilter);
    if (minCC > 0) filteredMatches = filteredMatches.filter(m => m.CC >= minCC);
    if (minDribbles > 0) filteredMatches = filteredMatches.filter(m => m.dribbles >= minDribbles);
    if (minMnt > 0) filteredMatches = filteredMatches.filter(m => m.mnt >= minMnt);
    if (forTeamFilter && forTeamFilter !== 'All') {
      const allowedTeams = forTeamFilter.split(',').map(s => s.trim().toLowerCase());
      filteredMatches = filteredMatches.filter(m => {
        const team = (m.forTeam || '').toLowerCase().trim();
        return allowedTeams.includes(team);
      });
    }
    if (againstTeamFilter && againstTeamFilter.trim() !== '') filteredMatches = filteredMatches.filter(m => (m.againstTeam || '').toLowerCase().trim().includes(againstTeamFilter.toLowerCase().trim()));
    if (goalTypes.length > 0) {
      filteredMatches = filteredMatches.filter(m => {
        const matchGoalTypes = Array.isArray(m.goalTypes) ? m.goalTypes : (m.goalTypes || '').split(',').map(t => t.trim());
        return goalTypes.map(t => t.toLowerCase()).every(type => matchGoalTypes.map(t => t.toLowerCase()).includes(type));
      });
    }

    // Match No filter
    if (matchNoFilter) filteredMatches = filteredMatches.filter(m => m.No == matchNoFilter);

    if (req.query.matchDate) {
      const inputDate = req.query.matchDate; // "2025-08-24"
      filteredMatches = filteredMatches.filter(m => {
        const matchDate = new Date(m.date);
        const yyyy = matchDate.getFullYear();
        const mm = String(matchDate.getMonth() + 1).padStart(2, '0');
        const dd = String(matchDate.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}` === inputDate;
      });
    }


    // Sorting
    if (sortOption === 'dateAsc') filteredMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
    else filteredMatches.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalGoals = filteredMatches.reduce((sum, m) => sum + (Number(m.goals) || 0), 0);
    const totalAssists = filteredMatches.reduce((sum, m) => sum + (Number(m.assists) || 0), 0);

    const totalFilteredMatches = filteredMatches.length;
    const paginatedMatches = filteredMatches.slice(offset, offset + limit);

    // Unique dynamic filters
    function normalizeText(str) { return (str || '').toLowerCase().trim(); }
    const uniqueForTeams = Array.from(new Map(filteredMatches.map(m => [normalizeText(m.forTeam), m.forTeam])).values());
    const uniqueCompetitions = Array.from(new Map(filteredMatches.map(m => [normalizeText(m.competition), m.competition])).values());

    const ogImages = {
      mbappe: "https://mhvstats.xyz/images/mbappe2.webp",
      haaland: "https://mhvstats.xyz/images/haaland2.webp",
      vinicius: "https://mhvstats.xyz/images/vinicius2.webp"
    };

    // console.log("Player:", player, "Table:", tableName, "Query Params:", req.query);
    //  console.log(matches)

    res.render('user/mh-v', {
      matches: paginatedMatches,
      offset: offset + limit,
      limit,
      hasMore: offset + limit < totalFilteredMatches,
      totalMatches: totalFilteredMatches,
      showingMatches: offset + paginatedMatches.length,
      dynamicFilters: { forTeam: uniqueForTeams, competition: uniqueCompetitions },
      totalGoals,
      totalAssists,
      playerName: playerInfo.name,       // 👈 Short name
      playerFullName: playerInfo.full,  // 👈 Full name

      // 👇 Pass SEO variables
      title: `All Matches ${playerInfo.name} | Match History & Stats | MHV`,
      description: `${playerInfo.full} complete match history with advanced filters on MHV.`,
      ogImage: ogImages[player.toLowerCase()] || "https://mhvstats.xyz/images/seo-preview.png", // 👈
      canonical: `<link rel="canonical" href="https://mhvstats.xyz/Match-History/${player}">`,
      layout: 'layout'
    });
  });
});

router.get('/Haaland', (req, res) => {
  res.render('user/Haaland'); // looks for dummy.hbs inside views/
});

router.get('/Mbappe', (req, res) => {
  res.render('user/Mbappe'); // looks for dummy.hbs inside views/
});

router.get('/Vinicius', (req, res) => {
  res.render('user/Vinicius'); // looks for dummy.hbs inside views/
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
    const text = `Report from: ${email}\n\nInaccurate Stat Title or Match Date/No: ${statTitle}\nCurrent Stat: ${currentStat}\nCorrect Stat: ${correctStat}\nExtra Details: ${extra || 'N/A'}`;

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

router.get('/faq', (req, res) => {
  displayHelper.getStats('faq', (err, faqData) => {
    if (err) {
      console.error('Error getting FAQ:', err);
      return res.status(500).send('Error loading FAQ');
    }

    // console.log('FAQ data fetched:', faqData);

    // --- SPLIT DATA BY CATEGORY ---
    const statistics = faqData.filter(item => item.type === 'Statistics & Records');
    const technical = faqData.filter(item => item.type === 'Technical');
    const about = faqData.filter(item => item.type === 'About Us');
    const support = faqData.filter(item => item.type === 'Support & Contact');

    // Render
    res.render('user/faq', {
      statistics,
      technical,
      about,
      support
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

  displayHelper.getStats(['ucl2', 'ucl', 'club'], (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }


    const mbappe_club = stats.club.find(p => p.Name === 'Mbappe');
    const haaland_club = stats.club.find(p => p.Name === 'Haaland');
    const vini_club = stats.club.find(p => p.Name === 'Vinicius');

    const mbappe = stats.ucl2.find(p => p.Name === 'Mbappe');
    const haaland = stats.ucl2.find(p => p.Name === 'Haaland');
    const vini = stats.ucl2.find(p => p.Name === 'Vinicius');

    const mbappe_ach = stats.ucl.find(p => p.Name === 'Mbappe');
    const haaland_ach = stats.ucl.find(p => p.Name === 'Haaland');
    const vini_ach = stats.ucl.find(p => p.Name === 'Vinicius');

    // console.log(mbappe, haaland, vini)

    // Dynamically render the matching .hbs page like user/ucl.hbs, user/wc.hbs, etc.
    res.render(`user/${comp}`, {
      title: 'Mbappe vs Haaland vs Vinicius | Champions League Stats',
      description: 'Compare goals, assists, and matches in the UEFA Champions League by Mbappe, Haaland, and Vinicius.',
      canonical: '<link rel="canonical" href="https://mhvstats.xyz/club-stats/ucl" />',
      admin: false,
      mbappe,
      haaland,
      vini,
      mbappe_club,
      haaland_club,
      vini_club,
      vini_ach,
      haaland_ach,
      mbappe_ach
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
  displayHelper.getStats(['intr2', 'wc', 'wc_live', 'copa_euro', 'copa_euro_live'], (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    const mbappe_wc = stats.wc_live.find(p => p.Name === 'Mbappe');
    const haaland_wc = stats.wc_live.find(p => p.Name === 'Haaland');
    const vini_wc = stats.wc_live.find(p => p.Name === 'Vinicius');

    const mbappe_wc_ach = stats.wc.find(p => p.Name === 'Mbappe');
    const haaland_wc_ach = stats.wc.find(p => p.Name === 'Haaland');
    const vini_wc_ach = stats.wc.find(p => p.Name === 'Vinicius');

    const mbappe_cu = stats.copa_euro_live.find(p => p.Name === 'Mbappe');
    const haaland_cu = stats.copa_euro_live.find(p => p.Name === 'Haaland');
    const vini_cu = stats.copa_euro_live.find(p => p.Name === 'Vinicius');

    const mbappe_cu_ach = stats.copa_euro.find(p => p.Name === 'Mbappe');
    const haaland_cu_ach = stats.copa_euro.find(p => p.Name === 'Haaland');
    const vini_cu_ach = stats.copa_euro.find(p => p.Name === 'Vinicius');

    const mbappe_all = stats.intr2.find(p => p.Name === 'Mbappe');
    const haaland_all = stats.intr2.find(p => p.Name === 'Haaland');
    const vini_all = stats.intr2.find(p => p.Name === 'Vinicius');


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
      vini_cu, vini_cu_ach, mbappe_cu_ach, haaland_cu_ach,
      vini_all, mbappe_all, haaland_all,
      vini_wc_ach, haaland_wc_ach, mbappe_wc_ach
    });
  });
});


router.get('/:time', function (req, res, next) {
  const time = req.params.time;

  const allowedTimes = ['season', 'year', 'age'];
  if (!allowedTimes.includes(time)) {
    const err = new Error('Oops! The page you are looking for does not exist.');
    err.status = 404;
    return next(err);
  }

  const seasons = [
    'live_2015_16', 'live_2016_17', 'live_2017_18', 'live_2018_19', 'live_2019_20',
    'live_2020_21', 'live_2021_22', 'live_2022_23', 'live_2023_24', 'live_2024_25', 'live_2025_26'
  ];

  const years = [
    'live2015', 'live2016', 'live2017', 'live2018', 'live2019',
    'live2020', 'live2021', 'live2022', 'live2023', 'live2024', 'live2025'
  ];

  let tables = [];
  if (time === 'season') {
    tables = seasons;
  } else if (time === 'year') {
    tables = years;
  } else if (time === 'age') {
    tables = ages; // make sure you have an ages array defined
  }

  displayHelper.getStats(tables, (err, stats) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).send('Error loading stats');
    }

    const data = {};

    for (const tableName of tables) {
      // Generate clean key for template
      let cleanKey = '';
      if (time === 'season') {
        cleanKey = tableName.replace(/_/g, ''); // Remove ALL underscores // e.g., 2024_25 → 202425
      } else if (time === 'year') {
        cleanKey = tableName.replace('year', ''); // e.g., year2015 → 2015
      } else if (time === 'age') {
        cleanKey = tableName.replace('age', ''); // e.g., age21 → 21
      }

      const table = stats[tableName] || [];

      const mbappe = table.find(p => p.Name === 'Mbappe') || {};
      const haaland = table.find(p => p.Name === 'Haaland') || {};
      const vinicius = table.find(p => p.Name === 'Vinicius') || {};

      // Use same key format as your season HBS template
      data[`mbappe_${cleanKey}`] = mbappe;
      data[`haaland_${cleanKey}`] = haaland;
      data[`vinicius_${cleanKey}`] = vinicius;

      // optional: store full table if needed
      data[`${time}_${cleanKey}`] = table;
    }

    let pageTitle = '';
    let metaDescription = '';
    if (time === 'season') {
      pageTitle = 'Mbappe vs Haaland vs Vinicius | Stats by season';
      metaDescription = 'Compare football stats of Mbappe, Haaland, and Vinicius by each season from 2015-16 to 2024-25.';
    } else if (time === 'year') {
      pageTitle = 'Mbappe vs Haaland vs Vinicius | Stats by calendar year';
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

// Dynamic route for all player articles
router.get('/:player/:article', (req, res) => {
  const { player, article } = req.params;

  const data = articles[player]?.[article];

  if (!data) {
    return res.status(404).render('user/article', { head: "off", title: "Article Not Found", content: ["<p>Sorry, this article does not exist.</p>"] });
  }

  // Render your article.hbs template
  res.render('user/article', {
    head: "off",       // keep your existing head option
    title: data.title,
    content: data.content,
    description: data.description,  // NEW
    date: data.date,
    related: data.related
  });
});




module.exports = router;
