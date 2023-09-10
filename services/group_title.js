const sendMsg = require('../utils/send-msg');

module.exports = {
    is_group_title: cmd => cmd === 'title',

    group_title: async (cmd, messageContent, api, msg) => {
        if (!msg.isGroup) {
            sendMsg(api, msg.threadID,
                `[${cmd}] Ta funkcja jest dostępna tylko dla konwersacji grupowych`);

            return new Promise((resolve, reject) => {
                resolve(messageContent);
            });
        }

        api.setTitle(messageContent, msg.threadID, (err, info) => {

        });


        return new Promise((resolve, reject) => {
            resolve(messageContent);
        });
    },
};
