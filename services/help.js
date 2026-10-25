const HELP_TEXT = `W grupie oznacz bota i wpisz komendę:
[help] — pomoc
[wiki] hasło — Wikipedia
[yt] fraza — szukanie YouTube
[news] fraza — wiadomości
[summarize] tekst — lokalne streszczenie
[translate_pl] tekst — tłumaczenie (tekst wysyłany do Google)
[licz] działanie — Wolfram Alpha (zapytanie wysyłane do Wolframa)
[przypomnij:2h 30m] treść — przypomnienie
Jednostki: s, m/min, h, d/day, month, y/year. Maksymalnie 5 lat.
[pobierz] https://youtu.be/VIDEO_ID — link do filmu; wymaga osobnego uprawnienia i włączenia funkcji
[title] nazwa — zmiana nazwy grupy; tylko administrator bota
[everyone], [call_all], [call_girls], [call_boys], [call_admin] — oznaczenia; tylko administrator bota, do 50 osób
[hej], [siema], [witaj], [cześć] — przywitanie
Możesz odpowiedzieć na wiadomość, aby użyć jej treści jako argumentu.
Łączenie działa od prawej: [translate_de|summarize|wiki] hasło.
Brak obsługi zadań cyklicznych. Limity mogą spowodować pominięcie nadmiarowych komend.`;
module.exports = {is_help: cmd => cmd === 'help', help: async () => HELP_TEXT};
