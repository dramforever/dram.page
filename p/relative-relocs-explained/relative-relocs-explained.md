```{=html}
<!DOCTYPE html>
<html>

<head>
    <title>ELF relative relocations explained -- dramforever</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="../../styles/default.css">
    <link rel="stylesheet" href="../../styles/post.css">
</head>

<body>

<div id="site-title">
    <h1 id="site-title-main"><a href="/">
        dramforever
    </a></h1>
    <div id="site-title-sub">a row of my life</div>
</div>

<article>
<div id="post-title">
    <h1 id="post-title-main">ELF relative relocations explained</h1>
    <span id="post-title-sub">2023-09-18</span>
</div>
```

## Background

Consider this code, where one piece of global data is a pointer to another piece of global data:

```
void *foo;
void *bar = &foo;
```

During program execution, the memory at `bar` contains an address of `foo`. One way to achieve this is to require all the data to be loaded at a certain address. Then the linker can simply pre-calculate the address at link time and fill in the address for `bar`.

Having a program runnable from only one fixed address may be undesirable, however:

- If we're a shared library, this would require a global registry of library addresses to avoid collision, and would be a massive pain.
- ASLR by definition requires randomized addresses and is in direct conflict of fixed addresses.
- In early boot scenarios such as bootloaders or EFI applications or drivers, virtual memory is not available, and it's desirable to place executables out of the way of one another at runtime.

If something can work at any (suitably aligned) address, it is *position-independent*. Otherwise it's *position-dependent*.

By compiling code to use PC-relative addressing, executable code can be made position-independent *relatively* easily. (Ha!) However the problem with global pointers is more fundamental. Again, take a look back at the code:

```
void *foo;
void *bar = &foo;
```

If we don't want to change the representation of a `void *`, and the address of global data is only known at runtime, something has to, *at runtime*, figure out the address of `foo` and put it in `bar` before user code can see it.

## Relative relocations

On ELF systems, this problem is handled with *dynamic relocations*. We'll tackle the most simple case here: relative relocations.

We'll handle the simplest case and assume everything (code, data) in an executable must still be contiguous and cannot move relative to one another. The entire executable will move as a whole to some "base address" that is only known at runtime. Then everything in the executable will be at a fixed offset from the base address.

We will also not need to link to dynamic shared libraries, and everything we need is in the executable. This is known as a statically-linked position-independent executable, or *static-pie*.

Conceptually, the three major steps that occur to make the code example work are:

1. Compiler: Generates a relocatable file (object file) with static relocations saying this:

   ```
   (8 bytes) // foo
   (8 bytes) // bar, Please fill in the address of foo
   ```

2. Linker: Places everything the compiler says to place at offsets from the base and generates a static-pie with dynamic relocations:

   ```
   offset       contents
   0x100        (8 bytes)
   0x108        (8 bytes) // Please fill in value of (base + 0x100)
   ```

3. Startup code: Figures out `base`, looks at the dynamic relocations, and fills in the correct addresses:

   ```
   addr         contents
   0xabc100     0
   0xabc108     0xabc100
   ```

We'll ignore the relocatable file and focus on the static-pie.

## RELA and REL

An instruction like "please fill in value of `(base + one_offset)` at `another_offset`" is called a *relocation*. The most obvious way to encode such a relocation is to just have a table of offsets. Like maybe an array of "RELA" entries:

```
struct {
    uintptr_t offset;
    uintptr_t info;
    intptr_t addend;
}
```

`info` encodes the type of this entry and some other information. For our purposes the value is just a constant called `R_*_RELATIVE` (The name and value is architecture-dependent, like `R_X86_64_RELATIVE` or `R_RISCV_RELATIVE`).

`offset` is the offset from the base address to which the entry applies to, and the addend is... the value to be added, in this case added to the base address.

