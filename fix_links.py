#!/usr/bin/env python3
"""
fix_links.py

Scans HTML files in this folder for external links, checks each URL,
tries simple fixes (https/http, add/remove www, trailing slash), and
replaces broken links with working variants. Creates .bak backups.

Run locally from this folder:

    python fix_links.py

Requires network access. Uses urllib only (no extra packages).
"""
import os, re, ssl, sys
from urllib.parse import urlparse, urlunparse
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


ROOT = os.path.dirname(__file__)
HTML_FILES = [f for f in os.listdir(ROOT) if f.lower().endswith('.html')]
HREF_RE = re.compile(r'href=["\'](https?://[^"\']+)["\']', re.I)

# disable cert verification (helps with some self-signed or old sites)
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def is_working(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=8, context=CTX) as resp:
            code = getattr(resp, 'status', None) or getattr(resp, 'getcode', lambda: None)()
            if code and 200 <= code < 400:
                return True
            data = resp.read(100)
            return bool(data)
    except Exception:
        return False


def try_variants(url):
    if is_working(url):
        return url
    parsed = urlparse(url)
    variants = []
    # scheme swap
    variants.append(urlunparse(parsed._replace(scheme='https' if parsed.scheme=='http' else 'http')))
    # add/remove www
    net = parsed.netloc
    if net.startswith('www.'):
        variants.append(urlunparse(parsed._replace(netloc=net[4:])))
    else:
        variants.append(urlunparse(parsed._replace(netloc='www.'+net)))
    # trailing slash toggle
    if url.endswith('/'):
        variants.append(url.rstrip('/'))
    else:
        variants.append(url + '/')
    # combine first two variants
    extras = list(variants)
    for v in extras:
        p = urlparse(v)
        if p.netloc.startswith('www.'):
            variants.append(urlunparse(p._replace(netloc=p.netloc[4:])))
        else:
            variants.append(urlunparse(p._replace(netloc='www.'+p.netloc)))

    seen = set()
    for v in variants:
        if v in seen: continue
        seen.add(v)
        if is_working(v):
            return v
    return None


def main():
    print('Scanning HTML files in', ROOT)
    urls = set()
    contents = {}
    for fn in HTML_FILES:
        path = os.path.join(ROOT, fn)
        with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
            txt = fh.read()
        contents[fn] = txt
        for m in HREF_RE.finditer(txt):
            urls.add(m.group(1))

    print('Found', len(urls), 'unique external URLs in', len(HTML_FILES), 'files')

    mapping = {}
    for u in sorted(urls):
        print('Checking:', u)
        if is_working(u):
            print('  OK')
            continue
        alt = try_variants(u)
        if alt:
            print('  Will replace ->', alt)
            mapping[u] = alt
        else:
            print('  BROKEN (no quick fix found)')

    if not mapping:
        print('\nNo replacements needed.')
        return

    print('\nApplying replacements and creating backups...')
    for fn, txt in contents.items():
        new_txt = txt
        changed = False
        for old, new in mapping.items():
            if old in new_txt:
                new_txt = new_txt.replace(old, new)
                changed = True
        if changed:
            path = os.path.join(ROOT, fn)
            bak = path + '.bak'
            if not os.path.exists(bak):
                with open(bak, 'w', encoding='utf-8') as fh:
                    fh.write(txt)
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(new_txt)
            print('Updated', fn)

    print('\nDone. Summary:')
    for old, new in mapping.items():
        print(old, '->', new)

if __name__ == '__main__':
    main()
