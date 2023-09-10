const sendMsg = require('../utils/send-msg');
const getDateFormat = require('../utils/date-format');
const {getDb, setDbValue} = require('../utils/db');

function isReminder(cmd) {
    return cmd.includes('przypomnij');
}

function getReminderTimeTimestamp(cmd) {
    const timeStr = cmd.split('|')[1];

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
            now.setMonth(now.getMonth()-1 + numericValue);
        } else if (val.endsWith('d')) {
            now.setDate(now.getDate() + numericValue);
        }
    });
    return now.getTime();
}

module.exports = {
    is_set_job: (cmd) => {
        if (cmd === 'zadanie') {
            return true;
        }
        const regex = /przypomnij|[a-z0-9\s]+/gm;
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
