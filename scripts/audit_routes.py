#!/usr/bin/env python3
import os, re, sys

all_links = {}
for root, dirs, files in os.walk('src'):
    for f in files:
        if not (f.endswith('.tsx') or f.endswith('.ts') or f.endswith('.jsx') or f.endswith('.js')):
            continue
        path = os.path.join(root, f).replace('\\', '/')
        try:
            with open(os.path.join(root, f), 'r', encoding='utf-8') as fp:
                content = fp.read()
            for m in re.finditer(r"""href=['"](\/[^'"\s>]+)['"]""", content):
                href = m.group(1)
                if not href.startswith('http') and not href.startswith('#') and '?' not in href:
                    if href not in all_links:
                        all_links[href] = []
                    all_links[href].append(path)
            for m in re.finditer(r"""router\.push\(['"](\/[^'"\s>]+)['"]\)""", content):
                href = m.group(1)
                if href not in all_links:
                    all_links[href] = []
                    if path not in all_links[href]:
                        all_links[href].append(path)
        except Exception as e:
            print(f"Error reading {path}: {e}", file=sys.stderr)

built_routes = {
    '/', '/admin', '/admin/users', '/billing', '/case-solver', '/community',
    '/court-simulator', '/create-admin', '/dashboard', '/debug-auth',
    '/decision-tree', '/demo-lawyer', '/document-generator', '/help', '/irac',
    '/landing', '/lawyer-dashboard', '/lawyer-login', '/lawyer-register',
    '/legal-database', '/legal-database-new', '/manual-payment',
    '/missing-features', '/payment-admin', '/premium', '/pricing', '/privacy',
    '/pro-tools', '/professional-tools', '/profile', '/qonunlar',
    '/scenario-generator', '/setup-supabase', '/signin', '/signup',
    '/simulator', '/statistics', '/tasks', '/terms', '/test-auth',
    '/virtual-court', '/voice-test', '/weakness-detector', '/auth/callback'
}

print('')
print('=== ALL LINKS FOUND IN PROJECT ===')
print('')
broken = []
for href in sorted(all_links.keys()):
    status = 'BROKEN' if href not in built_routes else 'OK'
    if href not in built_routes:
        broken.append(href)
    print(f'[{status}] {href}')
    for src in all_links[href]:
        print(f'     from {src}')
    print()

print(f'Total unique hrefs found: {len(all_links)}')
print(f'Broken links count: {len(broken)}')
print()
if broken:
    print('=== BROKEN LINKS ===')
    for b in broken:
        print(f'  {b}')
        for src in all_links[b]:
            print(f'     from {src}')
