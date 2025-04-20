---
title: "Slide rules approximating Vernier scales"
date: 2025-04-19
---

[Slide rules] are amazing. Even though nowadays we carry around in our pockets a computer with power unfathomed in the last century, I still think slide rules are a wonderful way to manipulate proportions in the analog domain. In fact, I regularly carry one in my daily bag.

[Slide rules]: https://en.wikipedia.org/wiki/Slide_rule

One problem with the slide rule I carry daily (a Faber-Castelle 62/82) is that it's rather small, about half a foot (around 15 centimeters) in length. (Presumably, the "6" in its name refers to its length of 6 inches.) This means there are fewer markings on it, and the precision of the numbers read from it is limited. I can only, for the most part, get 2 significant digits out of it.

Today I learned about a trick published over 60 years ago that allows me to pretty consistently get to 3 significant digits on the same hardware, at the cost of some more manipulations. To me, it felt like a software upgrade to my slide rule. How does it work? Let's find out.

## The method

Here's a simplified representation of the two conventional scales C and D. The top scale here is C, and the bottom is D. They both go from 1 to 10, and the horizontal lengths are proportional to the logarithm of the numeric values.

For convenience, we'll refer to the two scales as "top scale" and "bottom scale".

```{=html}
<svg
    version="1.1"
    viewBox="-10 -2 360 48"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg">
    <use xlink:href="#slideup" x="0" y="22" />
    <use xlink:href="#slidedown" x="20" y="22" />
</svg>
```

Let's say we want to read the position of the hairline on the bottom scale, shown here as a long red line:

```{=html}
<svg
    version="1.1"
    viewBox="140 20 90 26"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg">
    <use xlink:href="#slidedown" x="14.17099" y="22" />
</svg>
```

We can see that it's between `3.7` and `3.8`, but it would be difficult to ascertain the next digit.

Step 1: Line up 10 on the top scale with 9 on the bottom scale:

```{=html}
<svg
    version="1.1"
    viewBox="200 -2 160 48"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg">
    <use xlink:href="#slideup" x="0" y="22" />
    <use xlink:href="#slidedown" x="14.17099" y="22" />
    <rect
        style="fill: #0000ff22; stroke: blue; stroke-width: 0.5"
        width="6"
        height="38"
        x="306.6977"
        y="3" />
</svg>
```

Step 2: Go back to the hairline, and find a nearby marking on the top scale that is close to the hairline:

```{=html}
<svg
    version="1.1"
    viewBox="160 -2 200 48"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg">
    <use xlink:href="#slideup" x="0" y="22" />
    <use xlink:href="#slidedown" x="14.17099" y="22" />
    <rect
        style="fill: #0000ff22; stroke: blue; stroke-width: 0.5"
        width="3"
        height="10"
        x="188.27775"
        y="13" />
</svg>
```

Step 2: Move the top scale so that the found marking lines up with the hairline:

```{=html}
<svg
    version="1.1"
    viewBox="160 -2 200 48"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg">
    <use xlink:href="#slideup" x="1.45015" y="22" />
    <use xlink:href="#slidedown" x="14.17099" y="22" />
    <rect
        style="fill: #0000ff22; stroke: blue; stroke-width: 0.5"
        width="3"
        height="10"
        x="189.72790028083742"
        y="13" />
</svg>
```

Let's zoom in on the hairline:

```{=html}
<svg
    version="1.1"
    viewBox="160 -2 120 48"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg">
    <use xlink:href="#slideup" x="1.45015" y="22" />
    <use xlink:href="#slidedown" x="14.17099" y="22" />
    <rect
        style="fill: #0000ff22; stroke: blue; stroke-width: 0.5"
        width="3"
        height="10"
        x="189.72790028083742"
        y="13" />
</svg>
```

Step 3: Starting at the hairline position, going in the positive direction.

- On the bottom scale, count markings after the hairline, starting at 1.
- On the top scale, count markings starting at the one at the hairline as 0.

Find the pair of markings that line up best and note the number. Here, marking number 3 lines up best, as marked by the blue circle.

