const {wiki_search} = require('./wiki');
const {yt_search} = require('./yt');
const {is_hello, hello} = require('./hello');
const {summarize_text} = require('./nlp/summarize');
const {help} = require('./help');
const {is_translate, translate_text} = require('./translate');
const {is_user_call, user_call} = require('./user-call');
const {is_group_title, group_title} = require('./group_title');

const defaultFn = async () =>
    new Promise((resolve, reject) => resolve('Nie znam polecenia. Oznacz mnie i wpisz [help] aby uzyskać pomoc.'));

module.exports = (message) => {
    const content = message.body;
    if (content.includes('[help]')) {
        return help;
    }
    if (is_hello(message)) {
        return hello;
    }
    if (content.includes('youtube:')
        || content.includes('yt:')) {
        return yt_search;
    }
    if (content.includes('wiki:')) {
        return wiki_search;
    }
    if (content.includes('summarize:')) {
        return summarize_text;
    }
    if (is_translate(message)) {
        return translate_text;
    }
    if (is_user_call(message)) {
        return user_call;
    }
    if (is_group_title(message)) {
        return group_title;
    }

    return async () =>
        new Promise((resolve, reject) => {
            resolve('Nie znam polecenia. Oznacz mnie i wpisz [help] aby uzyskać pomoc.');
        });

};
