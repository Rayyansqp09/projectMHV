const db = require('../config/connection');
const { fetchRecentRealMadridMatches } = require('../ApiCall/apiFootball');

const DUPLICATE_CHECK_ENABLED = true;

async function runViniciusFetchJob() {
    try {
        const matches = await fetchRecentRealMadridMatches(5);
        console.log('Vinicius matches fetched:', matches.length);

        const connection = db.get();

        for (const match of matches) {
            const date = match.utcDate.split('T')[0];
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

            let existsInPending = false;
            let existsInHistory = false;

            if (DUPLICATE_CHECK_ENABLED) {
                existsInPending = await new Promise((resolve, reject) => {
                    connection.query(
                        `
            SELECT 1 FROM pending_matches
            WHERE player = 'Vinicius'
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
            SELECT 1 FROM mhvinicius
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
                    : 'mhvinicius';

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
                player: 'Vinicius',
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

            connection.query('INSERT INTO pending_matches SET ?', insertData);
        }

    } catch (err) {
        console.error('Vinicius fetch job failed:', err);
    }
}

module.exports = { runViniciusFetchJob };
