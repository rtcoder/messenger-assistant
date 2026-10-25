const {safeLink} = require('./storage');
module.exports = function createLinkGenerator(storage, domain, limit = 10000) {
    return value => {
        const url = safeLink(value);
        const key = domain ? storage.putLink(url, limit) : null;
        return key ? `${domain}link/${key}` : url;
    };
};
