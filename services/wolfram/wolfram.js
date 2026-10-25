const {requestJson} = require('../../utils/http');

async function queryWolfram(query, apiKey, options = {}) {
    const url = new URL('https://api.wolframalpha.com/v2/query');
    url.search = new URLSearchParams({input: query, appid: apiKey, output: 'json', format: 'plaintext'}).toString();
    const result = await requestJson(url, {...options, hosts: ['api.wolframalpha.com']});
    if (!result.queryresult?.success || !Array.isArray(result.queryresult.pods)) return 'Brak wyniku dla tego zapytania.';
    const output = result.queryresult.pods.slice(0, 10).map(pod => {
        const text = Array.isArray(pod.subpods) ? pod.subpods.map(sub => typeof sub.plaintext === 'string' ? sub.plaintext : '').filter(Boolean).join('\n') : '';
        return text ? `${String(pod.title || '').slice(0, 200)}\n${text}` : '';
    }).filter(Boolean).join('\n\n');
    return output.slice(0, 10000) || 'Brak tekstowego wyniku dla tego zapytania.';
}

module.exports = {
    queryWolfram, is_wolfram: cmd => cmd === 'licz',
    run_wolfram: async (cmd, content, api, message, {config}) => config.wolfram_api_key
        ? queryWolfram(content, config.wolfram_api_key, {timeoutMs: config.request_timeout_ms})
        : 'Funkcja niedostępna: brak klucza Wolfram Alpha.',
};
