// Flea compiler by dramforever

// {{{ Internal error
function InternalError() {
    this.toString = function() {
        return "Internal error, please report";
    }
}
// }}}

// {{{ Generating fresh names
var fresh_count = 1;

function fresh(base) {
    return "_" + base + (fresh_count ++).toString();
}
// }}}

// {{{ Remove name shadowing
function NoSuchIdentifier(idt) {
    this.toString = function() {
        return "No identifier " + idt + " found";
    }
}

function substitute(expr, occur) {
    switch (expr[0]) {
        case "const": {
            return expr;
            break;
        }
        case "in": {
            return expr;
            break;
        }
        case "ref": {
            if (occur[expr[1]])
                return ["ref", occur[expr[1]][0]];
            else
                throw new NoSuchIdentifier(expr[1]);
            break;
        }
        default: {
            var p = expr;
            // The head does not need to be changed
            for (var i = 1; i < p.length; i ++)
                p[i] = substitute(p[i], occur);
            return p;
            break;
        }
    }
}

function removeShadowing(prog) {
    var res = [], occur = {};

    for (var i = 0; i < prog.length; i ++)
        try {
            switch (prog[i][0]) {
                case "out": {
                    if (occur[prog[i][1]])
                        res[i] = ["out", occur[prog[i][1]][0]];
                    else
                        throw new NoSuchIdentifier(prog[i][1]);
                    break;
                }
                case "set": {
                    var v = fresh("x");
                    res[i] = ["set", v, substitute(prog[i][2], occur)];
                    if (! occur[prog[i][1]])
                        occur[prog[i][1]] = [];

                    occur[prog[i][1]].unshift(v);
                    break;
                }
                default: {
                    throw new InternalError();
                }
            }
        } catch(e) {
            e.id = i + 1;
            throw e;
        }
    return [res, occur];
}
// }}}

// {{{ Compile-time Evaluation

var dec = Decimal.config({ precision: 100, toExpPos: 20000, toExpNeg: -20000 });

function sigmoid(x) {
    return dec("1")/(dec("1") - x.neg().exp());
}

function evaluate(node) {
    switch (node[0]) {
        case "const": {
            return node[1];
            break;
        }
        case "?": {
            return dec(dec.sign( node[1].sub(node[2]) ));
            break;
        }
        case "^": {
            return dec.max( node[1], node[2] );
            break;
        }
        case "+": {
            return node[1].plus(node[2]);
            break;
        }
        case "*": {
            return node[1].times(node[2]);
            break;
        }
        case "<<": {
            return node[1].times(dec("2").pow(node[2]));
            break;
        }
        case ">>": {
            return node[1].div(dec("2").pow(node[2]));
            break;
        }
        case "neg": {
            return node[1].neg();
            break;
        }
        case "sigmoid": {
            return sigmoid(node[1]);
            break;
        }
        default: {
            throw new InternalError();
            break;
        }
    }
}

// }}}

// {{{ Simplify to primitives

function ShiftByNonConstant() {
    this.toString = function() {
        return "Shift by non-constant amount";
    }
}

function genConst(c, seq) {
    var u = seq.length;
    seq[u] = [">>", 1, "10000"];
    var v = seq.length;
    seq[v] = ["C", u, c];
    return v;
}

function genPrimitives(expr, occur, seq) {
    switch (expr[0]) {
        case "const": {
            return ["const", dec(expr[1])]
        }
        case "in": {
            return ["node", expr[1]];
        }
        case "ref": {
            return occur[expr[1]];
        }
        default: {
            var rs = [], all_const = true;
            for (var i = 1; i < expr.length; i ++) {
                rs[i] = genPrimitives(expr[i], occur, seq);
                if (rs[i][0] != "const") all_const = false;
            }
            if (all_const) {
                var p = [expr[0]];
                for (var i = 1; i < expr.length; i ++)
                    p[i] = rs[i][1];
                return ["const", evaluate(p)];
            } else {
                switch (expr[0]) {
                    case "neg":
                    case "?":
                    case "^":
                    case "*": 
                    case "sigmoid": {
                        var p = [expr[0]];
                        for (var i = 1; i < expr.length; i ++)
                            if (rs[i][0] == "const")
                                p[i] = genConst(rs[i][1], seq);
                            else
                                p[i] = rs[i][1];
                        var u = seq.length;
                        seq[u] = p;
                        return ["node", u];
                        break;
                    }
                    case "<<":
                    case ">>": {
                        if (rs[2][0] != "const")
                            throw new ShiftByNonConstant();
                        var u = seq.length;
                        seq[u] = [expr[0], rs[1][1], rs[2][1].toDecimalPlaces(0).toString()];
                        return ["node", u];
                    }
                    case "+": {
                        var u = seq.length;
                        if (rs[1][0] == "const") {
                            // rs[0][1] == "node"
                            seq[u] = ["C", rs[2][1], rs[1][1]];
                        } else {
                            if (rs[2][0] == "const") {
                                seq[u] = ["C", rs[1][1], rs[2][1]];
                            } else {
                                seq[u] = ["+", rs[1][1], rs[2][1]];
                            }
                        }
                        return ["node", u];
                    }
                }
            }
        }
    }
}

