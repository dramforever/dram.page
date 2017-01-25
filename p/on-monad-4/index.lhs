> {-# LANGUAGE DeriveFunctor #-}
> import Control.Monad

显然，[有个 free monad 的库](https://hackage.haskell.org/package/free)。对，又是 Edward Kmett。 

> import Control.Monad.Free
> import Prelude.Extras (Show1)

这是我们的二叉树

> data B a = B a a
>                deriving (Functor, Show)

> instance Show1 B

> type Tree = Free B

> leaf :: a -> Tree a
> leaf = Pure

> fork :: Tree a -> Tree a -> Tree a
> fork a b = Free (B a b)

看起来不错。

    ghci> fork (leaf 2) (leaf 3)
    Free (B (Pure 2) (Pure 3))

我们随便用一下子 `(>>=)`

    ghci> fork (leaf 2) (leaf 3) >>= (\x -> fork (leaf $ 5 * x) (leaf $ 6 * x))
    Free (B (Free (B (Pure 10) (Pure 12))) (Free (B (Pure 15) (Pure 18))))

发生了什么？

<h3>Monads for substitution</h3>

<blockquote>
Monads provide substitution (fmap) and renormalization (join) — Edward Kmett
</blockquote>

观察表明，`(>>=)` 将每个 `leaf x` 替换成了 `fork (leaf $ 5 * x) (leaf $ 6 * x)`。替换成什么，显然是 `(>>=)` 的第二个参数决定的。所以我们得出，在 free monad 中，`(>>=)` 的作用是：将每个 `Pure x` 替换成 `f x`。

    instance Functor f => Monad (Free f) where
      return = Pure
      Pure a >>= f = f a
      Free m >>= f = Free ((>>= f) <$> m)

将 `>>=` 读作“替换”之后，这就变得非常显然了。

<h3>Monad 的定律</h3>

    return a >>= f = f a

这不废话么，`Pure a` 替换成 `f a`

    m >>= return = m

`Pure a` 替换成 `Pure a`。也挺对的。

    (m >>= f) >>= g = m >>= (\x -> f x >>= g)

这里其实就是进行了两个变换 `f` 和 `g`。这两个变换至于是先在 m 里替换一次 f，再替换一次 `g`，还是直接把 `m` 里的每个 `Pure` 都替换成了 `f` `g` 的组合，是没有关系的，因为第一次替换完后的所有 `Pure` 都是从 `f` 里面来的。

<h3>变量的替换</h3>

考虑一件事：我们用一个 monad `AST` 来存一个表达式，`AST a` 的 `a` 存的是所有未被绑定的变量。

它还有可能会在一个子表达式里面绑定一个变量。考虑:

> data Var a = X | U a
>            deriving (Show, Functor)

    AST a
    AST (Var a)

之间的关系。后者的未被绑定的变量，有 `X` 和 `U a` 两种。我们完全可以假装`AST (Var a)` 是 `AST a` 被绑定了一个变量的版本。其中，这个所谓的未绑定的变量 `X` 在这里被绑定，剩余的未绑定的变量变成 `U a`。

> data AST a
>   = FV a
>   | AST a :@ AST a
>   | Lam (AST (Var a))
>   deriving (Functor, Show)

> instance Applicative AST where
>     pure = FV
>     (<*>) = ap

AST 如何是个 monad 呢？

> instance Monad AST where
>     FV a >>= f = f a
>     Lam m >>= f = Lam (m >>= go)
>       where go X = return X
>             go (U r) = U <$> (f r)

`AST a` 中的 `a` 是所有未被绑定的变量，所以在 `(>>=)` 中我们把绑定了的变量单独考虑就好了。

还差一个：

>     (m :@ n) >>= f = (m >>= f) :@ (n >>= f)

这样，比如我们想绑定一个变量

> abstract :: Eq a => a -> AST a -> AST (Var a)
> abstract v e = go <$> e
>   where go x = if x == v then X else U x

或者把当前绑定的变量替换成一个表达式？

> instantiate :: AST a -> AST (Var a) -> AST a
> instantiate m e = e >>= go
>   where go X = m
>         go (U x) = return x

> lam :: Eq a => a -> AST a -> AST a
> lam v e = Lam (abstract v e)

    ghci> abstract "a" (FV "a" :@ FV "b")
    FV X :@ FV (U "b")
    ghci> instantiate (FV "x" :@ FV "y") it      -- it 指的是上一个表达式的值哦
    (FV "x" :@ FV "y") :@ FV "b"
    ghci> lam "x" it
    Lam ((FV X :@ FV (U "y")) :@ FV (U "b"))
    it :: AST [Char]
    (0.01 secs, 175,712 bytes)
    ghci> lam "y" it
    Lam (Lam ((FV X :@ FV (U X)) :@ FV (U (U "b"))))
    it :: AST [Char]
    (0.01 secs, 184,816 bytes)
    ghci> lam "b" it
    Lam (Lam (Lam ((FV X :@ FV (U X)) :@ FV (U (U X)))))

对于一个变量啊，`X` 表示它在当前层被绑定，`U` 表示它在当前层没被绑定。比如你看最后那个 `(U (U X))` 是不是在最后一层绑定的？

这叫 [bound](https://hackage.haskell.org/package/bound)。又是 Edward Kmett 写的。不过他写的有一个 abstract 的懒标记功能，提高了性能。

monad 原来还能干这事啊

[代码在此](index.lhs)
