#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys, re, io
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def extract_first_chars(filepath, max_chars=5000):
    try:
        from pdfminer.high_level import extract_text
        text = extract_text(filepath, page_numbers=[0, 1], maxpages=2)
        return text[:max_chars], 'pdfminer'
    except Exception as e:
        try:
            import PyPDF2
            with open(filepath, 'rb') as fh:
                reader = PyPDF2.PdfReader(fh)
                text = ""
                for i in range(min(3, len(reader.pages))):
                    text += reader.pages[i].extract_text() or ""
            return text[:max_chars], 'PyPDF2'
        except Exception as e2:
            return f"[ERROR] {e}, {e2}", None

CODE_PATTERNS = [
    ("Konstitutsiya", "constitution", [
        r"konstitutsiy", r"asosiy qonun", r"prezident",
        r"xalq hokimiyati", r"fuqarolarning huquq",
    ]),
    ("Oila kodeksi", "family_code", [
        r"oila kodeksi", r"nikoh", r"oila qonunchiligi",
        r"aliment", r"farzand", r"ota.ona",
    ]),
    ("Ma'muriy javobgarlik kodeksi", "admin_code", [
        r"ma.muriy javobgarlik", r"ma.muriy huquqbuzarlik", r"jarima",
        r"ogohlantirish", r"yo.l harakati",
    ]),
    ("Jinoyat kodeksi", "criminal_code", [
        r"jinoyat kodeksi", r"jinoiy javobgarlik", r"jazo", r"jinoyat",
        r"ozodlikdan mahrum", r"ayblanuvchi",
    ]),
    ("Jinoyat-protsessual kodeksi", "criminal_procedure_code", [
        r"jinoyat.protsessual", r"tergov", r"protsessual kodeksi",
        r"himoya", r"ayblov", r"prokuror", r"tintuv", r"ehtiyot chorasi",
        r"jinoyat ishi", r"gumon qilinuvchi",
    ]),
    ("Fuqarolik kodeksi", "civil_code", [
        r"fuqarolik kodeksi", r"fuqarolik qonunchiligi", r"shartnoma",
        r"majburiyat", r"mulk huquqi", r"bitim", r"yuridik shaxs",
        r"da.vo muddati", r"meros",
    ]),
    ("Soliq kodeksi", "tax_code", [
        r"soliq kodeksi", r"soliq qonunchiligi", r"daromad", r"soliq to.lovchi",
        r"stavka", r"soliq davri", r"QQS", r"foyda",
    ]),
    ("Mehnat kodeksi", "labor_code", [
        r"mehnat kodeksi", r"ish beruvchi", r"xodim", r"ish haqi",
        r"mehnat shartnomasi", r"ta.til", r"ish vaqti",
        r"ishdan bo.shatish",
    ]),
]

def identify_code(text, filename):
    text_lower = text.lower()
    scores = []
    fname_lower = filename.lower()
    for name, code_id, _ in CODE_PATTERNS:
        kw = name.lower().split()[0] if ' ' in name else name.lower()
        if kw in fname_lower:
            return code_id, name, 100
    for name, code_id, patterns in CODE_PATTERNS:
        score = 0
        matched = []
        for p in patterns:
            count = len(re.findall(p, text_lower))
            if count > 0:
                score += min(count * 2, 20)
                matched.append(p[:20])
        scores.append((score, code_id, name, matched))
    scores.sort(key=lambda x: -x[0])
    if scores and scores[0][0] >= 5:
        return scores[0][1], scores[0][2], scores[0][0]
    return None, None, 0

folder = sys.argv[1] if len(sys.argv) > 1 else "."
folder_path = Path(folder)
pdfs = sorted([f for f in os.listdir(folder) if f.lower().endswith('.pdf')])

print("=" * 60)
print("PDF Identification Report")
print(f"Folder: {folder}")
print(f"Total PDFs: {len(pdfs)}")
print("=" * 60)

for pdf in pdfs:
    fp = folder_path / pdf
    size_kb = fp.stat().st_size / 1024
    print(f"\n--- {pdf} ({size_kb:.0f} KB) ---")
    
    text, method = extract_first_chars(str(fp))
    if not method:
        print(f"  ERROR: {text}")
        continue
    
    preview = text[:500].replace('\n', ' ').strip()
    print(f"  Preview: {preview[:150]}...")
    
    code_id, name, score = identify_code(text, pdf)
    if code_id:
        print(f"  >> IDENTIFIED: {name} ({code_id}) score={score}")
    else:
        print(f"  >> UNIDENTIFIED")
        print(f"  >> First chars: {preview[:200]}")
    
    print(f"  Method: {method}, chars: {len(text)}")

print("\n" + "=" * 60)
print("DONE")
print("=" * 60)
