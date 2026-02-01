const db = require('../config/connection');
const { notifyAdmins } = require('../helpers/adminpush');

const {
    fetchRecentPremierLeagueMatches,
    fetchRecentUCLMatches
} = require('../ApiCall/apiFootball');

const DUPLICATE_CHECK_ENABLED = true;
const MAN_CITY_NAME = 'Manchester City FC';

async function runHaalandFetchJob() {
    try {
        const plMatches = await fetchRecentPremierLeagueMatches(20);
        const clMatches = await fetchRecentUCLMatches(20);

        const allMatches = [...plMatches, ...clMatches];

        const matches = allMatches
            .filter(
                m =>
                    m.homeTeam.name === MAN_CITY_NAME ||
                    m.awayTeam.name === MAN_CITY_NAME
            )
            .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate)) // 🔥 SORT
            .slice(0, 2); // 🔒 LIMIT



        console.log('Haaland matches fetched:', matches.length);

        const connection = db.get();

        for (const match of matches) {
            const date = match.utcDate.split('T')[0];
            const competition = match.competition.name;
            const season = match.season.startDate.slice(0, 4);

            const home = match.homeTeam.name;
            const away = match.awayTeam.name;

            const forTeam = home === MAN_CITY_NAME ? home : away;
            const againstTeam = home === MAN_CITY_NAME ? away : home;

            const scorFor = home === MAN_CITY_NAME
                ? match.score.fullTime.home
                : match.score.fullTime.away;

            const scorAgainst = home === MAN_CITY_NAME
                ? match.score.fullTime.away
                : match.score.fullTime.home;

            const result =
                scorFor > scorAgainst ? 'WIN' :
                    scorFor < scorAgainst ? 'LOSS' : 'DRAW';

            let existsInPending = false;
            let existsInHistory = false;

            if (DUPLICATE_CHECK_ENABLED) {
                existsInPending = await new Promise((resolve, reject) => {
                    connection.query(
                        `
            SELECT 1 FROM pending_matches
            WHERE player = 'Haaland'
              AND date = ?
              AND forTeam = ?
              AND againstTeam = ?
            LIMIT 1
            `,
                        [date, forTeam, againstTeam],
                        (err, rows) => err ? reject(err) : resolve(rows.length > 0)
                    );
                });

                existsInHistory = await new Promise((resolve, reject) => {
                    connection.query(
                        `
            SELECT 1 FROM mhhaaland
            WHERE ABS(DATEDIFF(date, ?)) <= 1
            LIMIT 1
            `,
                        [date],
                        (err, rows) => err ? reject(err) : resolve(rows.length > 0)
                    );
                });
            }

            if (existsInPending || existsInHistory) {

                const source = existsInPending
                    ? 'pending_matches'
                    : 'mhhaaland';

                console.log(
                    `Skipping duplicate match [${source}]:`,
                    date,
                    forTeam,
                    'vs',
                    againstTeam
                );
                continue;
            }

            const insertData = {
                player: 'Haaland',
                date,
                season,
                competition,
                stage: match.matchday || null,
                forTeam,
                againstTeam,
                goals: null,
                assists: null,
                CC: null,
                BCC: null,
                Shot: null,
                dribbles: null,
                mnt: null,
                result,
                scorFor,
                scorAgainst
            };

            connection.query(
                'INSERT INTO pending_matches SET ?',
                insertData,
                (err, result) => {
                    if (err) {
                        console.error('❌ Pending insert failed:', err.sqlMessage || err);
                        return;
                    }

                    console.log('✅ Pending match inserted:', result.insertId);

                    // 🔔 NOTIFY ADMINS — CORRECT PLACE
                    notifyAdmins(
                        '⚽ New Pending Match',
                        'A new Haaland match needs approval',
                        {
                            icon: '/images/haaland2.webp'
                        }
                    );

                }
            );
        }

    } catch (err) {
        console.error('Haaland fetch job failed:', err.message || err);
    }
}

module.exports = { runHaalandFetchJob };
