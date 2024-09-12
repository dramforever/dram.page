---
title: "Assembly Tidbits #4: An odd jump"
date: 2024-03-29
---

```
jalr rd, imm(rs1)
```

`imm` is a 12-bit integer, sign extended.

"Jump and link register"... So set `rd` to address after, and jump to `imm + rs1`.

There's a small problem...

<details>
<summary>Reveal</summary>

What if `imm + rs1` is odd? All RISC-V instruction addresses are two-byte-aligned...

It's been specified that the lowest bit is simply masked. So this instruction actually jumps to `(imm + rs1) & (~1)`.

Most other jump and branch instructions with immediate operands are incapable of encoding odd immediates, and the immediate values are added to `pc`, which means that these won't ever even try to jump to an odd address.

(The only other thing I can think of is the code size squeezing instructions for microcontrollers `cm.jt` and `cm.jalt` from Zcmt (<https://github.com/riscv/riscv-isa-manual/blob/main/src/zc.adoc>), where a jump table is used to squeeze bytes from the jump and function calls. If a jump table entry is odd that lowest bit is also just masked.)

</details>

- - -

RISC-V assembly operand glossary:

- `rs1`: Source register
- `rd`: Destination register
- `imm`: Immediate operand (Most often 12-bit and sign extended.)
