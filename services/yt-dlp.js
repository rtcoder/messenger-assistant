const sendMsg = require('../utils/send-msg');
const youtubedl = require('youtube-dl-exec');
const {getDb, setDbKeyValue} = require('../utils/db');
const {getRandomString} = require('../utils/string-helpers');

module.exports = {
    yt_dlp: async (cmd, messageContent, api, msg) => {
        try {

            youtubedl(messageContent, {
                dumpSingleJson: true,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                addHeader: [
                    'referer:youtube.com',
                    'user-agent:googlebot',
                ],

            }).then(output => {

                const formats = output.formats.filter(f =>
                    f.audio_ext === 'none' && f.format_note && f.audio_channels,
                ).map(f => ({
                    width: f.width,
                    height: f.height,
                    url: f.url,
                    format_note: f.format_note,
                    quality: f.quality,
                    fps: f.fps,
                }));

                const bestVideo = formats.reduce((best, current) => {
                    return current.quality > best.quality ? current : best;
                }, formats[0]);

                const linksDb = getDb('links');
                const found = Object.keys(linksDb).find(key => {
                    return linksDb[key].url === bestVideo.url;
                });
                let url;
                if (found) {
                    url = found;
                } else {
                    const newKey = getRandomString();
                    setDbKeyValue('links', newKey, {
                        url: bestVideo.url,
                    });
                    url = newKey;
                }

                sendMsg(api, msg.threadID, url);
            });

            return new Promise((resolve, reject) => {
                resolve(null);
            });
        } catch (error) {
            sendMsg(api, msg.threadID, `[${cmd}] Błąd: coś się zepsuło...`);

            return new Promise((resolve, reject) => {
                resolve(null);
            });
        }
    },
};
