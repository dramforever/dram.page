// Functions for bisecting based on std::equal_range
// and the like in the GNU ISO C++ Library

function lower_bound(arr, fm, val, l = 0, r = arr.length) {
    while (r - l > 0) {
        const mid = l + ((r - l) >>> 1);
        if (fm[arr[mid]] < val) l = mid + 1;
        else r = mid;
    }
    return l;
}

function upper_bound(arr, fm, val, l = 0, r = arr.length) {
    while (r - l > 0) {
        const mid = l + ((r - l) >>> 1);
        if (fm[arr[mid]] <= val) l = mid + 1;
        else r = mid;
    }
    return l;
}

function equal_range(arr, fm, val, l = 0, r = arr.length) {
    while (fm[arr[l]] < val || fm[arr[r - 1]] > val) {
        const mid = l + ((r - l) >>> 1);
        if (fm[arr[mid]] < val)
            l = mid + 1;
        else if (fm[arr[mid]] > val)
            r = mid;
        else
            return [
                lower_bound(arr, fm, val, l, mid),
                upper_bound(arr, fm, val, mid + 1, r)
            ];
    }
    return [l, r];
}

function game(code) {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    Object.assign(canvas, {
        width: 1600,
        height: 1000
    });

    Object.assign(canvas.style, {
        width: '160vh',
        height: '100vh',
        borderStyle: 'solid',
        borderColor: 'black',
        borderWidth: '0px 1px',
        margin: '0px -1px',
        left: 'calc(50vw - 80vh)',
        position: 'absolute'
    });

    function parse(s) {
        const ar = s.split('\n');
        ar.shift();
        let nvlines = 0, nhlines = 0;

        for (var i = 0; i != ar.length; i++) {
            var xs = ar[i].split(' ');
            if (xs.length == 4) {
                if (xs[0] == '0')
                    nvlines ++;
                else if (xs[0] == '1')
                    nhlines ++;
            }
        }

        const nl = nvlines + nhlines;
        const x1 = new Int32Array(nl), y1 = new Int32Array(nl), x2 = new Int32Array(nl), y2 = new Int32Array(nl);
        const hlines = new Int32Array(nhlines), vlines = new Int32Array(nvlines);

        let vix = 0, hix = 0, ix = 0;

        for (var i = 0; i != ar.length; i++) {
            var xs = ar[i].split(' ');
            if (xs.length == 4) {
                if (xs[0] == '0') {
                    x1[ix] = + xs[3];
                    x2[ix] = + xs[3];
                    if (- xs[1] < - xs[2]) {
                        y1[ix] = - xs[1];
                        y2[ix] = - xs[2];
                    } else {
                        y1[ix] = - xs[2];
                        y2[ix] = - xs[1];
                    }
                    vlines[vix ++] = ix ++;
                } else if (xs[0] == '1') {
                    y1[ix] = - xs[3];
                    y2[ix] = - xs[3];
                    if (+ xs[1] < + xs[2]) {
                        x1[ix] = + xs[1];
                        x2[ix] = + xs[2];
                    } else {
                        x1[ix] = + xs[2];
                        x2[ix] = + xs[1];
                    }
                    hlines[hix ++] = ix ++;
                }
            }
        }

        hlines.sort((i, j) => y1[i] - y1[j]);
        vlines.sort((i, j) => x1[i] - x1[j]);

        return {
            x1, y1, x2, y2,
            hlines, vlines
        };
    }

    const lines = parse(code);

    let scale = 1;
    
    window.onwheel = (event) => {
        const sc = Math.pow(1.001, event.deltaY);

        if (0.1 < scale * sc && scale * sc < 10)
            scale *= sc;
    }

    const key = { jump: false, left: false, right: false };
    let lastkey = 'left';

    const keytable = {
        'w': 'jump',
        ' ': 'jump',
        'ArrowUp': 'jump',

        'a': 'left',
        'ArrowLeft': 'left',

        'd': 'right',
        'ArrowRight': 'right'
    };

    window.onkeydown = (event) => {
        if (event.key in keytable)
            key[keytable[event.key]] = true;
        lastkey = event.key;
    }

    window.onkeyup = (event) => {
        if (event.key in keytable)
            key[keytable[event.key]] = false;
    }

    window.onblur = () => {
        move = 0;
        key.left = false;
        key.right = false;
        key.jump = false;
    }

    function physics(origobj) {
        const nobj = Object.assign({}, origobj);

        const eps = 1e-2;

        if (nobj.riding != -1) {
            const x1 = lines.x1[nobj.riding], x2 = lines.x2[nobj.riding];
            if (nobj.x + nobj.width <= x1 || x2 <= nobj.x)
                nobj.riding = -1;
        }


        function line_bump(lid) {
            const x1 = lines.x1[lid];
            const y1 = lines.y1[lid];
            const x2 = lines.x2[lid];
            const y2 = lines.y2[lid];

            if (
                x1 < nobj.x + nobj.width
                && x2 > nobj.x
                && y1 < nobj.y + nobj.height
                && y2 > nobj.y) {
                if (y1 > origobj.y + nobj.height - eps) {
                    nobj.riding = lid;
                    nobj.vy = 0;
                    nobj.y = y1 - nobj.height;
                } else if (y2 < origobj.y + eps) {
                    nobj.vy = 0;
                    nobj.y = y2;
                } else {
                    nobj.vx = 0;
                    if (x2 < nobj.x + nobj.width/2)
                        nobj.x = x2;
                    else
                        nobj.x = x1 - nobj.width;
                }
            }
        }

        // Movement

        nobj.x = origobj.x + nobj.vx;

        if (nobj.riding == -1)
            nobj.y = origobj.y + nobj.vy;

        const hl_l = lower_bound(lines.hlines, lines.y1, nobj.y);
        const hl_r = lower_bound(lines.hlines, lines.y1, nobj.y + nobj.height);

        const vl_l = lower_bound(lines.vlines, lines.x1, nobj.x);
        const vl_r = upper_bound(lines.vlines, lines.x1, nobj.x + nobj.width);

        for (let i = vl_r - 1; i != vl_l - 1; i --) line_bump(lines.vlines[i], false);

        for (let i = hl_r - 1; i != hl_l - 1; i --) line_bump(lines.hlines[i], false);

        Object.assign(origobj, nobj);
    }

    const rect = {
        riding: -1,
        width: 30,
        height: 45,
        x: 1800,
        y: -800,
        vx: 0,
        vy: 0
    };

    function frame() {
        if (key.left && ! key.right) {
            rect.vx = -2;
        } else if (! key.left && key.right) {
            rect.vx = 2;
        } else if (key.left && key.right) {
            if (lastkey == 'left') rect.vx = -2;
            else rect.vx = 2;
        } else {
            rect.vx = 0;
        }

        if (rect.riding === -1) {
            if (key.jump) rect.vy = -2;
            rect.vy += 0.15;
            if (rect.vy < -2) rect.vy = -2;
        } else {
            if (key.jump) {
                rect.riding = -1;
                rect.vy = -2;
            }
        }

        for (let _ = 0; _ != 4; _ ++) physics(rect);

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, 1600, 1000);
        ctx.translate(800, 500);
        ctx.scale(1 / scale, 1 / scale);
        ctx.translate(- rect.x - rect.width / 2, - rect.y - rect.height / 2);
        // ctx.transform(1 / scale, 0, 0, 1 / scale, - canvasx, - canvasy);

        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';

        for (let i = 0; i != lines.x1.length; i ++) {
            ctx.beginPath();
            ctx.moveTo(lines.x1[i], lines.y1[i]);
            ctx.lineTo(lines.x2[i], lines.y2[i]);
            ctx.stroke();
        }

        ctx.fillStyle = '#777';
        ctx.strokeStyle = '#777';

        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

        requestAnimationFrame(frame);
    }
    frame();
};

