const sendMsg = require('../utils/send-msg');
const {
    is_wiki_search,
    is_group_title, group_title,
    is_user_call, user_call,
    help, is_help,
    is_news, get_news,
    translate_text, is_translate,
    is_hello, hello,
    is_yt_search, yt_search,
    yt_dlp, is_yt_dlp,
    summarize_text, is_summarize,
} = require('./index');
const {wiki_search} = require('./wiki');

const defaultFn = async (command, content, api, message) => {

    sendMsg(api, message.threadID,
        `Nie znam polecenia [${command}]. Oznacz mnie i wpisz [help] aby uzyskać pomoc.`);

    return new Promise((resolve, reject) => {
        resolve(content);
    });
};

const checks = [
    {check: is_help, fn: help},
    {check: is_yt_search, fn: yt_search},
    {check: is_wiki_search, fn: wiki_search},
    {check: is_summarize, fn: summarize_text},
    {check: is_group_title, fn: group_title},
    {check: is_user_call, fn: user_call},
    {check: is_yt_dlp, fn: yt_dlp},
    {check: is_news, fn: get_news},
    {check: is_hello, fn: hello},
    {check: is_translate, fn: translate_text},
];

module.exports = async (message, api) => {
    let [commands, contentWithoutCommands] = getCommandsFromMessage(message.body);
    if (message.messageReply?.body) {
        contentWithoutCommands = message.messageReply.body;
    }

    let newContent = '';
    for (let idx in commands) {
        const cmd = commands[idx];
        let fn = defaultFn;
        fn = checks.find(({check}) => check(cmd))?.fn;
        if (!fn) {
            fn = defaultFn;
        }
        const messageContentArg = (+idx) === 0
            ? contentWithoutCommands
            : newContent;
        console.log({cmd, messageContentArg, idx});
        newContent = await fn(cmd, messageContentArg, api, message);
    }
    return new Promise((resolve, reject) => {
        resolve(newContent);
    });
};

function getCommandsFromMessage(messageStr) {
    const regex = /^\[[a-z0-9:_]+\]/gmi;
    const match = regex.exec(messageStr);
    console.log(messageStr, regex, match);
    if (match === null) {
        return [[], messageStr];
    }
    const commands = match[0]
        .replaceAll('[', '')
        .replaceAll(']', '')
        .split(':')
        .reverse();

    const contentWithoutCommands = messageStr.replaceAll(match[0], '').trim();

    return [commands, contentWithoutCommands];
}
