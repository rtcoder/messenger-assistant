const sendMsg = require('../utils/send-msg');
const wiki = require('wikipedia');

module.exports = {
    wiki_search: async (cmd, messageContent, api, msg) => {
        try {
            wiki.setLang('pl');
            const page = await wiki.page(messageContent);
            return await page.intro();
        } catch (error) {
            sendMsg(api, msg.threadID, `[${cmd}] Błąd: coś się zepsuło...`);

            return new Promise((resolve, reject) => {
                resolve(null);
            });
        }
    },
};
