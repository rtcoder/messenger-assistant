const getConfig = require('./config');

const config = getConfig('config');
const BOT_PREFIX = config.bot_response_prefix;

module.exports = (api, threadID, msg) => {
    if(typeof msg === 'string') {
        api.sendMessage(`${BOT_PREFIX}${msg}`, threadID);
    }
    if(typeof msg === 'object') {
        if(msg.body){
            msg.body=`${BOT_PREFIX}${msg.body}`
        }
        api.sendMessage(msg, threadID);
    }
};
