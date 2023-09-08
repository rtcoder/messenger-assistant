const wiki = require('wikipedia');

module.exports = {
    wiki_search: async (query) => {
        try {
            const search = query.replaceAll('wiki:', '')
            wiki.setLang('pl');
            const page = await wiki.page(search);
            return await page.intro();
        } catch (error) {
            return new Promise((resolve, reject) => {
                resolve('Błąd: coś się zepsuło...');
            });
        }
    },
};
