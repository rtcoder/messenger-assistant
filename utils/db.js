const {readFileSync} = require('fs');
module.exports = (file) => {
    return JSON.parse(readFileSync(`../db/${file}.json`, 'utf-8'));
};
