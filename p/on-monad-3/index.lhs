> {-# LANGUAGE DeriveFunctor #-}
> import Control.Monad

<h3>Monad 的树型结构</h3>

我们来看一个二叉树

> data F a = E a | Fork (F a) (F a)
>          deriving (Functor)

它肯定是个 `Functor`。`Applicative` 的 `pure` 也好办。

> instance Applicative F where
>     pure = E
>     (<*>) = ap

我们 claim，`F` 也是个 `Monad`。`(>>=)` 要做什么呢？先随便写写吧。

> instance Monad F where

`E` 好像是别无选择的

>     E a >>= f = f a

`Fork` 的话随便写写，一下就想到了这个

>     Fork u v >>= f = Fork (u >>= f) (v >>= f)

写完了？但是这个靠谱么？

<h3>Monad 定律</h3>

- `return a >>= f = f a`
- `m >>= return = m`
- `(m >>= f) >>= g = m >>= (\x -> f x >>= g)`

如果用 `do` 写出来，看得更清楚

- `do { res <- return x; f res } = f x`
- `do { res <- m; return res } = m`
- `do { res <- do { x <- m; f x }; g res } = do { x <- m; res <- f x; g res }`

在命令式编程里面，你可能已经习惯于对程序做这种变换了。

在 Haskell 里，这种变换是可以**算**出来的。就用 Monad 定律。

我们来验证一下 F 符合 Monad 定律

<h3>第一条：</h3>

    return a >>= f
    = E a >>= f
    = f a

<h3>第二条：</h3>

    m >>= return = m

对 m 用归纳法

    E a >>= return = return a = E a

给定 `u >>= return = u` 和 `v >>= return = v`，我们有

    Fork u v >>= return
    = Fork (u >>= return) (v >>= return)
    = Fork u v

<h3>第三条</h3>

    (m >>= f) >>= g

对 m 用归纳法

    (E a >>= f) >>= g
    = f a >>= g （由 >>= 定义）
    = E a >>= (\x -> f x >>= g) （由 >>= 定义反推）

给定 `u` 和 `v` 符合条件，我们有

    (Fork u v >>= f) >>= g
    = Fork (u >>= f) (v >>= f) >>= g （由 >>= 定义）
    = Fork ((u >>= f) >>= g) ((v >>= f) >>= g) （由 >>= 定义）
    = Fork (u >>= (\x -> f x >>= g)) (v >>= (\x -> f x >>= g)) （由归纳假设）
    = Fork u v >>= (\x -> f x >>= g) （由 >>= 定义反推）

感觉好像重复写了好多东西啊。有没有更一般的结构？

<h3>Free monad</h3>

> data Free f a
>     = W (f (Free f a))
>     | Z a
>     deriving (Functor)

如果我们定义

> data Pair a = Pair a a
>             deriving (Functor)

那么 `Free Pair` 就和 `F` 是等效的了

    Fork (Fork (E 2) (E 3)) (E 5)

对应

    W (Bin (W (Bin (Z 2) (Z 3))) (Z 5))

之前的这么一步

    Fork u v >>= f = Fork (u >>= f) (v >>= f)

`u` `v` 包在一个 `Pair` 里之后，后面的那个 `u >>= f` 和 `v >>= f` 就可以变成 `fmap (>>= f)` 了

> instance Functor f => Applicative (Free f) where
>     pure = Z
>     (<*>) = ap

> instance Functor f => Monad (Free f) where
>     Z a >>= f = f a
>     W fa >>= f = W (fmap (>>= f) fa)

<h3>练习</h3>

- 证明 Free 是符合 Monad 定律的
