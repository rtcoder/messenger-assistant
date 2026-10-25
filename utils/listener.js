module.exports = (api, dispatcher, logger = () => {
}) => {
    api.setOptions({listenEvents: false, selfListen: false, logLevel: 'silent'});
    return api.listenMqtt((error, message) => {
        if (error) {
            logger('listener_error');
            return;
        }
        Promise.resolve().then(() => dispatcher.handle(message)).catch(() => logger('dispatch_error'));
    });
};
