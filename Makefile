MAKEFLAGS := -rR

include build.mk

.EXTRA_PREREQS += Makefile build.mk $(wildcard templates/*)

articles := $(build-articles) $(extra-articles)

export articles

targets-posts := $(patsubst %,p/%/index.html,$(build-articles))

.PHONY: all
all: $(targets-posts) $(extra-pages)

p/%/index.html: p/%/index.md
	pandoc --data-dir . --template template/post.html -o $@ $<

%.html: %.html.in
	templates/do_html.sh < $< > $@
