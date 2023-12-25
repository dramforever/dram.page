MAKEFLAGS := -rR

include build.mk

.EXTRA_PREREQS += Makefile build.mk $(wildcard templates/*)

articles := $(build-articles) $(extra-articles)

export articles

targets-articles := $(patsubst %,p/%/index.html,$(hidden-articles) $(build-articles))

.PHONY: all
all: $(targets-articles) $(extra-pages)

p/%/index.html: p/%/index.md
	pandoc --data-dir . -s --toc --template template/post.html --variable name:"$*" -o $@ $<

%.html: %.html.in
	templates/do_html.sh < $< > $@
