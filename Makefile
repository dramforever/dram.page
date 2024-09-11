MAKEFLAGS := -rR
ifeq ($(V),)
Q ?= @
endif

include build.mk

articles := $(build-articles) $(extra-articles)

export articles

targets-articles := $(patsubst %,p/%/index.html,$(hidden-articles) $(build-articles))

.PHONY: all
all: $(targets-articles) $(extra-pages)

.PHONY: index
index: $(extra-pages)

p/%/index.html: p/%/index.md templates/variables.yaml templates/post.html
	@echo " PANDOC" $@
	$(Q)pandoc --data-dir . --defaults templates/variables.yaml --katex -s --toc --template templates/post.html --variable name:"$*" -o $@ $<

%: %.in
	@echo "    GEN" $@
	$(Q)templates/do_html.sh < $< > $@

p/%/.entry.html: p/%/index.md templates/variables.yaml templates/entry.html
	@echo " PANDOC" $@
	$(Q)pandoc --data-dir . --defaults templates/variables.yaml --template templates/entry.html --variable name:"$*" -o $@ $<

# Stolen from https://github.com/chambln/pandoc-rss/blob/52227544480facb729315ade500f77d6e5cc7657/bin/pandoc-rss#L74-L82
p/%/.entry.xml: p/%/index.md templates/variables.yaml templates/date.xml templates/rss-entry.xml
	@echo " PANDOC" $@
	$(Q)date="$$(pandoc --data-dir . --defaults templates/variables.yaml --template templates/date.xml $<)" ; \
		date_std="$$(LANG=C TZ=UTC date --date "$$date" +'%a, %d %b %Y %T +0000')" ; \
		pandoc --data-dir . --defaults templates/variables.yaml --template templates/rss-entry.xml --variable name:"$*" --variable date_std:"$$date_std" -t html -o $@ $<

p/index.html: $(patsubst %,p/%/.entry.html,$(articles)) build.mk templates/variables.yaml templates/site-header.html templates/site-footer.html
index.html: $(patsubst %,p/%/.entry.html,$(articles)) build.mk templates/variables.yaml templates/site-header.html templates/site-footer.html
feed.xml: $(patsubst %,p/%/.entry.xml,$(articles)) build.mk templates/variables.yaml

.PHONY: clean
clean:
	rm -f p/*/.entry.html p/*/.entry.xml $(targets-articles) $(extra-pages)
