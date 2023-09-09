const sendMsg = require('../utils/send-msg');

const HELP_TEXT = `
Oznacz bota przy pomocy @
Pomoc:
[help]

Oznaczenie członków grupy:
[everyone] - wszyscy
[call_all] - wszyscy
[call_boys] - mężczyźni
[call_girls] - kobiety
[call_admin] - administratorzy

Youtube: 
[yt]szukana fraza
[youtube]szukana fraza

Wikipedia:
[wiki]hasło

Przywitanie:
[cześć]
[witaj]
[siema]
[hej]

Streszczenie tekstu:
[summarize]Długi tekst
lub odpisz na długą wiadomość oznaczając bota i wpisując
[summarize]

Tłumaczenie:
[translate_język]Tekst
np [translate_pl]Tekst
[translate_en]Tekst
[translate_de]Tekst
lub odpisz na wiadomość oznaczając bota i wpisując
[translate_język]

Zmiana nazwy grupy:
[title]Nowa nazwa

polecenia można łączyć np:
[translate_de:summarize:wiki]Andrzej Duda
1. znajdzie w Wikipedii hasło "Andrzej Duda"
2. zrobi podsumowanie treści
3. przetłumaczy na język niemiecki

`;

module.exports = {
    help: async (cmd, messageContent, api, message) => {
        sendMsg(api, message.threadID, HELP_TEXT);

        return new Promise((resolve, reject) => resolve(messageContent));
    },
};
