---
title: "Legendary off-by-ones, bugs or not"
date: 2026-09-13
---

# CRC-32 `k6'`

Using carryless multiplication (CLMUL) to efficiently compute a cyclic redundancy check (CRC) consists of two steps: folding and Barret reduction.
For both, some pre-computed constants are used.

The mathematics of CRC is described in detail elsewhere and will not be repeated here.
See the Intel whitepaper linked below for a comprehensive explanation.

This concerns only a specific variant of CRC known as the IEEE or Zlib CRC-32.
It uses the polynomial `0x104c11db7`.

In the computation, a constant used was known as as `k6'`.
The Intel whitepaper by Gopal et al. gives the value of this constant as:

```
k6' = 0x1db710640
```

However, as Kutenin described, some implementations use this value of `k6'` instead:

```
k6' = 0x1db710641
```

This discrepancy was also noted in the wuffs library.

A mathematical analysis reveals that the two constants are equivalent.
In effect, the LSB of `k6'` is unused.
You can think of this as the LSB of the multiplicand having no effect on the high-half of a carryless multiplication:

$$
(p(x) + a) (q(x) + b) = p(x)q(x) + a q(x) + b p(x) + a b
$$

The addition of the constant terms `a` and `b` results in a difference of degree no more than $\max\{\deg(p(x)), \deg(q(x))\}$.

Therefore, this is not a bug.

See also:

- Danila Kutenin, [How a Bug(?) in the Linux CRC-32 Checksum Turned out not to be a Bug](https://danlark.org/2021/03/08/how-a-bug-in-the-linux-crc-32-checksum-turned-out-not-to-be-a-bug/)
- Intel, [Fast CRC Computation for Generic Polynomials Using PCLMULQDQ Instruction](https://web.archive.org/web/20230315165408if_/https://www.intel.com/content/dam/www/public/us/en/documents/white-papers/fast-crc-computation-generic-polynomials-pclmulqdq-paper.pdf) (Link to the Internet Archive)
- [`common_up_x86_sse42.wuffs` from wuffs](https://github.com/google/wuffs/blob/9e5817e45d6ef222e1c7919ae3b6565a7146bdc2/std/crc32/common_up_x86_sse42.wuffs#L138-L195)

# Swift `Float.pi`

The constant `Float.pi` in Swift is the IEEE 754 binary32 approximation of $\pi$.
Its value is:

```
0x1.921fb4p+1 ≈ 3.14159250…
```

Most other language standard libraries provide this value instead:

```
0x1.921fb6p+1 ≈ 3.14159274…
```

The two differ in only the least significant bit of the significant.
In other words, they differ by a single ULP.

```
                    s e        m
0x1.921fb4p+1 = f32(0 10000000 10010010000111111011010)
0x1.921fb6p+1 = f32(0 10000000 10010010000111111011011)
```

The latter larger value is closer to the true value of $\pi$, `3.14159365…`.
However, Swift's value is chosen as rounding $\pi$ towards zero, in order to nudge trigonometric functions into the expected quadrants more often.

There is later consensus among the IEEE 754 working group that implementations should provide the closer-rounded value.
Therefore, there is a proposal to "fix" the value of
It is humorously referred to as the "Indiana π bill, take 2", in reference to the 1897 legislative bill in Indiana, United States that would have incidentally legislated the value of $\pi$ as `3.2`.

See: [\[Pitch\] round π to nearest](https://forums.swift.org/t/pitch-round-to-nearest/89497) on the Swift Forums.

This is not a bug, but it may be fixed anyway.

# Rockchip calendar

The RK808 PMIC had a real-time clock (RTC) that would count the time and date with very little power.
However, there is a bug in that chip.
It would be difficult to describe the off-by-one better than the patch message that added the corresponding workaround to Linux.

> rtc: rk808: Compensate for Rockchip calendar deviation on November 31st
>
> In A.D. 1582 Pope Gregory XIII found that the existing Julian calendar
> insufficiently represented reality, and changed the rules about
> calculating leap years to account for this. Similarly, in A.D. 2013
> Rockchip hardware engineers found that the new Gregorian calendar still
> contained flaws, and that the month of November should be counted up to
> 31 days instead. [...]

(See: <https://git.kernel.org/torvalds/c/f076ef44a44d02ed91543f820c14c2c7dff53716>)

The workaround eventually decided on was to arbitrarily consider `2016-01-01` the date at which the Rockchip and Gregorian calendars are synchronized.
Then, dates are converted as needed.
Unfortunately this does mean that firmware and dual-booted operating systems need the same synchronization convention, but it is probably fine.

This is definitely a bug, but since it's worked around in software, nobody has to see it.
