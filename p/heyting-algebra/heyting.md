```{=html}
<!DOCTYPE html>
<html>

<head>
    <title>Heyting algebra made unnecessarily complex -- dramforever</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="../../styles/default.css">
    <link rel="stylesheet" href="../../styles/post.css">
    <script type="text/javascript" async src="//cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-MML-AM_CHTML"></script>
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
    <h1 id="post-title-main">Heyting algebra made unnecessarily complex</h1>
    <span id="post-title-sub">2020-02-06</span>
</div>
```

(Apparently I went through a very long detour when trying to understand Heyting algebra. At least now I have the following blog post.)

Imagine an intuitionistic propositional logic, with the following formulas:

- Atoms $A$, $B$ ...
- Disjunction $A \vee B$
- Conjunction $A \wedge B$
- Implication $A \to B$
- Propositional constants $\top$ $\bot$

Also, imagine a simply typed lambda calculus (STLC) with at least the following types and their operations:

- Sum type $A + B$
- Product type $A \times B$
- Function type $A \to B$
- Unit type $()$
- Empty type $\mathrm{Void}$

From the Curry-Howard correspondence we can establish a pretty solid connection between the two. This you probably already know.

But it is also well-known that [the (most general) simply typed lambda-calculus is modeled by any cartesian closed category (CCC)](http://conal.net/papers/compiling-to-categories/). The STLC we need also needs coproduct (sum) objects in the category.

## Category in a hurry

You might not even be familiar with categories at all, let alone 'cartesian closed' and 'coproduct'. Let's just have a really short overview on category theoretic concepts here. What follows is not a tutorial on category theory; it just serves to show on a high level what could be done, not to teach you how to do it.

Category theory takes your algebraic structures into a whole new level, but let's start from the basics. A category $\mathscr C$ has a set of objects $\operatorname{Ob}(\mathscr C)$ and for all objects $A$, $B$ a set of arrows $A \to B$. $f : A \to B$ shall mean '$f$ is an arrow of $A \to B$'. Two arrows can be *composed* when the ends match, specifically if $f : B \to C$ and $g : A \to B$ then $f \circ g : A \to C$. There is also $\mathrm{id}_X : X$ for every object $X$, which you can think of as 'nothing composed together', which when composed with $f : A \to B$ on either side shouldn't change $f$: $\mathrm{id}_B \circ f = f \circ \mathrm{id}_A = f$.

One common pitfall: objects do not 'contain' anything! They are just tags. And also arrows aren't functions but it isn't uncommon to see function-like arrows.

Objects can be related with one another. A common way is something like '$C$ is the product object of $A$ and $B$ iff something', but tracking the variables quickly gets unwieldy so we often say '$A \times B$ is the product object of $A$ and $B$ iff something'. Note that for convenience this might not actually be well defined! But if a category 'has all binary products' it means there *is* an $A \times B$ for all $A$ and $B$.

Examples objects are the *product* $A \times B$ and *exponential* $[A, B]$, which you can think of as representing something like product types and function types. But remember, objects do not contain anything! Instead we must define them using arrows. Let's try the exponential.

An **exponential** object $[A, B]$ of $A$ and $B$ in a category $\mathscr C$ is another object in $\mathscr C$ equipped with an arrow $\mathrm{eval} : [A, B] \times A \to B$ such that, for any arrow $m : X \times A \to B$, there is a unique arrow $u(m) : X \to [A, B]$ such that $\mathrm{eval} \circ (u(m) \times \mathrm{id}_A) = m$. Graphically, this is shown as below (a 'commutative diagram' as they would call it):

![Commutative diagram for exponential](exponential.svg){ style="width: 40%; margin: 0 30%;" }\

Basically, it means that the essence of a function type is that it can be created by currying. You can see its usage in the lambda calculus below. In a functional language, say Haskell, $u$ would have type `((x, a) -> b) -> x -> a -> b`, which is just the `curry` function.

(The $\times \mathrm{id}_A$ part of $u(m) \times \mathrm{id}_A$ turns a $C \to [A, B]$ into a $C \times A \to [A, B] \times A$. Detail is of course skipped content.)

(If you are still confused about the difference between $[A, B]$ and $A \to B$, think $[A, B]$ as 'first-class functions'. Okay, objects are second class in category theory, whatever.)

Do pay special attention to the 'if this then that' involved and the 'types' of the arrows. They come into play later on when we interpret these in a logic setting.

## From STLC to CCC (and back)

We can basically 'implement' STLC in a category with sufficient structure (has the objects we want so we can use them). For our needs what we want is the following:

- All products $A \times B$
- All coproducts $A + B$
- All exponentials $[A, B]$
- Terminal object $1$
- Initial object $0$

We also impose some relation between these objects so they actually work together. Then we can make an STLC out of it. For functions we can use de Bruijn indices. You can check out the Codewars kata [Finally tagless interpreter](https://www.codewars.com/kata/finally-tagless-interpreter) where this is done. As the code is hidden behind the 'Train' button, while you read the description also read this code snipped related to lambda:

```haskell
class Language r where
  here   :: r (a, h) a
  before :: r h a -> r (any, h) a
  lambda :: r (a, h) b -> r h (a -> b)
  apply  :: r h (a -> b) -> (r h a -> r h b)

  -- Lots and lots and lots more...
```

Think `r a b` as $a \to b$ in the category $r$. `a` is used as a 'context stack' like `(x, (y, (z, ())))` holding the variable types, and `b` is the 'result type'. The other types correspond more directly to the categorical objects and are sort of easier to integrate. You still need to work out how to implement these operations in terms of the definition of objects, which we haven't talked about. Whatever.

An important note is that `r () a` represents a closed (i.e. no context) term of type `a`. Back to our category notation, this would be $1 \to A$.

What does that mean? It means that if there is an STLC term of type $A$, then in every cartesian closed category with sum (CCC with sum), there is an arrow $1 \to A'$, where $A'$ is the $A$ after 'translating' types to objects.

(Actually, that wasn't very rigourous, because the STLC defined at the beginning is actually left open. If for example we add 'atom' types and 'atom' objects (opaque types/objects) just like atomic propositions, then translate say atom type $T_i$ to atom object $O_i$ for all $i$ and close the definition of STLC up, this would not be a problem.)

Can we go the other way around? If $1 \to A'$ exists in every CCC with sum, then it exists in the category of STLC functions, where objects are types and arrows are function values. $A'$ doesn't need to *correspond* to a type because now it *is* the type. Just remove that useless '$() \to$' and we're golden.

Midway summary: $\mathrm{term} : A$ exists in STLC iff $f : 1 \to A'$ exists in *every* CCC with sum.

## Going to logic land

Now we gradually move from computation to logic, where proof irrelevance rules the land. Now we stop distinguishing two arrows of the same type $A \to B$; we just say they are equal. We now declare that $A \to B$ can also be a shorthand of 'An arrow of $A \to B$ exists'.

Furthermore, if there are arrows $A \to B$ and $B \to A$ ($A \leftrightarrow B$, you might say), then we stop distinguishing $A$ and $B$ (because objects are just tags which means $X \to A$ iff $X \to B$, and $A \to X$ iff $B \to X$, which make $A$ and $B$ indistinguishable in the arrow existence sense).

Note that I have not changed the 'inhabitedness' of each arrow 'type' $A \to B$. I just no longer care that two arrows of the same type are different.

What do we get? Let's go through some examples. First, the very definition of a category.

- $\mathrm{id}_A : A \to A$ turns into $A \to A$
- Composition means if $B \to C$ and $A \to B$, then $A \to C$
- (We already said that if $A \to B$ and $B \to A$ then $A = B$)

Sounds like $\to$ is now a partial order. What about exponentials? Do recall the two properties:

- $\mathrm{eval} : [A, B] \times A \to B$ is now just $[A, B] \times A \to B$
- 'given $m : X \times A \to B$ get $u(m) : X \to [A, B]$' is now just if $X \times A \to B$ then $X \to [A, B]$

As it turns out, it means that $[A, B]$ is the largest $M$ such that $M \times A \to B$ ('less than or equal to' is $\to$) . Which actually turns out to be the relative complement or implication operator of a&hellip; Heyting algebra.

The rest of the category theoretical objects and their required properties correspond to the requirement of a bounded lattice, the basis of a Heyting algebra.

- Product $A \times B$ turns into meet $A \wedge B$
- Coproduct $A + B$ turns into join $A \vee B$
- Terminal object $1$ turns into upper bound
- Initial object $0$ turns into lower bound

Remember that $1 \to A$ thing? It is always the case that $A \to 1$. So now it's equivalent to $A = 1$. So an arrow of $1 \to A$ exists in a CCC with sum iff $A = 1$ in the corresponding Heyting algebra.

But every Heyting algebra is a CCC with sum, because every requirement of a Heyting algebra *also* satisfies the corresponding object in a CCC with sum. Therefore, An arrow of $1 \to A$ exists in *every* CCC with sum, iff $A = 1$ in *every* Heyting algebra.

## Summing up

We already know about the Curry-Howard correspondence, so taking that into account we have the following: For a proposition $P$ in propositional logic. Let $[P]$ mean $P$ translated according to context, then the following are equivalent:

- $P$ is provable intuitionistically
- There is a term in STLC with type $[P]$
- There is an arrow of $1 \to [P]$ in every CCC with sum
- $[P] = 1$ in every Heyting algebra

(Of course there's that pesky variable thing. You can either add opaque symbols or say stuff like 'under any valuation' or whatever. This isn't rigorous, but I hope it gets the idea across.)

The equivalence of the first and last items are what I was seeking. But isn't the journey beautiful?

## About this document

The source of this document can be found at [`heyting.md`](heyting.md). Generate this HTML page with:

```console
$ pandoc --mathjax -f markdown-smart < heyting.md > index.html
```

```{=html}
</body>
</html>
```
