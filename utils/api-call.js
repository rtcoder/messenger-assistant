function apiCall(api, method, args = [], {timeoutMs = 20000} = {}) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error, value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (error) reject(new Error('Messenger operation failed'));
            else resolve(value);
        };
        const timer = setTimeout(() => finish(new Error('Messenger timeout')), timeoutMs);
        try {
            api[method](...args, finish);
        } catch (error) {
            finish(error);
        }
    });
}

module.exports = {apiCall};
