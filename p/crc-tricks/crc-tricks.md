```{=html}
<!DOCTYPE html>
<html>

<head>
    <title>Magic tricks with CRC -- dramforever</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="../../styles/default.css">
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
    <h1 id="post-title-main">Magic tricks with CRC</h1>
    <span id="post-title-sub">2021-12-25</span>
</div>
```

## An adjustable desk

A friend of mine bought a motorized adjustable desk a long time ago and recently
got the idea to hook up the controller to the Internet for some reason. They
tapped the wire coming from the controls panel with a logic analyzer and was
able to capture some packets, hexdumps shown:

```
AAFF 0040 2EEC
AAFF 0060 2964
AAFF 0050 2B08
AAFF 040E02 0450
AAFF 050E02 8EDA
AAFF 060E02 1D05
AAFF 070E02 978F
... (and many more samples)
```

They were reasonably sure that the framing was correctly decoded, meaning that
each line of hexdump is exactly one complete transmission. The message format of
two bytes of (seemingly fixed) header, variable number of bytes of message, and
two bytes of checksum resembles [Modbus][modbus] RTU.

[modbus]: https://modbus.org/

An implementation of the Modbus CRC-16, however, gives check sequences that don't
match up with what we see. It's still suspiciously like some sort of CRC-16
though, so I decided to go though with the assumption that it is a CRC-16
variant waiting to be discovered.

## But what is a CRC anyway?

The [*cyclic redundancy check* (CRC)][wp-crc] is a family of error-checking
codes that is widely used to detect inadvertent data corruption of data during
transmission or in storage. The most common way a CRC is implemented is using a
*linear feedback shift register* (LFSR), and the mathematical structure of it is
taking the remainder of a polynomial division, where the polynomial is defined
in $\mathrm{GF}(2)$.

[wp-crc]: https://en.wikipedia.org/wiki/Cyclic_redundancy_check

Let's go into details of how CRCs work in practice, in particular how the
details of the algorithms maps to polynomials, and how we can manipulate CRCs
using its properties, along with how I applied the ideas while reverse
engineering the exact parameters used for my friend's desk.

## Mathematical basics

Just for a warm up, let's go into some basics of how polynomials work. These
things are immensely useful in various fields of computer science because they
provide an interesting way to work with bit strings, so it can't hurt to take a
closer look.

### The Galois field $\mathrm{GF}(2)$

$GF(2)$ might have a scary name, but it really is just the integers modulo $2$.
This field only has two elements, $0$ and $1$. Thinking of them as logical bits,
addition is exclusive-or (xor), and multiplication is logical 'and'. Anything
added with itself is gone, and subtraction is the same as addition:

- $a + a = 0$
- $a + b = a - b$

Polynomials in $\mathrm{GF}(2)$, in particular univariate polynomials in $x$,
called $\mathrm{GF}(2)[x]$, is what we're interested in here. In particular,
since the coefficients of the terms are either $0$ or $1$, we can write them as
if each term just exists or doesn't exist, like:

$$ x^{16} + x^{3} + x^{1} + x^{0} $$

(Side note: Polynomials are *not* polynomial functions. There are only $4$
functions of $\mathrm{GF}(2) \to \mathrm{GF}(2)$, but if the term coefficients
of two polynomials differ they are not the same polynomial, regardless of
whether they correspond to the same function.)

We can the coefficients of a polynomial into a bit string, highest power term
first, omitting (the infinite sequence of) leading zeros. For example, the above
example corresponds to:

```
1 0000 0000 0000 1011
```

We can then read that as an (unsigned) integer in binary, which is a convenient
representation of $\mathrm{GF}(2)[x]$ polynomials in computers.

### Polynomial addition and multiplication

Addition and multiplications work exactly as we expect, if you take care that
the coefficients should be calculated modulo 2. As we all know, $2 = 0$, so each
term will cancel with itself:

$$ x^{n} + x^{n} = x^{n} - x^{n} = 0 $$

So for example:

$$ (x^{4} + x^{2}) + (x^{2} + x^{0}) = x^{4} + 2 x^{2} + x^{0} = x^{4} + x^{0}$$

