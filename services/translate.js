const {translate} = require('@vitalets/google-translate-api');
const sendMsg = require('../utils/send-msg');

module.exports = {
    is_translate: (cmd) => {
        const regex = /translate_[a-z]+/gm;
        const match = regex.exec(cmd);
        return match !== null;
    },
    translate_text: async (cmd, messageContent, api, msg) => {
        const regex = /translate_[a-z]+/gm;
        const match = regex.exec(cmd);
        let translateTo = match[0]
            .replaceAll('translate_', '')
            .replaceAll(':', '')
            .trim();
        return translate(messageContent, {to: translateTo})
            .then(res => res.text)
            .catch(err => {
                console.log(err)
                return new Promise((resolve, reject) => {
                    resolve(`[${cmd}] Błąd: coś się zepsuło...`);
                });
            });
    },
};
