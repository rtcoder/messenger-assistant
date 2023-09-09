const summarizer = require('@rtcoder/simple-summary');

module.exports = {
    summarize_text: async (cmd, messageContent, api, msg) => {
        return new Promise((resolve, reject) => {
            resolve(summarizer(messageContent));
        });
    },
};
