const {test} = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('runtime guard rejects unsupported versions and accepts the minimum and Node 24', () => {
    for (const [version, supported] of [['20.20.2', false], ['22.15.0', false], ['22.16.0', true], ['24.0.0', true]]) {
        const result = spawnSync(process.execPath, ['-e',
            `Object.defineProperty(process.versions, 'node', {value: ${JSON.stringify(version)}}); require('./scripts/check-runtime');`],
        {encoding: 'utf8'});
        assert.equal(result.status, supported ? 0 : 1, result.stderr);
        if (!supported) {
            assert.match(result.stderr, /requires Node\.js >=22\.16\.0/);
            assert.ok(result.stderr.includes(version));
        }
    }
});

test('unsupported runtime stops entry points before dependencies, configuration or commands', t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'messenger-engine-'));
    t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
    fs.mkdirSync(path.join(dir, 'scripts'));
    // Deliberately omit dependencies and config: the runtime diagnostic must come first.
    for (const file of ['main.js', 'scripts/migrate.js', 'scripts/check-runtime.js', 'install.sh', 'update.sh', 'run_script.sh']) {
        if (fs.existsSync(file)) fs.copyFileSync(file, path.join(dir, file));
    }
    const preload = path.join(dir, 'simulate-node20.cjs');
    fs.writeFileSync(preload, "Object.defineProperty(process.versions, 'node', {value: '20.20.2'});");
    for (const command of ['npm', 'git', 'pm2']) {
        fs.writeFileSync(path.join(dir, command), '#!/bin/sh\necho unexpected-command >&2\nexit 99\n', {mode: 0o700});
    }
    fs.symlinkSync(process.execPath, path.join(dir, 'node'));
    const env = {...process.env, PATH: dir + path.delimiter + process.env.PATH, NODE_OPTIONS: `--require=${preload}`};
    for (const file of ['main.js', 'scripts/migrate.js', 'install.sh', 'update.sh', 'run_script.sh']) {
        const result = spawnSync(file.endsWith('.sh') ? 'sh' : process.execPath, [file], {cwd: dir, env, encoding: 'utf8'});
        assert.equal(result.status, 1, `${file}: ${result.stderr}`);
        assert.match(result.stderr, /requires Node\.js >=22\.16\.0/, file);
        assert.doesNotMatch(result.stderr, /unexpected-command/);
    }
});
