const fs = require('node:fs');
const path = require('node:path');
const {Storage} = require('../utils/storage');
const {dataDir} = require('../utils/config');

function migrate(legacyDirectory, destination = dataDir()) {
    const read = file => {
        const filename = path.join(legacyDirectory, file + '.json');
        if (!fs.existsSync(filename)) return {};
        const value = JSON.parse(fs.readFileSync(filename, 'utf8'));
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid legacy data');
        return value;
    };
    const jobs = read('jobs'), links = read('links'), circular = read('circular-jobs');
    if (Object.keys(circular).length) throw Error('Legacy recurring jobs need manual migration; not imported');
    const store = new Storage(path.join(destination, 'bot.sqlite'));
    const linkStore = new Storage(path.join(destination, 'links.sqlite'));
    try {
        // Each database import is transactional and independently idempotent.
        store.migrateLegacy({jobs});
        linkStore.migrateLegacy({links});
        return {jobs: Object.keys(jobs).length, links: Object.keys(links).length};
    } finally {
        store.close();
        linkStore.close();
    }
}

if (require.main === module) {
    process.umask(0o077);
    try {
        console.log(JSON.stringify(migrate(process.env.BOT_LEGACY_DB_DIR || path.join(__dirname, '..', 'db'))));
    } catch {
        console.error('Migration failed. Check legacy JSON, HTTPS links, and recurring jobs. Source files were not changed.');
        process.exitCode = 1;
    }
}
module.exports = {migrate};
