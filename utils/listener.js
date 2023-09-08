const botResponse = require('./bot-response');

module.exports = (api) => {
    api.setOptions({
        listenEvents: true,
        selfListen: true,
    });
    api.listenMqtt((err, message) => {
        botResponse(api, message);
    });
};

