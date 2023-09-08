const {wiki_search} = require('./wiki');
const {yt_search} = require('./yt');
const {is_hello, hello} = require('./hello');

module.exports = (message) => {
    if (is_hello(message)) {
        return hello;
    }
    if (message.includes('youtube:')
        || message.includes('yt:')) {
        return yt_search;
    }
    if (message.includes('wiki:')) {
        return wiki_search;
    }

    return new Promise((resolve, reject) => {
        resolve(() => {
            return 'Nie znam polecenia';
        });
    });
};
