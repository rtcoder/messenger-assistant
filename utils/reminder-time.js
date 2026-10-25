function parseReminderTime(input, now = Date.now()) {
    if (typeof input !== 'string' || !input.trim() || input.length > 100) throw new Error('Invalid duration');
    const date = new Date(now);
    for (const token of input.trim().toLowerCase().split(/\s+/)) {
        const match = /^(\d+)(s|m|min|h|d|day|month|y|year)$/.exec(token);
        if (!match) throw new Error('Invalid duration');
        const n = Number(match[1]);
        if (!Number.isSafeInteger(n) || n <= 0 || n > 31536000) throw new Error('Invalid duration');
        const unit = match[2];
        const milliseconds = {s: 1000, m: 60000, min: 60000, h: 3600000, d: 86400000, day: 86400000}[unit];
        if (milliseconds) date.setTime(date.getTime() + n * milliseconds);
        else {
            const day = date.getUTCDate();
            date.setUTCDate(1);
            date.setUTCMonth(date.getUTCMonth() + (unit === 'month' ? n : n * 12));
            const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
            date.setUTCDate(Math.min(day, lastDay));
        }
    }
    const dueAt = date.getTime();
    if (!Number.isSafeInteger(dueAt) || dueAt <= now || dueAt - now > 5 * 366 * 86400000) throw new Error('Duration exceeds five years');
    return dueAt;
}

module.exports = {parseReminderTime};
