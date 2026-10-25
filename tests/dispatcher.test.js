const {test} = require('node:test');
const assert = require('node:assert/strict');
const {validateConfig} = require('../utils/config');
const config = validateConfig({
    bot_user_id: '1',
    threads_ids: ['100'],
    allow_private_messages: true,
    allowed_user_ids: ['2'],
    admin_user_ids: ['3'],
});
const message = (extra = {}) => ({
    type: 'message',
    threadID: '100',
    senderID: '2',
    isGroup: true,
    body: '@Bot [help]',
    mentions: {'1': '@Bot'}, ...extra,
});
const deferred = () => {
    let resolve;
    const promise = new Promise(r => resolve = r);
    return {promise, resolve};
};

function make(extra = {}) {
    const {createDispatcher} = require('../utils/dispatcher');
    const executed = [], sent = [], logs = [];
    const dispatch = createDispatcher({
        config, execute: async (...a) => {
            executed.push(a);
            return 'ok';
        }, send: async (...a) => sent.push(a), logger: (...a) => logs.push(a), ...extra,
    });
    return {dispatch, executed, sent, logs};
}

test('deny unknown DM, unlisted group, self and non-message events before services and content logging', async () => {
    const {dispatch, executed, sent, logs} = make();
    for (const input of [undefined, {}, message({
        threadID: '9',
        senderID: '9',
        isGroup: false,
    }), message({threadID: '900'}), message({senderID: '1'}), message({type: 'event'})]) {
        await dispatch.handle(input);
    }
    assert.equal(executed.length, 0);
    assert.equal(sent.length, 0);
    assert(!JSON.stringify(logs).includes('@Bot'));
});
test('admitted message executes once, strips bot mention and respects quoted pipelines', async () => {
    const {dispatch, executed} = make();
    const msg = message({
        body: '@Bot [translate_en|summarize]',
        messageID: 'abc',
        messageReply: {body: 'Quoted private text'},
    });
    await dispatch.handle(msg);
    await dispatch.handle(msg);
    assert.equal(executed.length, 1);
    assert.deepEqual(executed[0][0].commands, ['summarize', 'translate_en']);
    assert.equal(executed[0][0].content, 'Quoted private text');
    assert.equal(msg.body, '@Bot [translate_en|summarize]');
});
test('authorize the entire pipeline before any side effects; restrict downloads', async () => {
    const {dispatch, executed} = make();
    await dispatch.handle(message({body: '@Bot [title|help] x'}));
    await dispatch.handle(message({body: '@Bot [pobierz] https://youtu.be/abcdefghijk'}));
    assert.equal(executed.length, 0);
    await dispatch.handle(message({senderID: '3', body: '@Bot [title] allowed'}));
    assert.equal(executed.length, 1);
});
test('malformed, oversized and excessive pipelines are rejected', async () => {
    const {dispatch, executed} = make();
    for (const body of ['@Bot [help|help|help|help|help]', '@Bot [help||help]', '@Bot [help] ' + 'x'.repeat(10001), '@Bot plain text']) await dispatch.handle(message({body}));
    assert.equal(executed.length, 0);
});
test('provider and outgoing message failures are contained without logging private error details', async () => {
    const {dispatch, logs} = make({
        execute: async () => {
            throw Error('COOKIE_SECRET user content');
        }, send: async () => {
            throw Error('COOKIE_SECRET');
        },
    });
    assert.equal(await dispatch.handle(message()), 'failed');
    assert(!JSON.stringify(logs).includes('COOKIE_SECRET'));
});
test('rate limit rejects requests before invoking services', async () => {
    const {dispatch, executed} = make({config: {...config, user_rate_limit: 1}});
    await dispatch.handle(message());
    await dispatch.handle(message());
    assert.equal(executed.length, 1);
});
test('bounded queue enforces concurrency and rejects overflow', async () => {
    const gate = deferred();
    let active = 0, max = 0;
    const {dispatch} = make({
        config: {...config, concurrency: 1, max_queue: 1}, execute: async () => {
            active++;
            max = Math.max(max, active);
            await gate.promise;
            active--;
            return 'ok';
        },
    });
    const one = dispatch.handle(message());
    const two = dispatch.handle(message());
    assert.equal(await dispatch.handle(message()), 'busy');
    gate.resolve();
    await Promise.all([one, two]);
    assert.equal(max, 1);
    await dispatch.close();
    assert.equal(await dispatch.handle(message()), 'closed');
});
test('listener error and rejected dispatch never escape the callback', async () => {
    const listen = require('../utils/listener');
    let cb;
    const logs = [];
    const stop = listen({
        setOptions() {
        }, listenMqtt(fn) {
            cb = fn;
            return () => {
            };
        },
    }, {
        handle: async () => {
            throw Error('SECRET');
        },
    }, (...a) => logs.push(a));
    cb(Error('SECRET'));
    cb(null, message());
    await new Promise(setImmediate);
    assert(!JSON.stringify(logs).includes('SECRET'));
    stop();
});

test('queued and executing messages are not persisted as completed before success', async () => {
    const gate = deferred();
    const completed = new Set();
    const storage = {
        hasMessage: id => completed.has(id), acceptMessage: id => {
            completed.add(id);
            return true;
        },
    };
    const {dispatch} = make({
        storage, execute: async () => {
            await gate.promise;
            return 'ok';
        },
    });
    const pending = dispatch.handle(message({messageID: 'work'}));
    assert.equal(completed.has('work'), false);
    gate.resolve();
    await pending;
    assert.equal(completed.has('work'), true);
});
