module.exports = {
    help: async () => {
        return new Promise((resolve, reject) => {
            resolve(`
Oznacz bota przy pomocy @
Pomoc:
[help]

Youtube: 
yt:szukana fraza
youtube:szukana fraza

Wikipedia:
wiki:hasło

Przywitanie:
cześć
witaj
siema
hej

Streszczenie tekstu:
summarize:Długi tekst
lub odpisz na długą wiadomość oznaczając bota i wpisując
summarize:

Tłumaczenie:
translate_[język]:Tekst
np translate_pl:Tekst
translate_en:Tekst
translate_de:Tekst
lub odpisz na wiadomość oznaczając bota i wpisując
translate_[język]:

            `);
        });
    },
};
