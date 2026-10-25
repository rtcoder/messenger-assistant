const fs = require('node:fs');
const path = require('node:path');

function loadCookies(config) {
    const filename = path.join(process.env.BOT_CONFIG_DIR || path.join(__dirname, '..', 'config'), 'app-state.json');
    if ((fs.statSync(filename).mode & 0o077) !== 0) throw Error('Session file must be mode 0600');
    const parsed = JSON.parse(fs.readFileSync(filename, 'utf8'));
    const cookies = Array.isArray(parsed) ? parsed : parsed.cookies;
    if (!Array.isArray(cookies) || cookies.length === 0 || cookies.length > 100) throw Error('Invalid session cookies');
    const normalized = cookies.map(cookie => {
        const key = cookie.key || cookie.name;
        if (typeof key !== 'string' || !/^[\w-]+$/.test(key) || typeof cookie.value !== 'string' || /[;\r\n]/.test(cookie.value) || !/^\.?(facebook|messenger)\.com$/.test(cookie.domain)) throw Error('Invalid session cookie');
        return {
            key,
            value: cookie.value,
            domain: cookie.domain,
            path: '/',
            expires: cookie.expires || (cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toUTCString() : undefined),
        };
    });
    if (!normalized.some(cookie => cookie.key === 'c_user' && cookie.value === config.bot_user_id)) throw Error('Session account does not match bot_user_id');
    return normalized;
}

module.exports = async function login(config) {
    const cookies = loadCookies(config);
    const loginAPI = require('facebook-chat-api');
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Login timed out')), 90000);
        loginAPI({appState: cookies}, {
            logLevel: 'silent',
            logRecordSize: 0,
            forceLogin: false,
            selfListen: false,
            listenEvents: false,
        }, (error, api) => {
            clearTimeout(timeout);
            if (error || !api || String(api.getCurrentUserID()) !== config.bot_user_id) reject(new Error('Facebook login failed'));
            else resolve(api);
        });
    });
};
module.exports.loadCookies = loadCookies;
