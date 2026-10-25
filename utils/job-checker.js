function createJobChecker({
                              storage, send, canSend, logger = () => {
    }, now = Date.now,
                          }) {
    let running = null, timer;

    function tick() {
        if (running) return Promise.resolve();
        running = (async () => {
            // Claim one at a time so a queued job cannot outlive its lease.
            for (let count = 0; count < 10; count++) {
                const [job] = storage.claimDue(now(), 1, 300000);
                if (!job) break;
                try {
                    if (!canSend(job)) throw Error('Recipient is no longer allowed');
                    await send(job.threadID, job.text);
                    storage.completeJob(job.id, job.leaseToken);
                } catch {
                    storage.failJob(job.id, job.leaseToken, now());
                    logger('reminder_failed');
                }
            }
        })().catch(() => logger('scheduler_error')).finally(() => {
            running = null;
        });
        return running;
    }

    return {
        tick,
        start() {
            timer = setInterval(tick, 10000);
            tick();
        },
        async stop() {
            clearInterval(timer);
            await running;
        },
    };
}

module.exports = {createJobChecker};
