if [ ! -f config/config.json ]; then
  echo "Create config/config.json"
  cat ./templates/config/config.json.tpl >>config/config.json
  echo "Created."
fi

if [ ! -f config/app-state ]; then
  echo "Create config/app-state.json"
  touch config/app-state.json
  echo "Created."
fi

if [ ! -f db/bot-info.json ]; then
  echo "Create db/bot-info.json"
  cat ./templates/db/bot-info.json.tpl >>db/bot-info.json
  echo "Created."
fi

if [ ! -f db/links.json ]; then
  echo "Create db/links.json"
  echo "{}" >db/links.json
  echo "Created."
fi

if [ ! -f db/jobs.json ]; then
  echo "Create db/jobs.json"
  echo "{}" >db/jobs.json
  echo "Created."
fi

if [ ! -f db/circular-jobs.json ]; then
  echo "Create db/circular-jobs.json"
  echo "{}" >db/circular-jobs.json
  echo "Created."
fi
