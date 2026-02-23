---
title: "Cryptography 30 years apart: Ascon on an HP-16C"
date: 2026-01-15
---

Ascon ([NIST](https://csrc.nist.gov/pubs/sp/800/232/final), [Wikipedia](https://en.wikipedia.org/wiki/Ascon_(cipher))) is a set of lightweight cryptographic algorithms intended for resource constrained applications that nevertheless is intended to produce modern security. It was originally developed in 2014, and was finalized as a standard in August of 2025 as NIST SP 800-232 "Ascon-Based Lightweight Cryptography Standards for Constrained Devices: Authenticated Encryption, Hash, and Extendable Output Functions".

How resource constrained? How about an HP-16C ([Wikipedia][HP-16C]), a programmable programmer's calculator from over 30 years earlier? ~200 bytes total of program and storage should be enough.

[HP-16C]: https://en.wikipedia.org/wiki/HP-16C

I'm not going to pretend I'm going to be good at teaching you how to use these HP calculators. There are tutorials online all over that will do a far better job at explaining them. If you don't have an HP-16C, you can use [JRPN 16C](https://jrpn.jovial.com/run/index.html) as an in-browser emulator. It can directly import the listing below for your convenience.

## Example

Computing the hash function on an empty string, `Ascon-Hash256("")`, which should be `0b 3b e5 85 0f 2f 6b 98 ca f2 9f 8f de a8 9b 64 a1 fa 70 aa 24 9b 8f 83 9b d5 3b aa 30 4d 92 b2`.

First, pad the message with one `01` byte and as much zeros as needed to get to a multiple of 8. Bytes are read/written in little-endian, so the padded message is a single block `0x0000000000000001`. Then do the following:

- Enter the program (see end of post)
- Set mode: `[HEX] 0 [f] [WSIZE] [f] [UNSGN]` (set hexadecimal, 64-bit, unsigned)
- Initial value: `[f] [CLEAR REG] 80100cc0002 [STO] [0]`
- Initialization: `C [GSB] [0]` to apply the 12-round `Ascon-p[12]` permutation. You should get `9b1e5494e934d681`, which is `S0`
- XOR message: `1 [f] [XOR] [STO] [0]`, you should get `9b1e5494e934d680`
- Process message: `C [GSB] [0]` to apply again
- Read hash: you should get `986b2f0f85e53b0b`. Read bytes in little-endian, so the first 8 bytes are `0b 3b e5 85 0f 2f 6b 98`
- Iterate once more and read further bytes of hash: `C [GSB] [0]`, you should get `649ba8de8f9ff2ca`, hence `ca f2 9f 8f de a8 9b 64`
- Repeat until all 64 bytes are produced

(Note: Only `R0` is directly used to XOR the input onto and form the hash. It is, as a convenience, recalled after every `[GSB] [0]`. Other registers participate in the round function but the bytes are not directly used for input and output.)

## Program listing

This program isn't specifically optimized --- it is just a straightforward translation of [one of the C reference implementations][ascon-c]. It takes 140 lines of program space. On a real 16C it takes about 20 seconds per round, so `Ascon-p[8]` (8 rounds) takes ~2.5min, and `Ascon-p[12]` (12 rounds) takes ~4min.

[ascon-c]: https://github.com/ascon/ascon-c/blob/9057124473a4b9cbcc8a028b65a4abf6b4222b0f/src/opt64_lowsize/round.h

(In [JRPN 16C](https://jrpn.jovial.com/run/index.html) compatible format, so you can load it in directly via `(menu) > File > Import Program > Import from Clipboard`. Set `(menu) > Settings > Long Numbers` to `Grow LCD` and `(menu) > Settings > System Settings > ms/Program Instruction` to `0` for extra convenience.)

```
# Ascon round function
#
# Usage:
# Assumed Mode: [HEX] 0 [f] [WSIZE] [f] [UNSGN] (hexadecimal, 64-bit, unsigned)
#
# Modifies state S0 through S4 stored in R0 through R4
# Uses R5, R6 as scratch
#
#    Single round: <round constant> [GSB] [A]
#            e.g.: b4 [GSB] [A]
#
# Up to 12 rounds: <num rounds> [GSB] [0]
#            e.g.: 8 [GSB] [0]    for Ascon-p[8]
#            e.g.: C [GSB] [0]    for Ascon-p[12]
#
# 2026-01-18: Updated the multi-round subroutine to free up I register. Not
#             enough for a key, but you could store the IV there.
# 2026-02-23: Subroutine 0 performs RCL 0 at end for convenience
#             Minor peephole optimization near the start of subroutine A

   000 {          }
# Single round
   001 { 43 22  A } g LBL A

# s2 ^= s1 ^ c
   002 {    45  1 } RCL 1
   003 {    45  2 } RCL 2
   004 {    42 10 } f XOR
   005 {    42 10 } f XOR
   006 {    44  2 } STO 2

# s0 ^= s4
   007 {    45  4 } RCL 4
   008 {    45  0 } RCL 0
   009 {    42 10 } f XOR
   010 {    44  0 } STO 0

# s4 ^= s3
   011 {    45  3 } RCL 3
   012 {    45  4 } RCL 4
   013 {    42 10 } f XOR
   014 {    44  4 } STO 4

# tmp = ~s4 & s0
# (s4 already conveniently on TOS)
   015 {    42 30 } f NOT
   016 {    45  0 } RCL 0
   017 {    42 20 } f AND
   018 {    44  5 } STO 5

# s0 ^= ~s1 & s2
   019 {    45  1 } RCL 1
   020 {    42 30 } f NOT
   021 {    45  2 } RCL 2
   022 {    42 20 } f AND
   023 {    45  0 } RCL 0
   024 {    42 10 } f XOR
   025 {    44  0 } STO 0

# s2 ^= ~s3 & s4
   026 {    45  3 } RCL 3
   027 {    42 30 } f NOT
   028 {    45  4 } RCL 4
   029 {    42 20 } f AND
   030 {    45  2 } RCL 2
   031 {    42 10 } f XOR
   032 {    44  2 } STO 2

# s4 ^= ~s0 & s1
   033 {    45  0 } RCL 0
   034 {    42 30 } f NOT
   035 {    45  1 } RCL 1
   036 {    42 20 } f AND
   037 {    45  4 } RCL 4
   038 {    42 10 } f XOR
   039 {    44  4 } STO 4

# s1 ^= ~s2 & s3
   040 {    45  2 } RCL 2
   041 {    42 30 } f NOT
   042 {    45  3 } RCL 3
   043 {    42 20 } f AND
   044 {    45  1 } RCL 1
   045 {    42 10 } f XOR
   046 {    44  1 } STO 1

# s3 ^= tmp
   047 {    45  5 } RCL 5
   048 {    45  3 } RCL 3
   049 {    42 10 } f XOR
   050 {    44  3 } STO 3

# s1 ^= s0
   051 {    45  0 } RCL 0
   052 {    45  1 } RCL 1
   053 {    42 10 } f XOR
   054 {    44  1 } STO 1

# s3 ^= s2
   055 {    45  2 } RCL 2
   056 {    45  3 } RCL 3
   057 {    42 10 } f XOR
   058 {    44  3 } STO 3

# s0 ^= s4
   059 {    45  4 } RCL 4
   060 {    45  0 } RCL 0
   061 {    42 10 } f XOR
   062 {    44  0 } STO 0

# s0 = s0 ^ (s0 ror 19) ^ (s0 ror 28)
   063 {    45  0 } RCL 0
   064 {       36 } ENTER
   065 {       36 } ENTER
   066 {       36 } ENTER
   067 {        9 } 9
   068 {    42  F } f RRn
   069 {    42 10 } f XOR
   070 {        1 } 1
   071 {        3 } 3
   072 {    42  F } f RRn
   073 {    42 10 } f XOR
   074 {    44  0 } STO 0

# s1 = s1 ^ (s1 ror 39) ^ (s1 ror 61)
   075 {    45  1 } RCL 1
   076 {       36 } ENTER
   077 {       36 } ENTER
   078 {       36 } ENTER
   079 {        1 } 1
   080 {        6 } 6
   081 {    42  F } f RRn
   082 {    42 10 } f XOR
   083 {        2 } 2
   084 {        7 } 7
   085 {    42  F } f RRn
   086 {    42 10 } f XOR
   087 {    44  1 } STO 1

# s2 = s2 ^ (s2 ror 1) ^ (s2 ror 6)
   088 {    45  2 } RCL 2
   089 {       36 } ENTER
   090 {       36 } ENTER
   091 {       36 } ENTER
   092 {        5 } 5
   093 {    42  F } f RRn
   094 {    42 10 } f XOR
   095 {    42  D } f RR
   096 {    42 10 } f XOR
   097 {    44  2 } STO 2

# s3 = s3 ^ (s3 ror 10) ^ (s3 ror 17)
   098 {    45  3 } RCL 3
   099 {       36 } ENTER
   100 {       36 } ENTER
   101 {       36 } ENTER
   102 {        7 } 7
   103 {    42  F } f RRn
   104 {    42 10 } f XOR
   105 {        A } A
   106 {    42  F } f RRn
   107 {    42 10 } f XOR
   108 {    44  3 } STO 3

# s4 = s4 ^ (s4 ror 7) ^ (s4 ror 41)
   109 {    45  4 } RCL 4
   110 {       36 } ENTER
   111 {       36 } ENTER
   112 {       36 } ENTER
   113 {        2 } 2
   114 {        2 } 2
   115 {    42  F } f RRn
   116 {    42 10 } f XOR
   117 {        7 } 7
   118 {    42  F } f RRn
   119 {    42 10 } f XOR
   120 {    44  4 } STO 4

# s2 = ~s2
   121 {    45  2 } RCL 2
   122 {    42 30 } f NOT
   123 {    44  2 } STO 2

   124 {    43 21 } g RTN

# Multiple rounds
   125 { 43 22  0 } g LBL 0
   126 {        4 } 4
   127 {       40 } +
   128 {        F } F
   129 {       20 } *
   130 { 43 22  B } g LBL B
   131 {    44  6 } STO 6
   132 {    21  A } GSB A
   133 {    45  6 } RCL 6
   134 {        4 } 4
   135 {        B } B
   136 {    43 49 } g x==y
   137 {    22  C } GTO C
   138 {       33 } Rv
   139 {        F } F
   140 {       30 } -
   141 {    22  B } GTO B
   142 { 43 22  C } g LBL C
   143 {    45  0 } RCL 0
   144 {    43 21 } g RTN
```