```{=html}
<svg
    version="1.1"
    viewBox="175 4 65 30"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg">
    <use xlink:href="#slideup" x="1.45015" y="22" />
    <use xlink:href="#slidedown" x="14.17099" y="22" />

    <rect style="
        x: 188.778; y: calc(15px - 0.2lh);
        width: calc(32.3551px + 0.4ch);
        height: calc(0.2lh + 1px);
        fill: #ffffffaa" />

    <rect style="
        x: 191.929; y: calc(31px - 0.2lh);
        width: calc(30.5895px + 0.4ch);
        height: calc(0.2lh + 1px);
        fill: #ffffffaa" />

    <g style="font-size: 20%; fill: blue" transform="translate(0.5, 15)">
        <text x="189.778" y="0">0</text>
        <text x="193.019" y="0">1</text>
        <text x="196.184" y="0">2</text>
        <text x="199.276" y="0">3</text>
        <text x="202.298" y="0">4</text>
        <text x="205.255" y="0">5</text>
        <text x="208.147" y="0">6</text>
        <text x="210.979" y="0">7</text>
        <text x="213.752" y="0">8</text>
        <text x="216.469" y="0">9</text>
        <text x="219.133" y="0">10</text>
    </g>
    <g style="font-size: 20%; fill: blue" transform="translate(-0.8, 31)">
        <text x="193.729" y="0">1</text>
        <text x="197.222" y="0">2</text>
        <text x="200.628" y="0">3</text>
        <text x="203.949" y="0">4</text>
        <text x="207.19" y="0">5</text>
        <text x="210.355" y="0">6</text>
        <text x="213.447" y="0">7</text>
        <text x="216.469" y="0">8</text>
        <text x="219.426" y="0">9</text>
        <text x="222.318" y="0">10</text>

    </g>

    <circle cx="200.68758" cy="22" r="1.7" stroke="none" fill="#ff00ff88"/>
</svg>
```

If you're having trouble telling which line matches up, note how on the left of the correct line, the bottom markings deviate left, and similarly on the right side the bottom markings deviate right.

(This is exactly how you read a Vernier scale, by the way.)

Step 4: Whatever the number is, the hairline is that many tenths of a division past the previous marking.

For example, since the number of the line matching up is 3, and the hairline is between `3.7` and `3.8`, we know the hairline is at <code>3.7 + 0.1 &times; (3/10) = 3.73</code>.

That is, in fact, exactly the value I used to generate the position of this hairline.

## How does this work?

Corresponding positions on the top and bottom scale preserve proportions. Therefore, when we line up 10 on the top scale with 9 on the bottom scale, the numbers on the top scale are `10/9` times the number on the bottom scale. This means that the distance between markings on the top scale must be `9/10` of the distance on the bottom scale. This turns our slide rule markings into a [Vernier scale], and can be read similarly.

[Vernier scale]: https://en.wikipedia.org/wiki/Vernier_scale

Of course, this makes a few approximating assumptions. Firstly, it assumes that the markings are locally linear. Secondly, it assumes that the adjusting step 2 does not affect distance proportions much. Therefore, the new significant digit provided by this method is an approximate value.

## More details on usage

This method also won't directly work if the two scales have different amount of increment per division. You may have to ignore some markings to make it work.

It also does not work directly with positions after 9. However, you can consider using a folded scale (CF and DF) to move the value closer to the middle of the slide rule. Some slide rules (such as my 62/82) have "overflow" areas before 1 and after 10 that may help.

You can also count backwards to the previous matching line, and extrapolate the answer, noting that 9 divisions on the bottom equals 10 divisions on the top. The original article even suggests trying other proportions.

## References

