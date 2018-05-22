import { Disposable } from "./utils";
export declare type Trace = ResourceTrace | null;
export declare class ResourceTrace {
    resource: Disposable;
    next: Trace;
    constructor(resource: Disposable, next: Trace);
}
export interface Action<A> {
    run(cont: (value: A) => Trace): Trace;
}
export declare class PureA<A> implements Action<A> {
    value: A;
    constructor(value: A);
    run(cont: (value: A) => Trace): Trace;
}
export declare class AddEventListenerR implements Disposable {
    target: EventTarget;
    type: string;
    listener: EventListener;
    constructor(target: EventTarget, type: string, listener: EventListener);
    dispose(): void;
}
export declare class AddEventListenerA implements Action<void> {
    target: EventTarget;
    type: string;
    listener: EventListener;
    constructor(target: EventTarget, type: string, listener: EventListener);
    run(cont: (value: void) => Trace): Trace;
}
export declare class Kagome {
    traces: Trace[];
    constructor();
}
