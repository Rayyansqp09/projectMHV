const db = require('../config/connection');
const displayHelper = require('../helpers/disply');

// 🔥 Keep it here
function getPlayerTable(player) {
  switch (player.toLowerCase()) {
    case 'mbappe':
      return 'mhmbappe';
    case 'haaland':
      return 'mhhaaland';
    case 'vinicius':
      return 'mhvinicius';
    default:
      throw new Error('Invalid player');
  }
}

function isFinalStage(stage) {
  if (!stage) return false;

  const s = String(stage).toLowerCase().trim();

  return s === 'final' || s === 'final (1st leg)';
}

function getSeasonStats(player, season) {
  const connection = db.get();
  const table = getPlayerTable(player);

  return new Promise((resolve, reject) => {
    connection.query(
      `
      SELECT 
        COUNT(*) AS games,
        COALESCE(SUM(goals), 0) AS goals,
        COALESCE(SUM(assists), 0) AS assists,
        COALESCE(SUM(Shot), 0) AS shot,
        COALESCE(SUM(CC), 0) AS CC,
        COALESCE(SUM(BCC), 0) AS BCC,
        COALESCE(SUM(dribbles), 0) AS dribbles,
        COALESCE(SUM(mnt), 0) AS minutes
      FROM ${table}
      WHERE season = ?
      `,
      [season],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      }
    );
  });
}

function getYearStats(player, year) {
  const connection = db.get();
  const table = getPlayerTable(player);

  return new Promise((resolve, reject) => {
    connection.query(
      `
      SELECT 
        COUNT(*) AS games,
        COALESCE(SUM(goals), 0) AS goals,
        COALESCE(SUM(assists), 0) AS assists,
        COALESCE(SUM(Shot), 0) AS shot,
        COALESCE(SUM(CC), 0) AS CC,
        COALESCE(SUM(BCC), 0) AS BCC,
        COALESCE(SUM(dribbles), 0) AS dribbles,
        COALESCE(SUM(mnt), 0) AS minutes
      FROM ${table}
      WHERE YEAR(date) = ?
      `,
      [year],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      }
    );
  });
}

async function getGoalSummaryStats(player, matchData) {
  const playerLower = player.toLowerCase();
  const favOpponentView = `favOpponent_${playerLower}`;
  const clubView = `${playerLower}_club`;
  const currentYear = new Date(matchData.date).getFullYear();
  const playerTable = getPlayerTable(player);

  return new Promise((resolve, reject) => {
    displayHelper.getStats(['alltime', favOpponentView, clubView], async (err, data) => {
      if (err) return reject(err);

      try {
        const alltimeRow = data['alltime'].find(
          row => row.Name.toLowerCase() === playerLower
        );

        const favOpponentRow = data[favOpponentView].find(
          row => row.team?.trim().toLowerCase() === matchData.againstTeam?.trim().toLowerCase()
        );

        const clubRow = data[clubView].find(
          row => row.club?.trim().toLowerCase() === matchData.forTeam?.trim().toLowerCase()
        );

        const connection = db.get();

        // Year goals
        const yearGoals = await new Promise((resolveYear, rejectYear) => {
          connection.query(
            `SELECT COALESCE(SUM(goals), 0) AS goals FROM ${playerTable} WHERE YEAR(date) = ?`,
            [currentYear],
            (err, rows) => {
              if (err) rejectYear(err);
              else resolveYear(rows[0].goals || 0);
            }
          );
        });

        // Season goals
        const seasonGoals = await new Promise((resolveSeason, rejectSeason) => {
          connection.query(
            `SELECT COALESCE(SUM(goals), 0) AS goals FROM ${playerTable} WHERE season = ?`,
            [matchData.season],
            (err, rows) => {
              if (err) rejectSeason(err);
              else resolveSeason(rows[0].goals || 0);
            }
          );
        });

        // League goals (same competition as current match)
        const competitionGoals = await new Promise((resolveComp, rejectComp) => {
          connection.query(
            `SELECT COALESCE(SUM(goals), 0) AS goals
     FROM ${playerTable}
     WHERE competition = ?`,
            [matchData.competition],
            (err, rows) => {
              if (err) rejectComp(err);
              else resolveComp(rows[0].goals || 0);
            }
          );
        });

        resolve({
          goalsVsOpponent: favOpponentRow?.goals || 0,
          careerGoals: alltimeRow?.Goals || 0,
          clubGoals: alltimeRow?.clubGoals || 0,
          currentClubGoals: clubRow?.goals || 0,
          competitionGoals,
          yearGoals,
          seasonGoals
        });
      } catch (innerErr) {
        reject(innerErr);
      }
    });
  });
}

