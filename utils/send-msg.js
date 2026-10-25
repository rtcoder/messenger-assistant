const {apiCall} = require('./api-call');

function createSender(api, config) {
    return async (threadID, content, replyToMessageID) => {
        if (typeof threadID !== 'string' || !threadID) throw Error('Invalid recipient');
        const body = typeof content === 'string' ? content : content?.body;
        if (typeof body !== 'string' || !body.trim()) throw Error('Invalid outgoing message');
        if (typeof content === 'object' && !Array.isArray(content.mentions)) throw Error('Invalid outgoing message object');
        // Bound total output and number of messages, including prefix.
        const text = safeSlice(body, 10000);
        const chunkLength = 4000 - config.bot_response_prefix.length;
        if (typeof content === 'object' && text.length > chunkLength) throw Error('Mention message too long');
        for (let i = 0; i < text.length;) {
            const part = safeSlice(text.slice(i), chunkLength);
            i += part.length;
            const chunk = config.bot_response_prefix + part;
            const payload = typeof content === 'object' ? {
                ...content,
                body: chunk,
                mentions: content.mentions.map(mention => ({
                    ...mention,
                    fromIndex: (mention.fromIndex || 0) + config.bot_response_prefix.length,
                })),
            } : chunk;
            // facebook-chat-api places the callback before replyToMessageID.
            await apiCall({
                send(payload, thread, callback) {
                    return api.sendMessage(payload, thread, callback, replyToMessageID);
                },
            }, 'send', [payload, threadID], {timeoutMs: config.request_timeout_ms});
        }
    };
}

function safeSlice(text, length) {
    let end = Math.min(text.length, length);
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1]) && /[\uDC00-\uDFFF]/.test(text[end])) end--;
    return text.slice(0, end);
}

module.exports = {createSender};
