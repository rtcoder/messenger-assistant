const serviceGuesser = require('../services/_service-guess');
const getConfig = require('./config');
const {getDb} = require('./db');
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

    const formattedMessage = clearMsgContent(message);

    const services = serviceGuesser(formattedMessage, api);
    services.then(msg => {
        if (isValidMessage(msg)) {
            sendMsg(api, message.threadID, msg);
        }
    });

};

function isValidMessage(msg) {
    if (msg === null) {
        return false;
    }
    if (typeof msg === 'string') {
        return !!msg.length;
    }
    if (typeof msg === 'object') {
        return !!Object.keys(msg).length
            && (msg.body || msg.attachment || msg.sticker);
    }
    if (typeof msg === 'number') {
        return true;
    }
    return false;
}

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

function clearMsgContent(message) {
    message.body = removeBotPrefixFromText(
        removeBotMentionFromText(message.body),
    ).trim();
    if (message.messageReply?.body) {
        message.messageReply.body = removeBotPrefixFromText(
            removeBotMentionFromText(message.messageReply.body),
        ).trim();
    }

    return message;
}

function removeBotMentionFromText(text) {
    const {nickname, firstName, lastName} = botInfo;
    return text
        .replaceAll(`@${nickname}`, '')
        .replaceAll(`@${firstName} ${lastName}`, '')
        .replaceAll(`@${firstName}`, '');
}

function removeBotPrefixFromText(text) {
    return text
        .replaceAll(BOT_PREFIX, '');
}
