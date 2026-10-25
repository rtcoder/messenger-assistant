const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
let count = 0;

function scan(dir) {
    for (const item of fs.readdirSync(dir, {withFileTypes: true})) {
        if (item.name.startsWith('.') || ['node_modules', 'data', 'config', 'db', 'files'].includes(item.name)) continue;
        const filename = path.join(dir, item.name);
        if (item.isDirectory()) scan(filename);
        else if (item.name.endsWith('.js')) {
            new vm.Script(fs.readFileSync(filename, 'utf8'), {filename});
            count++;
        }
    }
}

scan(root);
console.log(`JavaScript syntax OK: ${count} files`);
