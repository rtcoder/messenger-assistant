const {help, is_help} = require('./help');
const {group_title, is_group_title} = require('./group_title');
const {hello, is_hello} = require('./hello');
const {get_news, is_news} = require('./news');
const {translate_text, is_translate} = require('./translate');
const {user_call, is_user_call} = require('./user-call');
const wiki = require('wikipedia');
const {is_wiki_search} = require('./wiki');
const {yt_search, is_yt_search} = require('./yt');
const {is_yt_dlp, yt_dlp} = require('./yt-dlp');
const {is_summarize, summarize_text} = require('./nlp/summarize');
const {is_wolfram, run_wolfram} = require('./wolfram/wolfram');
module.exports = {
    help,
    is_help,
    group_title,
    is_group_title,
    hello,
    is_hello,
    get_news,
    is_news,
    translate_text,
    is_translate,
    user_call,
    is_user_call,
    wiki,
    is_wiki_search,
    yt_search,
    is_yt_search,
    yt_dlp,
    is_yt_dlp,
    is_summarize,
    summarize_text,
    is_wolfram,
    run_wolfram,
};
