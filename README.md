# Messenger Assistant

Bot dla osobistego konta Facebooka: komendy na Messengerze, Wikipedia, YouTube,
wiadomości, tłumaczenia, lokalne streszczenia, Wolfram Alpha i przypomnienia.

## Wymagania

- Node.js >=22.16; zalecany Node 24 LTS. Node 22 może wypisywać ostrzeżenie o eksperymentalnym `node:sqlite`.
- PHP >=8 z SQLite3: potrzebny do opcjonalnego serwisu linków oraz testów PHP.
- Aktualny `yt-dlp` w PATH, jeśli włączysz `[pobierz]`. Instaluj z zaufanego źródła;
  bot nie pobiera ani nie aktualizuje programów na żądanie rozmówcy.
- Jedna instancja bota (limity wiadomości są lokalne dla procesu).

**Ograniczenie integracji:** `facebook-chat-api` 1.8.0 jest zarchiwizowaną,
nieoficjalną biblioteką emulującą klienta Facebooka. Zmiany Facebooka, wygaśnięcie
sesji i blokada konta mogą przerwać działanie. Testy offline nie potwierdzają
aktualnej zgodności z Facebookiem. Nie używaj prywatnego konta zawierającego
wrażliwe rozmowy; konto bota ma dostęp do wszystkich swoich rozmów. Nie istnieje
tu gwarancja bezawaryjności ani oficjalne wsparcie Meta dla tej metody.

## Instalacja

```sh
sh ./install.sh
```

Skrypt wykonuje `npm ci --ignore-scripts`, testy, przygotowanie konfiguracji
oraz migrację istniejących plików JSON. Nie uruchamia bota ani nie loguje się do Facebooka.
Nie wykonuje samodzielnie `git pull`. Gdy instalujesz tylko proces Node bez PHP,
użyj `npm ci --ignore-scripts` i `sh ./init_config.sh`; pełne testy uruchom w CI.

Uzupełnij `config/config.json` i `config/app-state.json` (format `{"cookies":[...]}`
albo tablica appState). Pole `c_user` musi odpowiadać `bot_user_id`. Plik sesji
musi mieć uprawnienia 0600. Nie wklejaj cookies do logów, zgłoszeń ani repozytorium.

```sh
chmod 600 config/config.json config/app-state.json
npm start
```

Alternatywnie `sh ./run_script.sh` uruchamia skonfigurowany PM2. Konfiguracja PM2
ogranicza restarty i pamięć. Nie uruchamiaj jednocześnie PM2 i systemd.
Przy błędzie startu log zawiera tylko `startup_failed`, bez sekretów. Sprawdź
najpierw składnię JSON, wymagane ID, uprawnienia pliku i ważność cookies.

### Konfiguracja dostępu

Wszystkie ID to **ciągi znaków**, np. `"123456789"`.

| Pole                     | Znaczenie                                                                                                  |
|--------------------------|------------------------------------------------------------------------------------------------------------|
| `bot_user_id`            | ID zalogowanego konta bota; wymagane                                                                       |
| `threads_ids`            | Grupy, w których bot reaguje na oznaczenie                                                                 |
| `allow_private_messages` | Domyślnie `false`; samo `true` nie otwiera dostępu wszystkim                                               |
| `allowed_user_ids`       | Osoby dopuszczone do komend w DM                                                                           |
| `admin_user_ids`         | Administratorzy **bota**; tylko oni używają `[title]` i masowych oznaczeń                                  |
| `enable_downloads`       | Domyślnie `false`                                                                                          |
| `download_user_ids`      | Osoby uprawnione do `[pobierz]`; administratorzy bota też mają to uprawnienie                              |
| `wolfram_api_key`        | Klucz Wolframa; można nadpisać przez `WOLFRAM_API_KEY`                                                     |
| `domain`                 | Opcjonalny publiczny adres HTTPS, np. `https://bot.example.com/`; bez niego zwracane są bezpośrednie linki |
| `timezone`               | Strefa wyświetlania terminów, domyślnie `Europe/Warsaw`                                                    |

Członkowie dozwolonej grupy mogą używać zwykłych komend po oznaczeniu bota.
Lista użytkowników DM nie ogranicza członków grup. Administrator bota również
musi przejść zwykły filtr rozmowy. Konfiguracja jest odczytywana przy starcie.

