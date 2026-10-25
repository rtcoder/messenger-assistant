<?php
declare(strict_types=1);

function handleRequest(string $uri, string $database): array
{
    $headers = [
        'Content-Type' => 'text/html; charset=UTF-8',
        'Cache-Control' => 'no-store',
        'Referrer-Policy' => 'no-referrer',
        'X-Content-Type-Options' => 'nosniff',
        'X-Frame-Options' => 'DENY',
        'Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
    ];
    $response = ['status' => 404, 'headers' => $headers, 'body' => 'Nie znaleziono strony.'];
    $path = parse_url($uri, PHP_URL_PATH);
    if ($path === '/') {
        $response['status'] = 200;
        $response['body'] = '<!doctype html><html lang="pl"><meta charset="UTF-8"><title>Messenger Assistant</title><h1>Messenger Assistant</h1><p>Serwis linków asystenta.</p></html>';
        return $response;
    }
    if (!is_string($path) || !preg_match('~^/link/([A-Za-z0-9_-]{1,64})/?$~D', $path, $matches)) return $response;
    try {
        if (!$database || !is_file($database)) throw new RuntimeException('Unavailable');
        $db = new SQLite3($database, SQLITE3_OPEN_READONLY);
        $db->enableExceptions(true);
        $db->busyTimeout(3000);
        $statement = $db->prepare('SELECT url FROM links WHERE id = :id');
        $statement->bindValue(':id', $matches[1], SQLITE3_TEXT);
        $result = $statement->execute();
        $row = $result->fetchArray(SQLITE3_ASSOC);
        $result->finalize();
        $statement->close();
        $db->close();
        $url = $row['url'] ?? null;
        if (is_string($url) && strlen($url) <= 8192 && !preg_match('/[\x00-\x20\x7f]/', $url) && filter_var($url, FILTER_VALIDATE_URL)) {
            $parts = parse_url($url);
            if (($parts['scheme'] ?? '') === 'https' && !isset($parts['user']) && !isset($parts['pass'])) {
                $response['status'] = 302;
                $response['headers']['Location'] = $url;
                $response['body'] = '';
            }
        }
    } catch (Throwable $error) {
        $response['status'] = 503;
        $response['body'] = 'Serwis chwilowo niedostępny.';
    }
    return $response;
}

if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    ini_set('display_errors', '0');
    $response = handleRequest($_SERVER['REQUEST_URI'] ?? '/', getenv('BOT_LINKS_DB') ?: '');
    http_response_code($response['status']);
    foreach ($response['headers'] as $name => $value) header($name . ': ' . $value);
    echo $response['body'];
}
