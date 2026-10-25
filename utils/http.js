async function requestText(input, {hosts, timeoutMs = 20000, maxBytes = 2 * 1024 * 1024, fetchImpl = fetch} = {}) {
    let response;
    try {
        const url = new URL(input);
        if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts?.includes(url.hostname)) throw Error('Invalid URL');
        response = await fetchImpl(url.href, {
            redirect: 'error',
            signal: AbortSignal.timeout(timeoutMs),
            headers: {'User-Agent': 'MessengerAssistant/2.0'},
        });
        if (!response.ok || Number(response.headers.get('content-length')) > maxBytes) throw Error('Invalid response');
        const chunks = [];
        let length = 0;
        for await (const chunk of response.body) {
            length += chunk.length;
            if (length > maxBytes) throw Error('Response too large');
            chunks.push(Buffer.from(chunk));
        }
        return Buffer.concat(chunks).toString('utf8');
    } catch {
        try {
            await response?.body?.cancel();
        } catch {
        }
        // A fetch error may contain the request URL and an API key.
        throw new Error('External request failed');
    }
}

async function requestJson(input, options) {
    try {
        return JSON.parse(await requestText(input, options));
    } catch {
        throw new Error('External JSON request failed');
    }
}

module.exports = {requestText, requestJson};
