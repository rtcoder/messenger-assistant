const services = require('./index');
const routes = [
    ['is_help', 'help'], ['is_group_title', 'group_title'], ['is_hello', 'hello'],
    ['is_news', 'get_news'], ['is_translate', 'translate_text'], ['is_user_call', 'user_call'],
    ['is_wiki_search', 'wiki_search'], ['is_yt_search', 'yt_search'], ['is_yt_dlp', 'yt_dlp'],
    ['is_summarize', 'summarize_text'], ['is_wolfram', 'run_wolfram'], ['is_set_job', 'set_job'],
];

function createExecutor(api, context) {
    return async ({commands, content}, message) => {
        // Resolve every command first; a typo must not partially execute a pipeline.
        const handlers = commands.map(cmd => routes.find(([check]) => services[check](cmd))?.[1]);
        if (handlers.some(fn => !fn)) return 'Nieznane polecenie. Wpisz [help].';
        let result = content;
        for (let i = 0; i < commands.length; i++) {
            if (typeof result !== 'string') throw Error('This result cannot be piped');
            if (result.length > context.config.max_input_length) result = result.slice(0, context.config.max_input_length);
            result = await services[handlers[i]](commands[i], result, api, message, {...context, commandIndex: i});
        }
        return result;
    };
}

module.exports = {createExecutor};
