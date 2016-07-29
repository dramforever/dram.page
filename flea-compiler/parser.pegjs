Program = r:(Line *) _ { return r; }

Line
    = _"out" _"(" name:Ident _")"  { return ["out", name]; }
    / name:Ident _'=' expr:Expr0 { return ["set", name, expr]; }

Expr0
    = head:Expr1 tail:((_"?"/_"^") Expr1)* {
        var h = head;
        for (var i = 0; i < tail.length; i ++)
            h = [tail[i][0][1], h, tail[i][1]];
        return h;
    }

Expr1
    = head:Expr2 tail:(_"+" Expr2)* {
        var h = head;
        for (var i = 0; i < tail.length; i ++)
            h = ["+", h, tail[i][2]];
        return h;
    }

Expr2
    = head:Expr3 tail:(_"*" Expr3)* {
        var h = head;
        for (var i = 0; i < tail.length; i ++)
            h = ["*", h, tail[i][2]];
       return h;
    }

Expr3
    = head:Expr4 tail:((_"<<"/_">>") Expr4)* {
        var h = head;
        for (var i = 0; i < tail.length; i ++)
            h = [tail[i][0][1], h, tail[i][1]];
       return h;
    }

Expr4
    = x:Expr5 { return x; }
    / _"-" x:Expr5 { return ["neg", x]; }

Expr5
    = _"(" x:Expr0 _")" { return x; }
    / _"s" _"(" x:Expr0 _")" { return ["sigmoid", x]; }
    / _"in" _"(" x:Integer _")" { return ["in", x]; }
    / x:Ident { return ["ref", x]; }
    / x:Number { return ["const", x];}

Number "number"
    = _ digits:$([0-9.]+) { return digits; }

Integer "integer"
    = _ digits:$([0-9]+) { return parseInt(digits); }

Ident "identifier"
    = _ id:$([a-zA-Z] [a-zA-Z0-9_]*) {
        return id;
    }

_ "whitespace"
    = ("{" [^}]* "}" / [ \t\n\r] )*

// vim: sw=4 ts=4 et
