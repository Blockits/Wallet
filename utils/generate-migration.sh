#! /bin/bash
g-migration() {
  [[ -z "$1" ]] && { echo "Migration version is required!" ; exit 1; }
  local vnum=$1
  if (($1 < 100)); then
    vnum=0$1
  fi
  touch src/scripts/migrations/"$vnum".js
  cp src/scripts/migrations/template.js src/scripts/migrations/"$vnum".js

  touch src/scripts/migrations/"$vnum".test.js
  cp src/scripts/migrations/template.test.js src/scripts/migrations/"$vnum".test.js
}

g-migration "$1"
