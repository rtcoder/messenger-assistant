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
[yt] szukana fraza
[youtube] szukana fraza

Wikipedia:
[wiki] hasło

Przywitanie:
[cześć]
[witaj]
[siema]
[hej]

Streszczenie tekstu:
[summarize] Długi tekst
lub odpisz na długą wiadomość oznaczając bota i wpisując
[summarize]

Tłumaczenie:
[translate_język] Tekst
np [translate_pl] Tekst
[translate_en] Tekst
[translate_de] Tekst
lub odpisz na wiadomość oznaczając bota i wpisując
[translate_język]

Zmiana nazwy grupy:
[title] Nowa nazwa

Pobieranie z Youtube:
[pobierz] Link do YT

Wiadomości:
[news] Szukana fraza (opcjonalnie)

Obliczenia:
[licz] Działanie
np:
[licz] x^2 - 4x + 4 < 4

Zadania:
[every:czas] Treść
np:
[every:4min] Co 4 minuty
[every:1h] Co godzinę
[every:2day] Co 2 dni
[every:4month] Co 4 miesiące
[every:4year] Co 4 lata
[every:wtorek 9:00AM] W każdy wtorek o 9 rano
[every:day 9:00AM] W każdy dzień o 9 rano

[przypomnij:czas] Treść 
np:
[przypomnij:2h 30m] Spotkanie
Wyśle wiadomość po 2.5h o treści "Spotkanie"

niektóre polecenia można łączyć np:
[translate_de|summarize|wiki] Andrzej Duda
1. znajdzie w Wikipedii hasło "Andrzej Duda"
2. zrobi podsumowanie treści
3. przetłumaczy na język niemiecki

`;

module.exports = {
    is_help: cmd => cmd === 'help',

    help: async (cmd, messageContent, api, message) => {
        sendMsg(api, message.threadID, HELP_TEXT);

        return new Promise((resolve, reject) => resolve(messageContent));
    },
};
