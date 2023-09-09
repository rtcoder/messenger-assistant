const ytSearchApi = require('youtube-search-api');

module.exports = {
    yt_search: async (cmd, messageContent, api, msg) => {

        return await ytSearchApi.GetListByKeyword(messageContent, false, 5)
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
