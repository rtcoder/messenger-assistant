const {apiCall} = require('../utils/api-call');
module.exports = {
    is_group_title: cmd => cmd === 'title',
    group_title: async (cmd, content, api, message, {config}) => {
        if (!message.isGroup || !content.trim() || content.length > 100) return 'Nazwa grupy musi mieć od 1 do 100 znaków.';
        await apiCall(api, 'setTitle', [content, message.threadID], {timeoutMs: config.request_timeout_ms});
        return 'Zmieniono nazwę grupy.';
    },
};