Domyślne limity: 10 komend użytkownika/minutę, 60 wiadomości globalnie/minutę,
2 równoległe wykonania, 20 oczekujących wiadomości, 4 komendy w łańcuchu,
10000 znaków wejścia i wyjścia. Odpowiedzi dzielone są na maksymalnie 3 części.
Wiadomości odrzucone przez filtr/limity są pomijane bez odpowiedzi, aby nie
amplifikować spamu. Błędy wykonania dostają ogólny komunikat. Logi nie zawierają
tekstu wiadomości, zapytań, adresów URL ani błędów dostawców.

## Komendy i zmiany zachowania

`[help]` opisuje wszystkie dostępne komendy. Łańcuch działa od prawej:
`[translate_de|summarize|wiki] hasło`. Treść cytowanej wiadomości może być argumentem.
Cały łańcuch jest sprawdzany pod kątem uprawnień i nazw komend przed wykonaniem.

- `[pobierz]` przyjmuje tylko pojedynczy film YouTube przez HTTPS (`watch`, `youtu.be`,
  `shorts`, `live`). Nie obsługuje playlist ani dowolnych serwisów. Zwraca dostępny
  format zawierający obraz i dźwięk; link dostawcy może wygasnąć. Proces nie korzysta
  z powłoki, plików konfiguracyjnych użytkownika, wtyczek ani sekretów środowiska.
- `[licz]` zwraca **tekst** zamiast składanych obrazków. Usunięto GraphicsMagick,
  sharp i pobieranie plików; wyniki dostępne wyłącznie jako grafika nie będą pokazane.
- `[summarize]` lokalnie wybiera do trzech istotnych zdań. Algorytm ekstrakcyjny,
  bez modelu językowego i bez wysyłania treści do zewnętrznego serwisu.
- Tłumaczenie wysyła tekst do Google, `[licz]` do Wolframa. Nie używaj tych komend
  do treści, których nie chcesz przekazywać tym dostawcom. Nieoficjalne tłumaczenie
  i wyszukiwarka YouTube również mogą przestać działać po zmianach po stronie dostawcy.
- `[przypomnij:2h 30m] treść`: `m` i `min` oznaczają minuty; miesiąc to `month`, rok
  to `y` lub `year`. Miesiące/lata liczone są kalendarzowo w UTC, z ograniczeniem
  dnia do ostatniego dnia miesiąca; pozostałe jednostki to stały czas upływający.
  Maksymalnie 5 lat. Zadania cykliczne (`every:`) nie były działającą funkcją starej
  wersji i są teraz jawnie odrzucane zamiast pozornie akceptowane.
- Wysyłka przypomnienia ma semantykę **at-least-once**: po potwierdzeniu zadanie
  znika, po błędzie jest ponawiane z opóźnieniem (maksymalnie 5 prób). Jeśli serwer
  przyjmie wiadomość, ale potwierdzenie zaginie, może pojawić się duplikat. Nie
  obiecujemy exactly-once bez idempotencji po stronie Messengera.
- Niewysłane zadania po 5 próbach pozostają w SQLite ze statusem `failed`.
  Wliczają się do limitu 50 zadań użytkownika i 1000 łącznie. Operator powinien
  przejrzeć je i usunąć lub zresetować status po usunięciu przyczyny. Nieudane
  zadania nie są automatycznie gubione. Scheduler sprawdza zadania co 10 sekund,
  wysyła do 10 na cykl i ponownie weryfikuje dozwoloną rozmowę.
- Trwałe potwierdzenie przetworzenia komendy zapisuje się po wykonaniu i odpowiedzi,
  nie przy wejściu do kolejki. Przy ponownej dostawie po restarcie identyfikator
  wiadomości i kroku chroni tworzenie przypomnień przed duplikacją przez 24 godziny.
  Pozostałe operacje zewnętrzne mogą zostać powtórzone po awarii między wykonaniem
  a zapisem potwierdzenia. Kolejka wejściowa jest w pamięci: odzyskanie niewykonanej
  wiadomości wymaga ponownej dostawy przez transport lub ponownego wysłania komendy.

## Migracja i aktualizacje

Zatrzymaj stary proces i wykonaj backup `config/`, `db/` oraz `data/`.

```sh
npm run migrate
```

Migracja przenosi `db/jobs.json` i `db/links.json` do osobnych baz
`data/bot.sqlite` i `data/links.sqlite`. Zachowuje stare identyfikatory linków.
Każda baza jest importowana transakcyjnie i idempotentnie; źródłowe JSON-y nie
są zmieniane. Można bezpiecznie wznowić import po błędzie. Nie da się odzyskać
zadań już nadpisanych przez starą wersję. Nieprawidłowe dane lub linki inne niż
HTTPS zatrzymują import; trzeba poprawić kopię źródła i ponowić. Niepusty
`circular-jobs.json` wymaga ręcznego rozpatrzenia i blokuje migrację.

