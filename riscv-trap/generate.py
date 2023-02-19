import sys
import re

def display_mask(value, total):
    pos, dig = value % 4, value // 4
    gen = lambda n: f'<span class="zero-digits">{"0" * n}</span>'
    return f'{gen(total - dig - 1)}{1 << pos :x}{gen(dig)}'

for line in sys.stdin:
    line = line.rstrip('\n')
    num, *rest = line.split('\t')
    num = int(num)
    parts = [f'{num}', f'{num:x}', display_mask(num, 6), *rest]
    print('<tr>', ' '.join(f'<td>{p}</td>' if p != '!' else '<td></td>' for p in parts), '</tr>')
