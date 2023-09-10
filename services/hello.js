const sendMsg = require('../utils/send-msg');

module.exports = {
    is_hello: (cmd) => ['witaj', 'hej', 'siema', 'cześć'].includes(cmd.toLocaleLowerCase()),

    hello: async (cmd, messageContent, api, message) => {
        sendMsg(api, message.threadID, 'Cześć chuje!');

        return new Promise((resolve, reject) => {
            resolve(messageContent);
        });
    },
};