Addition and multiplication have the commutativity, associativity and
distributivity properties we all know and love.

Using the representation of polynomials as unsigned integers, polynomial
addition is just bitwise-xor. Meanwhile, multiplication is known as 'carry-less
multiplication', which is often available as dedicated instructions in modern
CPUs for cryptographic applications.

### Polynomial (Euclidean) division

What we're concerned here most, when working with CRCs, is polynomial division.
It is defined analogously to integer division with remainder, except instead of
comparing the magnitude of numbers, we compare the *degree* of polynomials.

Given two polynomials $a(x)$ and $b(x)$ (where $b(x) \ne 0$), there is only one
*quotient* $q(x)$ and *remainder* $r(x)$ such that $r(x)$ has strictly smaller
degree than $b(x)$, and:

$$ a(x) = b(x) q(x) + r(x) $$

The algorithm to figure out $q(x)$ and $r(x)$ is a variation on the integer long
division algorithm. In particular, we don't usually care about $q(x)$, so it is
fairly easy to 'reduce' $a(x)$ with multiples of $b(x)$ until the degree is
strictly less than $b(x)$. Moreover, since the only possible non-zero
coefficient is $1$, we don't even need a division to figure out the scalar to
multiply $b(x) x^k$ by.

<pre><code>a = <em>(polynomial dividend)</em>
b = <em>(polynomial divisor)</em>

<b>while</b> (degree of a) >= (degree of b):
    a = a + b x^((degree of a) - (degree of b))

<b>return</b> a</code></pre>

In Python for example, the `int.bit_length` method returns the length of an
integer in binary representation, excluding leading zeros. It is one more than
the polynomial's degree, which is not important in our case:

```python
def poly_mod(a, b):
    while a.bit_length() >= b.bit_length():
        a ^= b << (a.bit_length() - b.bit_length())
    return a
```

For convenience we can use $a(x) \bmod b(x)$ to refer to $r(x)$.

One notable thing is that adding two polynomials together doesn't increase the
degree, so:

$$ (u + v) \bmod b = (u \bmod b) + (v \bmod b) $$

## Cyclic redundancy checks

### Basic CRCs

For a message consisting of bytes, we can also convert it to a bit string, by
putting each byte in order, and for each byte, put the *least significant* bit
first. So `f0 30` becomes `0000 1111 0000 1100`.

For simplicity, consider this CRC generation code, with a single parameter `tap`:

<pre><code>crc = 0

<b>for each</b> bit b in message:
    crc = crc ^ b
    <b>if</b> least significant bit of crc is 1:
        crc = (crc >> 1) ^ <em>tap</em>
    <b>else</b>:
        crc = crc >> 1

<b>return</b> crc</code></pre>

This structure is called a linear feedback shift register, or LFSR. We can try
to reverse engineer this in terms of polynomials in $\mathrm{GF}(2)$.

As the message is read in bit by bit, we can say that the 'current polynomial'
starts at $0$, and for each bit $b$ we read, we update the polynomial from $m$
to $mx + b$. This continues until the message is completely read, and $m$ is the
polynomial corresponding to the entire message.

Since the `crc` 'register' is constantly being shifted to the *right*, it
actually contains a 'bit reversed' polynomial. The least significant bit is
actually the highest power term. So similarly, if `tap` were some polynomial, it
should also be bit reversed. For convenience, say `crc` and `tap` are $N$-bit integers.

The 'bit reversed' part is not weird anymore if we write the integer `crc` as an
$N$ bit integer in little endian as a bit string and find the corresponding
polynomial. It *is* the correct polynomial we're looking for.

We can start interpreting the bit operations taken:

- For each bit $b$ in message:
  - $\mathtt{crc} \leftarrow \mathtt{crc} + b x^{N - 1}$
  - If the $x^{N - 1}$ coefficient of $\mathtt{crc}$ is $1$, then
    $\mathtt{crc} \leftarrow \mathtt{crc} \cdot x + x^N + \mathtt{tap}$
  - Else: $\mathtt{crc} \leftarrow \mathtt{crc} \cdot x$

