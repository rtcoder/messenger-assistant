const news = require('gnews');

const main = async () => {
    const starship = await news.search('Starship',{language:'pl'});
    const headline = await news.headlines({country: 'pl', language: 'pl', n: 5});
    console.log(headline);
    for (let article of starship) {
        console.log(article.pubDate + ' | ' + article.title);
    }

    const geo = await news.geo('Polska', {language:'pl',country:'pl',n : 5});
    console.log(geo);
};

main();
