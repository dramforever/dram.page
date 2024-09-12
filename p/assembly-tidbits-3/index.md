---
title: "Assembly tidbits #3.5: Intermission: Where RISC-V?"
date: 2024-03-27
---

Where can I try out RISC-V assembly?

If all you want is seeing assembly code, Compiler Explorer aka "godbolt" is a good place to go: <https://godbolt.org/>. Recommended compiler options: `-O` for cleaner code.

For running... There are a bunch of random RISC-V emulators out there but I do prefer a "real" environment.

If you want a "zero-setup" environment, check out one of the RISC-V machines at JSLinux: <https://bellard.org/jslinux/index.html>, which emulates a machine well enough to run Linux in your browser. They don't have many of the newer extensions, but it's good enough to get started immediately.

If you're okay with having a bunch of random stuff on your machine, read ahead:

For building, I usually use the cross toolchain from Nixpkgs, but any will do. For running I pull out QEMU. On Linux, the user-mode emulation works well with Nix which frees me from dealing with containers or sysroots.

I heard that you can get Docker to run riscv64 containers by setting up QEMU with binfmt, but I haven't personally tried it enough to recommend or recommend against. You can check out some general instructions at: https://docs.docker.com/build/building/multi-platform/
