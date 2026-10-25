const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {validateConfig} = require('../utils/config');
test('runtime composes real dispatch, command registry, storage and acknowledged replies without login', async t => {
    const {createRuntime} = require('../main');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'messenger-runtime-'));
    t.after(() => fs.rmSync(dir, {force: true, recursive: true}));
    const sent = [];
    let incoming;
    const api = {
        setOptions() {
        }, listenMqtt(cb) {
            incoming = cb;
            return () => {
            };
        }, sendMessage(body, thread, cb) {
            sent.push({body, thread});
            cb(null, {messageID: 'sent'});
        },
    };
    const config = validateConfig({bot_user_id: '1', threads_ids: ['100']});
    const runtime = createRuntime(api, config, {
        directory: dir, logger: () => {
        },
    });
    t.after(() => runtime.stop());
    await runtime.dispatcher.handle({
        type: 'message',
        isGroup: true,
        threadID: '100',
        senderID: '2',
        messageID: '1',
        body: '@Bot [przypomnij:2h 30m] spotkanie',
        mentions: {'1': '@Bot'},
    });
    assert.equal(runtime.storage.pendingCount(), 1);
    assert.match(sent[0].body, /Ustawiono przypomnienie/);
    await runtime.dispatcher.handle({
        type: 'message',
        isGroup: true,
        threadID: '100',
        senderID: '2',
        messageID: '2',
        body: '@Bot [hej]',
        mentions: {'1': '@Bot'},
    });
    assert.match(sent[1].body, /Siema/);
    runtime.start();
    incoming(Error('SECRET'));
    await runtime.stop();
});
test('legacy request replacement preserves synchronous cookie jar and HTML parsing used by adapter', () => {
    const {createRequire} = require('node:module');
    const adapterRequire = createRequire(require.resolve('facebook-chat-api'));
    const request = adapterRequire('request');
    const jar = request.jar();
    jar.setCookie('c_user=123; domain=.facebook.com; path=/', 'https://www.facebook.com');
    assert.equal(jar.getCookies('https://www.facebook.com')[0].cookieString(), 'c_user=123');
    assert.equal(typeof request.defaults({jar: true}), 'function');
    const $ = adapterRequire('cheerio').load('<input name="lsd" value="synthetic">');
    assert.equal($('input[name=lsd]').val(), 'synthetic');
    assert.equal(typeof require('facebook-chat-api'), 'function');
});
test('invalid configuration fails closed', () => {
    for (const input of [{concurrency: 0}, {max_commands: 100}, {allow_private_messages: 'true'}, {allowed_user_ids: [123]}, {domain: 'http://example.com/'}]) assert.throws(() => validateConfig(input));
    assert.equal(validateConfig({}).allow_private_messages, false);
});

test('restart before queued reminder execution permits redelivery and creates one durable job', async t => {
    const {spawnSync} = require('node:child_process');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'messenger-restart-'));
    const message = {
        type: 'message',
        isGroup: true,
        threadID: '100',
        senderID: '2',
        messageID: 'queued-reminder',
        body: '@Bot [przypomnij:2h] meeting',
        mentions: {'1': '@Bot'},
    };
    const script = `
        const {createRuntime}=require('./main');
        const {validateConfig}=require('./utils/config');
        const config=validateConfig({bot_user_id:'1',threads_ids:['100'],concurrency:1});
        const runtime=createRuntime({sendMessage(){}},config,{directory:process.argv[1],logger:()=>{}});
        runtime.dispatcher.handle({...${JSON.stringify(message)},messageID:'blocker',body:'@Bot [help]'});
        runtime.dispatcher.handle(${JSON.stringify(message)});
        process.exit(0);
    `;
    const child = spawnSync(process.execPath, ['-e', script, dir], {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8',
        timeout: 5000,
    });
    assert.equal(child.status, 0, child.stderr);
    const {createRuntime} = require('../main');
    const runtime = createRuntime({
        sendMessage(a, b, cb) {
            cb(null, {});
        },
    }, validateConfig({bot_user_id: '1', threads_ids: ['100']}), {
        directory: dir, logger: () => {
        },
    });
    t.after(async () => {
        await runtime.stop();
        fs.rmSync(dir, {recursive: true, force: true});
    });
    assert.equal(await runtime.dispatcher.handle(message), 'ok');
    assert.equal(await runtime.dispatcher.handle(message), 'duplicate');
    assert.equal(runtime.storage.pendingCount(), 1);
});
