const {translate} = require('@vitalets/google-translate-api');
module.exports = {
    is_translate: cmd => /^translate_[a-z]{2,3}$/.test(cmd),
    translate_text: async (cmd, content, api, message, {config}) => {
        const {text} = await translate(content, {to: cmd.slice('translate_'.length),
            fetchOptions: {
                signal: AbortSignal.timeout(config.request_timeout_ms),
                timeout: config.request_timeout_ms,
                size: 2 * 1024 * 1024,
                redirect: 'error',
            },
        });
        if (typeof text !== 'string') throw Error('Invalid translation response');
        return text.slice(0, 10000);
    },
};
