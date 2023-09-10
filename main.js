global.__basedir = __dirname;

const login = require('./utils/login');
const listener = require('./utils/listener');
const jobChecker = require('./utils/job-checker');


login(api => {
    listener(api);

    jobChecker(api);
});
