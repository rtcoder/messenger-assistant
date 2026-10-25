const {test} = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {Storage} = require('../utils/storage');
test('public PHP handler redirects stored HTTPS links and denies secret paths and unknown keys', t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'messenger-web-'));
    const filename = path.join(dir, 'links.sqlite');
    const db = new Storage(filename);
    const key = db.putLink('https://example.com/video');
    db.close();
    t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
    const invoke = uri => {
        const script = 'require $argv[1]; echo json_encode(handleRequest($argv[2], $argv[3]));';
        const result = spawnSync('php', ['-r', script, path.resolve('public/index.php'), uri, filename], {
            encoding: 'utf8',
            env: {...process.env, XDEBUG_MODE: 'off'},
        });
        assert.equal(result.status, 0, result.stderr);
        return JSON.parse(result.stdout);
    };
    const redirect = invoke('/link/' + key + '?utm=x');
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.Location, 'https://example.com/video');
    for (const uri of ['/config/app-state.json', '/db/jobs.json', '/.git/config', '/../config/config.json', '/link/missing']) assert.equal(invoke(uri).status, 404);
    assert.equal(invoke('/').status, 200);
});
