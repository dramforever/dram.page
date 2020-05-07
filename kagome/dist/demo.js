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
K.debugConfig.debugProcessRun = true;
var Input = function (_a) {
    var valueR = _a.valueR, rest = __rest(_a, ["valueR"]);
    return K.process(function (run) {
        var inp = run(function () { return K.kagomeElement("input", __assign({}, rest)); });
        run(function () { return K.domEvent(inp, 'input')(function () { return valueR.setDirectly(inp.value); }); });
        return inp;
    });
};
var Interact = function (_a) {
    var id = _a.id, blocks = _a.blocks;
    return K.process(function (run) {
        var removeSelf = function () {
            var at = blocks.value.findIndex(function (id1) { return id == id1; });
            if (at !== -1)
                blocks.splice(at, 1);
        };
        var container = run(function () {
            return K.kagomeElement("div", null,
                K.kagomeElement("button", { onclick: removeSelf },
                    "Remove ",
                    id));
        });
        var _loop_1 = function (i) {
            var id_1 = run(function () {
                return K.pureS("inp-" + Math.random() * Math.pow(2, 52));
            });
            var classR = run(function () { return K.reg(undefined); });
            var valueR = run(function () { return K.reg(''); });
            var hidePromptR = run(function () { return K.reg(false); });
            var hideInputR = run(function () { return K.reg(false); });
            var extraMessageR = run(function () { return K.reg(''); });
            var part = run(function () {
                return K.kagomeElement("div", null,
                    K.kagomeElement("label", { for: id_1 },
                        "Please type ",
                        i,
                        ": "),
                    K.kagomeElement(Input, { id: id_1, class: classR, valueR: valueR, hidden: hideInputR }),
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
    });
};
K.toplevel(function (run) {
    var blocks = run(function () { return K.array(); });
    var blocksView = run(function () { return blocks.sfa(function (id) {
        return K.kagomeElement(Interact, { id: id, blocks: blocks });
    }); });
    var counter = run(function () { return K.pureS({ value: 0 }); });
    var addBlock = function () {
        var id = counter.value++;
        blocks.push(id);
    };
    var app = run(function () {
        return K.kagomeElement("div", { class: "main" },
            K.kagomeElement("div", null,
                K.kagomeElement("button", { onclick: addBlock }, "Add a block")),
            blocksView);
    });
    run(function () { return K.appendChildD(document.body, app); });
});
//# sourceMappingURL=demo.js.map