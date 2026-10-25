#!/bin/sh
set -eu
cd "$(dirname "$0")"
exec pm2 start ecosystem.config.js
