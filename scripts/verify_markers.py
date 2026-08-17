# -*- coding: utf-8 -*-
"""Shubhali markerlarni tekshirish: haqiqiy modda yoki superscript sub-modda?"""
import sys
import re
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import pdfplumber

def check(pdf_path, numbers):
    found = {}
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            chars = page.chars or []
            if not chars:
                continue
            s_chars = sorted(chars, key=lambda c: c['top'])
            lines = []
            current = []
            cur_top = None
            for c in s_chars:
                if cur_top is None or c['top'] - cur_top > 3.5:
                    if current:
                        lines.append(current)
                    current = [c]
                    cur_top = c['top']
                else:
                    current.append(c)
            if current:
                lines.append(current)
            for line in lines:
                cs = sorted(line, key=lambda c: c['x0'])
                txt = ''.join(c['text'] for c in cs)
                m = re.match(r'^(\d{3,4})\s*-\s*modda', txt)
                if not m:
                    continue
                n = int(m.group(1))
                if n in numbers and n not in found:
                    sizes = [round(c['size'], 1) for c in cs if c['text'].isdigit()]
                    found[n] = (txt[:80], sizes)
    for n in numbers:
        if n in found:
            print(f'  {n}: {found[n][0]}  digit_sizes={found[n][1]}')
        else:
            print(f'  {n}: NOT FOUND as 3-4 digit marker at line start')

print('=== criminal_code: 391, 408, 439, 482')
check(r'C:/Users/ANUBIS PC/Desktop/Новая папка (3)/file (30).pdf', [391, 408, 439, 482, 505])
print('=== civil part1: 506, 588, 978, 1098')
check(r'C:/Users/ANUBIS PC/Desktop/Новая папка (3)/file (32).pdf', [506, 588, 978, 1098, 385])
print('=== admin: 504')
check(r'C:/Users/ANUBIS PC/Desktop/Новая папка (3)/file (34).pdf', [504, 505, 506, 507])
print('=== jpk: 645')
check(r'C:/Users/ANUBIS PC/Desktop/Новая папка (3)/file (31).pdf', [645, 646])
