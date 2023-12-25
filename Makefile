MAKEFLAGS := -rR

include build.mk

.EXTRA_PREREQS += Makefile build.mk $(wildcard templates/*)

articles := $(build-articles) $(extra-articles)

export articles

targets-articles := $(patsubst %,p/%/index.html,$(hidden-articles) $(build-articles))

.PHONY: all
all: $(targets-articles) $(extra-pages)

.PHONY: index
index: $(extra-pages)

p/%/index.html: p/%/index.md
	pandoc --data-dir . --defaults templates/variables.yaml -s --toc --template templates/post.html --variable name:"$*" -o $@ $<

%: %.in
	templates/do_html.sh < $< > $@
