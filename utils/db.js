const {readFileSync, writeFileSync} = require('fs');

module.exports = {
    getDb: (file) => {
        return JSON.parse(readFileSync(`${__dirname}/../db/${file}.json`, 'utf-8'));
    },
    getDbValue: (file, key) => {
        const db = this.getDb(file);
        return db[key] || null;
    },
    setDbKeyValue: (file, key, value) => {
        const db = this.getDb(file);
        db[key] = value;
        this.setDbValue(file, db);
    },
    setDbValue: (file, value) => {
        try {
            writeFileSync(`${__dirname}/../db/${file}.json`, JSON.stringify(value));
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    },
};
