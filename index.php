<?php
echo __DIR__;
$path = $_SERVER['REQUEST_URI'];

$parts = array_values(
    array_filter(
        explode('/', $path)
    )
);

if ($parts[0] === 'link') {
    try {
        $linksDb = file_get_contents(__DIR__ . '/db/links.json');
        $dbParsed = json_decode($linksDb, true);
        if (isset($dbParsed[$parts[1]])) {
            $url = $dbParsed[$parts[1]]['url'];
            header('Location: ' . $url);
            exit();
        }
        require_once 'views/404.html';
    } catch (Throwable $exception) {
        require_once 'views/404.html';
    }
}
