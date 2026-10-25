const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function validateConfig(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid config object');
    const config = {
        domain: '', bot_user_id: '', bot_response_prefix: '', allow_private_messages: false,
        threads_ids: [], allowed_user_ids: [], admin_user_ids: [], download_user_ids: [],
        enable_downloads: false, wolfram_api_key: '', timezone: 'Europe/Warsaw',
        max_commands: 4, max_input_length: 10000, concurrency: 2, max_queue: 20,
        user_rate_limit: 10, global_rate_limit: 60, request_timeout_ms: 20000,
        max_pending_reminders: 1000, max_user_reminders: 50, ...input,
    };
    for (const key of ['threads_ids', 'allowed_user_ids', 'admin_user_ids', 'download_user_ids']) {
        if (!Array.isArray(config[key]) || config[key].some(id => typeof id !== 'string' || !/^\d+$/.test(id))) throw new Error(`Invalid config: ${key}`);
    }
    for (const key of ['allow_private_messages', 'enable_downloads']) if (typeof config[key] !== 'boolean') throw new Error(`Invalid config: ${key}`);
    for (const key of ['bot_user_id', 'domain', 'bot_response_prefix', 'wolfram_api_key', 'timezone']) if (typeof config[key] !== 'string') throw new Error(`Invalid config: ${key}`);
    if (config.bot_user_id && !/^\d+$/.test(config.bot_user_id)) throw new Error('Invalid bot_user_id');
    if (config.bot_response_prefix.length > 100) throw new Error('Prefix too long');
    const upper = {
        max_commands: 10,
        max_input_length: 20000,
        concurrency: 8,
        max_queue: 100,
        user_rate_limit: 60,
        global_rate_limit: 600,
        request_timeout_ms: 60000,
        max_pending_reminders: 10000,
        max_user_reminders: 500,
    };
    for (const [key, max] of Object.entries(upper)) {
        if (!Number.isSafeInteger(config[key]) || config[key] < 1 || config[key] > max) throw new Error(`Invalid config: ${key}`);
    }
    new Intl.DateTimeFormat('pl-PL', {timeZone: config.timezone});
    if (config.domain) {
        const url = new URL(config.domain);
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Invalid domain');
        config.domain = url.href.replace(/\/?$/, '/');
    }
    return Object.freeze(config);
}

function getConfig(file = 'config') {
    if (!['config', 'app-state'].includes(file)) throw new Error('Unknown configuration');
    const dir = process.env.BOT_CONFIG_DIR || path.join(root, 'config');
    const value = JSON.parse(fs.readFileSync(path.join(dir, `${file}.json`), 'utf8'));
    return file === 'config' ? validateConfig({...value, ...(process.env.WOLFRAM_API_KEY ? {wolfram_api_key: process.env.WOLFRAM_API_KEY} : {})}) : value;
}

module.exports = getConfig;
module.exports.validateConfig = validateConfig;
module.exports.dataDir = () => path.resolve(process.env.BOT_DATA_DIR || path.join(root, 'data'));
