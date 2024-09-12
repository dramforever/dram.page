---
title: "Assembly Tidbits #5: Preserving returns"
date: 2024-04-04
---

When you call a function according to the RISC-V calling convention, you really just put the return address in `x1`/`ra` and jump to the start of the function.

For each non-leaf function, the function prologue saves `ra` on the stack, and the epilogue restores it back before returning back (or perhaps doing a tail call):

```
foo:
    addi sp, sp, -16
    sd ra, (sp)
    call bar            # Really: jal ra, bar (if in reach)
    call bar
    ...
    ld ra, (sp)
    addi sp, sp, 16
    ret                 # Really: c.jr ra
``` 

Leaf functions, meanwhile, generally do not touch `ra`.

```
addone:
    addi a0, a0, 1
    ret
```

Does this mean `ra` is preserved across calls / "call-saved"? No. `ra` is not preserved across calls. See: <https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-cc.adoc>.

One way to think about it is that `call bar` clobbers `ra`, so even if we require functions to restore `ra`, it's going to be a not very useful value anyway.

Another way to think about this is that `ra` is treated as an extra argument, a place to jump to. Argument registers are, as a rule, not call-saved.

Does this matter? Does allowing `ra` to be clobbered enable anything? Does requiring `ra` to be preserved enable anything? I genuinely don't know.
