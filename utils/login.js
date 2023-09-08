const login = require('facebook-chat-api');
const getConfig = require('./config');
const credential = {
    appState: getConfig('app-state').cookies,
};

module.exports = (callback) => {

    login(credential, (err, api) => {
        if (err) return console.error(err);

        callback(api);
    });

};
