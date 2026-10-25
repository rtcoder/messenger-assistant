// Keep this check dependency-free so it also works before npm ci.
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 16)) {
    console.error(`Messenger Assistant requires Node.js >=22.16.0 (found ${process.versions.node}). Use Node.js 24 LTS; with nvm: nvm install 24 && nvm use 24.`);
    process.exit(1);
}