Noting that for the operation `crc >> 1`, it *discards* the least significant
bit if it's zero. So in terms of polynomials, this means that a $x^N$ term
cannot occur in $\mathtt{crc}$ and would be discarded. That's what adding (or
really, subtracting) $x^n$ means.

A bit of distributing gives:

- For each bit $b$ in message:
  - $\mathtt{crc} \leftarrow \mathtt{crc} \cdot x + b x^N$
  - If the $x^N$ coefficient of $\mathtt{crc}$ is $1$, then
    $\mathtt{crc} \leftarrow \mathtt{crc} + x^N + \mathtt{tap}$

Each time a $b$ term is shifted into $m$, $m$ turns into $mx + b$, and,
$\mathtt{crc}$ is turned into $\mathtt{crc} \cdot x + b x^N$. If we don't bother
with the 'if' step, then after reading everything $\mathtt{crc} = m x^N$.

But after reading each bit, $x^N + \mathtt{tap}$ is either added or not. This
means $\mathtt{crc}$ and $m x^N$ are actually only equal modulo $x^N +
\mathtt{tap}$. Also notice that $\mathtt{crc}$ has degree strictly smaller
than $N$. Therefore:

$$ \mathtt{crc} = (m x^N) \bmod (\mathtt{tap} + x^N) $$

### Realistic CRCs

Realistic CRCs have a few more parameters. I call them `init` and `final`.

<pre><code>crc = <em>init</em>

<b>for each</b> bit b in message:
    crc = crc ^ b
    <b>if</b> least significant bit of crc is 1:
        crc = (crc >> 1) ^ <em>tap</em>
    <b>else</b>:
        crc = crc >> 1

<b>return</b> crc ^ <em>final</em></code></pre>

