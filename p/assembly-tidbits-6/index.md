---
title: "Assembly Tidbits #6: Division troubles"
date: 2024-04-06
---

What do you think division by zero should result in? Like an `unsigned long` division: `divu a0, a0, zero`.

Have you seen how a electromechanical calculator divides by zero, or rather, divides at all?

https://www.youtube.com/watch?v=7Kd3R_RlXgc

We'll ignore the decimal point for now, since it has no effect on the machine's internal function. In the first phase, it first moves the divisor `d` to successively higher digits, each time subtracting it from the dividend `a` to see if the result overflows / goes negative, and undoes the subtraction. the first time the result does overflow, first phase end. This finds the smallest `n` such that `d * 10**n > a`. This `n` is the number of digits in the quotient `q`. This has no relevance to our division instruction since the number of quotient digits is fixed (namely, fixed at the machine word length). (We *may* get back to this some other time.)

The second phase finds the actual digits of the quotient. This process goes from highest to lowest digit. For the `10**i` place, it starts at `0` and counts up one by one, each time subtracting the dividend by `d * 10**i`, until the subtraction overflows, in which case it is undone and we move to the `10**(i - 1)` place.

This is where the mechanical calculator attempting to divide by zero is caught in an infinite loop. Since subtracting by zero never overflows, the highest digit of the quotient just counts up and up without ever stopping.

That's in decimal. How about in binary? If we're doing binary division, the digit can only be `0` or `1`. So there's no need to loop through all the possible digits. Finding each quotient digit becomes simply:

- Subtract `d * 2**i`
- If subtracting overflows, undo subtraction and set result digit to `0`
- Otherwise, set result digit to `1`.

In both bases after we determine the lowest digit, what's remaining of the dividend is ... the remainder.

This means that in the binary case. If we use `0` as the divisor, since it never overflows, we end up with a quotient of all ones and remainder same as the dividend.

And that's what RISC-V specifies. Just don't check for zero and divide through:

```
divu rd, rs1, rs2 # If rs2 = 0, then rd = -1
remu rd, rs1, rs2 # If rs2 = 0, then rd = rs1
```

Making division by zero not raise an exception means that there is no arithmetic exception *anywhere* in RISC-V (floating point "exceptions" are more like, you know, flags). This frees up the programmer and/or the compiler to reorder division instructions freely, and makes the architecture simpler. The value specified here falls directly out of the most basic division algorithm (["restoring division"](https://en.wikipedia.org/wiki/Division_algorithm#Restoring_division) since there's "undo" involved). It may also apply to other more sophisticated algorithms, depending on how exactly these go.

- - -

RISC-V assembly operand glossary:

- `rs1`, `rs2`: Source registers
- `rd`: Destination register
