---
title: "Assembly tidbits #2: Zero on five"
date: 2024-03-24
---

On RISC-V, with the compressed extension (which is intended to be available for all but very specialized cases), the canonical way to set a register to zero is the two-byte:

```
c.li a0, 0    # Encoding: 0x4501
```

`c.li` stands for "compressed load immediate" and works for any immediate `-32 <= imm <= 31`.

One thing that just irks me a little is what some would write (`mv` for "move"):

```
mv a0, zero
```

`zero` (equivalently, `x0`) is the hard-wired-to-zero register. However, the two-byte compressed encoding of it, namely `c.mv a0, zero` is disallowed since the it actually encodes `c.jr a0` (jump to address in register `a0`). So the assembler has to generate the four-byte form:

```
addi a0, zero, 0    # Encoding: 0x00000513
```

Binutils as of 2.40 does this, unnecessarily wasting two bytes and giving the processor frontend a harder job. *However again*, the LLVM integrated assembler nevertheless manage to recognize it and generates the two-byte `c.li` form.

Weirdly, if you do write `addi a0, zero, 0` yourself, Binutils 2.40 *does* recognize that it could be assembled as `c.li a0, 0`. If we go back in time a bit to Binutils 2.30, it didn't actually even do that.

You can give other combinations of `mv`, `add`, `zero` a try... but enough about the missed assembler optimizations.

Going back to the title, if you want to remember one thing from this... On RISC-V, to load a register with zero, the canonical way to *write it in assembly* is to use the `li` ("load immediate") pseudoinstruction:

```
li a0, 0
```

The assembler will figure it out for you. 
