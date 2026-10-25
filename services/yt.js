const axios = require('axios');
// youtube-search-api uses this shared Axios instance internally.
axios.defaults.timeout = 20000;
axios.defaults.maxContentLength = 4 * 1024 * 1024;
axios.defaults.maxBodyLength = 10000;
axios.defaults.maxRedirects = 0;
const youtube = require('youtube-search-api');
youtube.ErrorHandler.getInstance().setErrorLogger(() => {
});
module.exports = {
    is_yt_search: cmd => ['yt', 'youtube'].includes(cmd),
    yt_search: async (cmd, content) => {
        const result = await youtube.GetListByKeyword(content.slice(0, 500), false, 5);
        if (!Array.isArray(result.items)) throw Error('Invalid YouTube response');
        return result.items.slice(0, 5).filter(item => typeof item.id === 'string' && /^[\w-]+$/.test(item.id)).map(item => `${String(item.title || '').slice(0, 300)}\n${item.type === 'channel' ? 'https://youtube.com/channel/' : 'https://youtu.be/'}${item.id}`).join('\n\n') || 'Brak wyników.';
    },
};
