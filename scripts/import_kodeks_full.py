# -*- coding: utf-8 -*-
"""
JURISTIV: To'liq kodeks PDF parseri (v2).
- pdfplumber orqali char darajasida o'qish
- Superscript sub-modda raqamlarini font o'lchamidan aniqlash:
  "103¹" -> base=103, sub=1 -> article_number="103-1"
- Bob (chapter) va bo'lim (section) sarlavhalarini aniqlash (raqam va rim raqami)
- Editorial izohlarni tozalash (LexUZ sharhi, Oldingi tahrirga qarang)
- Chiqish: scripts/kodeks_json/<code_id>.json
"""
import os
import re
import sys
import json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import pdfplumber

FOLDER = r'C:/Users/ANUBIS PC/Desktop/Новая папка (3)'
OUT_DIR = os.path.join(os.path.dirname(__file__), 'kodeks_json')
os.makedirs(OUT_DIR, exist_ok=True)

LINE_TOL = 3.5          # superscript (top farqi ~3.38) qo'shni qator bilan birlashishi uchun
MODAL_RATIO = 0.92      # shu nisbatdan kichik shrift = superscript

# code_id -> (filename fragment)
PDFS = [
    ('constitution', 'file (29).pdf'),
    ('criminal_code', 'file (30).pdf'),
    ('criminal_procedure_code', 'file (31).pdf'),
    ('civil_code', 'file (32).pdf'),      # 1-qism: 1..385
    ('civil_code', 'file (33).pdf'),      # 2-qism: 386.. (davomi)
    ('admin_code', 'file (34).pdf'),
    ('labor_code', 'file (35).pdf'),
    ('family_code', 'oila'),
    ('tax_code', 'soliq'),
]

APOS = '[\u2018\u2019\']'   # O‘zbekiston tipografik apostrofi

def is_page_artifact(text):
    t = text.strip()
    if re.match(r'^\d{1,2}\.\d{1,2}\.\d{4},\s*\d{1,2}:\d{2}\s+Page\s+\d+\s+of\s+\d+$', t):
        return True
    if re.match(r'^Page\s+\d+\s+of\s+\d+$', t):
        return True
    return False

def split_line(chars):
    cs = sorted(chars, key=lambda c: c['x0'])
    text = ''.join(c['text'] for c in cs)
    return text, cs

def modal_size(chars):
    sizes = [round(c['size'], 2) for c in chars if c['text'].strip()]
    if not sizes:
        return 12.8
    from collections import Counter
    return Counter(sizes).most_common(1)[0][0]

def find_article_marker(text, chars, modal):
    """
    Qator 'N-modda' markeri bo'lsa -> (base, sub, num_end_index) qaytaradi.
    Faqat QATOR BOSHIDAGI raqamlar olinadi (title'dagi raqamlar emas).
    Superscript raqamlar font o'lchamidan aniqlanadi.

    MUHIM FILTR: Qonun hujjatlariga havola qatorlari (masalan
    "391-modda, 52-son, 513-modda; ..." yoki "408-modda)" yoki
    "1098-modda ikkinchi qismi ...") HAQIQIY modda emas.
    Haqiqiy modda DOIMO "N-modda." (nuqta bilan) yoki qator oxiri bo'ladi.
    """
    m = re.match(r'^(\s*)(\d+)\s*-\s*modda', text)
    if not m:
        return None
    # 'modda' so'zidan keyingi belgini tekshiramiz
    after = text[m.end():]
    after_strip = after.lstrip()
    if after_strip:
        first = after_strip[0]
        # Havola ekanini bildiruvchi belgilar -> modda emas
        if first != '.' and first not in '.\u00a0':
            # Nuqta yo'q bo'lsa, qator oxirida ham modda bo'lishi mumkin (sarlavha keyingi qatorda)
            # lekin faqat "modda" so'zidan keyin darhol qator tugasa
            return None
    num_start = m.start(2)
    num_end = m.end(2)
    # text = ''.join(c['text']) bo'lgani uchun chars[num_start:num_end] raqam charlari
    num_chars = chars[num_start:num_end]
    base = ''.join(c['text'] for c in num_chars if c['size'] >= modal * MODAL_RATIO)
    sub = ''.join(c['text'] for c in num_chars if c['size'] < modal * MODAL_RATIO)
    if not base:
        base = m.group(2)
    return base, sub, num_end

