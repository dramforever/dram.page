import random

### 配置参数

num_actors = 5
max_steps = 2000
random.seed(12345)
logging = True

### 全局状态

state = random.choice(['00', '01', '10', '11'])
step = 0

### 传输数据记录

sent = ['' for i in range(num_actors)]
recv = [['' for j in range(num_actors)] for i in range(num_actors)]

def log_sent(src, bit):
    sent[src] += str(bit)

def log_recv(src, dest, bit):
    recv[dest][src] += str(bit)

### 主程序

def actor(me):
    global state, step

    def log(str):
        if logging:
            print('{:6} | {:3}: {}'.format(step, me, str))

    def next_actor(x):
        return (x + 1) % num_actors

    def wait_ack(msg, ack):
        global state
        state = msg
        count = 1
        while count < num_actors:
            yield
            if state == ack:
                count += 1
            state = msg

    def wait_until(target):
        if type(target) == str:
            target = [target]
        while state not in target:
            yield

    def sync_host():
        log('+ sync: begin counting')
        yield from wait_ack(msg = '10', ack = '11')
        log('+ sync: master done')

    def sync_guest():
        global state

        yield from wait_until(['10', '01'])
        state = '00'
        log('  sync: first ack')

        yield from wait_until('10')
        state = '11'
        log('  sync: second ack')

    def sender():
        global state

        state = '01'
        yield from wait_ack(msg = '01', ack = '00')

        log('+ takeover: done')

        bit = random.choice([0, 1])
        log('+ send: sending {}'.format(bit))

        msg = '1' + str(bit)
        yield from wait_ack(msg = msg, ack = '00')
        log('+ send: done')
        log_sent(src = me, bit = bit)

        state = '1' + str(1 - bit)

    def receiver():
        global state

        yield from wait_until('01')
        state = '00'
        log('  takeover: ack')

        yield from wait_until(['10', '11'])

        bit = int(state[1])

        log('  recv: ack, bit {} from {}'.format(bit, current))
        log_recv(src = current, dest = me, bit = bit)

        state = '00'
        yield

        if me == next_actor(current):
            neg_msg = '1' + str(1 - bit)
            yield from wait_until(neg_msg)

            log('+ taking over transmission')

    if me == 0:
        yield from sync_host()
    else:
        yield from sync_guest()

    current = 0

    while True:
        if me == current:
            yield from sender()
        else:
            yield from receiver()

        current = next_actor(current)


actors = [actor(i) for i in range(num_actors)]

for i in range(max_steps):
    step = i
    last_state = state
    actor_num = random.randrange(num_actors)
    next(actors[actor_num])

print('')
print('Transmission check')
print('')

for src in range(num_actors):
    src_sent = sent[src]
    print('{:3}|       {}'.format(src, src_sent))
    for dest in range(num_actors):
        if src != dest:
            dest_recv = recv[dest][src]

            # 这里，有可能不是所有人都接收到了最后一个 bit 就终止了
            # 或者有可能所有人都接收到了最后一个 bit，但是发信者还不知道
            # 因此接收到的可能比实际完成发送的多一个 bit

            # won't fix

            ok = '(Ok!)' if dest_recv[:len(src_sent)] == src_sent else '(Not ok!)'
            print('    > {:3}: {} {}'.format(dest, dest_recv, ok))
    print('')

### 传输统计

total_bits = sum(map(len, sent))

print('Transmission statistics:')
print('    {} actors, {} bits, {} steps'.format(num_actors, total_bits, max_steps))
print('    {} bits per 1k steps'.format(1000 * total_bits / max_steps))