---
title: "Cryptography 30 years apart: Ascon on an HP-16C"
date: 2026-01-15
---

Ascon ([NIST](https://csrc.nist.gov/pubs/sp/800/232/final), [Wikipedia](https://en.wikipedia.org/wiki/Ascon_(cipher))) is a set of lightweight cryptographic algorithms intended for resource constrained applications that nevertheless is intended to produce modern security. It was finalized as a standard in August of 2025 as NIST SP 800-232 "Ascon-Based Lightweight Cryptography Standards for Constrained Devices: Authenticated Encryption, Hash, and Extendable Output Functions".

How resource constrained? How about an HP-16C ([Wikipedia][HP-16C]), a programmable programmer's calculator from over 30 years ago? ~200 bytes total of program and storage should be enough.

[HP-16C]: https://en.wikipedia.org/wiki/HP-16C

I'm not going to pretend I'm going to be good at teaching you how to use these HP calculators. There are tutorials online all over that will do a far better job at explaining them. If you don't have an HP-16C, you can use [JRPN 16C](https://jrpn.jovial.com/run/index.html) as an in-browser emulator. It can directly import the listing below for your convenience.

## Example

Computing the hash function on an empty string, `Ascon-Hash256("")`, which should be `0b 3b e5 85 0f 2f 6b 98 ca f2 9f 8f de a8 9b 64 a1 fa 70 aa 24 9b 8f 83 9b d5 3b aa 30 4d 92 b2`.

First, pad the message with one `01` byte and as much zeros as needed to get to a multiple of 8. Bytes are read/written in little-endian, so the padded message is a single block `0x0000000000000001`. Then do the following:

- Enter the program (see end of post)
- Set mode: `[HEX] 0 [f] [WSIZE] [f] [UNSGN]` (set hexadecimal, 64-bit, unsigned)
- Initial value: `[f] [CLEAR REG] 80100cc0002 [STO] [0]`
- Initialization: `C [GSB] [0]` to apply the 12-round `Ascon-p[12]` permutation
- XOR message: `[RCL] [0] 1 [f] [XOR] [STO] [0]`, you should get `9b1e5494e934d680`
- Process message: `C [GSB] [0]` to apply again
- Read hash: `[RCL] [0]`, you should get `986b2f0f85e53b0b`. Read bytes in little-endian, so the first 8 bytes are `0b 3b e5 85 0f 2f 6b 98`
- Iterate once more and read further bytes of hash: `C [GSB] [0] [RCL] [0]`, you should get `649ba8de8f9ff2ca`, hence `ca f2 9f 8f de a8 9b 64`
- Repeat until all 64 bytes are produced

(Note: Only `R0` is directly used to XOR the input onto and form the hash. Other registers participate in the round function but the bytes are not directly used for input and output.)

This program isn't specifically optimized --- it is just a straightforward translation of [one of the C reference implementations][ascon-c]. It takes 140 lines of program space. On a real 16C it takes about 20 seconds per round, so `Ascon-p[8]` (8 rounds) takes ~2.5min, and `Ascon-p[12]` (12 rounds) takes ~4min.

[ascon-c]: https://github.com/ascon/ascon-c/blob/9057124473a4b9cbcc8a028b65a4abf6b4222b0f/src/opt64_lowsize/round.h

## Program listing

(In [JRPN 16C](https://jrpn.jovial.com/run/index.html) compatible format, so you can load it in directly via `(menu) > File > Import Program > Import from Clipboard`. Set `(menu) > Settings > Long Numbers` to `Grow LCD` and `(menu) > Settings > System Settings > ms/Program Instruction` to `0` for extra convenience.)

```
# Ascon round function
#
# Usage:
# Assumed Mode: [HEX] 0 [f] [WSIZE] [f] [UNSGN] (hexadecimal, 64-bit, unsigned)
#
# Modifies state S0 through S4 stored in R0 through R4
# Uses I, R5, R6 as scratch
#
#    Single round: <round constant> [GSB] [A]
#            e.g.: b4 [GSB] [A]
#
# Up to 12 rounds: <num rounds> [GSB] [0]
#            e.g.: 8 [GSB] [0]    for Ascon-p[8]
#            e.g.: C [GSB] [0]    for Ascon-p[12]

   000 {          }
# Single round
   001 { 43 22  A } g LBL A

# s2 ^= c
   002 {    45  2 } RCL 2
   003 {    42 10 } f XOR
   004 {    44  2 } STO 2

# s0 ^= s4
   005 {    45  4 } RCL 4
   006 {    45  0 } RCL 0
   007 {    42 10 } f XOR
   008 {    44  0 } STO 0

# s2 ^= s1
   009 {    45  1 } RCL 1
   010 {    45  2 } RCL 2
   011 {    42 10 } f XOR
   012 {    44  2 } STO 2

# s4 ^= s3
   013 {    45  3 } RCL 3
   014 {    45  4 } RCL 4
   015 {    42 10 } f XOR
   016 {    44  4 } STO 4

# tmp = ~s4 & s0
# (s4 already conveniently on TOS)
   017 {    42 30 } f NOT
   018 {    45  0 } RCL 0
   019 {    42 20 } f AND
   020 {    44  5 } STO 5

# s0 ^= ~s1 & s2
   021 {    45  1 } RCL 1
   022 {    42 30 } f NOT
   023 {    45  2 } RCL 2
   024 {    42 20 } f AND
   025 {    45  0 } RCL 0
   026 {    42 10 } f XOR
   027 {    44  0 } STO 0

# s2 ^= ~s3 & s4
   028 {    45  3 } RCL 3
   029 {    42 30 } f NOT
   030 {    45  4 } RCL 4
   031 {    42 20 } f AND
   032 {    45  2 } RCL 2
   033 {    42 10 } f XOR
   034 {    44  2 } STO 2

# s4 ^= ~s0 & s1
   035 {    45  0 } RCL 0
   036 {    42 30 } f NOT
   037 {    45  1 } RCL 1
   038 {    42 20 } f AND
   039 {    45  4 } RCL 4
   040 {    42 10 } f XOR
   041 {    44  4 } STO 4

# s1 ^= ~s2 & s3
   042 {    45  2 } RCL 2
   043 {    42 30 } f NOT
   044 {    45  3 } RCL 3
   045 {    42 20 } f AND
   046 {    45  1 } RCL 1
   047 {    42 10 } f XOR
   048 {    44  1 } STO 1

# s3 ^= tmp
   049 {    45  5 } RCL 5
   050 {    45  3 } RCL 3
   051 {    42 10 } f XOR
   052 {    44  3 } STO 3

# s1 ^= s0
   053 {    45  0 } RCL 0
   054 {    45  1 } RCL 1
   055 {    42 10 } f XOR
   056 {    44  1 } STO 1

# s3 ^= s2
   057 {    45  2 } RCL 2
   058 {    45  3 } RCL 3
   059 {    42 10 } f XOR
   060 {    44  3 } STO 3

# s0 ^= s4
   061 {    45  4 } RCL 4
   062 {    45  0 } RCL 0
   063 {    42 10 } f XOR
   064 {    44  0 } STO 0

# s0 = s0 ^ (s0 ror 19) ^ (s0 ror 28)
   065 {    45  0 } RCL 0
   066 {       36 } ENTER
   067 {       36 } ENTER
   068 {       36 } ENTER
   069 {        9 } 9
   070 {    42  F } f RRn
   071 {    42 10 } f XOR
   072 {        1 } 1
   073 {        3 } 3
   074 {    42  F } f RRn
   075 {    42 10 } f XOR
   076 {    44  0 } STO 0

# s1 = s1 ^ (s1 ror 39) ^ (s1 ror 61)
   077 {    45  1 } RCL 1
   078 {       36 } ENTER
   079 {       36 } ENTER
   080 {       36 } ENTER
   081 {        1 } 1
   082 {        6 } 6
   083 {    42  F } f RRn
   084 {    42 10 } f XOR
   085 {        2 } 2
   086 {        7 } 7
   087 {    42  F } f RRn
   088 {    42 10 } f XOR
   089 {    44  1 } STO 1

# s2 = s2 ^ (s2 ror 1) ^ (s2 ror 6)
   090 {    45  2 } RCL 2
   091 {       36 } ENTER
   092 {       36 } ENTER
   093 {       36 } ENTER
   094 {        5 } 5
   095 {    42  F } f RRn
   096 {    42 10 } f XOR
   097 {    42  D } f RR
   098 {    42 10 } f XOR
   099 {    44  2 } STO 2

# s3 = s3 ^ (s3 ror 10) ^ (s3 ror 17)
   100 {    45  3 } RCL 3
   101 {       36 } ENTER
   102 {       36 } ENTER
   103 {       36 } ENTER
   104 {        7 } 7
   105 {    42  F } f RRn
   106 {    42 10 } f XOR
   107 {        A } A
   108 {    42  F } f RRn
   109 {    42 10 } f XOR
   110 {    44  3 } STO 3

# s4 = s4 ^ (s4 ror 7) ^ (s4 ror 41)
   111 {    45  4 } RCL 4
   112 {       36 } ENTER
   113 {       36 } ENTER
   114 {       36 } ENTER
   115 {        2 } 2
   116 {        2 } 2
   117 {    42  F } f RRn
   118 {    42 10 } f XOR
   119 {        7 } 7
   120 {    42  F } f RRn
   121 {    42 10 } f XOR
   122 {    44  4 } STO 4

# s2 = ~s2
   123 {    45  2 } RCL 2
   124 {    42 30 } f NOT
   125 {    44  2 } STO 2

   126 {    43 21 } g RTN

# Multiple rounds
   127 { 43 22  0 } g LBL 0
   128 {    44 32 } STO I
   129 {        4 } 4
   130 {       40 } +
   131 {        F } F
   132 {       20 } *
   133 { 43 22  B } g LBL B
   134 {    44  6 } STO 6
   135 {    21  A } GSB A
   136 {    45  6 } RCL 6
   137 {        F } F
   138 {       30 } -
   139 {    43 23 } g DSZ
   140 {    22  B } GTO B
```
