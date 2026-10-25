const {apiCall} = require('../utils/api-call');
module.exports = {
    is_user_call: cmd => ['everyone', 'call_all', 'call_girls', 'call_boys', 'call_admin'].includes(cmd),
    user_call: async (cmd, content, api, message, {config}) => {
        const options = {timeoutMs: config.request_timeout_ms};
        const info = await apiCall(api, 'getThreadInfo', [message.threadID], options);
        const ids = cmd === 'call_admin' ? info?.adminIDs?.map(a => typeof a === 'string' ? a : a.id) : info?.participantIDs;
        if (!Array.isArray(ids) || ids.length > 50) return 'Oznaczanie jest ograniczone do grup liczących maksymalnie 50 osób.';
        if (!ids.length) return 'Brak osób do oznaczenia.';
        // The Facebook API accepts an array of IDs in one request.
        const users = await apiCall(api, 'getUserInfo', [ids], options);
        if (!users || typeof users !== 'object') throw Error('Invalid user info');
        const selected = ids.filter(id => users[id] && (cmd !== 'call_girls' || users[id].gender === 1) && (cmd !== 'call_boys' || users[id].gender === 2));
        let body = '';
        const mentions = selected.map(id => {
            const tag = '@' + String(users[id].name || 'Użytkownik').slice(0, 60);
            const fromIndex = body.length;
            body += tag + ' ';
            return {id, tag, fromIndex};
        });
        return mentions.length ? {body: body.trim(), mentions} : 'Brak osób do oznaczenia.';
    },
};
