---
title: "Assembly Tidbits #8: signed unsigned int, part 1"
date: 2024-06-05
---

**(part 1)** [(part 2)](https://cohost.org/dram/post/6395668-assembly-tidbits-9)

[The RISC-V calling convention] makes a curious remark about what to do when integers are passed in registers, and the integer type is smaller than the register width:

[The RISC-V calling convention]: https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-cc.adoc

> [I]nteger scalars narrower than XLEN bits are widened according to the sign of their type up to 32 bits, then sign-extended to XLEN bits.

In summary, say we're on 64-bit RISC-V:

| Width | Signed (`intN_t`) | Unsigned (`uintN_t`) |
|---|---|---|
| `[u]int8_t` | sign-extended | zero-extended |
| `[u]int16_t` | sign-extended | zero-extended |
| `[u]int32_t` | sign-extended | sign-extended |
| `[u]int64_t` | passed as-is | passed as-is |

Well, obviously the curious one here is `uint32_t`. Why on earth is this particular one sign-extended? The wording is very much intentional, and...

```c
unsigned int test() {
    return 0x80000001u;
}
```

```
Breakpoint 1, 0x0000000000010602 in test ()
(gdb) fin
Run till exit from #0  0x0000000000010602 in test ()
0x0000000000010614 in main ()
(gdb) p/x $a0
$2 = 0xffffffff80000001
```

Yeah! It's really how it's done! What's going on?

- - -

Designing data types to work this way serves one main purpose: minimizing the number of instructions added that would have to specifically handle 32-bit data.

Some ground rules: When we say *sign-extended*, we mean that the high 32 bits are all the same and copies of bit 31. So for example, `0xffff_ffff_8000_0000` is *sign-extended*, since bit 31 (with place value `2 ** 31`) is `1`, and all the high 32 bits are `1`. Same reason `0x0000_0000_4000_0000` is *sign-extended* as well. The actual information content as 32-bit values are all in the low 32 bits. The high bits are completely determined by the low 32 bits (in fact, by a single one of them, bit 31) and provide no additional information.

(I'm using `**` for exponentiation here.)

# Arithmetic operations

There's no way `add` would work the same on 32-bit data, so we have to use two different instructions: `add` and `addw`. `w` means "word" and is 32-bit. No, Intel does not get to tell us that a word is 16 bits.

```
add rd, rs1, rs2 # rd = rs1 + rs2
addw rd, rs1, rs2 # rd = sign_extend(rs1[31:0] + rs2[31:0])
```

The way `addw` works is that it disregards the high bits of the inputs, adds the two 32-bit values discarding carry, then sign extends the result. So for example, adding `0x0000_0000_4000_0000` (so, `2 ** 30`) with itself using `add` produces `0x0000_0000_8000_0000`, but using `addw` produces `0xffff_ffff_8000_0000`

Is `addw` for unsigned addition, or is it for twos' complement signed addition? As it turns out, both! Remember that the information content is all in the low 32 bits. The high bits in inputs are ignored, and the high bits in the output is completely determined by bit 31. Therefore, you only need to read the low 32-bits, which works the same way whether or not you're working with signed or unsigned values.

So for the value `0xffff_ffff_8000_0000` here, you only read `0x8000_0000`, and it "means" `2 ** 31` when interpreted as an unsigned value, and `- (2 ** 31)` when interpreted as a signed value. The unsigned addition has the "right" value, and the signed addition overflows as expected for a twos' complement.

# Bitwise operations

Bitwise operations are even easier. If for both inputs the high bits are copies of bit 31, then after the same operation, the resulting high bits will also be copies of bit 31 from the result. Therefore, the same `and`, `or`, `xor` instructions can be used for all the data types.

# Comparisons

Comparisons are quire interesting. RISC-V provides `slt` and `sltu` for signed and unsigned comparisons respectively, and gives `1` if `rs1 < rs2` and `0` if `rs1 >= rs2`.

```
slt rd, rs1, rs2 # rd = (rs1 signed < rs2) ? 1 : 0
sltu rd, rs1, rs2 # rd = (rs1 unsigned < rs2) ? 1 : 0
```

But ... those compare full-register width values, so how do you compare two `uint32_t` if they are weirdly sign extended? Don't you need a special instruction like, `bltuw`?

As it turns out, no! You can just use `sltu`. If you interpret the sign-extended values as unsigned 64-bit integers... then sign-extension is actually monotonic, so the order works out. The values `0x0000_0000` through `0x7fff_ffff` get mapped to the same values, and values `0x8000_0000` through `0xffff_ffff` get a huge number added to them, but the important part is that the mapping is monotonic and therefore order preserving.

![A diagram showing how the numbers have been monotonically mapped with a gap inserted between 0x7fff_ffff and 0x8000_0000](https://cohost.org/rc/attachment-redirect/4e7f4b38-ecd7-4e5f-bc76-015e35846027)

Same reasoning goes for the branch if less than `bltu` instruction, and the branch if greater than `bgeu` instruction.

Nice! Everything works out just right. It would be a shame if a common coding pattern/habit using `unsigned int` comes and really wants to be zero-extended in a 64-bit register and ruins the day...

- - -

RISC-V assembly operand glossary:

- `rs1`, `rs2`: Source registers
- `rd`: Destination register
