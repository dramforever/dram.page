<meta charset="utf-8">

> {-# LANGUAGE DeriveFunctor #-}
> import Control.Monad (ap)

<h3>前传</h3>

和 sxysxy 神犇做了个交♂易，我来发布一些关于 monad 的教程。借用林则徐的两句名言来描述我现在的心情：（这里省略14个字）

<h3>树上最近公共祖先 LCA</h3>


<blockquote>
给定一个有根树（无向无环联通图，其中指定一个特殊节点为**根节点**），给出许多操作 `(u, v)`，求 `u` 到 `v` 的路径上，既是 `u` 的祖先，也是 `v` 的祖先的节点 `lca(u, v)`
从根节点到 `u` 的路径（这条路径是唯一的）上的点都是 `u` 的祖先（包括根和 `u`）
</blockquote>

<h3>Functor 的 LCA</h3>

一个 LCA 的查询系列是一个**世界** `LCA` 里的一个程序，这个程序跑在一个可以求 LCA 的环境中。我们不妨先试试一下只有一个操作的情况。

> data F_LCA a
>   = F_LCA
>     { f_lcaQuery :: (Int, Int)
>     , f_lcaValue :: Int -> a
>     }

这个操作可以查询一次 LCA，并用这个 LCA 的结果得到另一个结果。

如果要实现一个可以查询 LCA 的东西，我们可以接受一个 `F_LCA`，并做如下操作：

- 获得 `f_lcaQuery`，即要查询的两个节点 `u` 和 `v`
- 计算得到 `k = lca(u, v)`
- 调用 `f_lcaValue k` 得到最终结果（比如可能是输出的字符串）

可以看到的是，我们的 `LCA a` 中，隐隐地包含着一个类型为 `a` 的最终结果。而这个最终结果，我们是可以直接去改它的：

    class Functor f where
      fmap :: (a -> b) -> f a -> f b

也就是

    fmap :: (a -> b) -> F_LCA a -> F_LCA b

`fmap f qr` 应该将 qr 扩充，其原本结果是 `t` 的，要变成 `f t`。但是在这样的同时，`fmap` 不应修改 `F_LCA` 所进行的询问本身。

> instance Functor F_LCA where
>   fmap f (F_LCA q v) = F_LCA q (f . v)

为了支持超过 `fmap` 的东西，显然需要查询 LCA 这个基本操作。

> f_query :: Int -> Int -> F_LCA Int
> f_query x y = F_LCA (x, y) (\u -> u)

然后已经可以用了

    ghci> let qr = show `fmap` f_query 2 4
    qr :: F_LCA String      -- 想查询 LCA，返回一个 String
    ghci> f_lcaQuery qr
    (2,4)                   -- 看起来有人想查询 lca(2, 4)
    it :: (Int, Int)
    ghci> f_lcaValue qr 1   -- 结果是 1，看看怎么样
    "1"                     -- 不错嘛
    it :: String

<h3>Applicative 的 LCA</h3>

为了实现查询（0 次或）多次 LCA，我们自然地想到，可以把 query 变成一个列表，并让 value 接受一个列表，里面放上所有查询结果。

> data A_LCA a
>   = A_LCA
>     { a_lcaQueries :: [(Int, Int)]
>     , a_lcaValue :: [Int] -> a
>     }

对最终结果的计算，应该是这样的：

- 获得 `a_lcaQueries`，即要查询的所有节点对
- 计算得到所有 LCA 值
- 调用 `a_lcaValue` 传入所有 LCA 值得到最终结果

显然它还是个 `Functor`

> instance Functor A_LCA where
>   f `fmap` (A_LCA q v) = A_LCA q (f . v)

与之前不同的是，我们的 `A_LCA` 可以进行这样的组合：

- 查询一波 LCA 得到一个 String
- 再查询一波 LCA 得到另一个 String
- 然后把这两个 String 拼一块

别忘了咱还能不查询 LCA 直接给出结果

这样，Applicative 简直完美：

    class Functor f => Applicative f where
      pure :: a -> f a
      (<*>) :: f (a -> b) -> f a -> f b

`pure x` 直接给出结果 x

`f <*> x` 把 `f` 给出的结果 `f1`，和 `x` 组合的结果 `x1` 拼一块，给出结果 `f1 x1`

“拼一块”那个组合，可以这么实现

    (pure (++) <*> foo) <*> bar
    pure (++) <*> foo <*> bar -- 因为左结合
    (++) <$> foo <*> bar -- <$> 就是 fmap
                         -- 其实是一样的，想想为什么

而 `A_LCA` 的 `Applicative` 实现并不难写

> instance Applicative A_LCA where
>   pure x = A_LCA [] (const x)
>   A_LCA q1 f <*> A_LCA q2 x
>     = let newVal xs
>             = case splitAt (length q1) xs of

在这里，我们把列表按长度分成两半。因为我们可以认为，`a_lcaValue` 被调用时传入的列表是可以和查询列表 `a_lcaQueries` 对应的。

>                 (m, n) -> f m (x n)
>       in A_LCA (q1 ++ q2) newVal

当然，基础的操作：

> a_query :: Int -> Int -> A_LCA Int
> a_query x y = A_LCA [(x, y)] (\[u] -> u)

没有问题，也是可以用的

    ghci> let qr = (,,) <$> a_query 6 7 <*> a_query 8 10 <*> a_query 9 5
    qr :: A_LCA (Int, Int, Int)
    ghci> a_lcaQueries qr
    [(6,7),(8,10),(9,5)]
    it :: [(Int, Int)]
    ghci> a_lcaValue qr [1, 2, 3]
    (1,2,3)
    it :: (Int, Int, Int)

这个对应着什么？当然就是离线 LCA 了。

<h3>Monad 的 LCA</h3>

每次查询输入的是 `(x, y)`，可惜不一定查询的是 `lca(u, v)`

<blockquote>
询问 (u, v) 由下列规则产生（OIER都知道是怎样的吧>_<)<br>
u=min(（x+lastans)mod n+1,(y+lastans）mod n+1);<br>
v=max(（x+lastans)mod n+1,(y+lastans）mod n+1);<br>
lastans表示上一个询问的答案，一开始lastans为0<br>
</blockquote>

