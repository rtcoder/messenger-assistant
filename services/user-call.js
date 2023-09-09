const sendMsg = require('../utils/send-msg');

module.exports = {
    user_call: async (cmd, messageContent, api, msg) => {
        if (!msg.isGroup) {
            sendMsg(api, msg.threadID,
                `[${cmd}] Ta funkcja jest dostępna tylko dla konwersacji grupowych`);

            return new Promise((resolve, reject) => {
                resolve(messageContent);
            });
        }

        const ids = [];

        api.getThreadInfo(msg.threadID, (err, info) => {
            const content = msg.body.toLocaleLowerCase();
            if (cmd === 'everyone'
                || cmd === 'call_all'
                || cmd === 'call_girls'
                || cmd === 'call_boys') {
                ids.push(
                    ...info.participantIDs,
                );
            }
            if (cmd === 'call_admin') {
                ids.push(
                    ...info.adminIDs.map(admin => admin.id),
                );
            }

            getUsersInfo(ids, api, (users) => {
                let list = users;
                if (cmd === 'call_girls') {
                    list = users.filter(u => u.gender === 1);
                }
                if (cmd === 'call_boys') {
                    list = users.filter(u => u.gender === 2);
                }
                const mentions = list.map(user => {
                    return {
                        tag: `@${user.name}`,
                        id: user.id,
                    };
                });
                const message = {
                    mentions,
                    body: list.map(u => `@${u.name}`).join(' '),
                };
                sendMsg(api, msg.threadID, message);
            });
        });


        return new Promise((resolve, reject) => {
            resolve(messageContent);
        });
    },
};

function getUsersInfo(ids, api, callback) {
    const users = [];

    ids.forEach(id => {
        api.getUserInfo(id, (err, usr) => {
            const key = Object.keys(usr)[0];
            const usrInfo = usr[key];
            users.push({
                name: usrInfo.name,
                gender: usrInfo.gender,
                id: id,
            });

            if (users.length === ids.length) {
                callback(users);
            }
        });
    });
}