Zmienne ścieżek:

- `BOT_CONFIG_DIR`: katalog `config.json` i `app-state.json`.
- `BOT_DATA_DIR`: katalog nowych baz, domyślnie `data/`.
- `BOT_LEGACY_DB_DIR`: katalog starych JSON-ów, domyślnie `db/`.

Dalsze aktualizacje: **najpierw zatrzymaj proces**, następnie `sh ./update.sh`.
Skrypt używa `git pull --ff-only`, odtwarzalnego `npm ci`, testów i migracji;
nie restartuje sam aplikacji. Po sprawdzeniu wyników uruchom ją ponownie.
Nie używaj `npm audit fix --force` bez przeglądu zgodności zależności.

## Wdrożenie i publiczne linki

Uruchamiaj bota jako osobnego użytkownika bez roota. Przykład systemd znajduje
się w `deploy/messenger-assistant.service`; dostosuj ścieżkę Node i użytkownika.
Trzymaj konfigurację w `/etc/messenger-assistant`, dane w
`/var/lib/messenger-assistant`, a kod jako tylko do odczytu dla procesu.
Zadbaj o rotację dziennika systemd/PM2 i ograniczenie dostępu do backupów.
Ogranicz na hoście ruch wychodzący do sieci prywatnych/metadanych chmury, zwłaszcza
jeśli włączasz `yt-dlp`; walidacja URL aplikacji nie zastępuje izolacji sieciowej.

Jeżeli używasz skracacza linków:

1. **Docroot serwera WWW musi wskazywać wyłącznie `public/`.** Nigdy katalog repo.
   W `deploy/nginx.conf.example` jest przykład. Ustaw TLS i właściwy socket PHP.
   Rootowe `.htaccess` dodatkowo blokuje omyłkową publikację repo przez Apache,
   ale nie chroni serwera ignorującego `.htaccess`.
2. W konfiguracji PHP-FPM ustaw `BOT_LINKS_DB` na bezwzględną ścieżkę do
   `links.sqlite`. Przykład nginx przekazuje ją jako parametr FastCGI.
3. PHP potrzebuje **tylko odczytu** `links.sqlite` i przejścia przez katalog danych.
   Można przypisać dedykowaną wspólną grupę: katalog danych `0710`, plik linków
   `0640`, pozostawiając `bot.sqlite` i konfigurację `0600`. Nie dawaj PHP odczytu
   bazy przypomnień, cookies ani zapisu katalogu danych. Nowe pliki są tworzone
   jako `0600`; uruchom przygotowanie/migrację przed nadaniem dostępu PHP.
4. Sprawdź przez HTTP, że `/config/app-state.json`, `/db/jobs.json`, `/.git/config`
   i `/data/bot.sqlite` zwracają 404/403. Zrób to przed dodaniem prawdziwej sesji.

Serwis przekierowuje wyłącznie zapisane linki HTTPS, nie przyjmuje publicznych
zapisów i otwiera bazę w trybie read-only. Link jest publiczny dla każdego, kto
zna jego klucz; nie umieszczaj w nim prywatnych zasobów. Stare krótkie klucze
pozostają dla kompatybilności; nowe powstają z 24 losowych bajtów kryptograficznych.
Nowe wpisy mają limit 10000; po osiągnięciu limitu bot zwraca bezpośredni URL HTTPS,
zachowując dotychczasowe linki. Migracja zachowuje także większy istniejący zbiór,
ale nie pozwala na jego dalszy automatyczny przyrost.

## Testy i zależności

```sh
npm ci --ignore-scripts
npm run check
npm test
php -l public/index.php
npm audit --omit=dev
```

Testy korzystają z tymczasowych baz i atrap zewnętrznych integracji. Nie logują
się na Facebooka ani nie wysyłają wiadomości. CI wykonuje testy na Node 22 i 24.
Przed wdrożeniem potrzebny jest kontrolowany test na dedykowanym koncie bota:
logowanie, odbiór wiadomości, wysyłka, zmiana nazwy, oznaczenia i powrót po restarcie.

Wymuszone zamiany zależności `facebook-chat-api`: `request` → utrzymywany
`@cypress/request`, Cheerio 1.2 oraz aktualny `ws` 8. Testy sprawdzają zgodność
używanego interfejsu cookie jar i parsowania HTML. To celowa lokalna warstwa
zgodności; nie jest aktualizacją samego protokołu Facebooka. Zerowy wynik
`npm audit` oznacza brak zgłoszonych podatności w bieżącej bazie skanera,
nie certyfikat bezpieczeństwa ani gwarancję działania starego adaptera.
