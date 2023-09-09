const {readFileSync, writeFileSync} = require('fs');

function getDb(file) {
    return JSON.parse(readFileSync(`${__dirname}/../db/${file}.json`, 'utf-8'));
}

function getDbValue(file, key) {
    const db = getDb(file);
    return db[key] || null;
}

function setDbKeyValue(file, key, value) {
    const db = getDb(file);
    db[key] = value;
    setDbValue(file, db);
}

function setDbValue(file, value) {
    try {
        writeFileSync(`${__dirname}/../db/${file}.json`, JSON.stringify(value));
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

module.exports = {
    getDb,
    getDbValue,
    setDbKeyValue,
    setDbValue,
};
