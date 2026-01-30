const axios = require('axios');

const API_BASE = 'https://api.football-data.org/v4';

// Real Madrid ID on Football-Data.org
const REAL_MADRID_ID = 86;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'X-Auth-Token': process.env.FOOTBALL_DATA_KEY
  }
});

// Fetch recent finished matches of Real Madrid
async function fetchRecentRealMadridMatches(limit = 5) {
  const res = await api.get(`/teams/${REAL_MADRID_ID}/matches`, {
    params: {
      status: 'FINISHED',
      limit
    }
  });

  return res.data.matches;
}

module.exports = {
  fetchRecentRealMadridMatches
};
