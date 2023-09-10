const getConfig = require('./config');

const config = getConfig('config');
const BOT_PREFIX = config.bot_response_prefix;

module.exports = (api, threadID, msg, callback, replyToMessageID) => {
    if (typeof msg === 'string') {
        api.sendMessage(`${BOT_PREFIX}${msg}`, threadID, callback, replyToMessageID);
    }
    if (typeof msg === 'object') {
        if (msg.body) {
            msg.body = `${BOT_PREFIX}${msg.body}`;
        }
        api.sendMessage(msg, threadID, callback, replyToMessageID);
    }
};
