const {readFileSync} = require('fs');
module.exports = (file) => {
    return JSON.parse(readFileSync(`${__dirname}/../db/${file}.json`, 'utf-8'));
};
