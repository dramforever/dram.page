/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/webpack.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nclass ResourceTrace {\r\n    constructor(resource, next) {\r\n        this.resource = resource;\r\n        this.next = next;\r\n    }\r\n    dispose() {\r\n        const disposeList = [];\r\n        for (let current = this; current !== null; current = current.next)\r\n            disposeList.push(current);\r\n        disposeList.reverse();\r\n        for (const x of disposeList)\r\n            x.resource.dispose();\r\n    }\r\n}\r\nexports.ResourceTrace = ResourceTrace;\r\nclass Action {\r\n    constructor(run) {\r\n        this.run = run;\r\n    }\r\n    then(cont) {\r\n        return new Action(bcont => this.run(va => cont(va).run(bcont)));\r\n    }\r\n}\r\nexports.Action = Action;\r\nclass Behavior {\r\n    constructor(value) {\r\n        this.value = value;\r\n        this.willUpdate = false;\r\n        this.watchers = {};\r\n        this.subscriptions = {};\r\n        this.watcherNum = 0;\r\n        this.subscriptionNum = 0;\r\n    }\r\n    addWatcher(behavior, reason) {\r\n        this.watchers[this.watcherNum] = { behavior, reason };\r\n        return this.watcherNum++;\r\n    }\r\n    removeWatcher(id) {\r\n        delete this.watchers[id];\r\n    }\r\n    addSubscription(subscription) {\r\n        this.subscriptions[this.subscriptionNum] = subscription;\r\n        return this.subscriptionNum++;\r\n    }\r\n    removeSubscription(id) {\r\n        delete this.subscriptions[id];\r\n    }\r\n    needUpdate(tainted) {\r\n        this.willUpdate = true;\r\n        for (const i in this.watchers)\r\n            if (this.watchers.hasOwnProperty(i)) {\r\n                const { behavior, reason } = this.watchers[i];\r\n                behavior.notify(reason, tainted);\r\n            }\r\n        tainted.push(this);\r\n    }\r\n    notify(reason, tainted) {\r\n        if (!this.willUpdate)\r\n            if (this.checkUpdate(reason))\r\n                this.needUpdate(tainted);\r\n    }\r\n    initiateUpdate() {\r\n        let tainted = [];\r\n        this.needUpdate(tainted);\r\n        tainted.reverse();\r\n        for (const behavior of tainted)\r\n            if (behavior.willUpdate)\r\n                behavior.update();\r\n        let subscriptions = [];\r\n        for (const behavior of tainted)\r\n            for (const id in behavior.subscriptions)\r\n                subscriptions.push([behavior, behavior.subscriptions[id]]);\r\n        subscriptions.sort((s1, s2) => s1[1].timestamp - s2[1].timestamp);\r\n        for (const [behavior, subscription] of subscriptions)\r\n            subscription.callback(behavior.value);\r\n    }\r\n    update() {\r\n        this.doUpdate();\r\n        this.willUpdate = false;\r\n    }\r\n}\r\nexports.Behavior = Behavior;\r\nclass RegisterB extends Behavior {\r\n    doUpdate() {\r\n    }\r\n    checkUpdate(reason) {\r\n        console.error('RegisterB told to update. Why?');\r\n        return false;\r\n    }\r\n    dispose() {\r\n    }\r\n    changeValue(value) {\r\n        console.log('update');\r\n        this.value = value;\r\n        this.initiateUpdate();\r\n    }\r\n}\r\nexports.RegisterB = RegisterB;\r\nclass LiftB extends Behavior {\r\n    constructor(fn, ...children) {\r\n        const computed = fn(...children.map(b => b.value));\r\n        super(computed);\r\n        this.fn = fn;\r\n        this.children = children.map((behavior, ix) => {\r\n            const id = behavior.addWatcher(this, ix);\r\n            return { behavior, id };\r\n        });\r\n    }\r\n    doUpdate() {\r\n        this.value = this.fn(...this.children.map(b => b.behavior.value));\r\n    }\r\n    checkUpdate(reason) {\r\n        return true;\r\n    }\r\n    dispose() {\r\n        for (const { behavior, id } of this.children)\r\n            behavior.removeWatcher(id);\r\n    }\r\n}\r\nexports.LiftB = LiftB;\r\nclass BehaviorSubscriptionR {\r\n    constructor(behavior, callback) {\r\n        this.timestamp = BehaviorSubscriptionR.currentTime++;\r\n        this.behavior = behavior;\r\n        this.callback = callback;\r\n        this.status = 'alive';\r\n        this.subscriptionId = this.behavior.addSubscription(this);\r\n    }\r\n    dispose() {\r\n        if (this.status === 'alive') {\r\n            this.behavior.removeSubscription(this.subscriptionId);\r\n            this.status = 'dead';\r\n        }\r\n    }\r\n}\r\nBehaviorSubscriptionR.currentTime = 0;\r\nexports.BehaviorSubscriptionR = BehaviorSubscriptionR;\r\nfunction resourceTrace(value, cont) {\r\n    return new ResourceTrace(value, cont(value));\r\n}\r\nexports.resourceTrace = resourceTrace;\r\nexports.Kagome = {\r\n    pure(value) {\r\n        return new Action(cont => cont(value));\r\n    },\r\n    listen(target, type, listener) {\r\n        return new Action(cont => {\r\n            target.addEventListener(type, listener);\r\n            return new ResourceTrace({ dispose() { target.removeEventListener(type, listener); } }, cont(undefined));\r\n        });\r\n    },\r\n    appendChild(parent, node) {\r\n        return new Action(cont => {\r\n            parent.appendChild(node);\r\n            return new ResourceTrace({ dispose() { parent.removeChild(node); } }, cont(undefined));\r\n        });\r\n    },\r\n    registerB(value) {\r\n        return new Action(cont => {\r\n            const behavior = new RegisterB(value);\r\n            return resourceTrace(behavior, cont);\r\n        });\r\n    },\r\n    liftB(fn, ...behaviors) {\r\n        return new Action(cont => {\r\n            const behavior = new LiftB(fn, ...behaviors);\r\n            return resourceTrace(behavior, cont);\r\n        });\r\n    },\r\n    sampleB(behavior) {\r\n        return new Action(cont => {\r\n            console.log('stuff', cont);\r\n            const subscription = new BehaviorSubscriptionR(behavior, callback);\r\n            let trace = new ResourceTrace(subscription, cont(behavior.value));\r\n            function callback(value) {\r\n                if (trace.next !== null)\r\n                    trace.next.dispose();\r\n                trace.next = cont(value);\r\n            }\r\n            return trace;\r\n        });\r\n    }\r\n};\r\n\n\n//# sourceURL=webpack:///./src/index.ts?");

/***/ }),

/***/ "./src/webpack.js":
/*!************************!*\
  !*** ./src/webpack.js ***!
  \************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./index */ \"./src/index.ts\");\n/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_index__WEBPACK_IMPORTED_MODULE_0__);\n\r\n\r\nObject.assign(window, _index__WEBPACK_IMPORTED_MODULE_0__);\r\n\n\n//# sourceURL=webpack:///./src/webpack.js?");

/***/ })

/******/ });