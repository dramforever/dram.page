```{=html}
<!DOCTYPE html>
<html>

<head>
    <title>Threaded code explained in C -- dramforever</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="../../styles/default.css">
    <link rel="stylesheet" href="../../styles/post.css">
</head>

<body>

<div id="site-title">
    <h1 id="site-title-main"><a href="/">
        dramforever
    </a></h1>
    <div id="site-title-sub">a row of my life</div>
</div>

<article>
<div id="post-title">
    <h1 id="post-title-main">Threaded code explained in C</h1>
    <span id="post-title-sub">2023-11-??</span>
</div>
```

At some point in your life you may have decided that it would be a good idea to represent something in term of a "virtual machine". You know, a relatively simple format of data that encodes things to do, and a simple interpreter reading it and doing the actual thing.

I hope what you were intending to implement is actually a programming language, not just something that got to the point of being accidentally Turing-complete. I wouldn't judge either way though.

## Bytecode

A "bytecode" is one of the obvious popular choices. Each instruction has, say, one byte of opcode and several bytes of operands. Let's also say we're using a stack machine, because it's also an obvious popular choice. A bytecode program might look something like this:

```
enum opcode : uint8_t {
    OP_PUSH,
    OP_ADD,
    // ...
}

const uint8_t program[] = {
    OP_PUSH, 1,
    OP_PUSH, 2,
    OP_ADD,
    // ...
};
```

And the interpreter would look something like this:

```
// Instruction pointer
const uint8_t *ip = program;

// Stack pointer
uintptr_t *sp = malloc(STACK_SIZE);

for (;;) {
    switch (*ip) {
    case OP_PUSH:
        ip ++;
        uint8_t operand = *(ip ++);
        // Push immediate operand
        *(sp ++) = (uintptr_t) operand;
        break;

    case OP_ADD:
        ip ++;
        // Pop operands
        uintptr_t b = *(-- sp);
        uintptr_t a = *(-- sp);
        // Push result
        *(sp ++) = a + b;
        break;

    // ... more opcodes
    }
}
```

## Direct threaded code

The `switch` statement above would probably be compiled into a jump table by the compiler. If you don't need the program to be serializable, one thing you can do is to simply store function pointers in an array, skipping the table altogether:

```
struct state;

typedef void (*insn)(struct state *);

struct state {
    const insn *ip;
    uintptr_t *sp;
};

const insn program[] = {
    code_push_1,
    code_push_2,
    code_add,
    // ...
};
```

Instead of `case`s in a `switch` block, the individual opcodes are now individual functions

```
void code_push_1(struct state *s) { *(s->sp ++) = 1; s->ip ++; }
void code_push_2(struct state *s) { *(s->sp ++) = 2; s->ip ++; }

void code_add(struct state *s) {
    uintptr_t b = *(-- s->sp);
    uintptr_t a = *(-- s->sp);
    *(s->sp ++) = a + b;
    s->ip ++;
}
```

And the interpreter would simply repeatedly call the current function:

```
struct state s = {
    .ip = program,
    .sp = malloc(STACK_SIZE),
};

for (;;) *(s->ip)(&s);
```

## Indirect threaded code

Instead of function pointers, the program can contain pointers to more complicated objects. An obvious example would be *other programs*, as an implementation of subroutines.

Since we want the handling of objects to remain uniform, each object would need a function pointer pointing to some code telling it what to do. Following it could be some payload. For simplicity, let's say that the only possible payload is a subroutine.

To handle subroutine calls and returns, we'd also need to add a return stack pointer (`rsp`) to our state.

```
struct state;

struct object {
    void (*code)(struct state *);
    const struct object *payload[];
};

struct state {
    const struct object * const *ip;
    uintptr_t *sp;
    const struct object * const **rsp;
}
```

Primitive objects can have `code` with no `payload`:

```
void code_add(struct state *s) {
    // ...
}

const struct object o_add = { .code = code_add };
```

Within a `code`, you can get access to a pointer to the current object with `*(s->ip)`.

Let's see how we could handle subroutines. The code of a subroutine objects should bump the `ip` and push it on the return stack, and change `ip` to point to the payload. Each subroutine should end with a `return` primitive that pops the return address and change `ip` back:

```
void code_subroutine(struct state *s) {
    const struct object *myself = *(s->ip);
    s->ip ++;
    *(s->rsp ++) = s->ip;
    s->ip = myself->payload;
}

void code_return(struct state *s) {
    s->ip = *(-- s->rsp);
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

The interpreter is largely unchanged, just with an additional dereferencing on `s->ip`. Starting the interpreter is slightly tricky. Where do you point `ip` initially?

If you have an object that's the "main program", you can make up an array and start there. Be careful --- the main program must not return because it has nowhere to return to.

```
extern const struct object o_main;

