#!/usr/bin/env bash

set -e

IFS=' ' read -ra articles <<< "$articles"

do_template() {
    pandoc --data-dir . /dev/null --from markdown --to html --metadata title="..." --template "$@"
}

do_index_limit() {
    for a in "${articles[@]:0:$1}"; do
        pandoc --data-dir . --template templates/entry.html "p/$a/index.md" --variable name:"$a"
    done
}

do_index_all() {
    do_index_limit "${#articles[@]}"
}

while IFS= read -r line; do
    if [[ "$line" == '\'* ]]; then
        eval "${line:1}"
    else
        echo "$line"
    fi
done
