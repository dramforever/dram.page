---
title: "Threaded code explained in C"
date: 2023-11-20
---

At some point in your life you may have decided that it would be a good idea to represent something in term of a "virtual machine". You know, a relatively simple format of data that encodes things to do, and a simple interpreter reading it and doing the actual thing.

I hope what you were intending to implement is actually a programming language, not just something that got to the point of being accidentally Turing-complete. I wouldn't judge either way though.

## Side note: C features used in this article

I'm going to assume familiarity with the C language, but just to make easier for those less familiar with C, here are some explanations of less obvious constructs used in the code:

### Infinite loop

`for (;;)` is an infinite loop.

### Stack operations

We're going to use arrays and pointers as stacks. The convention we're going to use is:

```
uintptr_t stack_buf[STACK_SIZE];
uintptr_t *sp = stack_buf;
```

- The stack "grows up", meaning that successive pushes go into higher indices.
- The stack pointer starts at the beginning of the underlying array.
- The stack pointer points to one element after the top element. So if the stack currently has `3` elements, then `sp = stack_buf + 3`.
- Using the semantics of C's increment/decrement operators, `*(sp++) = foo` pushes `foo` on the stack, whereas `bar = *(--sp)` pops an element from the stack and assigns it to `bar`.

### Function pointers

Later in the article we're going to need to "store" functions as data. The way this is done is using a *function pointer*.

It's possible to declare function pointers directly, but I'm going to use a `typedef` for the sake of your sanity:

```
typedef void (*codeptr)(void);
```

This means `codeptr` is now a type alias for the type "function pointer to a function that takes no arguments and returns `void`".

(For historical reasons a parameter list of `(void)`, not `()`, means "takes no arguments" in C.)

You can use this type in variables or members. The name of any function with the correct signature can be used as a value of type `codeptr`. To use a function pointer, just call it like any function.

```
void foo(void);
codeptr p = foo;
p(); // Calls foo
```

On most architectures a function pointer is represented by the address of the start of the code of a function.

## Bytecode

A "bytecode" is one of the obvious popular choices. Each instruction has, say, one byte of opcode and several bytes of operands. Let's also say we're using a stack machine, because it's also an obvious popular choice. A bytecode program might look something like this:

```
#define OP_EXIT 0
#define OP_PUSH 1
#define OP_ADD 2
#define OP_PRINT 3
// ... more opcodes

const uint8_t program[] = {
    OP_PUSH, 1, OP_PUSH, 1, OP_ADD, OP_PRINT, OP_EXIT,
};
```

And the interpreter would look something like this:

```
const uint8_t *ip = program;

uintptr_t stack_buf[STACK_SIZE];
uintptr_t *sp = stack_buf;

void interpreter(void) {
    for (;;) {
        switch (*ip) {
        case OP_PUSH:
            ip++;
            uintptr_t operand = *(ip++);
            *(sp++) = operand;
            break;

        case OP_ADD:
            ip++;
            uintptr_t b = *(--sp);
            uintptr_t a = *(--sp);
            *(sp++) = a + b;
            break;

        // ... more opcodes
        }
    }
}
```

## Direct threaded code

The `switch` statement above would probably be compiled into a jump table by the compiler. If you don't need the program to be serializable, one thing you can do is to simply store function pointers in an array, skipping the table altogether:

```
typedef void (*codeptr)(void);

void code_one(void);
// ... more functions

const codeptr program[] = {
    code_one, code_one, code_add, code_print, code_exit,
};
```

Instead of `case`s in a `switch` block, the individual opcodes are now individual functions

```
void code_one(void) {
    ip++;
    *(sp++) = 1;
}

void code_add(void) {
    ip++;
    uintptr_t b = *(--sp);
    uintptr_t a = *(--sp);
    *(sp++) = a + b;
}

// ...
```

And the interpreter would simply repeatedly call the current function pointer. For simplicity's sake, we'll keep the interpreter state in global variables (for now).

```
const codeptr *ip = program; // Changed!

uintptr_t stack_buf[STACK_SIZE];
uintptr_t *sp = stack_buf;

void interpreter(void) {
    for (;;)
        (*ip)();
}
```

## Indirect threaded code

Instead of function pointers, the program can contain pointers to more complicated objects. An obvious example would be *other programs*, as an implementation of subroutines.

Since we want the handling of objects to remain uniform, each object would need a function pointer pointing to some code telling it what to do. Following it could be some payload. For simplicity, let's say that the only possible payload is a subroutine.

To handle subroutine calls and returns, we'd also need to add a return stack pointer (`rsp`) to our interpreter state. We'll see how to handle it later.

```
typedef void (*codeptr)(void);

struct object {
    codeptr code;
    const struct object *payload[];
};

const struct object *const *ip = ...; // Changed!

uintptr_t stack_buf[STACK_SIZE];
uintptr_t *sp = stack_buf;

// New: return stack
const struct object *const *rstack_buf[STACK_SIZE];
const struct object *const **rsp = rstack_buf;
```

Primitive objects can have `code` with no `payload`:

```
void code_add(void) {
    ip++;
    uintptr_t b = *(--sp);
    uintptr_t a = *(--sp);
    *(sp++) = a + b;
}

const struct object o_add = { .code = code_add };
```

Within a `code`, you can get access to a pointer to the current object with `*ip`.

