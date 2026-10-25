const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {Storage} = require('../utils/storage');
test('scheduler keeps failed jobs and removes only acknowledged deliveries; rejects overlapping ticks', async t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'messenger-scheduler-'));
    const storage = new Storage(path.join(dir, 'db.sqlite'));
    t.after(() => {
        storage.close();
        fs.rmSync(dir, {force: true, recursive: true});
    });
    storage.addJob({threadID: '100', senderID: '2', text: 'remind', dueAt: 1000});
    const {createJobChecker} = require('../utils/job-checker');
    let attempts = 0, time = 1000, release;
    const checker = createJobChecker({
        storage, now: () => time, send: async () => {
            attempts++;
            if (attempts === 1) throw Error('offline');
            await new Promise(r => release = r);
        }, canSend: () => true, logger: () => {
        },
    });
    await checker.tick();
    assert.equal(storage.pendingCount(), 1);
    time = 100000;
    const tick = checker.tick();
    await new Promise(setImmediate);
    await checker.tick();
    assert.equal(attempts, 2);
    assert.equal(storage.pendingCount(), 1);
    release();
    await tick;
    assert.equal(storage.pendingCount(), 0);
});
