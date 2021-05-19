```{=html}
<!DOCTYPE html>
<html>

<head>
    <title>The with construct in nix-lang -- dramforever</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="../../styles/default.css">
    <link rel="stylesheet" href="../../styles/post.css">
    <script type="text/javascript" async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-MML-AM_CHTML"></script>
</head>

<body>

<div id="site-title">
    <h1 id="site-title-main"><a href="/">
        dramforever
    </a></h1>
    <div id="site-title-sub">a row of my life</div>
</div>

<article>
<div id="post-title">
    <h1 id="post-title-main">The <code>with</code> construct in nix-lang</h1>
    <span id="post-title-sub">2021-05-19</span>
</div>
```

The Nix package manager comes with its own programming language for, among other
things, defining packages. We're not here to discuss whether that's a good
decision. We'll call it the Nix language, or nix-lang for short.

This article assumes some familiarity with nix-lang. This is not a tutorial.

# The syntax `with A; E`

Nix-lang has a construct `with A; E`. Its purpose is to bring the attributes of
the attrset `A` into scope as variables within the expression `E`. So instead
of:

```nix
[ pkgs.foo pkgs.bar pkgs.baz ]
```

You can write:

```nix
with pkgs; [ foo bar baz ]
```

As a syntax sugar, this has the obvious advantages of making code look shorter,
and the obvious disadvantage of making it confusing.

# 'The' problem with `with`

A problem arises when there's a conflict between a lexically bound variable
('normal' various bound by `let` or a lambda parameter) and something that's
bound by `with`:

```nix
let a = 4;
in with { a = 3; }; a
```

An obvious way to resolve this would be to make this expression evaluate to `3`.
This comes with a price though: Lexical scope would be broken. This is in fact
the most commonly cited reason that an almost equivalent construct, `with` in
JavaScript, is considered deprecated. (See [MDN][mdn-with] for example.)

[mdn-with]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with#ambiguity_contra

Since we're talking about Nix, let's imagine that Nix-lang worked this way,
`with` overriding normal variables. You have in your code:

```nix
let foobar = "something";
in with pkgs;
  /* ... */
```

And next month, a package called `foobar` is added to Nixpkgs. Your code would
be broken.

Thankfully, that's not what happens in nix-lang.

# The solution in Nix-lang

In nix-lang, `with` does *not* override lexically bound variables. This example,
in the real nix-lang, evaluates to `4`:

```nix
let a = 4;
in with { a = 3; }; a
```

`with` simply *never* override something that's lexically bound. `with A; E`
only affects variables in `E` that are otherwise unbound.

# A desugaring of `with`

This means that `with` in nix-lang is a purely syntactical construct. You can
eliminate all uses of `with` in an expression without ever evaluating the code,
because you don't need to.

The only thing changed is that an unbound variable, which would be a syntax
error, now becomes a reference to the attrset mentioned to `with`.

So, to desugar `with`, look at each variable mentioned in the code:

- If it's lexically bound, leave it as is.
- Otherwise, if there are no `with` constructs above it, report an unbound variable.
- Otherwise, take all the `with A;` that wraps this variable, combine them
  together like `(A1 // A2 // A3)`, and change the variable `v` into `((A1 // A2
  // A3).v)`

Some examples:

- Most common usage: Just let me type less stuff:

    ```nix
    # Before
    [ pkgs.foo pkgs.bar pkgs.baz ]

    # After
    with pkgs; [ foo bar baz ]
    ```
- Lexical scoping is preserved

    ```nix
    # Before
    let a = 4;
    in with { a = 3; b = 4; c = 5; }; a + b + c

    # After
    let a = 4;
    in a + ({ a = 3; b = 4; }.b) + ({ a = 3; b = 4; }.c)
    ```

# Well technically...

There's a small mistake with the translation above. You can't just copy verbatim
the attrset used in `with` into each usage, because the `with` dictionary is
only evaluated once. This hardly matters ever, but ideally, the latter example
should be translated into something like: (Where `__with_1` is a fresh variable)

```nix
let a = 4;
in let __with_1 = { a = 3; b = 4; c = 5; };
  in a + __with_1.b + __with_1.c
```

Imagine that instead of `{ a = 3; b = 4; c = 5; }` there is a complicated
computation. The naive translation would duplicate this computation, which is
probably undesirable. This case occurs in the commonly used pattern:

```nix
with (import <nixpkgs> {}); /* ... */
```

# So should we use `with`?

Be careful. The fact that `with` modifies the behavior of unbound variables
instead of all variables is arguably an improvement over the now deprecated
JavaScript `with`. But it still modifies the behavior of unbound variables.

Given the possibly confusing behavior, I personally only use `with` in certain
circumstances in which I'm familiar *with* the consequences, like:

```nix
environment.systemPackages = with pkgs; [ foo bar baz ];

meta = with lib; { /* ... */ };

helperFunction = with builtins; /* use builtins here */
```

I don't really like `with (import <nixpkgs> {});`, but admittedly, I sometimes
get sloppy and use it.

Hopefully, equipped *with* a better understanding of what nix-lang's `with`
does, you know what you want to do *with* it.

I probably already annoyed you *with* all those `with` jokes. I'm going to stop.

# About this document

This document was generated using [Pandoc][pandoc] from [the Markdown source](nix-lang-with.md):

[pandoc]: https://pandoc.org/

```console
$ pandoc -f markdown --mathjax -t html < nix-lang-with.md > index.html
```

```{=html}
</body>
</html>
```
