const sendMsg = require('../utils/send-msg');

module.exports = {
    is_user_call: (msg) => {
        const content = msg.body.toLocaleLowerCase();
        return !!(content.includes('[everyone]')
            || content.includes('[call_all]')
            || content.includes('[call_girls]')
            || content.includes('[call_boys]')
            || content.includes('[call_admin]'));

    },
    user_call: async (msg, api) => {
        if (!msg.isGroup) {
            return new Promise((resolve, reject) => {
                resolve('Ta funkcja jest dostępna tylko dla konwersacji grupowych');
            });
        }

        const ids = [];

        api.getThreadInfo(msg.threadID, (err, info) => {
            const content = msg.body.toLocaleLowerCase();
            if (content.includes('[everyone]')
                || content.includes('[call_all]')
                || content.includes('[call_girls]')
                || content.includes('[call_boys]')) {
                ids.push(
                    ...info.participantIDs,
                );
            }
            if (content.includes('[call_admin]')) {
                ids.push(
                    ...info.adminIDs.map(admin => admin.id),
                );
            }

            getUsersInfo(ids, api, (users) => {
                let list = users;
                if (content.includes('[call_girls]')) {
                    list = users.filter(u => u.gender === 1);
                }
                if (content.includes('[call_boys]')) {
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
            resolve(null);
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
