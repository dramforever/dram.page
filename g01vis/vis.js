function parse(s) {
    var ar = s.split('\n');
    ar.shift();
    var ms = [];
    for (var i = 0; i < ar.length; i++) {
        var xs = ar[i].split(' ');
        if (xs.length == 4) {
            if (xs[0] == '0')
                ms.push([[parseFloat(xs[3]), parseFloat(xs[1])], [parseFloat(xs[3]), parseFloat(xs[2])]]);
            else if (xs[0] == '1')
                ms.push([[parseFloat(xs[1]), parseFloat(xs[3])], [parseFloat(xs[2]), parseFloat(xs[3])]]);
        }
    }
    return ms;
}

var canvas = document.getElementById('can');
var ctx = canvas.getContext('2d');
var inp = document.getElementById('code');

var offsetX = 0, offsetY = 900;

function visualize() {
    ctx.clearRect(0, 0, 1500, 900);
    var res = parse(inp.value);
    ctx.strokeWidth = 4;
    for (var i = 0; i < res.length; i++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + res[i][0][0], offsetY - res[i][0][1]);
        ctx.lineTo(offsetX + res[i][1][0], offsetY - res[i][1][1]);
        ctx.stroke();
        ctx.closePath();
    }
}

var tracking = false;

canvas.onclick = function () {
    if (tracking)
        document.exitPointerLock();
    else
        canvas.requestPointerLock();
};


document.addEventListener('pointerlockchange', function () {
    tracking = (document.pointerLockElement === canvas);
}, false);

canvas.onmousemove = function (event) {
    if (tracking) {
        offsetX += event.movementX;
        offsetY += event.movementY;
        visualize();
    }
};

inp.onchange = visualize;

visualize();