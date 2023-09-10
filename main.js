const login = require('./utils/login');
const listener = require('./utils/listener');
global.__basedir = __dirname;

login(listener);
