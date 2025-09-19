---
title: "dram.page is now served by grebedoc.dev"
date: 2025-09-19
---

That's it. If you're seeing this post, your receiving this page from [grebedoc.dev].

[grebedoc.dev]: https://grebedoc.dev

Check it out if you want a way to serve the contents from a git repo over HTTP(S) on the public Internet.

The backend server on grebedoc.dev is called git-pages. I'll probably use the two names interchangably for the rest of this article.

(However, I will use "`grebedoc.dev`" to specifically refer to the domain itself, and use grebedoc.dev to refer to the service.)

## Zero downtime migration

I think I've managed to do a zero-downtime migration from Netlify. This is what I did:

First, I moved everything to the `pages` branch. This is just easier.

Then, I set up the "method 1" DNS record:

```
_git-pages-repository.dram.page.  600  IN  TXT  (
    "https://github.com/dramforever/dram.page.git" )
```

Then, I triggered an initial clone using the `PUT` method.

```
$ curl -v -X PUT -H 'Host: dram.page' \
    'https://grebedoc.dev' \
    --data 'https://github.com/dramforever/dram.page.git'
```

This has two effects:

- It asks git-pages to start serving files for `Host: dram.page`
- It registers `dram.page` as a known domain to git-pages, allowing it to immediately start receiving HTTPS requests. This lets me to completely avoid sending anything over unencrypted HTTP, including the webhook.

Now I can see if it's serving my pages correctly:

```
$ curl -v -H 'Host: dram.page' 'https://grebedoc.dev'
```

For me, that looked good, so I'm ready to do the switch, changing the actual DNS record to make my site point to the grebedoc.dev server:

```
dram.page.  600  IN  ALIAS  grebedoc.dev
```

... well, `ALIAS` is not a real DNS record. The effect is that the authoritative DNS server looks up the IPv4 and IPv6 address of the domain `grebedoc.dev` and serves them as A and AAAA records of `dram.page`. Fortunately my authoritative DNS service has this feature.

And that's it, I'm serving the latest site on grebedoc.dev.

As for auto-updating, the webhook part works normally.

## What's wrong with Netlify?

Nothing, really, but since I use zero complex features and just serve what's in the git repo, this is just simpler.
