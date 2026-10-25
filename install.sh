#!/bin/sh
set -eu
umask 077
cd "$(dirname "$0")"
node ./scripts/check-runtime.js
npm ci --ignore-scripts
npm test
sh ./init_config.sh
npm run migrate
