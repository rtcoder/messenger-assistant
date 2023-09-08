const {readFileSync} = require('fs');
module.exports = (file) => {
    return JSON.parse(readFileSync(`../config/${file}.json`, 'utf-8'));
};