(*Note*: The same structure is used for static relocations but the meanings of fields are not identical. That's irrelevant to this article.)

To put everything together again, for each entry in the array, if `info == R_*_RELATIVE`, then it means "Please fill in the value of `(base + addend)` at `offset` from base of executable". The algorithm to run to apply these relocations is also pretty simple:

```
uintptr_t base = ...;
for (rela = ...) {
    if (rela->info == R_*_RELATIVE) {
        *(uintptr_t *)(base + rela->offset) = base + rela->addend;
    } else ...
}
```

On some architectures a simplified structure "REL" is used, like:

```
struct {
    uintptr_t offset;
    uintptr_t info;
}
```

The `addend` field is gone from the table, and is just stashed into where `offset` points. The meaning of entries is otherwise the same.

```
for (rel = ...) {
    if (rel->info == R_*_RELATIVE) {
        *(uintptr_t *)(base + rel->offset) += base;
    } else ...
}
```

## The `.rel[a].dyn` section, and `DT_REL[A]*`

The linker synthesizes an array of tag-value pairs, and also synthesizes a symbol `_DYNAMIC` to point to the start of it:

```
struct {
    uintptr_t tag;
    uintptr_t value;
} _DYNAMIC[];
```

The format of the dynamic array does not have an explicit size and is terminated by an entry with `tag` as `DT_NULL = 0`. The relevant tags for us are:

- `tag` is `DT_RELA = 7`, `value` is offset of array of RELA entries
- `tag` is `DT_RELASZ = 8`, `value` is total size in bytes of the array of RELA entries
- `tag` is `DT_RELAENT = 9`, `value` is the size in bytes of one RELA entry, i.e. `3 * sizeof(uintptr_t)`

This allows us to find where the array of RELA entries is. We can just find `_DYNAMIC` and the base address using PC-relative addressing, and we can run the relocation algorithm from the previous section.

Perhaps just for convenience, the linker puts the `_DYNAMIC` array in a section called `.dynamic`, and the dynamic RELA relocations in `.rela.dyn`.

(If you have an operating system giving you ELF auxillary vectors, you can look up the base address as `AT_BASE`, and look up where `_DYNAMIC` is by looking for `AT_PHDR` to find the `PT_DYNAMIC` segment. I suppose this is more portable.)

A similar thing happens for REL, with the `.rel.dyn` section, and tags `DT_REL = 17`, `DT_RELSZ = 18`, `DT_RELENT = 19`. Not much more to say about those.

## Linker script trickery for the `.rel[a].dyn` section

If you're building a bootloader or something and just want to, you don't *have* to use `_DYNAMIC`. You can just use the linker script to give you symbols that bound the `.rel[a]` array.

```
.rela.dyn : {
    __rela_start = .;
    *(.rela*)
    __rela_end = .;
}
```

## RELR

The RELA format is grossly inefficient space-wise at representing relocations. REL is 1/3 better but is only really a thing on some architectures. Can we do even better?

For position independent executables it is often the case that there are a lot of contiguous addresses needing relative relocation. For example, this is one relocation per every string:

```
const char *string_table = {
    "one string",
    "another string",
    "a third string",
    ...
};
```

RELR is a new packed format to store dynamic relative relocations more efficiently with bitmaps. From what I can tell it's not really well documented, but support exists in e.g. glibc and musl. The linker LLD supports it fully. BFD ld supports it for x86 only.

The closest to an official documentation is [one email on the general-abi mailing list][relr-proposal] that is a proposal for the RELR format.

[relr-proposal]: https://groups.google.com/g/generic-abi/c/bX460iggiKg/m/YT2RrjpMAwAJ

The idea originates from Google for their Android stuff, but the format eventually settled on is this:

- Each entry is `uintptr_t` long.
- If an entry is even, it means the `uintptr_t` at this address needs relocating.
- If an entry is odd, the bits except the least significant bit, from lowest to highest, is a bitmap encoding which of the `sizeof(uintptr_t) * 8 - 1` `uintptr_t` values after the last address handled needs relocating.

(It is simply assumed that all offsets needing relocation is aligned.)

For example, on a 64-bit system, if we want 64 contiguous relocations, we can just represent it with two entries:

```
0x0000_0000_0001_0000   The one uintptr_t at offset 0x10000 needs relocating
0xffff_ffff_ffff_ffff   The next 63 uintptr_t values after that needs relocating
                        (Offset 0x10008 through 0x101f8)
```

The last address handled is `0x101f8`, so if the next entry is still a bitmap it would start from `0x10200`. If we want one more relocation, making it 65 instead of 64:

```
0x0000_0000_0000_0003   Of the next 63 words, only the first one needs relocating
                        (Offset 0x10200)
```

(Remember that the least significant bit isn't part of the bitmap.)

Even though bitmap only has one bit set, it still handles 63 `uintptr_t` values, so if the next entry is still a bitmap it would start from `0x103f8`.

If we want to skip to another address, just put in the address. In fact if you want to be lazy and don't want to figure out how to generate bitmaps, you can skip this altogether and just put down a list of addresses, and it's still valid.

As simple as RELR is, the savings are remarkable. For our example, 65 relocations are represented with 24 bytes with RELR. In RELA that's 1560 bytes. This is a space saving of 98%. According to [some measurements][relr-measurements] this saves around 5% to 20% of binary size for PIEs. On most modern computers it is likely that the more compact in-memory representation is also faster due to less memory accesses.

[relr-measurements]: https://groups.google.com/g/generic-abi/c/bX460iggiKg/m/s8AOWvPaCAAJ

The algorithm in more detail is like this:

```
uintptr_t next; // Next address to relocate
for (uintptr_t entry ...) {
    if ((entry & 1) == 0) {
        *(uintptr_t *)(base + entry) += base; // Like REL

        // Next to relocate is the word after the one pointed to by entry
        next = base + entry + sizeof(uintptr_t);
    } else {
        // The bitmap handles the next (sizeof(uintptr_t) * 8 - 1) words
        for (i = 0; i < sizeof(uintptr_t) * 8 - 1; i ++) {
            if ((entry >> (i + 1)) & 1) {
                // If bit (i + 1) is set, word i needs relocating
                *(uintptr_t *)(next + sizeof(uintptr_t) * i) += base;
            }
        }

        // Next to relocate is after that
        next += sizeof(uintptr_t) * (8 * sizeof(uintptr_t) - 1);
    }
}
```

For the bitmap case, it might be more convenient to write it like this:

```
        uintptr_t tmp = next;
        for (; entry >>= 1; tmp += sizeof(uintptr_t)) {
            if (entry & 1) {
                *(uintptr_t *)tmp += base;
            }
        }

        next += sizeof(uintptr_t) * (8 * sizeof(uintptr_t) - 1);
```

RELR uses `.relr.dyn` section and tags `DT_RELR = 36`, `DT_RELRSZ = 35`, `DT_RELRENT = 37`. (Note: The values aren't sequential!)

Since only dynamic relative relocations are represented in RELR, it does not replace RELA/REL. The proposal states that dynamic RELR relocations should be processed before REL/RELA.

## A note on "base address"

The base address mentioned above is not actually the start of the binary, but the address to which the address `0` is moved to. Since PIEs are usually linked to starting at `0` this checks out. If your linker script links everything starting at somewhere else, like:

```
SECTIONS {
    . = 0x80000000;
    __executable_start = .;

    // ...
}
```

The base address is actually `__executable_start - 0x80000000`. No idea why you would do that though, since the whole point of PIE is to not have a fixed start address...

## References

- [Relative relocations and RELR][maskray-relr] by MaskRay
- [arm64: Add support for relocating the kernel with RELR relocations][arm64-linux-relr] by Peter Collingbourne
- [Linker and Libraries Guide, Oracle Solaris 11 Information Library][solaris-linker]

[maskray-relr]: https://maskray.me/blog/2021-10-31-relative-relocations-and-relr
[arm64-linux-relr]: https://lore.kernel.org/all/20190801011842.199786-1-pcc@google.com/
[solaris-linker]: https://docs.oracle.com/cd/E23824_01/html/819-0690/toc.html

## About this document

This document was generated using [Pandoc][pandoc] from [the Markdown source](relative-relocs-explained.md):

[pandoc]: https://pandoc.org/

```console
$ pandoc -f markdown -t html < relative-relocs-explained.md > index.html
```

```{=html}
</body>
</html>
```
