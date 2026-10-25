module.exports = {
    apps: [{
        name: 'messenger-assistant', script: './main.js', cwd: __dirname,
        instances: 1, exec_mode: 'fork', max_memory_restart: '512M',
        min_uptime: '30s', max_restarts: 3, restart_delay: 15000,
        kill_timeout: 100000, env: {NODE_ENV: 'production'},
    }],
};