{
    const code = `小怪兽

10 4 25
6 11 250

3 1200 1065

4 3450 1000
4 1300 100
5 500
4 2300 100
5 500
4 1500 1055
4 1550 1055
4 1600 1055
4 1650 1055
4 1700 1055
4 1750 1055
4 1800 1055
4 1850 1055
4 1900 1055
4 1950 1055
4 2000 1055
4 2050 1055
4 2100 1055
4 2150 1055
4 2200 1055
4 2250 1055
4 2300 1055
4 2350 1055
4 2400 1055
4 2450 1055
4 2500 1055

-1 大怪兽
1 0 1000 0
0 75 1000 900
1 900 920 800
1 650 800 750
0 1400 1160 900
1 600 900 1400
1 250 600 1350
0 1250 1000 200
-1 嘴
1 820 870 1010
0 1010 1150 820
-1 眼睛
1 570 650 1250
1 570 600 1240
0 1240 1250 600
-1 耳朵
1 280 340 1170
0 1170 1110 280
1 280 340 1110
-1 角
1 270 310 1500
0 1350 1500 270
0 1350 1500 310
-1 头发
1 600 900 1415
1 600 750 1430
-1 辫子
0 330 1100 100
0 250 1200 80
0 250 1230 60
0 270 1220 40
0 280 1200 20
0 200 1150 0
0 250 1000 -20
0 200 840 -40
0 200 780 -60
0 200 750 -80
0 100 710 -100
0 100 650 -120
0 100 550 -140
0 -50 350 -160

-1 小怪兽
1 1200 2000 100
1 1200 1170 110
0 100 180 1200
1 1200 1350 180
1 1350 1500 250
1 1500 2000 300
0 100 300 2000
1 1470 1526 200
1 1470 1491 193
0 193 200 1491
1 1640 1670 250
1 1640 1670 220
0 220 250 1670
1 1520 1550 350
0 300 350 1520
0 300 350 1550
1 2000 2020 120
1 2000 2020 150
0 120 150 2020

-1 小怪兽
1 2200 3000 100
1 2200 2170 110
0 100 180 2200
1 2200 2350 180
1 2350 2500 250
1 2500 3000 300
0 100 300 3000
1 2470 2526 200
1 2470 2491 193
0 193 200 2491
1 2640 2670 250
1 2640 2670 220
0 220 250 2670
1 2520 2550 350
0 300 350 2520
0 300 350 2550
1 3000 3020 120
1 3000 3020 150
0 120 150 3020

-1 QAQ
1 1075 2650 1055
1 1075 2650 1045
1 1100 1300 1065
1 1100 1300 1035
1 3325 3575 300
1 3100 3200 450
1 2900 3000 600
1 2750 2825 750
1 2650 2700 900
-1 2600 2650 1050
1 2650 2700 1200
1 2725 2800 1350
1 2875 3075 1500
1 3150 3225 1400
1 3275 3325 1300
1 3350 3400 1200
1 3400 3425 1100
1 3440 3460 1000
1 3800 3700 450
1 4000 3900 600
1 4150 4075 750
1 4250 4200 900
1 4300 4250 1050
1 4250 4200 1200
1 4175 4100 1350
1 4025 3825 1500
1 3750 3675 1400
1 3625 3575 1300
1 3550 3500 1200
1 3500 3475 1100`;
    game(code);
}