Let's see how we could handle subroutines. The code of a subroutine objects should bump the `ip` and push it on the return stack, and change `ip` to point to the payload. Each subroutine should end with a `return` primitive that pops the return address and change `ip` back:

```
void code_subroutine(void) {
    const struct object *self = *ip;
    ip++;
    *(rsp++) = ip;
    ip = self->payload;
}

void code_return(void) {
    ip = *(--rsp);
}

const struct object o_return = { .code = code_return };
```

And now a subroutine could look like

```
const struct object o_two = {
    .code = code_subroutine,
    .payload = { &o_one, &o_one, &o_add, &o_return },
};
```

The interpreter is largely unchanged, just with an additional dereferencing on `ip`. Starting the interpreter is slightly tricky. Where do you point `ip` initially?

If you have an object that's the "main program" `o_main`, you can store `&o_main` in memory and let `ip` point to that. Be careful --- the main program must not return because it has nowhere to return to.

```
const struct object *const start = &o_main;
const struct object *const *ip = &start;

void interpreter(void) {
    for (;;)
        (*ip)->code();
}
```

## Primitive-centric threaded code

There are two issues with indirect threaded code from the previous section:

- The extra pointer indirection might be unsatisfactory for efficiency reasons.
- There's no easy way to encode an immediate operand.

We can solve both problems with yet another spin on threaded code. M. Anton Ertl, in implementing Gforth, used what was referred to as "primitive-centric threaded code". It is essentially a fat pointer scheme:

```
typedef void (*codeptr)(uintptr_t);

struct instr {
    codeptr code;
    uintptr_t data;
};
```

Instead of requiring a dereference of a point to access an object, the program directly stores a function pointer and one pointer worth of extra data. When processing each "instruction" in the program, the interpreter provides the extra data to the function.

```
const struct instr i_main = { ... };
const struct instr *ip = &i_main; // Changed!

uintptr_t stack_buf[STACK_SIZE];
uintptr_t *sp = stack_buf;

// Changed to adapt to match the type of ip
const struct instr *rstack_buf[STACK_SIZE];
const struct instr **rsp = rstack_buf;

void interpreter(void) {
    for (;;) {
        struct instr ins = *ip;
        ins.code(ins.data);
    }
}
```

It's now possible again to make a generic "push", without requiring separate code for every possible immediate value:

```
void code_push(uintptr_t data) {
    ip++;
    *(sp++) = data;
}

const struct instr i_one = { .code = code_push, .data = 1 };
const struct instr i_two = { .code = code_push, .data = 2 };
```

Subroutine calls can be made by making `data` point to an array of instructions making up the subroutines:

```
void code_subroutine(uintptr_t data) {
    const struct instr *sr = (const struct instr *) data;
    ip++;
    *(rsp++) = ip;
    ip = sr;
}

void code_return(uintptr_t data) {
    ip = *(--rsp);
}

const struct instr sr_three[] = {
    { .code = code_push, .data = 1 },
    { .code = code_push, .data = 2 },
    { .code = code_add },
    { .code = code_return },
};

const struct instr sr_six[] = {
    { .code = code_subroutine, .data = (uintptr_t) sr_three },
    { .code = code_subroutine, .data = (uintptr_t) sr_three },
    { .code = code_add },
    { .code = code_return },
};
```

## Optimization

We can leverage a few tricks to convince the compiler into keeping our interpreter state in registers, and avoid doing a function call and return for each step.

Firstly, instead of using a loop to repeatedly call functions, we can instead make each piece of code tail call the next:

```
void code_foo(uintptr_t data) {
    // ...

    struct instr ins = *ip;
    ins.code(ins.data);
}
```

Compile your code with optimizations on. Your compiler should recognize that this is a tail call, and compile this down to a simpler indirect jump.

Next, instead of using global variables for the interpreter state, put them into arguments:

```
void code_foo(
    uintptr_t data,
    const struct instr *ip,
    uintptr_t *sp,
    const struct instr **rsp
) {
    // ...

    struct instr ins = *ip;
    ins.code(ins.data, ip, sp, rsp);
}
```

Using some macros would reduce the boilerplate a bit

```
#define DECL_STATE \
    const struct instr *ip, \
    uintptr_t *sp, \
    const struct instr **rsp

#define STATE ip, sp, rsp

void code_foo(uintptr_t data, DECL_STATE) {
    // ...

    struct instr ins = *ip;
    ins.code(ins.data, STATE);
}
```

On modern register-rich architectures (x86-64, ARM, RISC-V, MIPS, ...), the arguments `ip`, `sp`, `rsp` would be passed in registers. Since `ins.code` expect these in the same registers, if your code leaves some of those state variables unchanged, there's no cost to simply passing it on.

(On 32-bit x86, it might be possible with some non-portable `__attribute__((regparm(4)))` magic. I have not yet experimented with this.)

For threaded code, this is about as close as it gets to what you'd write in assembly. More native-code optimizations is possible, but would be out of the scope of (mostly) portable C.

## Notes

The [*Threading*][gforth-threading] section from the Gforth manual was very helpful when writing this article. In particular, the concept of primitive-centric threaded code is described in detail.

[gforth-threading]: https://gforth.org/manual/Threading.html

Complete demos corresponding to snippets in this article can be found on [GitHub at dramforever/threaded-code-demo][threaded-code-demo].

[threaded-code-demo]: https://github.com/dramforever/threaded-code-demo
