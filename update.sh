#!/bin/sh
set -eu
umask 077
cd "$(dirname "$0")"
git pull --ff-only
npm ci --ignore-scripts
npm test
sh ./init_config.sh
# Run in a maintenance window: never replace a running application's dependencies.
npm run migrate
printf '%s\n' 'Update verified. Restart your process manager after reviewing configuration and migration output.'
