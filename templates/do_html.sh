#!/usr/bin/env bash

set -e

IFS=' ' read -ra articles <<< "$articles"

do_template() {
    pandoc --data-dir . --defaults templates/variables.yaml /dev/null --from markdown --to html --metadata title="..." --template "$@"
}

do_index_limit() {
    for a in "${articles[@]:0:$1}"; do
        pandoc --data-dir . --defaults templates/variables.yaml --template templates/entry.html "p/$a/index.md" --variable name:"$a"
    done
}

do_index_all() {
    do_index_limit "${#articles[@]}"
}

do_rss_all() {
    for a in "${articles[@]}"; do
        # Stolen from https://github.com/chambln/pandoc-rss/blob/52227544480facb729315ade500f77d6e5cc7657/bin/pandoc-rss#L74-L82
        date="$(pandoc --data-dir . --defaults templates/variables.yaml --template templates/date.xml "p/$a/index.md")"
        date_std="$(LANG=C TZ=UTC date --date "$date" +'%a, %d %b %Y %T +0000')"
        pandoc --data-dir . --defaults templates/variables.yaml --template templates/rss-entry.xml "p/$a/index.md" --variable name:"$a" --variable date_std:"$date_std"
    done
}

while IFS= read -r line; do
    if [[ "$line" == '\'* ]]; then
        eval "${line:1}"
    else
        printf "%s" "$line"
    fi
done
