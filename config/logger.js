const { isDev } = require('../config/env');

function log(...args) {
    if (isDev) console.log(...args);
}

module.exports = log;