The method described in this article was originally published in: Roger Wickenden, 1948, Utilizing the Vernier Principle for Precise Readings of Slide Rule Settings, [doi:10.1119/1.1991139](https://doi.org/10.1119/1.1991139)

Images in this article are based on work by Wrtlprnft, itself based on original image made by Benjamin Crowell. See the original file at: <https://en.wikipedia.org/wiki/File:Slide_rule_example3.svg>

## License and source code

This article, including the images, are licensed under the Creative Commons Attribution-ShareAlike 4.0 International license. For more information on the license, see: <https://creativecommons.org/licenses/by-sa/4.0/deed.en>

The Markdown source to this page can be found at: <https://github.com/dramforever/dram.page/blob/master/p/slide-rule-vernier/index.md>

```{=html}
<svg
    version="1.1"
    viewBox="0 0 0 0"
    style="display: none"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg">
  <defs>
    <g id="scale">
      <rect
         style="fill:#f0e0d0;stroke:#000000;stroke-width:1"
         width="328"
         height="22"
         x="-9"
         y="0" />
      <path
         d="m 0,0 0,12 m 6.5622771,-12 0,6 m 6.2569419,-6 0,9 m 5.978762,-9 0,6 m 5.724268,-6 0,9 m 5.490559,-9 0,6 m 5.275186,-6 0,9 m 5.076074,-9 0,6 m 4.891448,-6 0,9 m 4.719782,-9 0,6 m 4.559759,-6 0,12 m 4.410231,-12 0,6 m 4.2702,-6 0,9 m 4.138788,-9 0,6 m 4.015224,-6 0,9 m 3.898823,-9 0,6 m 3.788983,-6 0,9 m 3.685162,-9 0,6 m 3.58688,-6 0,9 m 3.493703,-9 0,6 m 3.405245,-6 0,12 m 3.321156,-12 0,6 m 3.241121,-6 0,9 m 3.164847,-9 0,6 m 3.09209,-6 0,9 m 3.0226,-9 0,6 m 2.95617,-6 0,9 m 2.89258,-9 0,6 m 2.83169,-6 0,9 m 2.77329,-9 0,6 m 2.71726,-6 0,12 m 2.66346,-12 0,6 m 2.61173,-6 0,9 m 2.56198,-9 0,6 m 2.51409,-6 0,9 m 2.46796,-9 0,6 m 2.42349,-6 0,9 m 2.38059,-9 0,6 m 2.33919,-6 0,9 m 2.29921,-9 0,6 m 2.26055,-6 0,12 m 4.41023,-12 0,6 m 4.2702,-6 0,6 m 4.13879,-6 0,6 m 4.01523,-6 0,6 m 3.89882,-6 0,9 m 3.78898,-9 0,6 m 3.68516,-6 0,6 m 3.58688,-6 0,6 m 3.49371,-6 0,6 m 3.40524,-6 0,12 m 3.32116,-12 0,6 m 3.24112,-6 0,6 m 3.16485,-6 0,6 m 3.09209,-6 0,6 m 3.0226,-6 0,9 m 2.95616,-9 0,6 m 2.89259,-6 0,6 m 2.83168,-6 0,6 m 2.7733,-6 0,6 m 2.71726,-6 0,12 m 2.66345,-12 0,6 m 2.61174,-6 0,6 m 2.56198,-6 0,6 m 2.51409,-6 0,6 m 2.46796,-6 0,9 m 2.42349,-9 0,6 m 2.38059,-6 0,6 m 2.33919,-6 0,6 m 2.2992,-6 0,6 m 2.26056,-6 0,12 m 4.41023,-12 0,6 m 4.2702,-6 0,6 m 4.13879,-6 0,6 m 4.01522,-6 0,6 m 3.89883,-6 0,12 m 3.78898,-12 0,6 m 3.68516,-6 0,6 m 3.58688,-6 0,6 m 3.4937,-6 0,6 m 3.40525,-6 0,12 m 3.32115,-12 0,6 m 3.24112,-6 0,6 m 3.16486,-6 0,6 m 3.09209,-6 0,6 m 3.0226,-6 0,12 m 2.95616,-12 0,6 m 2.89258,-6 0,6 m 2.83169,-6 0,6 m 2.77329,-6 0,6 m 2.71727,-6 0,12"
         style="stroke: black; stroke-width: 1" />
    </g>
    <g id="numbers" font-size="9px">
      <text x="1.5" y="0">1</text>
      <text x="94.728302" y="0">2</text>
      <text x="149.263" y="0">3</text>
      <text x="187.957" y="0">4</text>
      <text x="217.96899" y="0">5</text>
      <text x="242.492" y="0">6</text>
      <text x="263.22501" y="0">7</text>
      <text x="281.185" y="0">8</text>
      <text x="297.02701" y="0">9</text>
      <text x="311.198" y="0">1</text>
    </g>
    <g id="slidedown">
      <use xlink:href="#scale" x="0" y="0" />
      <use xlink:href="#numbers" x="0" y="16" />
      <path
         d="m 177.05691028083743,-0.5 0,23"
         style="stroke: red; stroke-width: 0.5" />
    </g>
    <g id="slideup">
      <use xlink:href="#scale" x="0" y="0" transform="scale(1,-1)" />
      <use xlink:href="#numbers" x="0" y="-9" />
    </g>
  </defs>
</svg>
```