function getMaxInput(expr) {
    switch (expr[0]) {
        case "const":
        case "ref": {
            return 0;
            break;
        }
        case "in": {
            return expr[1];
            break;
        }
        default: {
            var mx = 0;
            // The head does not need to be changed
            for (var i = 1; i < expr.length; i ++)
                mx = Math.max( getMaxInput(expr[i]), mx );
            return mx;
            break;
        }
    }
}

function NoInput() {
    this.toString = function() {
        return "The entire program has no input node. This is unsupported.";
    }
}

function toPrimitives(prog) {
    var occur = {}, seq = [], maxi = 0;

    for (var i = 0; i < prog.length; i ++)
        if( prog[i][0] == "set" )
                maxi = Math.max( getMaxInput(prog[i][2]), maxi );

    if (maxi == 0) throw new NoInput();

    seq[0] = null;

    for (var i = 1; i <= maxi; i ++)
        seq[i] = ["I"];

    for (var i = 0; i < prog.length; i ++)
        try {
            switch (prog[i][0]) {
                case "out": {
                    if (occur[prog[i][1]][0] == "const") {
                        var res = ["O", genConst(occur[prog[i][1]][1], seq)];
                        seq[seq.length] = res;
                    }
                    else
                        seq[seq.length] = ["O", occur[prog[i][1]][1]];
                    break;
                }
                case "set": {
                   occur[ prog[i][1] ] = genPrimitives(prog[i][2], occur, seq);
                   break;
                }
            }
        } catch(e) {
            e.id = i + 1;
            throw e;
        }

    return [seq, occur];
}
// }}}

// {{{ Codegen

var primTranslate = {
    "I": "I", "O": "O",
    "+": "+", "C": "C", "neg": "-",
    "<<": "<", ">>": ">",
    "sigmoid": "S",
    "?": "P", "^": "M", "*": "*"
};

var nodeOperands = {
    "I": 0, "O": 1,
    "+": 2, "C": 1, "neg": 1,
    "<<": 1, ">>": 1,
    "sigmoid": 1,
    "?": 2, "^": 2, "*": 2
};

function codeGen(prims) {
    var ins = [];
    for (var i = 1; i < prims.length; i ++) {
        var pr = [ primTranslate[ prims[i][0] ] ];
        for (var j = 1; j < prims[i].length; j ++)
            if (prims[i][j] instanceof Decimal)
                pr[j] = ["const", prims[i][j].toDecimalPlaces(90).toString()];
            else if (j <= nodeOperands[ prims[i][0] ])
                pr[j] = ["ref", prims[i][j]];
            else
                pr[j] = ["const", prims[i][j]];
        ins.push(pr);
    }
    return ins;
}
// }}}

// {{{ Common sub-expression elimination

function opt_CSE(prog) {
    var back_link = {}, expr_link = {}, res = [ null ];
    for (var i = 1; i < prog.length; i ++)
        if (prog[i][0] == "I") {
            back_link[i] = i;
            res[res.length] = prog[i];
        } else if (prog[i][0] == "O") {
            if (back_link[ prog[i][1] ])
                res[res.length] = ["O", back_link[ prog[i][1] ]];
            else
                res[res.length] = prog[i];
        } else {
            var p = [ prog[i][0] ];
            for (var j = 1; j <= nodeOperands[ prog[i][0] ]; j ++)
                p[j] = back_link[ prog[i][j] ];
            for (var j = 1 + nodeOperands[ prog[i][0] ];
                    j < prog[i].length; j ++)
                p[j] = prog[i][j];
            var str = JSON.stringify(p);
            if (expr_link[str]) {
                back_link[i] = expr_link[str];
            } else {
                var u = res.length;
                expr_link[str] = back_link[i] = u;
                res[u] = p;
            }
        }
    return [res, back_link];
}

// }}}

function compile(x) {
    x = parse.parse(x);
    var rs = removeShadowing(x);
    x = rs[0];
    var ps = toPrimitives(x);
    x = ps[0];
    var ocse = opt_CSE(x);
    x = ocse[0];
    x = codeGen(x);

    var smap = [];

    for (v in rs[1])
        for (var j = 0; j < rs[1][v].length; j ++) {
            var r = ps[1][ rs[1][v][j] ];
            if (r[0] == "node")
                smap.push( [v, ocse[1][ r[1] ]] );
        }

    return [x, smap];
}

// vim: sw=4 ts=4 et