function createGoalSummaryPost(player, matchData, stats) {
  if ((Number(matchData.goals) || 0) <= 0) return null;

  return {
    post_type: 'goal_summary',
    title: `${player} scored and now has...`,
    content:
      `🚨 ${player} scored ${matchData.goals} goal${Number(matchData.goals) > 1 ? 's' : ''} against ${matchData.againstTeam} in his last game.

And with that, he now has:

⚽ ${stats.goalsVsOpponent} goals vs ${matchData.againstTeam}
🎯 ${stats.careerGoals} career goals
🏟️ ${stats.clubGoals} club goals
🤍 ${stats.currentClubGoals} goals for ${matchData.forTeam}
🏆 ${stats.competitionGoals} ${matchData.competition} goals
📅 ${stats.yearGoals} goals in ${new Date(matchData.date).getFullYear()}
🔥 ${stats.seasonGoals} goals in the ${matchData.season} season`
  };
}

function createMatchPost(player, match) {
  console.log('Creating match post with data:', match);
  return {
    post_type: 'match',
    title: `${player} vs ${match.againstTeam}`,
    content:
      `📊 ${player}'s latest game vs ${match.againstTeam} :

⚽ ${match.goals || 0} Goals
🅰️ ${match.assists || 0} Assists
🎯 ${match.shot || 0} Shots on Target
🎨 ${match.CC || 0} Chances Created
🔥 ${match.BCC || 0} Big Chances Created
⚡ ${match.dribbles || 0} Dribbles Completed`
  };
}

function createSeasonPost(player, stats, season) {
  return {
    post_type: 'season_so_far',
    title: `${player} ${season} season so far`,
    content:
      `📊 ${player} in ${season} So Far  ⚔️👇🏻

👕 ${stats.games} Games   
⚽ ${stats.goals} Goals
🅰️ ${stats.assists} Assists
🎯 ${stats.shot || 0} Shots on Target
👟 ${stats.CC || 0} Chance Created 
🥅 ${stats.BCC || 0} Big Chance Created
🪄 ${stats.dribbles || 0} Successful Dribbles 

${stats.goals + stats.assists} G/A in ${stats.games} Games 😮‍💨🔥
`
  };
}

function createYearPost(player, stats, year) {
  return {
    post_type: 'year_so_far',
    title: `${player} ${year} so far`,
    content:
`📊 ${player} in ${year} So Far  ⚔️👇🏻

👕 ${stats.games} Games   
⚽ ${stats.goals} Goals
🅰️ ${stats.assists} Assists
🎯 ${stats.shot || 0} Shots on Target
👟 ${stats.CC || 0} Chance Created 
🥅 ${stats.BCC || 0} Big Chance Created
🪄 ${stats.dribbles || 0} Successful Dribbles 

${stats.goals + stats.assists} G/A in ${stats.games} Games 😮‍💨🔥
`
  };
}

