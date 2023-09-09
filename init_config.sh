if [ ! -f config/config.json ]; then
  cat ./templates/config/config.json.tpl >>config/config.json
fi

if [ ! -f config/app-state ]; then
  touch config/app-state.json
fi

if [ ! -f db/bot-info.json ]; then
  cat ./templates/db/bot-info.json.tpl >>db/bot-info.json
fi

if [ ! -f db/links.json ]; then
  echo "{}" >db/links.json
fi
