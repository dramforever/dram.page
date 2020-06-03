```{=html}
<!DOCTYPE html>
<html>

<head>
    <title>6 步搞懂 FFT -- dramforever</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="../../styles/default.css">
    <link rel="stylesheet" href="../../styles/post.css">
    <script type="text/javascript" async src="//cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-MML-AM_CHTML"></script>
</head>

<body>

<div id="site-title">
    <h1 id="site-title-main"><a href="/">
        dramforever
    </a></h1>
    <div id="site-title-sub">coding, thoughts and stuff irl</div>
</div>

<article>
<div id="post-title">
    <h1 id="post-title-main">6 步搞懂 FFT</h1>
    <span id="post-title-sub">2019-09-15</span>
</div>
```

FFT，启动！

## 第一步：单位根

如下形式的复数称为 $n$ 次单位根（其中 $i$ 是虚数单位）：

$$
\omega_n^k = e^{2 \pi ik/n}
$$

（这里上标是幂次）

基本性质有：

$$
\omega_n^k = \omega_n^{k+xn} = \omega_{xn}^{xk}
$$

$$
\omega_n^a\omega_n^b=\omega_n^{a+b}
$$

$$
\sum_{p=0}^{n-1} \omega_n^{pk} = \begin{cases} n & k \bmod n = 0 \\ 0 & k \bmod n \neq0  \end{cases}
$$

## 第二步：DFT

DFT 是一个 $n$ 元序列到 $n$ 元序列的映射，如下：

$$
\mathsf{DFT}(a)_k = \sum_p a_p \omega_n^{pk}
$$

其逆如下：

$$
\mathsf{IDFT}(a)_k = {1 \over n} \sum_p a_p \omega_n^{-pk}
$$

以下默认：大写字母表示对应小写字母的 DFT，如：

$$
A=\mathsf{DFT}(a)
$$

## 第三歩：循环卷积和多项式乘法

考虑从 $a$ 和 $b$ 构造的序列 $c$（用 $\circ$ 表示序列按位乘，如 $\langle 1,2,3 \rangle \circ \langle 4,5,6 \rangle = \langle 4, 10, 18 \rangle$）：

$$
c = \mathsf{IDFT}(A \circ B)
$$

展开定义将各项重新组合可得：

$$
\begin{align}
c_k & = {1 \over n} (\sum_p (\sum_q a_q \omega_n^{qp})(\sum_r b_r \omega_n^{rp})\ \omega_n^{-pk} ) \\
  & = {1 \over n} (\sum_q \sum_r a_q b_r (\sum_p \omega_n^{(q+r-k) p}))
\end{align}
$$

根据单位根基本性质，将最里面的求和式化简：（方括号表示真取 $1$ 假取 $0$）

$$
\sum_p \omega_n^{(q+r-k) p} = n \cdot [(q+r-k) \bmod n=0]
$$

故有：

$$
c_k = \sum_q \sum_r a_q b_r [(q+r-k) \bmod n=0]
$$

（用类似的思路可以证明 DFT 和 IDFT 互逆，此处略去）

也就是说，等式左侧实现了一个叫做循环卷积的过程，伪代码如下：

```plain
c = new array of n zeros
for q:
	for r:
		c[(q + r) mod n] += a[q] * b[r]
```

特别的，考虑需要计算两个多项式的乘法：我们有系数序列 $a$ 和 $b$，$a$ 有 $u$ 项，$b$ 有 $v$ 项。假设系数存的是从常数项在下标 $0$ 开始，我们给 $a$ 后补 $v$ 个 $0$，给 $b$ 后补 $u$ 个 $0$，计算循环卷积时所有 $q + r$ “溢出” $n$ 的项都为 $0$，也就是说相当于 $\bmod n$ 不需要考虑，那么循环卷积特化为多项式乘法：

```plain
c = new array of n zeros
for q:
	for r:
		c[q + r] += a[q] * b[r]
```

注意到大整数乘法可以化为多项式乘法加处理进位。

直接计算是 $O(n^2)$ 的，我们通过在 $O(n \log n)$ 时间计算 DFT 和 IDFT，配合 $O(n)$ 时间按位乘，在 $O(n \log n)$ 时间完成这个过程。

