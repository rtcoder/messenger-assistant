const Parser = require('rss-parser');
const {requestText} = require('../utils/http');
module.exports = {
    is_news: cmd => cmd === 'news',
    get_news: async (cmd, content, api, message, context) => {
        const url = new URL(content ? 'https://news.google.com/rss/search' : 'https://news.google.com/rss');
        url.search = new URLSearchParams({q: content.slice(0, 500), hl: 'pl', gl: 'PL', ceid: 'PL:pl'}).toString();
        const xml = await requestText(url, {hosts: ['news.google.com'], timeoutMs: context.config.request_timeout_ms});
        const data = await new Parser().parseString(xml);
        return (data.items || []).slice(0, 5).map(item => `${String(item.title || '').slice(0, 300)}\n${context.putLink(item.link)}`).join('\n\n') || 'Brak wiadomości.';
    },
};
