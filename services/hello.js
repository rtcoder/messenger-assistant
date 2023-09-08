module.exports = {
    is_hello: (msg) => {
        const content = msg.body.toLocaleLowerCase();
        return !!(content.includes('witaj')
            || content.includes('hej')
            || content.includes('siema')
            || content.includes('cześć'));

    },
    hello: async () => {
        return new Promise((resolve, reject) => {
            resolve('Cześć chuje!');
        });
    },
};