const struct object start[] = { &o_main };

struct state s = {
    .ip = start,
    .sp = malloc(STACK_SIZE),
    .rsp = malloc(RETURN_STACK_SIZE),
};

for (;;) *(s->ip)->code(&s);
```

## Primitive-centric threaded code

There are two issues with indirect threaded code from the previous section:

- The extra pointer indirection might be unsatisfactory for efficiency reasons.
- There's no easy way to encode an immediate operand.

We can solve both problems with yet another spin on threaded code. M. Anton Ertl, in implementing Gforth, used what was referred to as "primitive-centric threaded code". It is essentially a fat pointer scheme:

```
struct state;

struct instr {
    void (*code)(uintptr_t data, struct state *s);
    uintptr_t data;
};

struct state {
    const struct instr *ip;
    uintptr_t *sp;
    const struct instr **rsp;
}
```

Instead of requiring a dereference of a point to access an object, the program directly stores a function pointer and one pointer worth of extra data. When processing each "instruction" in the program, the interpreter provides the extra data to the function.

```
extern const struct instr i_main;

struct state s = {
    .ip = &i_main,
    .sp = malloc(STACK_SIZE),
    .rsp = malloc(RETURN_STACK_SIZE),
}

for (;;) {
    struct instr ins = *s.ip;
    ins.code(ins.data, &s);
}
```

It's now possible again to make a generic "push", without requiring separate code for every possible immediate value:

```
void code_push(uintptr_t data, struct state *s) {
    *(s->sp ++) = data;
}

const struct instr i_one = { .code = code_push, .data = 1 };
const struct instr i_two = { .code = code_push, .data = 2 };
```

Subroutine calls can be made by making `data` point to an array of instructions making up the subroutines:

```
void code_subroutine(uintptr_t data, struct state *s) {
    s->ip ++;
    *(s->rsp ++) = s->ip;
    s->ip = (const struct instr *) data;
}

void code_return(uintptr_t, struct state *s) {
    s->ip = *(-- s->rsp);
}

const struct instr sr_one_plus_one[] = {
    { .code = code_push, .data = 1 },
    { .code = code_push, .data = 1 },
    { .code = code_add },
    { .code = code_return },
};

const struct instr sr_two_plus_two[] = {
    { .code = code_subroutine, .data = (uintptr_t) sr_one_plus_one },
    { .code = code_subroutine, .data = (uintptr_t) sr_one_plus_one },
    { .code = code_add },
    { .code = code_return },
}
```

## Optimization: Tail-calls

We can leverage a few tricks to convince the compiler into keeping our interpreter `state` in registers, and avoid doing a function call and return for each step.

Firstly, instead of using a loop to repeatedly call functions, we can instead make each piece of code tail call the next:

```
void code_foo(uintptr_t data, struct state *s) {
    // ...

    struct instr ins = *s.ip;
    ins.code(ins.data, &s);
}
```

Compile your code with optimizations on. Your compiler should recognize that this is a tail call, and compile this down to a simpler indirect jump.

Next, explode the `struct state` into separate arguments:

```
void code_foo(
    uintptr_t data,
    const struct instr *ip,
    uintptr_t *sp,
    const struct instr **rsp,
) {
    // ...

    struct instr ins = *ip;
    ins.code(ins.data, ip, sp, rsp);
}
```

On modern register-rich architectures (x86-64, ARM, RISC-V, MIPS, ...), the arguments `ip`, `sp`, `rsp` would be passed in registers. Since `ins.code` expect these in the same registers, if your code leaves some of those state variables unchanged, there's no cost to simply passing it on.

(On 32-bit x86, it might be possible with some non-portable `__attribute__((regparm(4)))` magic. I have not yet experimented with this.)

For threaded code, this is about as close as it gets to what you'd write in assembly. More native-code optimizations is possible, but would be out of the scope of (mostly) portable C.

## References

- [*Threading*][gforth-threading], Gforth manual

[gforth-threading]: https://gforth.org/manual/Threading.html

## About this document

This document was generated using [Pandoc][pandoc] from [the Markdown source](threaded-code.md):

[pandoc]: https://pandoc.org/

```console
$ pandoc -f markdown -t html < threaded-code.md > index.html
```

```{=html}
</body>
</html>
```