## 第四步：DFT 的两个性质

线性性（此处加法是按位加），比较容易得到：

$$
\mathsf{DFT}(A+B) = \mathsf{DFT}(A) + \mathsf{DFT}(B)
$$

还有一个没那么明显：从 $a$ 和 $b$ 构造两个交替为原序列元素和 $0$ 的序列：

$$
x = \langle a_0, 0, a_1, 0, \dots,a_{n-1},0 \rangle \\
y = \langle 0, b_0, 0, b_1, \dots,0, b_{n-1} \rangle \\
$$

则对 $x$，利用其中只有一半元素非零，以及单位根的性质可得：
$$
\begin{align}
X_k &= \sum_{p = 0}^{2n-1} x_p \omega_{2n}^{pk} \\
& = \sum_{p = 0}^{n-1} a_{p} \omega_{2n}^{2pk}
= \sum_{p = 0}^{n-1} a_{p} \omega_{n}^{pk} \\
& = A_{k \bmod n}
\end{align}
$$

类似的，对 $y$：

$$
\begin{align}
Y_k & = \sum_{p = 0}^{2n-1} y_p \omega_{2n}^{pk} \\
& = \sum_{p = 0}^{n-1} b_{p} \omega_{2n}^{(2p+1)k}
= \sum_{p = 0}^{n-1} b_{p} \omega_{n}^{pk} \omega_{2n}^{k} \\
& = \omega_{2n}^k B_{k \bmod n}
\end{align}
$$

（取模的原因是 $k$ 可能超过 $n-1$，但是 DFT 原式代入 $k$ 和 $k + n$ 是一样的）

## 第五步：FFT

取上面的 $x + y$ 得：

$$
z = x+y=\langle a_0, b_0, a_1, b_1, \dots , a_{n-1}, b_{n-1} \rangle
$$

利用线性性有：

$$
Z_k = X_k + Y_k = A_{k \bmod n} + \omega_{2n}^k B_{k \bmod n}
$$

也就是说，我们可以将 $2n$ 长度的 $z$ 的 DFT 拆成两个长度为 $n$ 的 $a$ 和 $b$ 的 DFT，和一个 $O(n)$ 的合并过程（是奇偶拆，不是中间分开）。不断递归进行这个过程（单元素序列的 DFT 是其自身），可以在 $O(n \log n)$ 时间完成一个长度为 $n$ 的 DFT，这里 $n$ 需要是 $2$ 的幂。

这个方法叫做 FFT。

## 第六步：二进制重排

考虑分治的“分”过程，我们首先将偶数位置和奇数位置分开，然后各自再拆偶数位和奇数位，依此类推。在二进制中，就是先按最低位 `0` `1` 排序，然后两半分别按照次低位排序，依此类推，也就是按照二进制反转排序（如 `000 100 010 ... 001 101 ...`）

如对于 $n = 8$ 按照分治的顺序排好是：

$$
\langle 0, 4, 2, 6, 1, 5, 3, 7 \rangle
$$

然后迭代合并：

$$
\begin{align}
& \langle 0, 4, 2, 6, 1, 5, 3, 7 \rangle \\
\to\ & \langle 04, 26, 15, 37 \rangle \\
\to\ & \langle 0246, 1357 \rangle \\
\to\ & \langle 01234567 \rangle
\end{align}
$$

这样我们可以使用两个数组来保存本次迭代和上次迭代的结果，每次一对一对合并，使用 $O(n)$ 的内存空间完成 FFT（直接递归需要 $O(n \log n)$），而且一般更快。

完工撒花！

## 注

- 在不同的实现中 DFT 的参数可能不同，如 `numpy.fft.fft` 的实现中，单位根上的的幂次是我们这里所用的取负，$pk$ 变为 $-pk$（或者说单位根取共轭），`ifft` 相反。

- 类似的方法可以构造拆成大于 $2$ 份的 FFT，在此略去。

本文使用 [Pandoc](https://pandoc.org/) 从 [Markdown 原始文件生成](fft.md)，参数为：

```console
$ pandoc --mathjax -f markdown-auto_identifiers -t html < fft.md > index.html
```

```{=html}
</body>
</html>
```
