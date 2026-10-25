<?php
// Fail closed for the obsolete entrypoint. Point the web server at public/.
http_response_code(403);
echo 'Configure the web document root as public/.';
