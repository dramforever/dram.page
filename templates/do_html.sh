#!/usr/bin/env bash

set -e

IFS=' ' read -ra articles <<< "$articles"

do_template() {
    pandoc --data-dir . --defaults templates/variables.yaml /dev/null --from markdown --to html --metadata title="..." --template "$@"
}

source "$1"
