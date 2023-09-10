const {translate} = require('@vitalets/google-translate-api');
const news = require('gnews');
const {putLink} = require('../utils/link-generator');

module.exports = {
    is_news: cmd => cmd === 'news',

    get_news: async (cmd, messageContent, api, msg) => {
        const opt = {language: 'pl', country: 'pl', n: 5};
        const geo = await news.geo(messageContent, opt);
        const val=geo.map(v=>{
            return `
            ${v.title}
            ${putLink(v.link)}
            `
        }).join('\n\n');
        return new Promise((resolve, reject) => {
            resolve(val);
        });
    },
};
