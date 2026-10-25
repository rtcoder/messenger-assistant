const {parseReminderTime} = require('../utils/reminder-time');
module.exports = {
    is_set_job: cmd => cmd.startsWith('przypomnij:') || cmd === 'zadanie' || cmd.startsWith('every:'),
    set_job: async (cmd, content, api, message, {storage, config, commandIndex = 0}) => {
        if (!cmd.startsWith('przypomnij:')) return 'Zadania cykliczne nie są obsługiwane. Użyj [przypomnij:2h 30m] treść.';
        if (!content.trim()) return 'Podaj treść przypomnienia.';
        let dueAt;
        try {
            dueAt = parseReminderTime(cmd.slice('przypomnij:'.length));
        } catch {
            return 'Nieprawidłowy czas. Przykład: [przypomnij:2h 30m] treść. Jednostki: s, m/min, h, d, month, y. Maksymalnie 5 lat.';
        }
        const sourceID = message.messageID ? `${message.threadID}:${message.messageID}:${commandIndex}` : undefined;
        storage.addJob({
            threadID: message.threadID,
            senderID: message.senderID,
            text: content,
            dueAt,
            sourceID,
        }, {perUser: config.max_user_reminders, total: config.max_pending_reminders});
        const date = new Intl.DateTimeFormat('pl-PL', {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: config.timezone,
        }).format(dueAt);
        return `Ustawiono przypomnienie na ${date} (${config.timezone}).`;
    },
};
