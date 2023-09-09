const {wiki_search} = require('./wiki');
const {yt_search} = require('./yt');
const {is_hello, hello} = require('./hello');
const {summarize_text} = require('./nlp/summarize');
const {help} = require('./help');
const {is_translate, translate_text} = require('./translate');
const {user_call} = require('./user-call');
const {group_title} = require('./group_title');
const sendMsg = require('../utils/send-msg');
const {yt_dlp} = require('./yt-dlp');

const defaultFn = async (command, content, api, message) => {

    sendMsg(api, message.threadID,
        `Nie znam polecenia [${command}]. Oznacz mnie i wpisz [help] aby uzyskać pomoc.`);

    return new Promise((resolve, reject) => {
        resolve(content);
    });
};

const commandsMapToServices = {
    'help': help,
    'youtube': yt_search,
    'yt': yt_search,
    'wiki': wiki_search,
    'summarize': summarize_text,
    'title': group_title,
    'everyone': user_call,
    'call_all': user_call,
    'call_girls': user_call,
    'call_boys': user_call,
    'call_admin': user_call,
    'pobierz': yt_dlp,
};

module.exports = async (message, api) => {
    let [commands, contentWithoutCommands] = getCommandsFromMessage(message.body);
    if (message.messageReply?.body) {
        contentWithoutCommands = message.messageReply.body;
    }

    let newContent = '';
    for (let idx in commands) {
        const cmd = commands[idx];
        let fn = defaultFn;

        if (is_hello(cmd)) {
            fn = hello;
        } else if (is_translate(cmd)) {
            fn = translate_text;
        } else if (commandsMapToServices[cmd]) {
            fn = commandsMapToServices[cmd];
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
