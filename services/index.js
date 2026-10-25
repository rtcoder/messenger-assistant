const modules = [require('./help'), require('./group_title'), require('./hello'), require('./news'), require('./translate'), require('./user-call'), require('./wiki'), require('./yt'), require('./yt-dlp'), require('./nlp/summarize'), require('./wolfram/wolfram'), require('./set_job')];
module.exports = Object.assign({}, ...modules);
