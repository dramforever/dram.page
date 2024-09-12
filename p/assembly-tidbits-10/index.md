---
title: "Assembly Tidbits #10: jalr"
date: 2024-06-21
---

In RISC-V assembly, which of these are valid uses of the `jalr` instruction?

```
jalr a0         # (1)
jalr (a0)       # (2)
jalr a0, a0     # (3)
jalr a0, a0, 4  # (4)
jalr a0, (a0)   # (5)
jalr a0, 4(a0)  # (6)
```

<details>
<summary>Solution</summary>

Binutils 2.38 thinks all are valid and they mean the following respectively

```
jalr ra, 0(a0)  # jalr a0
jalr ra, 0(a0)  # jalr (a0)
jalr a0, 0(a0)  # jalr a0, a0
jalr a0, 4(a0)  # jalr a0, a0, 4
jalr a0, 0(a0)  # jalr a0, (a0)
jalr a0, 4(a0)  # jalr a0, 4(a0)
```

As a reminder, `jalr rd, imm(rs1)` means `pc = (imm + rs1) & (~1)` and set `rd` to `old_pc + 4`. (Not considering compressed instructions.)

LLVM 18 rejects (2) and (5) as not valid because `(a0)` is not okay and insists you on writing `0(a0)` instead.

Personally, I was very surprised that (4) is allowed. As far as I can tell no other instruction allows both (4) and (6) styles.

```
ld a0, (a0)     # Okay
ld a0, 8(a0)    # Okay
ld a0, a0, 8    # Not allowed

addi a0, a0, 8  # Okay
addi a0, 8(a0)  # Not allowed
```

</details>

It's June of 2024. There's still no official assembly syntax for RV{32,64}GC.