当然你知道，更险恶的是这个：

<blockquote>
注意出题人为了方便，input的第二行最后多了个空格。
</blockquote>

最一般的情况，我们可能每个查询，其实是依赖于前面的结果的。最一般的依赖，是一个函数。

    depend :: f a -> (a -> f b) -> f (a, b)

我可以在一个已经造好的程序，后面续上一个函数，从前面程序的结果，映射到我后面需要续上的程序。你得把两个结果都给我。

其实可以直接让你算最后一个值就可以了，显然你前面必须算过才能得出最后这个：

    (>>=) :: f a -> (a -> f b) -> f b

用这个可以定义 `depend`

> u `depend` f = u >>= (\k -> (\p -> (k, p)) <$> f k)

现在是 2016 年底了，`Monad` 很只剩下一个必须定义的方法：

    class Applicative m => Monad m where
      (>>=) :: m a -> (a -> m b) -> m b

对了，一般是 `Monad m` 而不是 `Monad f`。

> data M_LCA a
>   = FinalResult a
>   | Query (Int, Int) (Int -> M_LCA a)

每一个不是直接给出结果的程序，必定有其第一个查询的 LCA。以后的查询，依赖于这个第一次查询的结果。

我真懒：

>   deriving (Functor)

你需要在文件顶上加上一个这个

    {-# LANGUAGE DeriveFunctor #-}

每次我告诉你我要 `Query` 的时候，你信心满满地告诉我答案，等待着你的却是更多的 `Query`，直到得到 `FinalResult`。完美。

> instance Applicative M_LCA where
>   pure = FinalResult

真・最终结果

>   (<*>) = ap

`ap` 我待会儿解释

> instance Monad M_LCA where
>   FinalResult a >>= f

如果我们已经知道结果是什么了，lastans 就确定是 `a` 了，把它传进去就行了。

>     = f a

>   Query uv a >>= f

否则，我们假装已经得到了这一次的查询结果

>     = Query uv (\k ->

然后，告诉 `a`，看它返回的续上的程序是什么。我们这就得到了一个少一次查询的 `M_LCA a`，可以递归调用 `(>>=)`

>         a k >>= f)

整理一下

    instance Monad M_LCA where
      FinalResult a >>= f = f a
      Query uv a >>= f
        = Query uv (\k -> a k >>= f)

基本操作并没有什么不好写的

> m_query :: Int -> Int -> M_LCA Int
> m_query x y = Query (x, y) (\u -> FinalResult u)

不过这个好像没法直接查看查询输出结果了？咱写个 interactive 的。

> run :: M_LCA a -> IO a
> run (FinalResult x) = pure x
> run (Query uv f) = do
>   putStrLn $ "Result of " ++ show uv ++ "?"
>   r <- read <$> getLine
>   run (f r)

`do` 和 `(>>=)` 的对应是这样的

    do { x <- e; ... } = e >>= \x -> ...
    do { e ; ... } = e >>= \_ -> ...
    do { e } = e

do block 简写成一行了，展开大概是这样的

    do { a ; b ; c }
    = do a
         b
         c

试试吧，我们先查询 `k = lca(2, 3)`，然后查询 `lca(k, k + 1)`

> m_test :: M_LCA Int
> m_test = do
>   k <- m_query 2 3
>   m_query k (k + 1)

展开成 `(>>=)` 是这样的：

    m_test = m_query 2 3 >>= \k -> m_query k (k + 1)

    ghci> run m_test
    Result of (2,3)?
    54                        -- 键盘输入
    Result of (54,55)?
    0                         -- 键盘输入
    0                         -- 结果输出

看起来不错

为了帮助你理解 `M_LCA`，我们也可以把 m_test 完全展开：

    m_test = Query (2, 3) (\k -> Query (k, k + 1) FinalResult)

当然，像这样的就是前面给的那个险恶的东西的处理办法了

    foo = Query (x1, y1) (\lastans1 ->
            Query ( (lastans + x2) `mod` (n + 1)
                  , (lastans + y2) `mod` (n + 1))
                  (\lastans2 -> ...))

你已经成功定义了一个有意思的 Monad 了。

事实上，这个 Monad 用常规方法不好定义，所以咱们在 `M_LCA` 里手动发明了一波 free monad。这个可以以后讲。

<h3>练习</h3>

- `ap` 在 `Control.Monad` 里面有，对于没用 `(<*>)` 定义了 `(>>=)` 的 Monad，可以用 `ap` 当作 `(<*>)` 的默认实现。（如果用了的话会死循环）类型是非常明确的：

          ap :: Monad m => m (a -> b) -> m a -> m b

    尝试实现它。当然，你就不能用 `(<*>)` 了（人家等着用 `ap` 当 `(<*>)` 呢）不会的话，倒是有答案：<http://hackage.haskell.org/package/base-4.9.0.0/docs/src/GHC.Base.html#ap>

- 对于全部左结合的 `((a >>= b) >>= c) >>= ...`，算法的复杂度会退化成 `O(n^2)` 的。（好吧，准确地说，每次都会不停地遍历 Query 组成的一长链。）解决这个问题。（你应该是需要修改 `M_LCA` 的定义的。）（提示：这个问题**并不容易**）
