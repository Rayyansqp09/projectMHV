const db = require('../config/connection');
const { notifyAdmins } = require('../helpers/adminpush');


const {
    fetchRecentFixtures,
    fetchFixtureEvents,
    fetchFixtureLineups,
    MBAPPE_NAME
} = require('../ApiCall/apiFootball');

const { fetchRecentRealMadridMatches } = require('../ApiCall/apiFootball');
const DUPLICATE_CHECK_ENABLED = true; // 🔁 turn ON later


async function runMbappeFetchJob() {
    try {
        const matches = await fetchRecentRealMadridMatches(2);
        console.log('Mbappe Matches fetched:', matches.length);



        const connection = db.get();

        for (const match of matches) {
            const date = match.utcDate.split('T')[0]; // YYYY-MM-DD
            const competition = match.competition.name;
            const season = match.season.startDate.slice(0, 4);

            const home = match.homeTeam.name;
            const away = match.awayTeam.name;

            const forTeam = home === 'Real Madrid CF' ? home : away;
            const againstTeam = home === 'Real Madrid CF' ? away : home;

            const scorFor = home === 'Real Madrid CF'
                ? match.score.fullTime.home
                : match.score.fullTime.away;

            const scorAgainst = home === 'Real Madrid CF'
                ? match.score.fullTime.away
                : match.score.fullTime.home;

            const result =
                scorFor > scorAgainst ? 'WIN' :
                    scorFor < scorAgainst ? 'LOSS' : 'DRAW';

            // 🔍 duplicate check (unchanged logic)
            let existsInPending = false;
            let existsInHistory = false;

            if (DUPLICATE_CHECK_ENABLED) {

                existsInPending = await new Promise((resolve, reject) => {
                    connection.query(
                        `
      SELECT 1 FROM pending_matches
      WHERE player = 'Mbappe'
        AND date = ?
        AND forTeam = ?
        AND againstTeam = ?
      LIMIT 1
      `,
                        [date, forTeam, againstTeam],
                        (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows.length > 0);
                        }
                    );
                });

                existsInHistory = await new Promise((resolve, reject) => {
                    connection.query(
                        `
    SELECT 1
    FROM mhmbappe
    WHERE ABS(DATEDIFF(date, ?)) <= 1
    LIMIT 1
    `,
                        [date],
                        (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows.length > 0);
                        }
                    );
                });

            }

            if (existsInPending || existsInHistory) {
                const source = existsInPending
                    ? 'pending_matches'
                    : 'mhmbappe';

                console.log(
                    `Skipping duplicate match [${source}]:`,
                    date,
                    forTeam,
                    'vs',
                    againstTeam
                );

                continue;
            }

            // 🧾 Insert into pending (player stats left manual)
            const insertData = {
                player: 'Mbappe',
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
                        'A new Mbappe match needs approval',
                        {
                            icon: '/images/mbappe2.webp'
                        }
                    );

                }
            );

            // console.log('PENDING MATCH DATA:', insertData);

        }


    } catch (err) {
        console.error('Mbappe fetch job failed:', err);
    }
}

module.exports = { runMbappeFetchJob };
