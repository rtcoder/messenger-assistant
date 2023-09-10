const sendMsg = require('../utils/send-msg');
const {exec} = require('child_process');
const {putLink} = require('../utils/link-generator');

module.exports = {
    is_yt_dlp: cmd => cmd === 'pobierz',

    yt_dlp: async (cmd, messageContent, api, msg) => {
        try {
            const args = [
                '--dump-single-json',
                '--no-warnings',
                '--no-call-home',
                '--no-check-certificate',
                '--prefer-free-formats',
                '--youtube-skip-dash-manifest',
                `--referer=${messageContent}`,
            ].join(' ');

            exec(
                `yt-dlp "${messageContent}" ${args}`,
                (error, stdout, stderr) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.log(`stderr: ${stderr}`);
                        return;
                    }
                    const output = JSON.parse(stdout);
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

                    const link = putLink(bestVideo.url);

                    sendMsg(api, msg.threadID, `${link}`);
                });

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
