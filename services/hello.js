const sendMsg = require('../utils/send-msg');

module.exports = {
    is_hello: (command) => {
        const content = command.toLocaleLowerCase();
        return ['witaj', 'hej', 'siema', 'cześć'].includes(content);
    },
    hello: async (cmd, messageContent, api, message) => {
        sendMsg(api,message.threadID,'Cześć chuje!');

        return new Promise((resolve, reject) => {
            resolve(messageContent);
        });
    },
};
