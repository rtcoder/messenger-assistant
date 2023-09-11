const sendMsg = require('../utils/send-msg');
const getDateFormat = require('../utils/date-format');
const {getDb, setDbValue} = require('../utils/db');

function isReminder(cmd) {
    return cmd.includes('przypomnij');
}

function getReminderTimeTimestamp(cmd) {
    const timeStr = cmd.split(':')[1];

    const now = new Date();
    timeStr.split(' ').forEach(val => {
        val = val.toLocaleLowerCase();
        const numericValue = +(val.replaceAll(/\D/g, ''));

        if (val.endsWith('h')) {
            now.setHours(now.getHours() + numericValue);
        } else if (val.endsWith('min')) {
            now.setMinutes(now.getMinutes() + numericValue);
        } else if (val.endsWith('s')) {
            now.setSeconds(now.getSeconds() + numericValue);
        } else if (val.endsWith('y')) {
            now.setFullYear(now.getFullYear() + numericValue);
        } else if (val.endsWith('m')) {
            now.setMonth(now.getMonth() - 1 + numericValue);
        } else if (val.endsWith('d')) {
            now.setDate(now.getDate() + numericValue);
        }
    });
    return now.getTime();
}

function parseInterval(input) {
    const regex = /^every:(\d+)(min|h|day|month|year)$/;
    const dayOfWeekRegex = /^every:(\w+) (\d{1,2}:\d{2}[APap][Mm])$/;

    const minutesMatch = input.match(regex);
    const dayOfWeekMatch = input.match(dayOfWeekRegex);

    if (minutesMatch) {
        const [, value, unit] = minutesMatch;
        const parsedValue = parseInt(value);
        if (!isNaN(parsedValue)) {
            switch (unit) {
                case 'min':
                    return `*/${parsedValue} * * * *`;
                case 'h':
                    return `0 */${parsedValue} * * *`;
                case 'day':
                    return `0 0 */${parsedValue} * *`;
                case 'month':
                    return `0 0 1 */${parsedValue} *`;
                case 'year':
                    return `0 0 1 1 */${parsedValue}`;
                default:
                    return null; // Nieprawidłowa jednostka czasu
            }
        }
    } else if (dayOfWeekMatch) {
        const [, dayOfWeek, time] = dayOfWeekMatch;
        if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(dayOfWeek)) {
            return `0 ${time.replace(':', ' ')} * * ${dayOfWeek.substring(0, 3)}`;
        }
    }

    return null; // Nieprawidłowy format
}

module.exports = {
    is_set_job: (cmd) => {
        if (cmd === 'zadanie') {
            return true;
        }
        const regex = /przypomnij:[a-z0-9\s]+/gm;
        const match = regex.exec(cmd);
        return match !== null;
    },

    // ['zadanie', 'przypomnij'].includes(cmd.toLocaleLowerCase()),

    set_job: async (cmd, messageContent, api, message) => {
        if (isReminder(cmd)) {
            const reminderTimestamp = getReminderTimeTimestamp(cmd);
            const date = getDateFormat(
                'yyyy-MM-dd HH:mm:ss',
                reminderTimestamp,
            );

            const jobsDb = getDb('jobs');
            jobsDb[reminderTimestamp] = {
                threadID: message.threadID,
                text: messageContent,
            };
            setDbValue('jobs', jobsDb);

            sendMsg(api, message.threadID,
                `Ustawiono przypomnienie na ${date}`);
        }

        return new Promise((resolve, reject) => {
            resolve(messageContent);
        });
    },
};
