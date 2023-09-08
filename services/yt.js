const youtubesearchapi = require('youtube-search-api');
module.exports = {
    yt_search: async (query) => {

        const ytSearch = query.replaceAll('youtube:', '')
            .replaceAll('yt:', '');

        return await youtubesearchapi.GetListByKeyword(ytSearch, false, 5)
            .then(r => {
                return r.items.map(item => {
                    const link = item.type === 'channel'
                        ? 'https://youtube.com/channel/' + item.id
                        : `https://youtu.be/${item.id}`;
                    return `${item.title} ${link}`;
                }).join('\n');

            });
    },
};
