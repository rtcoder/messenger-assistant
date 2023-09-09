const sendMsg = require('../utils/send-msg');
const youtubedl = require('youtube-dl-exec');
const {getDb, setDbKeyValue} = require('../utils/db');
const {getRandomString} = require('../utils/string-helpers');
const getConfig = require('../utils/config');
const config = getConfig('config');
const linksDb = getDb('links');
const {exec} = require('child_process');

module.exports = {
    yt_dlp: async (cmd, messageContent, api, msg) => {
        try {
            const args = [
                '--dump-single-json',
                '--no-warnings',
                '--no-call-home',
                '--no-check-certificate',
                '--prefer-free-formats',
                '--youtube-skip-dash-manifest',
                `--referer=${messageContent}`
            ].join(' ');
            exec(`yt-dlp ${messageContent} ${args}`, (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
            });
            // youtubedl(messageContent, {
            //     dumpSingleJson: true,
            //     noCheckCertificates: true,
            //     noWarnings: true,
            //     preferFreeFormats: true,
            //     addHeader: [
            //         'referer:youtube.com',
            //         'user-agent:googlebot',
            //     ],
            //
            // }).then(output => {
            //     console.info(output);
            //     const formats = output.formats.filter(f =>
            //         f.audio_ext === 'none' && f.format_note && f.audio_channels,
            //     ).map(f => ({
            //         width: f.width,
            //         height: f.height,
            //         url: f.url,
            //         format_note: f.format_note,
            //         quality: f.quality,
            //         fps: f.fps,
            //     }));
            //
            //     const bestVideo = formats.reduce((best, current) => {
            //         return current.quality > best.quality ? current : best;
            //     }, formats[0]);
            //
            //     const found = Object.keys(linksDb).find(key => {
            //         return linksDb[key].url === bestVideo.url;
            //     });
            //     let url;
            //     if (found) {
            //         url = found;
            //     } else {
            //         const newKey = getRandomString();
            //         setDbKeyValue('links', newKey, {
            //             url: bestVideo.url,
            //         });
            //         url = newKey;
            //     }
            //
            //     sendMsg(api, msg.threadID, `${config.domain}link/${url}`);
            // });

            return new Promise((resolve, reject) => {
                resolve(null);
            });
        } catch (error) {
            sendMsg(api, msg.threadID, `[${cmd}] Błąd: coś się zepsuło...`);
            console.error(error);
            return new Promise((resolve, reject) => {
                resolve(null);
            });
        }
    },
};
