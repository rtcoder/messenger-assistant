const wiki = require('wikipedia');

(async () => {
    try {
        wiki.setLang('pl');
        const page = await wiki.page('Batman');
        console.log(page);
        //Response of type @Page object
        const summary = await page.intro();
        console.log(summary);
        //Response of type @wikiSummary - contains the intro and the main image
    } catch (error) {
        console.log(error);
        //=> Typeof wikiError
    }
})();
