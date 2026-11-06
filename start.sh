#!/bin/sh
cd "$(dirname "$0")"
command -v node >/dev/null 2>&1 || { echo "Node.js is not installed. Get it from https://nodejs.org"; exit 1; }
export EPM_LOOP=1
while true; do
  node server.js
  [ $? -eq 75 ] || break
  echo "Restarting the EPM server..."; sleep 1
done
