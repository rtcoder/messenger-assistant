const {translate} = require('@vitalets/google-translate-api');

module.exports = {
    is_translate: (msg) => {
        const regex = /translate_[a-z]+:/gm;
        const match = regex.exec(msg.body);
        return match !== null;
    },
    translate_text: async (msg) => {
        const regex = /translate_[a-z]+:/gm;
        const match = regex.exec(msg.body);
        let text;
        let translateTo = match[0]
            .replaceAll('translate_', '')
            .replaceAll(':', '')
            .trim();
        if (msg.messageReply?.body) {
            text = msg.messageReply?.body;
        } else {
            text = msg.body.replaceAll(match[0], '');
        }
        return translate(text, {to: translateTo})
            .then(res => res.text)
            .catch(err => {
                console.log(err)
                return new Promise((resolve, reject) => {
                    resolve('Błąd: coś się zepsuło...');
                });
            });
    },
};
