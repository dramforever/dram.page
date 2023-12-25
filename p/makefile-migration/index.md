---
title: "Migrating my blog site to a Makefile"
date: 2023-12-17
---

Until recently, I have mostly manually managed the HTML files of my blog with a Makefile. Every page you see on here in my "blog style" is managed by.

I have enlisted the help of [Pandoc] to generate convert the main article contents from Markdown to HTML for me, but putting in the header, title, date, etc still involved copying and pasting a bunch of stuff manually.

[Pandoc]: https://pandoc.org/

What's more, every time I write a new article, I need to insert it into the list on the [home page](/) and [post index page](/p/). That, plus the `<title>` element and header in the article page, means that I need to paste the title of an article *four times*.

I could migrate my blog to a static site generator. Or I could just do something to automate the bits I need.

## YAML frontmatter and pandoc templates

## Doing multiple things easily with `Makefile`

## Each index item is also a template

## Bash-based templates?

Behold, the templating language I came up in like 30 seconds:

```
while IFS= read -r line; do
    if [[ "$line" == '\'* ]]; then
        eval "${line:1}"
    else
        printf "%s" "$line"
    fi
done
```

## Stubs for unmigrated articles

## Future work
