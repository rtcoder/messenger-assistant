// The dispatcher owns admission, limits, deduplication and the error boundary.
module.exports = require('./dispatcher').createDispatcher;
