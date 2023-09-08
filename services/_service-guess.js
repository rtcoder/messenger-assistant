const {wiki_search} = require('./wiki');
const {yt_search} = require('./yt');
const {is_hello, hello} = require('./hello');
const {summarize_text} = require('./nlp/summarize');
const {help} = require('./help');
const {is_translate, translate_text} = require('./translate');

const defaultFn = async () =>
    new Promise((resolve, reject) => resolve('Nie znam polecenia'));

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

    return async () =>
        new Promise((resolve, reject) => {
            resolve('Nie znam polecenia');
        });

};
