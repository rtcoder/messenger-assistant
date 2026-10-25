const {test} = require('node:test');
const assert = require('node:assert/strict');

test('download rejects shell payloads, non-YouTube hosts, credentials and playlists before spawning', async () => {
    const {getVideoLink} = require('../services/yt-dlp');
    let calls = 0;
    const execFileImpl = () => {
        calls++;
    };
    for (const url of ['https://example.invalid/$(printf INJECTED)', 'https://youtube.com.evil.test/watch?v=abcdefghijk', 'http://127.0.0.1/', 'https://user@youtube.com/watch?v=abcdefghijk', 'https://youtube.com/playlist?list=abc', '--exec=sh']) {
        await assert.rejects(getVideoLink(url, {execFileImpl}));
    }
    assert.equal(calls, 0);
});
test('download passes canonical video URL as one argument, disables shell and validates output', async () => {
    const {getVideoLink} = require('../services/yt-dlp');
    const result = await getVideoLink('https://youtu.be/abcdefghijk?x=$(touch%20oops)', {
        execFileImpl: (bin, args, options, cb) => {
            assert.equal(bin, 'yt-dlp');
            assert.equal(options.shell, false);
            assert.deepEqual(args.slice(-2), ['--', 'https://www.youtube.com/watch?v=abcdefghijk']);
            assert(!args.includes('--no-check-certificate'));
            assert(args.includes('--ignore-config'));
            cb(null, JSON.stringify({
                formats: [{
                    url: 'https://r1.googlevideo.com/videoplayback?token=x',
                    vcodec: 'avc',
                    acodec: 'aac',
                    height: 360,
                }],
            }));
        },
    });
    assert.equal(result, 'https://r1.googlevideo.com/videoplayback?token=x');
});
test('malformed, playlist and empty download output reject cleanly', async () => {
    const {getVideoLink} = require('../services/yt-dlp');
    for (const value of ['bad json', '{}', '{"formats":[]}', '{"_type":"playlist","entries":[]}']) {
        await assert.rejects(getVideoLink('https://youtu.be/abcdefghijk', {execFileImpl: (b, a, o, cb) => setImmediate(() => cb(null, value))}));
    }
});
test('HTTP enforces host, TLS, redirects and streaming byte limit', async () => {
    const {requestText} = require('../utils/http');
    let requested = false;
    await assert.rejects(requestText('http://127.0.0.1', {
        hosts: ['example.com'], fetchImpl: async () => {
            requested = true;
        },
    }));
    assert.equal(requested, false);
    await assert.rejects(requestText('https://example.com', {
        hosts: ['example.com'],
        maxBytes: 3,
        fetchImpl: async () => new Response('1234'),
    }));
    await assert.rejects(requestText('https://example.com', {
        hosts: ['example.com'],
        fetchImpl: async () => new Response('', {status: 302, headers: {Location: 'http://127.0.0.1'}}),
    }));
    assert.equal(await requestText('https://example.com', {
        hosts: ['example.com'], fetchImpl: async (url, options) => {
            assert.equal(options.redirect, 'error');
            assert(options.signal);
            return new Response('abc');
        },
    }), 'abc');
});
test('send awaits acknowledgement and rejects synchronous/async failure and timeout', async () => {
    const {createSender} = require('../utils/send-msg');
    const config = {bot_response_prefix: 'BOT: ', request_timeout_ms: 10};
    await assert.rejects(createSender({
        sendMessage() {
            throw Error('secret');
        },
    }, config)('1', 'hello'));
    await assert.rejects(createSender({
        sendMessage(a, b, cb) {
            cb(Error('secret'));
        },
    }, config)('1', 'hello'));
    await assert.rejects(createSender({
        sendMessage() {
        },
    }, config)('1', 'hello'));
    let sent;
    await createSender({
        sendMessage(body, thread, cb, reply) {
            sent = {body, thread, reply};
            cb(null, {});
        },
    }, config)('1', 'hello', 'reply');
    assert.deepEqual(sent, {body: 'BOT: hello', thread: '1', reply: 'reply'});
});
test('summary handles Polish sentences locally and limits output', async () => {
    const {summarize_text} = require('../services/nlp/summarize');
    const text = 'Kot śpi na kanapie. Pies biega po parku. Kot lubi mleko. W domu mieszka kot.';
    const result = await summarize_text('summarize', text);
    assert(result.includes('Kot'));
    assert(result.length < text.length);
    assert(!result.includes('undefined'));
});
test('Wolfram returns bounded text, handles no results and does not leak API keys on errors', async () => {
    const {queryWolfram} = require('../services/wolfram/wolfram');
    const fetchImpl = async (url, options) => {
        assert.equal(new URL(url).searchParams.get('input'), '2+2');
        return new Response(JSON.stringify({
            queryresult: {
                success: true,
                pods: [{title: 'Result', subpods: [{plaintext: '4'}]}],
            },
        }));
    };
    assert.equal(await queryWolfram('2+2', 'SECRET', {fetchImpl}), 'Result\n4');
    assert.match(await queryWolfram('unknown', 'SECRET', {fetchImpl: async () => new Response('{"queryresult":{"success":false}}')}), /Brak/);
    await assert.rejects(queryWolfram('x', 'SECRET', {
        fetchImpl: async () => {
            throw Error('url contains SECRET');
        },
    }), error => !error.message.includes('SECRET'));
});

test('sender shifts mentions past prefix and chunks astral characters without broken surrogates', async () => {
    const {createSender} = require('../utils/send-msg');
    const sent = [];
    const send = createSender({
        sendMessage(body, thread, cb) {
            sent.push(body);
            cb(null, {});
        },
    }, {bot_response_prefix: '@Jan: ', request_timeout_ms: 100});
    await send('1', {
        body: '@Jan @Jan',
        mentions: [{id: '2', tag: '@Jan', fromIndex: 0}, {id: '3', tag: '@Jan', fromIndex: 5}],
    });
    assert.deepEqual(sent[0].mentions.map(m => m.fromIndex), [6, 11]);
    sent.length = 0;
    await send('1', '🙂'.repeat(10000));
    assert(sent.length <= 3);
    for (const chunk of sent) {
        assert(chunk.length <= 4000);
        assert(chunk.isWellFormed());
    }
});
