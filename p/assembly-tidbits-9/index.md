---
title: "Assembly Tidbits #9: signed unsigned int, part 2"
date: 2024-06-12
---

[(part 1)](https://cohost.org/dram/post/6283552-assembly-tidbits-8) **(part 2)**

Last time we saw how RISC-V could deal with unsigned 32-bit values that are sign extended just fine. In fact, it's natively designed to do so: `uint32_t` *should be* sign extended in registers.

Well of course, we need efficient 32-bit operations because there's an entire world out there with C code processing `int`-sized data. And of course `int` is 32-bit because everyone is doing it like this[^1].

[^1]: See https://en.cppreference.com/w/c/language/arithmetic_types#Data_models "Other models are very rare. For example, ILP64 (8/8/8: int, long, and pointer are 64-bit) only appeared in some early 64-bit Unix systems (e.g. Unicos on Cray)". Also, see https://archive.opengroup.org/public/tech/aspen/lp64_wp.htm for arguments in favor of LP64.

Everything is fine and dandy. Until...

```
char memory_access(char *p, uint32_t i) {
    return p[i];
}
```

```
memory_access:
        slli    a1, a1, 32
        srli    a1, a1, 32
        add     a0, a0, a1
        lbu     a0, 0(a0)
        ret
```

Oh no. That's a lot of instructions just to read one byte from memory. What went wrong?

Essentially, to calculate `p + i`, you would need to promote `i` from an unsigned 32-bit value to an unsigned 64-bit value. Since the 32-bit value is stored in a register sign-extended, this operations is not free! In fact, it was expected to be rare enough that you need two instructions to do it, doing a shifting dance `(a << 32) >> 32` to zero out the high bits.

Even worse, since the 32-bit arithmetic instructions give out their results sign-extended, you can't just be smart about it and keep the value zero-extended -- doing 32-bit arithmetic like `addw`, `slliw` etc destroys the zero-extension, and doing 64-bit arithmetic gives you the wrong result!

The correct way of course is to add instructions to handle these cases. Indeed, the standard Zba extension and non-standard Xtheadba extension provides instructions like `add.uw` and `slli.uw` to handle promoting unsigned 32-bit values to 64-bit. Compiling the code above with `-march=rv64gc_zba` gives this code:

```
memory_access:
        add.uw  a0, a1, a0
        lbu     a0, 0(a0)
        ret
```

... which combines the zero-extension and addition in one instruction, a far more reasonable codegen.

But what if you already have silicon that doesn't have these new instructions `add.uw`? What if you do not care that you're committing crimes against `uint32_t`?

- - -

CoreMark is one of those standard benchmarks you run on your processor cores to tell people how good it is. You will cite your CM/GHz figures in your core documentation, and you will tweak the crap out of the compiler options to make it look good.

On November of 2018, a patch to SiFive's port of CoreMark simply titled ["Tweaks for the HiFive Unleashed"](https://github.com/sifive/benchmark-coremark/commit/287f632b3e1fa3d9ea87e03a30d33ed6c1184485), aside from some aforementioned compiler option tweaks, contains this horrifying change to `core_portme.h`:

```
-typedef unsigned int ee_u32;
+typedef signed int ee_u32;
```

Ain't no rule saying `u32` can't be signed.

By now you should know the significance of `typedef int32_t uint32_t`. Every time there's a memory access using an unsigned 32-bit index, doing this saves *at least* two instructions in it.

Testing with this change shows significant improvement in the CoreMark benchmark score, while not affecting correctness (since it never actually overflows). See this forum post for someone who tried, but do note that the variables aren't very well controlled: https://forums.sifive.com/t/coremark-benchmark-degradation-on-hifive-unmatched/5193

In January of 2019, EEMBC [issued a change to the rules](https://github.com/eembc/coremark/commit/7663f78002d0aa55ea6a047c1dc4e11d43fbeb4f) that:

> [...] signed and unsigned types *must* be observed in `core_portme.h`.

Changing the original `typedef` rules:

	* `ee_u8` is an 8 bits datatype.
	* `ee_s16` is a 16 bits datatype.
	* `ee_u16` is a 16 bits datatype.
	* `ee_s32` is a 32 bits datatype.
	* `ee_u32` is a 32 bits datatype.

Into:

	* `ee_u8` is an unsigned 8-bit datatype.
	* `ee_s16` is a signed 16-bit datatype.
	* `ee_u16` is an unsigned 16-bit datatype.
	* `ee_s32` is a signed 32-bit datatype.
	* `ee_u32` is an unsigned 32-bit datatype.

Nowadays if you're buying a new hot RISC-V thing now that has like roughly the new SiFive U7 or better ([VisionFive 2](https://www.starfivetech.com/en/site/boards), [HiFive Premier P550](https://www.sifive.com/boards/hifive-premier-p550) (not yet out as of writing)), or T-Head C908 (Kendryte K230), or SpaceMit K1 ([Banana Pi BPI-F3](https://wiki.banana-pi.org/Banana_Pi_BPI-F3)), it will have the `add.uw` instructions that will be there for when your code mixes `uint32_t` with addresses.

And basically none of the distros will be using it since everyone targets `rv64gc` without `zba`.

But you'll know they aren't running their Dhrystone and CoreMark with a signed unsigned int.

- - -

References

- <https://github.com/riscv/riscv-isa-manual/blob/main/src/b-st-ext.adoc#zba-address-generation>
- <https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-cc.adoc>
- <https://github.com/XUANTIE-RV/thead-extension-spec/blob/master/xtheadba.adoc>
