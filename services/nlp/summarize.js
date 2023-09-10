const summarizer = require('@rtcoder/simple-summary');

module.exports = {
    is_summarize: cmd => cmd === 'summarize',

    summarize_text: async (cmd, messageContent, api, msg) => {
        return new Promise((resolve, reject) => {
            resolve(summarizer(messageContent));
        });
    },
};