async function getLast10Matches(player) {
  const table = getPlayerTable(player);
  const connection = db.get();

  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT againstTeam, goals, assists
       FROM ${table}
       ORDER BY date DESC
       LIMIT 10`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function createLast10Post(player, matches) {
  const lines = matches.map(match => {
    const goals = Number(match.goals) || 0;
    const assists = Number(match.assists) || 0;

    let output = '';

    if (goals === 0 && assists === 0) {
      output = '❌';
    } else {
      output = '⚽'.repeat(goals) + '🅰️'.repeat(assists);
    }

    return `${output} 🆚 ${match.againstTeam}`;
  });

  const totalGoals = matches.reduce((sum, m) => sum + (Number(m.goals) || 0), 0);
  const totalAssists = matches.reduce((sum, m) => sum + (Number(m.assists) || 0), 0);
  const totalGA = totalGoals + totalAssists;

  return {
    post_type: 'last_10',
    title: `${player} last 10 games`,
    content:
      `📊 ${player} in Last ${matches.length} Games 👇🏻

${lines.join('\n')}

⚽ ${totalGoals} Goals
🅰️ ${totalAssists} Assists

${totalGA} G/A in ${matches.length} Games 😮‍💨 🔥`
  };
}

function getAllTimeStats(player) {
  const connection = db.get();
  const table = getPlayerTable(player);

  return new Promise((resolve, reject) => {
    connection.query(
      `
      SELECT 
        COUNT(*) AS games,
        COALESCE(SUM(goals), 0) AS goals,
        COALESCE(SUM(assists), 0) AS assists
      FROM ${table}
      `,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      }
    );
  });
}

function getContributionEmoji(goals, assists) {
  if (goals === 0 && assists === 0) return '❌';

  let line = '';

  if (goals > 0) line += goals <= 4 ? '⚽'.repeat(goals) : `⚽x${goals}`;
  if (assists > 0) line += assists <= 3 ? '🅰️'.repeat(assists) : `🅰️x${assists}`;

  return line;
}

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getScoringStreak(player) {
  const playerTable = getPlayerTable(player);
  const connection = db.get();

  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT againstTeam, goals, assists
       FROM ${playerTable}
       ORDER BY date DESC`,
      (err, rows) => {
        if (err) return reject(err);

        const matches = [];
        let streak = 0;

        for (const row of rows) {
          if ((Number(row.goals) || 0) > 0) {
            streak++;
            matches.push({
              againstTeam: row.againstTeam,
              goals: Number(row.goals) || 0,
              assists: Number(row.assists) || 0
            });
          } else {
            break;
          }
        }

        resolve({ streak, matches });
      }
    );
  });
}

function getHatTrickStreak(player) {
  const playerTable = getPlayerTable(player);
  const connection = db.get();

  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT againstTeam, goals, assists
       FROM ${playerTable}
       ORDER BY date DESC`,
      (err, rows) => {
        if (err) return reject(err);

        const matches = [];
        let streak = 0;

        for (const row of rows) {
          if ((Number(row.goals) || 0) >= 3) {
            streak++;
            matches.push({
              againstTeam: row.againstTeam,
              goals: Number(row.goals) || 0,
              assists: Number(row.assists) || 0
            });
          } else {
            break;
          }
        }

        resolve({ streak, matches });
      }
    );
  });
}

async function getCompetitionSummaryStats(player, matchData) {
  const playerTable = getPlayerTable(player);
  const connection = db.get();

  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT 
          COUNT(*) AS games,
          COALESCE(SUM(goals), 0) AS goals,
          COALESCE(SUM(assists), 0) AS assists
       FROM ${playerTable}
       WHERE competition = ?`,
      [matchData.competition],
      (err, rows) => {
        if (err) return reject(err);

        resolve({
          games: Number(rows[0].games) || 0,
          goals: Number(rows[0].goals) || 0,
          assists: Number(rows[0].assists) || 0
        });
      }
    );
  });
}

function createCompetitionSummaryPost(player, matchData, stats) {
  if (!matchData.competition) return null;

  const ga = stats.goals + stats.assists;

  return {
    post_type: 'competition_summary',
    title: `${player} in ${matchData.competition}`,
    content:
      `📊 ${player} in ${matchData.competition}

👕 ${stats.games} Game${stats.games === 1 ? '' : 's'}
⚽ ${stats.goals} Goal${stats.goals === 1 ? '' : 's'}
🅰️ ${stats.assists} Assist${stats.assists === 1 ? '' : 's'}

${ga} G/A in ${stats.games} Game${stats.games === 1 ? '' : 's'} ✅🔥`
  };
}

