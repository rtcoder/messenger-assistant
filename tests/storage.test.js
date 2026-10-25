const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function open(t) {
    const {Storage} = require('../utils/storage');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'messenger-storage-'));
    const db = new Storage(path.join(dir, 'bot.sqlite'));
    t.after(() => {
        db.close();
        fs.rmSync(dir, {recursive: true, force: true});
    });
    return {db, dir};
}

test('reminders at the same timestamp survive independently and survive reopening', t => {
    const {db, dir} = open(t);
    const a = db.addJob({threadID: 'a', senderID: 'u', text: 'first', dueAt: 1000});
    const b = db.addJob({threadID: 'b', senderID: 'v', text: 'second', dueAt: 1000});
    assert.notEqual(a, b);
    db.close();
    const {Storage} = require('../utils/storage');
    const reopened = new Storage(path.join(dir, 'bot.sqlite'));
    t.after(() => reopened.close());
    assert.equal(reopened.pendingCount(), 2);
    assert.deepEqual(reopened.claimDue(1000, 10).map(x => x.text).sort(), ['first', 'second']);
});

test('leases prevent double claiming and expired work can be recovered', t => {
    const {db} = open(t);
    db.addJob({threadID: 'a', senderID: 'u', text: 'one', dueAt: 1000});
    const [job] = db.claimDue(1000, 1, 500);
    assert.equal(db.claimDue(1100, 1).length, 0);
    const [recovered] = db.claimDue(1600, 1);
    assert.equal(recovered.id, job.id);
    assert.notEqual(recovered.leaseToken, job.leaseToken);
    assert.equal(db.completeJob(job.id, job.leaseToken), false);
    assert.equal(db.completeJob(recovered.id, recovered.leaseToken), true);
    assert.equal(db.pendingCount(), 0);
});

test('failed delivery remains durable and retries only after backoff', t => {
    const {db} = open(t);
    db.addJob({threadID: 'a', senderID: 'u', text: 'one', dueAt: 1000});
    const [job] = db.claimDue(1000, 1);
    db.failJob(job.id, job.leaseToken, 1000);
    assert.equal(db.pendingCount(), 1);
    assert.equal(db.claimDue(1001, 1).length, 0);
    assert.equal(db.claimDue(100000, 1).length, 1);
});

test('legacy migration is atomic, idempotent and preserves distinct jobs', t => {
    const {db} = open(t);
    const input = {jobs: {'1000': {threadID: 'a', text: 'legacy'}}, links: {old: {url: 'https://example.com/a'}}};
    db.migrateLegacy(input);
    db.migrateLegacy(input);
    assert.equal(db.pendingCount(), 1);
    assert.equal(db.getLink('old'), 'https://example.com/a');
    assert.throws(() => db.migrateLegacy({jobs: {bad: {threadID: 'x', text: 'x'}}, links: {}}));
    assert.equal(db.pendingCount(), 1);
});

test('link lookup rejects unsafe schemes and produces unguessable persisted keys', t => {
    const {db} = open(t);
    assert.throws(() => db.putLink('javascript:alert(1)'));
    const key = db.putLink('https://example.com/a');
    assert.match(key, /^[a-f0-9]{48}$/);
    assert.equal(db.getLink(key), 'https://example.com/a');
    assert.equal(db.putLink('https://example.com/a'), key);
});

test('reminder units handle documented minutes and reject malformed/overflow durations', () => {
    const {parseReminderTime} = require('../utils/reminder-time');
    const now = Date.parse('2026-10-25T10:00:00Z');
    assert.equal(parseReminderTime('2h 30m', now), Date.parse('2026-10-25T12:30:00Z'));
    assert.equal(parseReminderTime('2h 30min', now), Date.parse('2026-10-25T12:30:00Z'));
    for (const input of ['', '0m', '-1h', '1h junk', 'Infinityh', '999999999999999999y']) {
        assert.throws(() => parseReminderTime(input, now));
    }
    assert.equal(parseReminderTime('1month', Date.parse('2026-01-31T10:00:00Z')), Date.parse('2026-02-28T10:00:00Z'));
});

test('failed jobs still consume quota and same legacy URL keeps every old key', t => {
    const {db} = open(t);
    db.addJob({threadID: 'a', senderID: 'u', text: 'x', dueAt: 1000}, {perUser: 1, total: 1});
    const [job] = db.claimDue(1000, 1);
    db.failJob(job.id, job.leaseToken, 1000, 1);
    assert.throws(() => db.addJob({threadID: 'a', senderID: 'u', text: 'x', dueAt: 1000}, {perUser: 1, total: 1}));
    db.migrateLegacy({links: {one: {url: 'https://example.com/a'}, two: {url: 'https://example.com/a'}}});
    assert.equal(db.getLink('one'), db.getLink('two'));
});

test('reopening storage preserves deliberately assigned web read permissions', t => {
    const {db, dir} = open(t);
    db.close();
    const filename = path.join(dir, 'bot.sqlite');
    fs.chmodSync(filename, 0o640);
    const {Storage} = require('../utils/storage');
    const again = new Storage(filename);
    t.after(() => again.close());
    assert.equal(fs.statSync(filename).mode & 0o777, 0o640);
});

test('replayed reminder source creates one job even after original delivery', t => {
    const {db} = open(t);
    const input = {threadID: '100', senderID: '2', text: 'one', dueAt: 1000, sourceID: 'message:step:0'};
    const id = db.addJob(input);
    assert.equal(db.addJob(input), id);
    assert.equal(db.pendingCount(), 1);
    const [job] = db.claimDue(1000, 1);
    db.completeJob(job.id, job.leaseToken);
    assert.equal(db.addJob(input), id);
    assert.equal(db.pendingCount(), 0);
});

test('link quota bounds persistent growth and falls back to direct HTTPS URLs', t => {
    const {db} = open(t);
    const generate = require('../utils/link-generator')(db, 'https://bot.example/', 2);
    const first = generate('https://example.com/one');
    generate('https://example.com/two');
    assert.equal(generate('https://example.com/three'), 'https://example.com/three');
    assert.equal(generate('https://example.com/one'), first);
    assert.equal(db.db.prepare('SELECT count(*) n FROM links').get().n, 2);
});
