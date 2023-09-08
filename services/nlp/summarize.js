const summarizer = require('@rtcoder/simple-summary');

module.exports = {
    summarize_text: async (message) => {
        const text = message.messageReply?.body || message.body;
        return new Promise((resolve, reject) => {
            resolve(summarizer(text));
        });
    },
};
