#!/bin/sh
set -eu
umask 077
cd "$(dirname "$0")"
config_dir="${BOT_CONFIG_DIR:-$(pwd)/config}"
data_dir="${BOT_DATA_DIR:-$(pwd)/data}"
mkdir -p "$config_dir" "$data_dir"
if [ ! -f "$config_dir/config.json" ]; then
    cp templates/config/config.json.tpl "$config_dir/config.json"
fi
if [ ! -f "$config_dir/app-state.json" ]; then
    printf '{"cookies":[]}\n' > "$config_dir/app-state.json"
fi
chmod 600 "$config_dir/config.json" "$config_dir/app-state.json"
printf '%s\n' 'Configuration prepared. Fill bot_user_id, allowlists and session cookies before starting.'
