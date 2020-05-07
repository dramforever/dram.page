"use strict";
/* @jsx K.kagomeElement */
/// <reference path="../../kagome/kagome.d.ts" />
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var K = Kagome;
var Input = function (_a) {
    var valueR = _a.valueR, rest = __rest(_a, ["valueR"]);
    return K.process(function (run) {
        var inp = run(function () { return K.kagomeElement("input", __assign({}, rest)); });
        run(function () { return K.domEvent(inp, 'input')(function () { return valueR.setDirectly(inp.value); }); });
        return inp;
    });
};
var Interact = function () { return K.process(function (run) {
    var container = run(function () { return K.kagomeElement("div", null); });
    var _loop_1 = function (i) {
        var id = run(function () {
            return K.pureS("inp-" + Math.random() * Math.pow(2, 52));
        });
        var classR = run(function () { return K.reg(undefined); });
        var valueR = run(function () { return K.reg(''); });
        var hidePromptR = run(function () { return K.reg(false); });
        var hideInputR = run(function () { return K.reg(false); });
        var extraMessageR = run(function () { return K.reg(''); });
        var part = run(function () {
            return K.kagomeElement("div", null,
                K.kagomeElement("label", { for: id },
                    "Please type ",
                    i,
                    ": "),
                K.kagomeElement(Input, { id: id, class: classR, valueR: valueR, hidden: hideInputR }),
                K.kagomeElement("p", { class: "prompt", hidden: hidePromptR },
                    valueR,
                    " isn't right"),
                K.kagomeElement("p", { class: "prompt", hidden: hidePromptR }, extraMessageR));
        });
        run(function () { return K.appendChildD(container, part); });
        var value = run(function () { return valueR; });
        if (value !== i.toString()) {
            run(function () { return classR.setD('wrong'); });
            if (value === undefined || value === '') {
                // Input is empty
                run(function () { return hidePromptR.setD(true); });
            }
            if (value.length - i.toString().length > 10) {
                run(function () { return hideInputR.setD(true); });
                run(function () { return extraMessageR.setD('Forget about it'); });
            }
            return "break";
        }
        else {
            run(function () { return hidePromptR.setD(true); });
            run(function () { return classR.setD('ok'); });
        }
    };
    for (var i = 0;; i++) {
        var state_1 = _loop_1(i);
        if (state_1 === "break")
            break;
    }
    return container;
}); };
K.toplevel(function (run) {
    var app = run(function () {
        return K.kagomeElement("div", { class: "main" },
            K.kagomeElement(Interact, null),
            K.mapped([Interact(), K.kagomeElement(Interact, null)]));
    });
    run(function () { return K.appendChildD(document.body, app); });
});
//# sourceMappingURL=demo.js.map