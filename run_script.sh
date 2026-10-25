#!/bin/sh
set -eu
cd "$(dirname "$0")"
node ./scripts/check-runtime.js
exec pm2 start ecosystem.config.js
