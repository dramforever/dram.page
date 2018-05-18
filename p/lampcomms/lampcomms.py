import random

# 配置参数

num_actors = 5
max_steps = 2000
random.seed(12345)
logging = True

# 初始状态随机
state = random.choice(['00', '01', '10', '11'])

# 现在是第几个回合
step = 0

# 记录发送和接收的数据

sent = ['' for i in range(num_actors)]
recv = [['' for j in range(num_actors)] for i in range(num_actors)]

def log_sent(src, bit):
    sent[src] += str(bit)

def log_recv(src, dest, bit):
    recv[dest][src] += str(bit)

# 每个人的程序区别在于自己的 id

def actor(me):
    global state, step

    def log(str):
        if logging:
            print('{:6} | {:3}: {}'.format(step, me, str))

    def next_actor(x):
        '''由于后面需要所有人轮流发送信息，这个函数返回 x 后面的是谁'''
        return (x + 1) % num_actors

    def wait_ack(msg, ack):
        '''将灯的状态置于 msg，然后计数 n - 1 次，等每个人都将灯置于
        ack 一次表示接收到
        只有置于 ack 的才算，置于其它状态会被忽略并改回 msg

        用法：yield from wait_ack(...)'''
        global state
        state = msg
        count = 1
        while count < num_actors:
            yield
            if state == ack:
                count += 1
            state = msg

    def wait_until(target):
        '''等待灯出现 target 状态
        target 可以是一个 str 表示期待的状态，或者一个 list 表示期待
        的状态集合

        用法：yield from wait_until(...)'''
        if type(target) == str:
            target = [target]
        while state not in target:
            yield

    # 同步阶段，由 0 号掌控

    if me == 0:

        state = '10'

        log('+ sync: begin counting')

        # 这里等待每个人都 ack 一次 11，可以保证同步完成
        # 具体解释见下方对于 1 ~ n-1 号的表述

        yield from wait_ack(msg = '10', ack = '11')

        log('+ sync: master done')

    else:
        yield from wait_until(['10', '01'])

        log('  sync: first ack')

        state = '00'

        # 第一次的 ack 其实不重要

        yield from wait_until('10')

        # 这里因为我们之前将灯置于 00 了，所以知道这个 10 是 0 号告诉我们的

        log('  sync: second ack')

        # 也就是说这个 11 的 ack 都是对 0 号发出的 10，而不是初始条件的 10

        state = '11'

        log('  sync: slave done')

    # 现在，每个人轮流发送信息

    current = 0     # 当前是谁发送信息

    while True:
        if me == current:
            # 对于发信者

            ### 1. 接管发信

            # 第一个循环：
            #   如果是我发信息，那么我将状态置为 01
            #   其他人已经同步过了，所以知道这个 01 是 current 发出的

            state = '01'

            # 等待所有人都接收到 01，知道我要开始发信息了

            yield from wait_ack(msg = '01', ack = '00')

            log('+ takeover: done')

            ### 2. 正式发信

            # 随机选择 0 或 1 发送

            bit = random.choice([0, 1])

            log('+ send: sending {}'.format(bit))

            # 因为上面接管只用了 00 和 01
            # 我们用 1x 来表示信息的话一定能区分开

            msg = '1' + str(bit)

            # 自然要等大家 ack

            yield from wait_ack(msg = msg, ack = '00')

            log('+ send: done')

            log_sent(src = me, bit = bit)

            # 现在所有人都知道了信息是什么，所以发送一个和信息相反的
            # 以表示等待下一个人接管

            state = '1' + str(1 - bit)

        else:
            # 对于收信者

            ### 1. 等待接管

            yield from wait_until('01')

            log('  takeover: ack')
            state = '00'

            ### 2. 接收信息

            yield from wait_until(['10', '11'])

            bit = int(state[1])

            log('  recv: ack, bit {} from {}'.format(bit, current))
            log_recv(src = current, dest = me, bit = bit)

            state = '00'

            yield

            if me == next_actor(current):
                # 如果下一个发信的是我，那么

                ### 3. 准备接管

                # 我们等待这局发信者的与消息相反的灯状态
                # 这样我们就知道什么时候可以开始接管

                neg_msg = '1' + str(1 - bit)

                yield from wait_until(neg_msg)

                log('+ taking over transmission')

        current = next_actor(current)


actors = [actor(i) for i in range(num_actors)]

for i in range(max_steps):
    step = i
    last_state = state
    actor_num = random.randrange(num_actors)
    next(actors[actor_num])


# 输出并检查传输情况

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

# 一些关于传输数据的统计

total_bits = sum(map(len, sent))

print('Transmission statistics:')
print('    {} actors, {} bits, {} steps'.format(num_actors, total_bits, max_steps))
print('    {} bits per 1k steps'.format(1000 * total_bits / max_steps))