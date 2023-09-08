const serviceGuesser = require('../services/_service-guess');
const {readFileSync} = require('fs');

const config = JSON.parse(readFileSync('../config/config.json', 'utf-8'));
const BOT_PREFIX = config.bot_response_prefix;
const BOT_USER_ID = config.bot_user_id;
const THREADS_IDS = config.threads_ids;

module.exports = (api, message) => {
    if (!shouldSendMessage(message)) {
        return;
    }

    const content = removeBotMentionFromContent(message.body);

    // console.log(message);
    const service = serviceGuesser(content);
    service(content).then(msg => {
        sendMsg(api, message.threadID, msg);
    });

};

function sendMsg(api, threadID, msg) {
    api.sendMessage(`${BOT_PREFIX}${msg}`, threadID);
}

function shouldSendMessage(msg) {
    return !(!msg.threadID
        || !msg.body
        || !THREADS_IDS.includes(msg.threadID)
        || msg.senderID === BOT_USER_ID
        || !msg.mentions
        || !msg.mentions[BOT_USER_ID]);
}

function removeBotMentionFromContent(content) {
    return content
        .replaceAll('@kaczkobot', '')
        .replaceAll('@Kaczko Bot', '')
        .replaceAll('@Kaczko', '')
        .toLocaleLowerCase();
}
