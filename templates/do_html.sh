#!/usr/bin/env bash

set -e

IFS=' ' read -ra articles <<< "$articles"

do_template() {
    pandoc --data-dir . --defaults templates/variables.yaml /dev/null --from markdown --to html --metadata title="..." --template "$@"
}

do_fragment() {
    local suffix="$1" ; shift
    for a in "$@"; do
        cat "p/$a/$suffix"
    done
}

while IFS= read -r line; do
    if [[ "$line" == '\'* ]]; then
        eval "${line:1}"
    else
        printf "%s" "$line"
    fi
done