(Side note: A particular may also reverse or not reverse the order of the bits
on input, and may reverse or not reverse the bit order of `crc`. In practice,
these options have not shown up at least for me, and only takes 4 tries to brute
force, so they're not considered.)

Just like before, we notice that if we don't do the 'reduction' step,
$\mathtt{crc} = \mathtt{init} \cdot x^L + m x^N$, where $L$ is the length of the
message, this time *counting* leading zeros. A $\mathtt{final}$ thing is added
to the result.

Suppose that $\mathtt{init}$ and $\mathtt{final}$ have degree less than $N$, then:

$$ \mathtt{crc} = (m x^N + \mathtt{init} \cdot x^L + \mathtt{final}) \bmod (\mathtt{tap} + x^N) $$

We note that the previous zero-initialized CRC does not depend on $L$, which
means that it cannot detect extra/missing leading zeros. A non-zero `init`
mitigates this. I have absolutely no idea what `final` is supposed to achieve,
but it's just there.

From now on, we'll use these symbols consistently:

- $L$ (length) is the message length in bits
- $m$ (message) is the message bit string as a polynomial
- $N$ is the length of the CRC
- $r$ (remainder) is $\mathtt{crc}$
- $F$ is $\mathtt{final}$
- $I$ is $\mathtt{init}$
- $P$ (polynomial) is $\mathtt{tap} + x^N$

Now the equation for a realistic CRC can be written:

$$ r = (m x^N + I x^L + F) \bmod P $$

The following one just means both sides are equal after doing a $\bmod P$. If
you're familiar with modulo congruences in integers, it's basically the same
thing.

$$ r \equiv m x^N + I x^L + F \pmod P $$

## Linearity properties of CRCs

### CRCs are linear

(Or affine, if you're pedantic)

Suppose we have two messages $m_1$ and $m_2$ of the same length $L$, with CRCs
$r_1$ and $r_2$ respectively.

$$
\begin{aligned}
r_1 &\equiv m_1 x^N + I x^L + F  \pmod{P} \\
r_2 &\equiv m_2 x^N + I x^L + F  \pmod{P}
\end{aligned}
$$

Adding the two equations together gives something quite nice (remember, anything
added with itself equals zero):

$$ r_1 + r_2 \equiv (m_1 + m_2) x^N  \pmod{P} $$

Suppose that we have another pair of messages $m_3$ and $m_4$, still with
lengths $L$, such that $m_1 + m_2 = m_3 + m_4$, i.e. the four messages
bitwise-xor to all zeros. Then we have:

$$ r_1 + r_2 \equiv (m_1 + m_2) x^N \equiv (m_3 + m_4) x^N \equiv r_3 + r_4  \pmod{P} $$

This is actually fairly common. For example, with consecutive numbers
as strings:

- $m_1$ is ASCII `10`, binary `1000 1100 0000 1100`
- $m_2$ is ASCII `11`, binary `1000 1100 1000 1100`
- $m_3$ is ASCII `12`, binary `0100 1100 1000 1100`
- $m_4$ is ASCII `13`, binary `1100 1100 1000 1100`

Or, taking these four message hexdumps from the samples:

```
AAFF 040E02 0450
AAFF 050E02 8EDA
AAFF 060E02 1D05
AAFF 070E02 978F
```

The messages match up just like the consecutive numbers example above, and the
check sequences also match up. That's some encouraging confirmation that we're
indeed looking at a CRC.

(I guess technically this kind of property should be called 'affine' instead of
'linear', but, meh...)

### Applications

This property is tremendously useful if we actually *know* the parameters of a
certain CRC algorithm. For example, going back to bitwise land, if we have two
messages $a$ and $b$ of the same length, and $z$ is the all-zeros messages of
that length, then:

$$ \mathrm{crc}(a \oplus b) = \mathrm{crc}(a) \oplus \mathrm{crc}(b) \oplus \mathrm{crc}(z)$$

Suppose for some inexplicable reason, someone uses a CRC-32 as a hash function
to hash string representations of integers, as an attempt to hide the original numbers:

```
crc("123456") = 0x0972d361
```

The number can range up to 10 digits, so they're hoping that we can't brute
force our way through a billion numbers to find a match.

Nobody with even a tiny bit of sanity would think that's a reasonable way to
hide a number... Right?

(Right? I suppose that's a story for another time...)

To reverse the digit string out of the CRC, we can do a [meet-in-the-middle
attack][mitm], matching up strings like `123\0\0\0` (that's `123` then 3 NUL
bytes) with `\0\0\0456`. The details are not that hard, and it takes
milliseconds to 'crack' each hash (if memory serves). For collisions we also get
every solution.

[mitm]: https://en.wikipedia.org/wiki/Meet-in-the-middle_attack

However in our case of the adjustable desk, we don't actually know the
parameters used. We must dig deeper. But before that, let's take a detour into
how CRCs are transmitted:

## Messages with CRC appended

There's another thing about how CRCs are implemented. Take a look back at the
'CRC equation'

$$ r \equiv m x^N + I x^L + F \pmod P $$

Let's rearrange it a bit:

$$ m x^N + r \equiv I x^L + F \pmod P $$

The right hand side only depends on the message length, and the left hand
side... It's the message with $N$ zeros appended, then bitwise-xor with the CRC,
i.e. exactly the message and the CRC concatenated. If you like thinking of CRCs
as integers, that's the messages concatenated with the CRC in little endian.

It is not a coincidence that CRCs are often concatenated after the message in
this exact way. Due to this nice property, this concatenation simplifies CRC
checking hardware, which need not keep track of a 'state' of whether it's
reading data or reading the CRC, and only need an end-of-stream signal. We'll
not go into detail on that, but just notice that each line in our hexdump:

```
AAFF 0040 2EEC
```

Is already the polynomial $m x^N + r$.

## Messages with equal length

In our case, we know several pairs of messages and their correct CRCs. We can
work out a fair bit of information by comparing messages. We'll first focus on
pairs of messages with equal length.

### Comparing several equal-length messages

Given two messages $m_1$ and $m_2$ with equal length $L$, and known CRCs $r_1$
and $r_2$,

$$
\begin{aligned}
m_1 x^N + r_1 &\equiv I x^L + F  \pmod{P} \\
m_2 x^N + r_2 &\equiv I x^L + F  \pmod{P}
\end{aligned}
$$

Adding the two equations together give:

$$ (m_1 x^N + r_1) + (m_2 x^N + r_2) \equiv 0  \pmod{P} $$

Similarly, if we have more messages $m_3$, $m_4$, etc. still of length $L$, we
have:

$$
\begin{aligned}
(m_1 x^N + r_1) + (m_3 x^N + r_3) \equiv 0  \pmod{P} \\
(m_1 x^N + r_1) + (m_4 x^N + r_4) \equiv 0  \pmod{P}
\end{aligned}
$$

Actually, it only matters that for each pair used in this adding, the messages
have the same length. The pairs don't have to be all $L$. Let's call $d_{k,l} =
(m_k x^N + r_k) + (m_l x^N + r_l)$

Since all the $m_k x^N + r_k$ directly correspond to the data we dumped, we
actually know them *in full*, not just modulo something. So we know all $d_{k,
l}$ in full. If $m_k$ and $m_l$ have the same length then for some unknown $q_{k,l}$:

$$ d_{k, l} = P \cdot q_{k, l} $$

We have several multiples of $P$. How can we find $P$ itself? This sounds like a
job for...

### Polynomial greatest common divisor (GCD)

So if we can calculate the remainder of polynomial division, is there an
analogous Euclidean algorithm to calculate the [greatest common divisor (GCD) of
two polynomials][poly-gcd]? You bet:

[poly-gcd]: https://en.wikipedia.org/wiki/Polynomial_greatest_common_divisor

```python
def poly_gcd(a, b):
    while b != 0:
        a, b = b, poly_mod(a, b)
    return a
```

The GCD of two polynomials $a(x)$ and $b(x)$ is the polynomial $g(x)$ with the
highest degree such that $a(x)$ and $b(x)$ are both the product $g(x)$ and
another polynomial.

The Euclidean algorithm for finding GCD works with polynomials, just like with
integers.

### Finding $P$ with GCD

Since if we have examples of $P \cdot q_{k, l}$ available, even though all the
$q_{k, l}$ are unknown, we should be able to take the GCD of all of them and
hopefully get $P$.

So for example with these three message hexdumps:

```
m1, r1 = AAFF 0040 2EEC
m2, r2 = AAFF 0060 2964
m3, r3 = AAFF 0050 2B08
```

Pairing them up arbitrarily give these polynomials:

$$
\begin{aligned}
(m_1 x^{16} + r_1) + (m_2 x^{16} + r_2) &= x^{18} + x^{15} + x^{14} + x^{13} + x^{4} + x^{0} \\
(m_1 x^{16} + r_1) + (m_3 x^{16} + r_3) &= x^{19} + x^{15} + x^{13} + x^{5} + x^{2} + x^{1} + x^{0}
\end{aligned}
$$

They should both be a multiple of $P$, so taking the polynomial GCD should give
us a multiple of $P$ of lower degree, hopefully $P$ itself.

What we get is:

$$ x^{16} + x^{14} + x^{13} + x^{2} + x^{0} $$

Since we guessed that it's a CRC-16, $P$ should have degree $N = 16$, and this
result does have degree $16$. So that's it, we found our polynomial $P = x^{16}
+ \mathtt{tap}$.

For use in code, `tap` should be the bit reversal of `0x6005`, i.e. `0xa006`.

## Messages with unequal length

### Comparing messages with unequal length

Having figured out $P$, we can try working on the rest of our parameters. We'll
pick two messages $m_1$ and $m_2$ with unequal lengths $L_1$ and $L_2$, and
known CRCs $r_1$ and $r_2$,

$$
\begin{aligned}
m_1 x^N + r_1 &\equiv I x^{L_1} + F  \pmod{P} \\
m_2 x^N + r_2 &\equiv I x^{L_2} + F  \pmod{P}
\end{aligned}
$$

Adding them this time gives:

$$ (m_1 x^N + r_1) + (m_2 x^N + r_2) \equiv I (x^{L_1} + x^{L_2}) \pmod{P} $$

Everything except $I$ is known here.

### Solving for $I$

Suppose that:

$$ I = \sum_{k = 0}^{N - 1} a_k x^k $$

Then:

$$ I (x^{L_1} + x^{L_2}) \bmod P = \sum_{k = 0}^{N - 1} a_k \cdot (x^k (x^{L_1} + x^{L_2}) \bmod P) $$

The left hand side is just $((m_1 x^N + r_1) + (m_2 x^N + r_2)) \bmod P$. Each
one of $x^k (x^{L_1} + x^{L_2}) \bmod P$ is also known.

Note also that each of those is a polynomial of degree smaller than $N$. These
polynomials form a *vector space* over $\mathrm{GF}(2)$. If we think in terms of
vector spaces, the problem now is to figure out a linear combination of the base
vectors $x^k (x^{L_1} + x^{L_2}) \bmod P$ that gives $I (x^{L_1} + x^{L_2})
\bmod P$.

In other words, we need to solve a linear equation. That's a job for our beloved
Gauss-Jordan elimination. But this time we work in $\mathrm{GF}(2)$, so adding
rows just means bitwise-xor, and there is no scaling involved.

In the rare chance that we don't get a unique solution, i.e. the base vectors
aren't actually linear independent, we can pick another message with a different
length try again.

If we go back to the real data we collected and pick these two messages:

```
m1, r1 = AAFF 0040 2EEC
m2, r2 = AAFF 040E02 0450
```

The lengths are $L_1 = 32$ and $L_2 = 40$, so the base vectors are (remember
first bit is highest power):

```
k  | x^k (x^L1 + x^L2) mod P
---|-------------------------
0  | 0001 1011 1100 0010
1  | 0011 0111 1000 0100
2  | 0110 1111 0000 1000
3  | 1101 1110 0001 0000
4  | 1101 1100 0010 0101
5  | 1101 1000 0100 1111
6  | 1101 0000 1001 1011
7  | 1100 0001 0011 0011
8  | 1110 0010 0110 0011
9  | 1010 0100 1100 0011
10 | 0010 1001 1000 0011
11 | 0101 0011 0000 0110
12 | 1010 0110 0000 1100
13 | 0010 1100 0001 1101
14 | 0101 1000 0011 1010
15 | 1011 0000 0111 0100
```

Our target polynomial $((m_1 x^N + r_1) + (m_2 x^N + r_2)) \bmod P$ is `1101
0110 1110 0110`, or:

$$ x^{15} + x^{14} + x^{12} + x^{10} + x^{9} + x^{7} + x^{6} + x^{5} + x^{2} + x^{1} $$

Solving for $a_k$, and we get that every single $a_k$ is $1$, i.e. `init` is the
all-ones `0xffff`.

# Solving for $F$

Now the only thing remaining to figure out is the final value $F$. Going back to
this:

$$ r \equiv m x^N + I x^L + F \pmod P $$

Solving for $F$ is pretty easy now, given that we know everything else:

$$ F \equiv m x^N + r + I x^L \pmod P $$

In other words, we can do a CRC calculation on something we know, assuming that
`final` is zero, and check the bitwise-xor with the real CRC to get the real
value or `final`. In the case of this adjustable desk it turns out that `final`
actually is just zero.

Now we have the complete set of parameters:

```
tap   = 0xa006
init  = 0xffff
final = 0x0000
```

This is not any standard CRC, as far as I know. I have no idea why the desk was
programmed this way.

I tried this process on some other samples including some CRC-32 ones and it
seems to work fairly reliably given like 10 example pairs.

# Did you really do all these just to hack into a desk?

No, I just wrote a program that went through all $2^{16}$ values of `tap`,
assuming that `init = 0xffff` and `final = 0x0000` just like Modbus. I found
`tap = 0x2006` works.

Then they started talking about sending it into a solver like Z3 or something,
in case brute force didn't work (well, brute forcing 32-bit CRCs where you need
to figure out both `init` and `tap` does seem to be intractable), but I was *so*
sure that I can reverse engineer CRC without brute force or relying on solvers
that I actually went ahead and did it. Got [nerd snipped][nerd-snipped], I
suppose.

[nerd-snipped]: https://xkcd.com/356

## About this document

This document was generated using [Pandoc][pandoc] from [the Markdown source](crc-tricks.md):

[pandoc]: https://pandoc.org/

```console
$ pandoc -f markdown --mathjax -t html < crc-tricks.md > index.html
```

```{=html}
</body>
</html>
```
