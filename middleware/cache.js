const NodeCache = require('node-cache');
const pageCache = new NodeCache({ stdTTL: 900 });

const { isDev } = require('../config/env');

function cache(duration = 900) {
  return (req, res, next) => {
    if (isDev) return next();

    const key = req.originalUrl;

    const cached = pageCache.get(key);

    if (cached) {
      console.log('⚡ CACHE HIT:', key);
      return res.send(cached);
    }

    console.log('❌ CACHE MISS:', key);

    const originalSend = res.send.bind(res);

    res.send = (body) => {
      console.log('💾 CACHING:', key);
      pageCache.set(key, body, duration);
      originalSend(body);
    };

    next();
  };
}

function clearCache() {
  pageCache.flushAll();
}

module.exports = { cache, clearCache };