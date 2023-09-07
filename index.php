<?php
if (!isset($_GET['hub_mode'])
    || !isset($_GET['hub_verify_token'])
    || !isset($_GET['hub_challenge'])
) {
    echo 'err';
    return;
}
echo $_GET['hub_challenge'];
http_response_code(200);
