const {readFileSync} = require('fs');
module.exports = (file) => {
    return JSON.parse(readFileSync(`${__dirname}/../config/${file}.json`, 'utf-8'));
};