def parse_pdf(pdf_path, code_id):
    articles = []
    chapter = ''
    section = ''

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
                if cur_top is None or c['top'] - cur_top > LINE_TOL:
                    if current:
                        lines.append(current)
                    current = [c]
                    cur_top = c['top']
                else:
                    current.append(c)
            if current:
                lines.append(current)

            for line in lines:
                text, chars_meta = split_line(line)
                if is_page_artifact(text):
                    continue
                stripped = text.strip()
                if not stripped:
                    continue

                # ---- Bob sarlavhasi: "1-bob. ..." / "I bob. ..." / "1-BOB"
                m_bob = re.match(r'^(\d+|[IVXL]+)\s*[-.\u00a0]?\s*bob[.\u00a0]?\s*(.*)$', stripped, re.IGNORECASE)
                if m_bob:
                    chapter = f"{m_bob.group(1)}-bob. {m_bob.group(2)}".strip()
                    continue

                # ---- Kichik bo'lim
                m_kb = re.match(r'^(\d+|[IVXL]+)\s*[-.\u00a0]?\s*kichik\s+bo'+APOS+r'lim[.\u00a0]?\s*(.*)$', stripped, re.IGNORECASE)
                if m_kb:
                    section = f"{m_kb.group(1)}-kichik bo'lim. {m_kb.group(2)}".strip()
                    continue

                # ---- Bo'lim sarlavhasi: "... BO'LIM ..."
                m_sec = re.match(r'^([IVXL]+\s+BO'+APOS+r'LIM|BIRINChI\s+BO'+APOS+r'LIM|IKKINChI\s+BO'+APOS+r'LIM|UChINChI\s+BO'+APOS+r'LIM|TO'+APOS+r'RTINChI\s+BO'+APOS+r'LIM|BESHINChI\s+BO'+APOS+r'LIM|OLTINChI\s+BO'+APOS+r'LIM|YETTINChI\s+BO'+APOS+r'LIM|SAKKIZINChI\s+BO'+APOS+r'LIM|TO'+APOS+r'QQIZINChI\s+BO'+APOS+r'LIM|O'+APOS+r'NINChI\s+BO'+APOS+r'LIM)[.\u00a0]?\s*(.*)$', stripped, re.IGNORECASE)
                if m_sec and len(stripped) < 100:
                    section = stripped
                    continue

                # ---- QISM sarlavhasi
                m_q = re.match(r'^(UMUMIY\s+QISM|MAXSUS\s+QISM|BIRINChI\s+QISM|IKKINChI\s+QISM|UChINChI\s+QISM|TO'+APOS+r'RTINChI\s+QISM)[.\u00a0]?\s*$', stripped, re.IGNORECASE)
                if m_q:
                    section = stripped
                    continue

                # ---- Modda markeri
                modal = modal_size(chars_meta)
                marker = find_article_marker(text, chars_meta, modal)
                if marker:
                    base, sub, num_end = marker
                    article_number = base if not sub else f"{base}-{sub}"
                    # sarlavha: raqam va '-modda' dan keyingi qator davomi
                    rest = text[num_end:]
                    rest = re.sub(r'^[\s\u00a0]*-\s*modda\b', '', rest, flags=re.IGNORECASE)
                    rest = re.sub(r'^[\s\u00a0]*modda\b', '', rest, flags=re.IGNORECASE)
                    rest = re.sub(r'^[.\u00a0]\s*', '', rest).strip()
                    articles.append({
                        'code_id': code_id,
                        'article_number': article_number,
                        'article_number_int': int(base),
                        'title': rest,
                        'content': '',
                        'chapter': chapter,
                        'section': section,
                    })
                    continue

                # ---- Oddiy matn -> oxirgi moddaning content'iga
                if articles:
                    articles[-1]['content'] += stripped + '\n'

    # Content tozalash
    for a in articles:
        c = a['content']
        c = re.sub(r'LexUZ\s+sharhi.*$', '', c, flags=re.DOTALL)
        c = re.sub(r'(?m)^Oldingi\s+tahrirga\s+qarang\.?\s*$', '', c)
        c = re.sub(r'\n{3,}', '\n\n', c)
        c = c.strip()
        a['content'] = c
    return articles

def main():
    report = {}
    for code_id, fname_part in PDFS:
        pdf_path = None
        for f in os.listdir(FOLDER):
            low = f.lower()
            if fname_part in low:
                pdf_path = os.path.join(FOLDER, f)
                break
        if not pdf_path:
            print(f'!! PDF topilmadi: {fname_part}')
            continue
        print(f'=== {code_id} <- {os.path.basename(pdf_path)}')
        arts = parse_pdf(pdf_path, code_id)
        # natijani saqlash (civil 2 qism birlashadi)
        out_path = os.path.join(OUT_DIR, code_id + '.json')
        existing = []
        if os.path.exists(out_path):
            existing = json.load(open(out_path, encoding='utf-8'))
        all_arts = existing + arts
        json.dump(all_arts, open(out_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

        nums = sorted({a['article_number_int'] for a in arts})
        gaps = []
        for i in range(1, len(nums)):
            if nums[i] - nums[i-1] > 1:
                gaps.append((nums[i-1], nums[i]))
        print(f'  moddalar: {len(arts)}, jami: {len(all_arts)}, unique int: {len(nums)}')
        if nums:
            print(f'  range: {nums[0]}..{nums[-1]}')
        if gaps:
            print(f'  gaps: {gaps[:30]}')
        subs = [a['article_number'] for a in arts if '-' in a['article_number']]
        if subs:
            print(f'  sub-moddalar: {len(subs)} | misol: {subs[:10]}')
        no_title = [a['article_number'] for a in arts if not a['title']]
        if no_title:
            print(f'  ! title yoq: {len(no_title)} ta, misol: {no_title[:8]}')
        report[code_id] = len(all_arts)
    print()
    print('JAMI:', json.dumps(report, ensure_ascii=False))

if __name__ == '__main__':
    main()
