const {getRandomString} = require('./string-helpers');
const {setDbKeyValue, getDb} = require('./db');
const getConfig = require('./config');
const linksDb = getDb('links');
const config = getConfig('config');

module.exports = {
    putLink: (link) => {
        const found = Object.keys(linksDb).find(key => {
            return linksDb[key].url === link;
        });
        let url;
        if (found) {
            url = found;
        } else {
            const newKey = getRandomString();
            setDbKeyValue('links', newKey, {
                url: link,
            });
            url = newKey;
        }
        return `${config.domain}link/${url}`;
    },
};
