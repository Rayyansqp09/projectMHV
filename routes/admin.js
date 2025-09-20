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
  if (!isDev) {
    const cachedPage = pageCache.get('/');
    if (cachedPage) return res.send(cachedPage);
  }

  const seasons = ['2025_26', 'all_time', 'mhhaaland', 'mhmbappe', 'mhvinicius'];

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
    const season = '2025_26';
    const cleanKey = season.replace('_', '');
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
      admin: true,
      canonical: '<link rel="canonical" href="https://mhvstats.xyz/" />',

      mbappe,
      haaland,
      vini,
      [`mbappe_${cleanKey}`]: mbappeSeason,
      [`haaland_${cleanKey}`]: haalandSeason,
      [`vinicius_${cleanKey}`]: viniciusSeason,
      [`season_${cleanKey}`]: seasonStats,

      // 👇 last 5 matches for home page
      mbappeMatches,
      haalandMatches,
      viniciusMatches
    };

res.render('index', data, (err, html) => {
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


// router.get('/sts-update', function(req, res) {
//   res.send('GET /sts-update route');
// });

router.post('/sts-update', upload.none(), function (req, res) {
  const formData = req.body;
  console.log(`[${new Date().toISOString()}] 🛠️ Admin requested stats update:`, formData);

  const tableName = formData.tablename;
  delete formData.tablename;

  // ✅ Remove frontend helper fields
  delete formData.customStatName;
  delete formData.customStatValue;

  displayHelper.updateStats(tableName, formData, function (err, result) {
    if (err) {
      console.error(`[${new Date().toISOString()}] ❌ Failed to update stats for table "${tableName}":`, err);
      return res.status(500).send('Database update failed.');
    }

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

router.post('/add-match', async (req, res) => {
  try {
    console.log('Form Data Received:', req.body); // Debug

    const { playerTable, ...matchData } = req.body; // playerTable: table name for the selected player

    // Wrap callback in a Promise for await
    await new Promise((resolve, reject) => {
      displayHelper.addMatch(playerTable, matchData, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    res.json({ success: true, message: 'Match added successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to add match' });
  }
});

// Single router to handle modify or delete
router.post('/match-action', (req, res) => {
  const { matchNumber, action, data, playerTable } = req.body;

  if (!matchNumber || !action) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  if (action === 'modify') {
    // Call helper function to modify match using callback
    displayHelper.modifyMatch(playerTable, matchNumber, data, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'Failed to modify match' });
      }
      res.json({ success: true, message: 'Match updated successfully!' });
    });

  } else if (action === 'delete') {
    // Call helper function to delete match using callback
    displayHelper.deleteMatch(playerTable, matchNumber, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'Failed to delete match' });
      }
      res.json({ success: true, message: 'Match deleted successfully!' });
    });

  } else {
    return res.status(400).json({ success: false, error: 'Invalid action' });
  }
});

router.get('/get-match/:matchNumber', (req, res) => {
  const { matchNumber } = req.params;
  const { playerTable } = req.query;

  if (!matchNumber || !playerTable) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  displayHelper.getStats(playerTable, (err, allMatches) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: 'Server error' });
    }

    const match = allMatches.find(row => row.No == matchNumber);

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    // ✅ Convert date to YYYY-MM-DD for input[type="date"]
    if (match.date) {
      if (match.date instanceof Date) {
        match.date = match.date.toISOString().split('T')[0];
      } else if (typeof match.date === 'string') {
        const [day, month, year] = match.date.split("/");
        match.date = `${year}-${month}-${day}`;
      }
    }

    res.json({ success: true, match });
  });
});

router.get('/Match-History/:player', (req, res) => {
  const player = req.params.player.toLowerCase(); // <-- from path, not query
  const limit = parseInt(req.query.limit) || 10;
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
      const knockoutStages = ['round of 16', 'quarter final', 'semi final', 'playoffs', 'final', '3rd place', 'second stage', 'knockout play-offs', 'preliminary round'];

      filteredMatches = filteredMatches.filter(m => {
        const mStage = (m.stage || '').toLowerCase().trim();
        return selectedStages.some(stageLower => {
          if (stageLower === 'knockout') return knockoutStages.includes(mStage);
          if (stageLower === 'league stage') return /^matchweek\s*\d+$/i.test(m.stage || '') || (!knockoutStages.includes(mStage) && mStage !== 'group stage');
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
    if (forTeamFilter && forTeamFilter !== 'All') filteredMatches = filteredMatches.filter(m => (m.forTeam || '').toLowerCase().trim() === forTeamFilter.toLowerCase().trim());
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
      admin: true,

      // 👇 Pass SEO variables
      title: `All Matches ${playerInfo.name} | Match History & Stats | MHV`,
      description: `${playerInfo.full} complete match history with advanced filters on MHV.`,
      ogImage: ogImages[player.toLowerCase()] || "https://mhvstats.xyz/images/seo-preview.png", // 👈
      canonical: `<link rel="canonical" href="https://mhvstats.xyz/Match-History/${player}">`,
      layout: 'layout'
    });
  });
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
      admin: true,
      voteData,
      totalVotes
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
