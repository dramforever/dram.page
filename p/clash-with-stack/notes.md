
- Intro
    - TODO Short intro to Clash
    - Really short intro to Stack
    - Problem: Every tutorial runs clash on 'raw' Haskell files
        - bitlog.it
        - Clash FAQ: https://github.com/clash-lang/clash-compiler/wiki/FAQ#how-do-i-run-and-install-clash-using-stack
    - Problem: (make this short)
        - Why `stack exec` and pass the flags and files if you can just `stack repl`
        - Why throw away Stack-based project management
            - `stack.yaml` and `package.yaml` stuff like dependencies and Stackage snapshots
- Fitting Clash into Stack
    - Play around a little bit with the executables `clash` and `clashi`
    - Reveal: Just customized `ghc` and `ghci`
    - `stack repl` has a flag `--with-ghc`
        - `  --with-ghc GHC           Use this GHC to run GHCi`
    - We can try to use `--with-ghc clash`
    - Unfortunately doesn't work out of the box
        - Missing modules
    - Adding the needed dependencies
        - Tracking down implicit deps by module name
        - `ghc-typelits-natnormalise`, `ghc-typelits-extra`, and `ghc-typelits-knownnat`
        - Adding these to the deps of your project works
        - We will come back to it later
- Give it a test
    - Load up the project: `stack repl --with-ghc clash`
    - Compile to HDL in REPL: `:verilog`
        - (Example here)
    - Extra flags: `--ghci-options`
- Compiling Clash code with regular GHC
    - Flags
        - Clash by default loads a few plugins
        - As documented in the... other (?) Clash FAQ?
        - https://clash-lang.readthedocs.io/en/latest/faq.html
            - Look for `-fplugin`
            - Oh by the way this also documents the three packages that contains the plugins
            - Unsurprisingly that was the three missing packages
            - How things worked: Clash added flags like `-fplugin GHC.TypeLits.Normalise`
            - But it implicitly depends on the modules being in scope
    - Extensions
        - Clash by default also enables and disables GHC extensions
        - https://github.com/clash-lang/clash-compiler/blob/master/clash-ghc/src-ghc/Clash/GHC/LoadModules.hs#L614
        - Or look for `wantedLanguageExtensions ::` if the list moved
        - `wanted`: copy to `default-extensions`
        - `unwanted`: prepend `No` and add
    - Now `stack repl` works too
- Code available on GitHub
    - https://github.com/dramforever/clash-with-stack
    - modules work
- Extra: Where to put `clash-ghc`?
    - One way is to use `build-depends`
        - But we really don't import anything from it
    - `build-tool-depends`
        - Conveys that only the binaries are needed
        - But still forces depending packages to
    - Not mentioning it
        - Works, but bad user experience
        - Won't get installed automatically
        - Less friendly if trying to get started with a project

```plain
<command line>: Could not find module ‘GHC.TypeLits.KnownNat.Solver’
Use -v to see a list of the files searched for.
```

```plain
ghci> :verilog PlayClash.Circuit
Loading dependencies took 1.088728906s
Compiling: PlayClash.Circuit.refAdder32
Applied 550 transformations
Normalisation took 0.891433855s
Netlist generation took 0.003641186s
Compiling: PlayClash.Circuit.chainAdder32
Applied 32 transformations
Normalisation took 0.083207021s
Netlist generation took 0.004778602s
Total compilation took 2.079329679s
```
