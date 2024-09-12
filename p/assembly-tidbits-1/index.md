---
title: "Assembly tidbits #1: Data link established"
date: 2024-03-23
---

```
void hello() {
    puts("hello world");
}
```

To implement this function according to the RISC-V calling convention, you would want to put the address of the string in `a0` and jump to (i.e. tail call) `puts`. How could you achieve this with just one instruction?

```
hello:
    # TODO: One instruction here
    .string "hello world"
```

(No, this is not normally how this is done. Also, you may assume that `puts` is within reach of one instruction.)

<details>
<summary>Solution</summary>

```
hello:
    jal a0, puts
    .string "hello world"
```

`jal`, or jump-and-link, means to put address after the instruction in a register and jump to the encoded offset. The RISC-V `jal` instruction allows *any* general purpose register to be the destination to put the "return address" in.

However, nothing says that the return address stored can only be used as a return address. It could also be, for example in this case, a pointer to some data right after the `jal` instruction.

(This would work as long as the executable code is readable, and your program is not so big that `puts`/`puts@plt` goes out of range of one instruction.)

Of course, this is not how you would normally do the equivalent of a C string literal. Something more reasonable would be:

```
    .section .text
hello:
    lla a0, .Lmsg
    tail puts

    .section .rodata
.Lmsg:
    .string "hello world"
```

</details>
