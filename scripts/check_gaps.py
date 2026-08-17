# -*- coding: utf-8 -*-
"""Jinoyat kodeksi 302->408 gap'i haqiqiy yoki parser xatosi ekanini tekshirish."""
import sys
import re
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

text = open('scripts/kodeks_text/criminal_code.txt', encoding='utf-8').read()

# 302-modda qayerda? keyingi modda nima?
for m in re.finditer(r'(?m)^\s*(\d{1,4})\s*-\s*modda', text):
    n = int(m.group(1))
    if 300 <= n <= 312 or 400 <= n <= 412:
        ctx = re.sub(r'\s+', ' ', text[m.start():m.start()+90])
        print(n, '=>', ctx[:80])

# 303 uchun flex qidiruv
print('--- flex search "303" near modda:')
for m in re.finditer(r'303[\s\-\u00a0]*modda', text):
    print('   ', repr(text[max(0,m.start()-40):m.start()+60]))
    if m.start() > 600000:
        break
