const sendMsg = require('../utils/send-msg');
module.exports = {
    is_group_title: (msg) => {
        const content = msg.body.toLocaleLowerCase();
        return content.includes('title:');
    },
    group_title: async (msg, api) => {
        if (!msg.isGroup) {
            return new Promise((resolve, reject) => {
                resolve('Ta funkcja jest dostępna tylko dla konwersacji grupowych');
            });
        }
        const newTitle = msg.body.replace('title:', '').trim();
        api.setTitle(newTitle, msg.threadID, (err, info) => {

        });


        return new Promise((resolve, reject) => {
            resolve(null);
        });
    },
};
