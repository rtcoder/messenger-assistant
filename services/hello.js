module.exports = {
    is_hello: (content) => {
        return !!(content.includes('witaj')
            || content.includes('hej')
            || content.includes('siema')
            || content.includes('cześć'));

    },
    hello: () => {
        return new Promise((resolve, reject) => {
            resolve('Cześć chuje!');
        });
    },
};
