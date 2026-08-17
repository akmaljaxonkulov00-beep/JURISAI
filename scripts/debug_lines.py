# -*- coding: utf-8 -*-
"""pdfplumber qator tuzilishini tekshirish."""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import pdfplumber

def dump_line(pdf_path, search, max_lines=3):
    with pdfplumber.open(pdf_path) as pdf:
        for pi, page in enumerate(pdf.pages):
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
                if search in txt:
                    print(f'--- {pdf_path.split("/")[-1]} page {pi}: search={search!r}')
                    print('  TEXT:', repr(txt))
                    sizes = {}
                    for c in cs:
                        if c['text'].strip():
                            sizes.setdefault(round(c['size'], 1), 0)
                            sizes[round(c['size'], 1)] += 1
                    print('  sizes:', sizes)
                    print('  chars:', [(repr(c['text']), round(c['size'], 1)) for c in cs if c['text'].strip()][:25])
                    return
    print(f'NOT FOUND {search!r}')

dump_line(r'C:/Users/ANUBIS PC/Desktop/Новая папка (3)/file (29).pdf', '1-modda')
dump_line(r'C:/Users/ANUBIS PC/Desktop/Новая папка (3)/file (30).pdf', '411-modda')
