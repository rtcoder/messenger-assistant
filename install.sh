#!/bin/sh
set -eu
umask 077
cd "$(dirname "$0")"
npm ci --ignore-scripts
npm test
sh ./init_config.sh
npm run migrate
