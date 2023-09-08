const serviceGuesser = require('../services/_service-guess');
const getConfig = require('./config');
const getDb = require('./db');
const sendMsg = require('./send-msg');

const config = getConfig('config');
const botInfo = getDb('bot-info');
const BOT_PREFIX = config.bot_response_prefix;
const BOT_USER_ID = config.bot_user_id;
const THREADS_IDS = config.threads_ids;

module.exports = (api, message) => {
    if (!shouldSendMessage(message)) {
        return;
    }

    const content = removeBotMentionFromContent(message.body);
    const formattedMessage = {
        ...message,
        body: content,
    };
    // console.log(message);
    const service = serviceGuesser(formattedMessage);
    service(formattedMessage, api).then(msg => {
        if (msg !== null) {
            sendMsg(api, message.threadID, msg);
        }
    });

};

function shouldSendMessage(msg) {
    console.log(msg);
    if (config.allow_private_messages
        && msg.threadID === msg.senderID
        && msg.body) {
        return true;
    }
    return !(!msg.threadID
        || !msg.body
        || !THREADS_IDS.includes(msg.threadID)
        || msg.senderID === BOT_USER_ID
        || !msg.mentions
        || !msg.mentions[BOT_USER_ID]);
}

function removeBotMentionFromContent(content) {
    const {nickname, firstName, lastName} = botInfo;
    return content
        .replaceAll(`@${nickname}`, '')
        .replaceAll(`@${firstName} ${lastName}`, '')
        .replaceAll(`@${firstName}`, '');
}
