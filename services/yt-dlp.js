const {execFile} = require('node:child_process');

function videoURL(input) {
    if (typeof input !== 'string' || input.length > 2048 || /[\x00-\x20\x7f]/.test(input)) throw Error('Invalid video URL');
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) throw Error('HTTPS video URL required');
    let id;
    if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
        if (url.pathname === '/watch') id = url.searchParams.get('v');
        else id = /^\/(?:shorts|live)\/([\w-]+)$/.exec(url.pathname)?.[1];
    }
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id || '')) throw Error('Unsupported video URL');
    return `https://www.youtube.com/watch?v=${id}`;
}

async function getVideoLink(input, {execFileImpl = execFile, timeoutMs = 20000} = {}) {
    const url = videoURL(input);
    const args = ['--ignore-config', '--no-plugin-dirs', '--no-cache-dir', '--no-playlist', '--skip-download', '--dump-single-json', '--no-warnings', '--use-extractors', 'youtube', '--socket-timeout', '10', '--retries', '0', '--extractor-retries', '0', '--', url];
    const stdout = await new Promise((resolve, reject) => {
        // No secrets or proxy credentials are inherited by the child process.
        execFileImpl('yt-dlp', args, {
            shell: false,
            timeout: timeoutMs,
            killSignal: 'SIGKILL',
            maxBuffer: 2 * 1024 * 1024,
            encoding: 'utf8',
            env: {PATH: process.env.PATH || '/usr/bin:/bin', LANG: 'C.UTF-8', YTDLP_NO_PLUGINS: '1'},
        }, (error, output) => {
            if (error) reject(new Error('Video lookup failed'));
            else resolve(output);
        });
    });
    let data;
    try {
        data = JSON.parse(stdout);
    } catch {
        throw Error('Invalid video response');
    }
    if (data._type === 'playlist' || !Array.isArray(data.formats)) throw Error('Expected a single video');
    const formats = data.formats.filter(f => f && typeof f.url === 'string' && f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none').sort((a, b) => (Number(b.height) || 0) - (Number(a.height) || 0));
    for (const format of formats) {
        try {
            const link = new URL(format.url);
            if (link.protocol === 'https:' && !link.username && !link.password && !link.port && (link.hostname === 'googlevideo.com' || link.hostname.endsWith('.googlevideo.com'))) return link.href;
        } catch {
        }
    }
    throw Error('No combined video/audio format available');
}

module.exports = {
    videoURL, getVideoLink,
    is_yt_dlp: cmd => cmd === 'pobierz',
    yt_dlp: async (cmd, content, api, message, context) => {
        const url = await getVideoLink(content, {timeoutMs: context.config.request_timeout_ms});
        return context.putLink(url);
    },
};
