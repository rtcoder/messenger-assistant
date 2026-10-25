const {parseMessage, authorizeCommands} = require('./message-policy');

function createDispatcher({
                              config, execute, send, logger = () => {
    }, storage, now = Date.now,
                          }) {
    const queue = [], users = new Map(), seen = new Map(), idle = [];
    let active = 0, closed = false, windowStart = now(), globalCount = 0;
    const log = event => logger(event);

    function drain() {
        while (active < config.concurrency && queue.length) {
            const {parsed, message, resolve} = queue.shift();
            active++;
            (async () => {
                try {
                    const result = await execute(parsed, message);
                    if (typeof result === 'string' && result.trim()) await send(message.threadID, result, message.messageID);
                    else if (result && typeof result === 'object') await send(message.threadID, result, message.messageID);
                    if (typeof message.messageID === 'string' && storage) storage.acceptMessage(message.messageID, now());
                    resolve('ok');
                } catch {
                    if (message.messageID) seen.delete(message.messageID);
                    log('command_failed');
                    try {
                        await send(message.threadID, 'Nie udało się wykonać polecenia. Spróbuj później.', message.messageID);
                    } catch {
                        log('send_failed');
                    }
                    resolve('failed');
                } finally {
                    active--;
                    drain();
                    if (!active && !queue.length) while (idle.length) idle.shift()();
                }
            })();
        }
    }

    async function handle(message) {
        if (closed) return 'closed';
        let parsed;
        try {
            parsed = parseMessage(message, config);
        } catch {
            return 'invalid';
        }
        if (!parsed) return 'ignored';
        if (!authorizeCommands(parsed.commands, message, config)) return 'denied';
        const time = now();
        if (time - windowStart >= 60000) {
            windowStart = time;
            globalCount = 0;
            users.clear();
        }
        for (const [id, expiry] of seen) if (expiry <= time) seen.delete(id);
        const id = typeof message.messageID === 'string' ? message.messageID : null;
        if (id && seen.has(id)) return 'duplicate';
        if (globalCount >= config.global_rate_limit || (users.get(message.senderID) || 0) >= config.user_rate_limit) return 'limited';
        if (active >= config.concurrency && queue.length >= config.max_queue) return 'busy';
        if (id && storage && storage.hasMessage(id, time)) return 'duplicate';
        if (id) {
            if (seen.size >= 10000) seen.delete(seen.keys().next().value);
            seen.set(id, time + 86400000);
        }
        globalCount++;
        users.set(message.senderID, (users.get(message.senderID) || 0) + 1);
        return new Promise(resolve => {
            queue.push({parsed, message, resolve});
            drain();
        });
    }

    return {
        handle, close: async () => {
            closed = true;
            if (active || queue.length) await new Promise(resolve => idle.push(resolve));
        },
    };
}

module.exports = {createDispatcher};
