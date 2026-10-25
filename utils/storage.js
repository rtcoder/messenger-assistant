const {DatabaseSync} = require('node:sqlite');
const {randomUUID, randomBytes, createHash} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function safeLink(value) {
    if (typeof value !== 'string' || value.length > 8192 || /[\x00-\x20\x7f]/.test(value)) throw new Error('Invalid link');
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('HTTPS link required');
    return url.href;
}

class Storage {
    constructor(filename) {
        fs.mkdirSync(path.dirname(filename), {recursive: true, mode: 0o700});
        try {
            fs.closeSync(fs.openSync(filename, 'wx', 0o600));
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
        }
        this.db = new DatabaseSync(filename);
        this.db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA secure_delete=ON;
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY, threadID TEXT NOT NULL, senderID TEXT NOT NULL,
                text TEXT NOT NULL, dueAt INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
                attempts INTEGER NOT NULL DEFAULT 0, leaseUntil INTEGER, leaseToken TEXT
            );
            CREATE INDEX IF NOT EXISTS jobs_due ON jobs(status, dueAt);
            CREATE TABLE IF NOT EXISTS links (id TEXT PRIMARY KEY, url TEXT NOT NULL);
            CREATE INDEX IF NOT EXISTS links_url ON links(url);
            CREATE TABLE IF NOT EXISTS received (id TEXT PRIMARY KEY, expiresAt INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS job_sources (sourceID TEXT PRIMARY KEY, jobID TEXT NOT NULL, expiresAt INTEGER NOT NULL);`);
    }

    transaction(fn) {
        this.db.exec('BEGIN IMMEDIATE');
        try {
            const value = fn();
            this.db.exec('COMMIT');
            return value;
        } catch (error) {
            this.db.exec('ROLLBACK');
            throw error;
        }
    }

    addJob({threadID, senderID, text, dueAt, sourceID}, {perUser = 50, total = 1000} = {}) {
        validateJob({threadID, text, dueAt});
        if (typeof senderID !== 'string' || !senderID) throw new Error('Missing sender');
        if (sourceID !== undefined && (typeof sourceID !== 'string' || sourceID.length > 512)) throw new Error('Invalid source');
        return this.transaction(() => {
            this.db.prepare('DELETE FROM job_sources WHERE expiresAt<=?').run(Date.now());
            if (sourceID) {
                const prior = this.db.prepare('SELECT jobID FROM job_sources WHERE sourceID=?').get(sourceID);
                if (prior) return prior.jobID;
            }
            if (this.db.prepare('SELECT count(*) n FROM jobs').get().n >= total || this.db.prepare('SELECT count(*) n FROM jobs WHERE senderID=?').get(senderID).n >= perUser) throw new Error('Reminder quota reached');
            const id = randomUUID();
            this.db.prepare('INSERT INTO jobs (id,threadID,senderID,text,dueAt) VALUES (?,?,?,?,?)').run(id, threadID, senderID, text, dueAt);
            if (sourceID) this.db.prepare('INSERT INTO job_sources VALUES (?,?,?)').run(sourceID, id, Date.now() + 86400000);
            return id;
        });
    }

    pendingCount() {
        return this.db.prepare('SELECT count(*) n FROM jobs WHERE status IN (\'pending\',\'sending\')').get().n;
    }

    claimDue(now, limit = 10, leaseMs = 120000) {
        return this.transaction(() => {
            this.db.prepare('UPDATE jobs SET status=\'pending\',leaseToken=NULL WHERE status=\'sending\' AND leaseUntil<=?').run(now);
            const jobs = this.db.prepare('SELECT * FROM jobs WHERE status=\'pending\' AND dueAt<=? ORDER BY dueAt,id LIMIT ?').all(now, limit);
            for (const job of jobs) {
                job.leaseToken = randomUUID();
                this.db.prepare('UPDATE jobs SET status=\'sending\',leaseUntil=?,leaseToken=? WHERE id=?').run(now + leaseMs, job.leaseToken, job.id);
            }
            return jobs;
        });
    }

    completeJob(id, token) {
        return this.db.prepare('DELETE FROM jobs WHERE id=? AND status=\'sending\' AND leaseToken=?').run(id, token).changes === 1;
    }

    failJob(id, token, now, maxAttempts = 5) {
        return this.transaction(() => {
            const job = this.db.prepare('SELECT attempts FROM jobs WHERE id=? AND status=\'sending\' AND leaseToken=?').get(id, token);
            if (!job) return false;
            const attempts = job.attempts + 1;
            this.db.prepare('UPDATE jobs SET status=?,attempts=?,dueAt=?,leaseUntil=NULL,leaseToken=NULL WHERE id=?').run(
                attempts >= maxAttempts ? 'failed' : 'pending', attempts, now + Math.min(3600000, 30000 * 2 ** (attempts - 1)), id,
            );
            return true;
        });
    }

    acceptMessage(id, now = Date.now()) {
        return this.transaction(() => {
            this.db.prepare('DELETE FROM received WHERE expiresAt<=?').run(now);
            return this.db.prepare('INSERT OR IGNORE INTO received VALUES (?,?)').run(id, now + 86400000).changes === 1;
        });
    }

    hasMessage(id, now = Date.now()) {
        return !!this.db.prepare('SELECT 1 FROM received WHERE id=? AND expiresAt>?').get(id, now);
    }

    putLink(value, limit = 10000) {
        const url = safeLink(value);
        return this.transaction(() => {
            const existing = this.db.prepare('SELECT id FROM links WHERE url=?').get(url);
            if (existing) return existing.id;
            if (this.db.prepare('SELECT count(*) n FROM links').get().n >= limit) return null;
            const id = randomBytes(24).toString('hex');
            this.db.prepare('INSERT INTO links VALUES (?,?)').run(id, url);
            return id;
        });
    }

    getLink(id) {
        return this.db.prepare('SELECT url FROM links WHERE id=?').get(id)?.url ?? null;
    }

    migrateLegacy({jobs = {}, links = {}}) {
        for (const [timestamp, job] of Object.entries(jobs)) validateJob({...job, dueAt: Number(timestamp)});
        for (const [id, link] of Object.entries(links)) {
            if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) throw new Error('Invalid legacy link id');
            safeLink(link.url);
        }
        this.transaction(() => {
            this.db.exec('CREATE TABLE IF NOT EXISTS imported (id TEXT PRIMARY KEY)');
            for (const [timestamp, job] of Object.entries(jobs)) {
                const id = 'legacy-' + createHash('sha256').update(timestamp).digest('hex');
                if (this.db.prepare('INSERT OR IGNORE INTO imported VALUES (?)').run(id).changes) this.db.prepare('INSERT INTO jobs (id,threadID,senderID,text,dueAt) VALUES (?,?,?,?,?)').run(id, job.threadID, 'legacy', job.text, Number(timestamp));
            }
            for (const [id, link] of Object.entries(links)) {
                const existing = this.getLink(id);
                if (existing && existing !== safeLink(link.url)) throw new Error('Conflicting legacy link');
                this.db.prepare('INSERT OR IGNORE INTO links VALUES (?,?)').run(id, safeLink(link.url));
            }
        });
    }

    close() {
        if (this.db?.isOpen) this.db.close();
    }
}

function validateJob({threadID, text, dueAt}) {
    if (typeof threadID !== 'string' || !threadID || typeof text !== 'string' || !text.trim() || text.length > 10000 || !Number.isSafeInteger(dueAt) || dueAt <= 0) throw new Error('Invalid reminder');
}

module.exports = {Storage, safeLink};
