const {requestJson} = require('../utils/http');
module.exports = {
    is_wiki_search: cmd => cmd === 'wiki',
    wiki_search: async (cmd, content, api, message, {config}) => {
        if (!content.trim()) return 'Podaj hasło do wyszukania.';
        const url = new URL('https://pl.wikipedia.org/w/api.php');
        url.search = new URLSearchParams({
            action: 'query',
            format: 'json',
            prop: 'extracts',
            exintro: '1',
            explaintext: '1',
            redirects: '1',
            titles: content.slice(0, 300),
        }).toString();
        const result = await requestJson(url, {hosts: ['pl.wikipedia.org'], timeoutMs: config.request_timeout_ms});
        return Object.values(result.query?.pages || {}).map(page => typeof page.extract === 'string' ? page.extract : '').filter(Boolean).join('\n').slice(0, 10000) || 'Nie znaleziono hasła.';
    },
};
