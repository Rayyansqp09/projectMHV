const axios = require('axios');

const API_BASE = 'https://api.football-data.org/v4';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'X-Auth-Token': process.env.FOOTBALL_DATA_KEY
  }
});

// Fetch recent finished matches of ANY team
async function fetchRecentTeamMatches(teamId, limit = 5) {
  const res = await api.get(`/teams/${teamId}/matches`, {
    params: {
      status: 'FINISHED',
      limit
    }
  });

  return res.data.matches;
}

// KEEP this for backward compatibility (Mbappé)
async function fetchRecentRealMadridMatches(limit = 5) {
  return fetchRecentTeamMatches(86, limit);
}

// Premier League matches
async function fetchRecentPremierLeagueMatches(limit = 20) {
  const res = await api.get('/competitions/PL/matches', {
    params: {
      status: 'FINISHED',
      limit
    }
  });

  return res.data.matches;
}

// Champions League matches
async function fetchRecentUCLMatches(limit = 20) {
  const res = await api.get('/competitions/CL/matches', {
    params: {
      status: 'FINISHED',
      limit
    }
  });

  return res.data.matches;
}


module.exports = {
  fetchRecentTeamMatches,
  fetchRecentRealMadridMatches,
  fetchRecentPremierLeagueMatches,
  fetchRecentUCLMatches
};
