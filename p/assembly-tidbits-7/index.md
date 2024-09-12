---
title: "Assembly Tidbits #7: Exceptional jump"
date: 2024-04-18
---

That feeling when you trip, fall, and jolt awake realizing it was a dream?

Yeah that's what happens when a RISC-V operating system kernel enables the MMU early in the boot process. It causes an exception that lands back at the correct address. At least this way is common for RISC-V. Other architectures probably have it different.

- - -

A really common way to design a Unix-like kernel is to have all of the kernel code and data at some high/negative address. However usually physical memory is at a low-ish positive address. Usually on boot the MMU is disabled so we're running in physical addresses. How does the jump between the two happen?

I'm using the OpenBSD source as our example here since it's pretty and clean. The file is [`sys/arch/riscv64/riscv64/locore.S`](https://github.com/openbsd/src/blob/be15e419c1b8f75543577619727d35a483ee7aec/sys/arch/riscv64/riscv64/locore.S#L108)

(You may want to know that there's Linux's version, which has more comments: <https://elixir.bootlin.com/linux/v6.8/source/arch/riscv/kernel/head.S#L73>)

```
    /* s9 = physical address of start of kernel */

	/* Setup supervisor trap vector */
	lla	t0, va
	sub	t0, t0, s9
	li	t1, KERNBASE
	add	t0, t0, t1
	csrw	stvec, t0

	/* Set page tables base register */
	lla	s2, pagetable_l1
	srli	s2, s2, PAGE_SHIFT
	li	t0, SATP_MODE_SV39
	or	s2, s2, t0
	sfence.vma
	csrw	satp, s2

	.align 2
va:

    /* ... */
```

Let `phys_base` be the value in `s9`, the physical address at which the kernel is loaded. `KERNBASE` the virtual address that the kernel expects to be based at when it's running "properly" with MMU enabled.

At the start of this snippet, `pc` is the physical address, `satp.MODE` is `Bare`, so the MMU is off / identity-mapped. `lla` is PC-relative load address, so it sets `t0` to the physical address of `va`. The first part of the code ends up setting `stvec`, the trap handler address, to `physical addr of va - phys_base + KERNBASE`, which is the virtual address of `va` after MMU is enabled.

The second part of the code enables the MMU in Sv39 mode, with root of page table at `pagetable_l1`. The `sfence.vma` here ensures that after enabling the MMU it will see the page table contents that earlier code has written, and `csrw satp, s2` actually does the enabling.

The page table at `pagetable_l1` maps the kernel region starting at virtual address `KERNBASE` to the physical address region starting at `phys_base`.

What happens at this point?

After enabling the MMU, the next thing to do is to fetch the instruction following the `csrw`. However, since `pc` is still pointing at the physical address of the code, it maps to nowhere. An `Instruction page fault` exception happens.

... which causes a jump to `stvec`, the exception handler, which was pointing to the virtual address of `va`, which is where we want to be. We're awake and the MMU is on.

(`stvec` cannot hold an exception handler address that's not aligned to 4 bytes, so the `.align 2` inserts a `nop` if needed.)