async function getFinalMatches(player) {
  const playerTable = getPlayerTable(player);
  const connection = db.get();

  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT againstTeam, goals, assists, date
   FROM ${playerTable}
   WHERE LOWER(stage) IN ('final', 'final (1st leg)')
   ORDER BY date DESC`,
      (err, rows) => {
        if (err) return reject(err);

        resolve(rows.map(row => ({
          againstTeam: row.againstTeam,
          goals: Number(row.goals) || 0,
          assists: Number(row.assists) || 0
        })));
      }
    );
  });
}

async function getFinalStatsFromView(player) {
  const playerLower = player.toLowerCase();

  return new Promise((resolve, reject) => {
    displayHelper.getStats(['alltime'], (err, data) => {
      if (err) return reject(err);

      try {
        const alltimeRow = data['alltime'].find(
          row => row.Name.toLowerCase() === playerLower
        );

        resolve({
          finalGoals: Number(alltimeRow?.finalGoals) || 0,
          finalAssists: Number(alltimeRow?.finalAssists) || 0,
          finalGames: Number(alltimeRow?.finalGames) || 0
        });
      } catch (innerErr) {
        reject(innerErr);
      }
    });
  });
}

function createFinalTimelinePost(player, matchData, finalMatches, stats) {
  const goals = Number(matchData.goals) || 0;
  const assists = Number(matchData.assists) || 0;
  const opponent = matchData.againstTeam;
  const competitionText = matchData.competition
    ? ` in the ${matchData.competition} final`
    : ' in a final';

  let hook = '';

  if (goals > 0 && assists > 0) {
    hook = `🚨 ${player} scored and assisted${competitionText}.`;
  } else if (goals > 0) {
    hook = `🚨 ${player} scored his ${getOrdinal(stats.finalGoals)} career final goal.`;
  } else if (assists > 0) {
    hook = `🅰️ ${player} assisted against ${opponent}${competitionText}.`;
  } else {
    hook = `❌ ${player} failed to score against ${opponent}${competitionText}.`;
  }

  return {
    post_type: 'final_timeline',
    title: `${player} finals history`,
    content:
      `${hook}

📊 ${player} in Finals

${finalMatches
        .slice(0, 6)
        .map(match => `${getContributionEmoji(match.goals, match.assists)} 🆚 ${match.againstTeam}`)
        .join('\n')}`
  };
}


function createFinalSummaryPost(player, stats) {
  const ga = stats.finalGoals + stats.finalAssists;

  return {
    post_type: 'final_summary',
    title: `${player} in Finals`,
    content:
      `📊 ${player} in Finals

👕 ${stats.finalGames} Game${stats.finalGames === 1 ? '' : 's'}
⚽ ${stats.finalGoals} Goal${stats.finalGoals === 1 ? '' : 's'}
🅰️ ${stats.finalAssists} Assist${stats.finalAssists === 1 ? '' : 's'}

${ga} G/A in ${stats.finalGames} Game${stats.finalGames === 1 ? '' : 's'} ✅🔥`
  };
}

async function checkMilestones(player, matchData) {
  const posts = [];

  const allTime = await getAllTimeStats(player);
  const seasonStats = await getSeasonStats(player, matchData.season);

  // Career Goals milestone (every 50)
  if (allTime.goals > 0 && allTime.goals % 50 === 0) {
    posts.push({
      post_type: 'milestone_goal',
      title: `${player} reached ${allTime.goals} goals`,
      content:
        `🚨 ${player} has now reached ${allTime.goals} career goals.

Another major milestone for one of the best attackers in world football.`
    });
  }

  // Career Assists milestone (every 25)
  if (allTime.assists > 0 && allTime.assists % 25 === 0) {
    posts.push({
      post_type: 'milestone_assist',
      title: `${player} reached ${allTime.assists} assists`,
      content:
        `🎯 ${player} has now reached ${allTime.assists} career assists.

Another huge creative milestone.`
    });
  }

  // Career Games milestone (every 50)
  if (allTime.games > 0 && allTime.games % 50 === 0) {
    posts.push({
      post_type: 'milestone_games',
      title: `${player} reached ${allTime.games} games`,
      content:
        `🎮 ${player} has now completed ${allTime.games} career appearances.

Consistency at the highest level.`
    });
  }

  // Season Goals milestone (every 10)
  if (seasonStats.goals > 0 && seasonStats.goals % 10 === 0) {
    posts.push({
      post_type: 'milestone_season_goals',
      title: `${player} reached ${seasonStats.goals} goals this season`,
      content:
        `⚽ ${player} has now scored ${seasonStats.goals} goals in the ${matchData.season} season.

Elite output.`
    });
  }

  const scoring = await getScoringStreak(player);

  if (scoring.streak >= 4) {
    posts.push({
      post_type: 'milestone_scoring_streak',
      title: `${player} scored in ${scoring.streak} consecutive games`,
      content:
        `🔥 ${player} has now scored in ${scoring.streak} consecutive games.

${scoring.matches
          .map(match => `${getContributionEmoji(match.goals, match.assists)} 🆚 ${match.againstTeam}`)
          .join('\n')}

Incredible consistency.`
    });
  }

  const hattrick = await getHatTrickStreak(player);

  if (hattrick.streak >= 2) {
    posts.push({
      post_type: 'milestone_hattrick_streak',
      title: `${player} hat-tricks in ${hattrick.streak} consecutive games`,
      content:
        `🎩 ${player} has now scored a hat-trick in ${hattrick.streak} consecutive games.

${hattrick.matches
          .map(match => `${getContributionEmoji(match.goals, match.assists)} 🆚 ${match.againstTeam}`)
          .join('\n')}

Unreal form.`
    });
  }

  return posts;
}

function saveGeneratedPosts(player, posts, matchData) {
  const connection = db.get();

  return new Promise((resolve, reject) => {
    if (!posts.length) return resolve();

    const values = posts.map(post => [
      player,
      post.post_type,
      post.title,
      post.content,
      matchData.id || null,
      matchData.date || null,
      'draft'
    ]);

    connection.query(
      `
      INSERT INTO generated_posts
      (player, post_type, title, content, source_match_id, source_date, status)
      VALUES ?
      `,
      [values],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
}

function deleteOldGeneratedPosts(player, matchData) {
  const connection = db.get();

  return new Promise((resolve, reject) => {
    connection.query(
      `
      DELETE FROM generated_posts
      WHERE player = ?
      AND source_date = ?
      AND status = 'draft'
      `,
      [player, matchData.date],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
}

async function generatePostsAfterMatch(player, matchData) {
  //   const connection = db.get();

  const posts = [];

  await deleteOldGeneratedPosts(player, matchData);

  // 1. Match performance post
  const matchPost = createMatchPost(player, matchData);
  if (matchPost) posts.push(matchPost);

  // 2. Goal summary post (if scored)
  const goalSummaryStats = await getGoalSummaryStats(player, matchData);
  const goalSummaryPost = createGoalSummaryPost(player, matchData, goalSummaryStats);
  if (goalSummaryPost) posts.push(goalSummaryPost);

  const competitionStats = await getCompetitionSummaryStats(player, matchData);
  const competitionPost = createCompetitionSummaryPost(player, matchData, competitionStats);

  if (competitionPost) posts.push(competitionPost);

  // 3. Season so far post
  const seasonStats = await getSeasonStats(player, matchData.season);
  const seasonPost = createSeasonPost(player, seasonStats, matchData.season);
  if (seasonPost) posts.push(seasonPost);

  // 4. Calendar year post
  const year = new Date(matchData.date).getFullYear();
  const yearStats = await getYearStats(player, year);
  const yearPost = createYearPost(player, yearStats, year);
  if (yearPost) posts.push(yearPost);

  // 5. Last 10 games post
  const last10Matches = await getLast10Matches(player);
  const last10Post = createLast10Post(player, last10Matches);
  if (last10Post) posts.push(last10Post);

  // 6. Milestone posts
  const milestonePosts = await checkMilestones(player, matchData);
  posts.push(...milestonePosts);

  // 7. Finals timeline and summary
  if (isFinalStage(matchData.stage)) {
    const finalStats = await getFinalStatsFromView(player);
    const finalMatches = await getFinalMatches(player);

    posts.push(createFinalSummaryPost(player, finalStats));
    posts.push(createFinalTimelinePost(player, matchData, finalMatches, finalStats));
  }

  // Save all posts
  await saveGeneratedPosts(player, posts, matchData);

  return posts;
}



module.exports = { generatePostsAfterMatch };