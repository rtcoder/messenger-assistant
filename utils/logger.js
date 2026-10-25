// Never pass provider errors, URLs, cookies or message objects to this logger.
module.exports = function log(event, fields = {}) {
    const safe = {time: new Date().toISOString(), event: /^[a-z_]+$/.test(event) ? event : 'unknown_event'};
    for (const key of ['durationMs', 'attempt', 'count']) if (Number.isFinite(fields[key])) safe[key] = fields[key];
    process.stdout.write(JSON.stringify(safe) + '\n');
};
