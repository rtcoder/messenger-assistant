const {readFileSync} = require('fs');
const login = require('facebook-chat-api');

const credential = {
    appState: JSON.parse(readFileSync('../config/app-state.json', 'utf-8')).cookies,
};

module.exports = (callback) => {

    login(credential, (err, api) => {
        if (err) return console.error(err);

        callback(api);
    });

};
