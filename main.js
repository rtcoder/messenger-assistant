require('./scripts/check-runtime');
const path = require('node:path');
const {Storage} = require('./utils/storage');
const getConfig = require('./utils/config');
const {createSender} = require('./utils/send-msg');
const {createDispatcher} = require('./utils/dispatcher');
const {createExecutor} = require('./services/_service-guess');
const {createJobChecker} = require('./utils/job-checker');
const createLinkGenerator = require('./utils/link-generator');
const listen = require('./utils/listener');
const log = require('./utils/logger');

function createRuntime(api, config, {directory = getConfig.dataDir(), logger = log} = {}) {
    const storage = new Storage(path.join(directory, 'bot.sqlite'));
    const links = new Storage(path.join(directory, 'links.sqlite'));
    const send = createSender(api, config);
    const context = {config, storage, putLink: createLinkGenerator(links, config.domain)};
    const dispatcher = createDispatcher({config, execute: createExecutor(api, context), send, logger, storage});
    const checker = createJobChecker({
        storage, send, logger, canSend: job =>
            config.threads_ids.includes(job.threadID) || (config.allow_private_messages && config.allowed_user_ids.includes(job.threadID)),
    });
    let stopListening, started = false, stopped = false;
    return {
        dispatcher, storage,
        start() {
            if (started || stopped) return;
            started = true;
            stopListening = listen(api, dispatcher, logger);
            checker.start();
            logger('started');
        },
        async stop() {
            if (stopped) return;
            stopped = true;
            if (typeof stopListening === 'function') stopListening();
            await Promise.all([checker.stop(), dispatcher.close()]);
            storage.close();
            links.close();
            logger('stopped');
        },
    };
}

async function main() {
    process.umask(0o077);
    const config = getConfig();
    if (!config.bot_user_id) throw Error('Set bot_user_id');
    const api = await require('./utils/login')(config);
    const runtime = createRuntime(api, config);
    runtime.start();
    let stopping = false;
    const shutdown = async () => {
        if (stopping) return;
        stopping = true;
        const deadline = setTimeout(() => {
            log('shutdown_timeout');
            process.exit(1);
        }, 90000);
        try {
            await runtime.stop();
            clearTimeout(deadline);
            process.exit(0);
        } catch {
            log('shutdown_failed');
            process.exit(1);
        }
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
}

if (require.main === module) {
    // Never print uncaught provider exceptions containing cookies/URLs/message text.
    process.on('uncaughtException', () => {
        log('fatal_exception');
        process.exit(1);
    });
    process.on('unhandledRejection', () => {
        log('fatal_rejection');
        process.exit(1);
    });
    main().catch(() => {
        log('startup_failed');
        process.exit(1);
    });
}
module.exports = {createRuntime};
