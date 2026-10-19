#!/usr/bin/env python3
"""Valida o pacote SEO. Uso: python3 validar.py [--lancamento] [PASTA_DO_SITE_HTML]
Sem --lancamento: avisa sobre placeholders mas não falha. Com --lancamento: DOMAIN_PLACEHOLDER, {{...}}, noindex e sameAs vazio FALHAM."""
import json, glob, os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
launch = "--lancamento" in sys.argv
site = next((a for a in sys.argv[1:] if not a.startswith("--")), None)
err, warn = [], []
meta = json.load(open(os.path.join(here, "metas.json"), encoding="utf-8"))["pages"]
paths = set()
for p in meta:
    for l in ("fr", "en"):
        t, d, pa = p[l]["title"], p[l]["description"], p[l]["path"]
        if len(t) > 60: err.append(f"{p['key']}/{l}: title {len(t)} > 60")
        if len(d) > 155: err.append(f"{p['key']}/{l}: description {len(d)} > 155")
        if len(d) < 50: warn.append(f"{p['key']}/{l}: description curta ({len(d)})")
        if pa in paths: err.append(f"rota duplicada {pa}")
        paths.add(pa)
        if not pa.startswith(f"/{l}"): err.append(f"{pa} não começa por /{l}")
for f in sorted(glob.glob(os.path.join(here, "jsonld", "*.json"))):
    raw = open(f, encoding="utf-8").read()
    try: data = json.loads(raw)
    except Exception as e: err.append(f"{os.path.basename(f)}: JSON inválido ({e})"); continue
    if "TEMPLATE" in f and launch and ("{{" in raw or "_LISEZ_MOI" in raw): warn.append(f"{os.path.basename(f)}: template ainda com {{...}} (ok se nenhuma página usa)")
    if "TEMPLATE" not in f and "{{" in raw: err.append(f"{os.path.basename(f)}: {{...}} esquecido")
    if '"sameAs": []' in raw: (err if launch else warn).append(f"{os.path.basename(f)}: sameAs vazio (preencher com perfis reais)")
for f in ("robots.txt", "sitemap.xml", "llms.txt"):
    raw = open(os.path.join(here, f), encoding="utf-8").read()
    if "DOMAIN_PLACEHOLDER" in raw: (err if launch else warn).append(f"{f}: ainda com DOMAIN_PLACEHOLDER")
sm = open(os.path.join(here, "sitemap.xml"), encoding="utf-8").read()
locs = set(re.findall(r"<loc>([^<]+)</loc>", sm))
for loc in locs:
    block = re.search(r"<url>\s*<loc>"+re.escape(loc)+r"</loc>(.*?)</url>", sm, re.S).group(1)
    for h in re.findall(r'href="([^"]+)"', block):
        if h not in locs: err.append(f"sitemap: hreflang aponta para URL fora do sitemap: {h}")
if site:
    for f in glob.glob(os.path.join(site, "**", "*.html"), recursive=True):
        h = open(f, encoding="utf-8", errors="ignore").read()
        rel = os.path.relpath(f, site)
        is_private = rel.startswith("admin") or rel.startswith("cliente") or rel.startswith("entrega") or rel.startswith("google")
        if is_private: continue
        if re.search(r'<meta name="robots" content="[^"]*noindex', h): (err if launch else warn).append(f"{rel}: noindex")
        if "<link rel=\"canonical\"" not in h: (err if launch else warn).append(f"{rel}: sem canonical")
        n = len(re.findall(r"<h1[\s>]", h))
        if n != 1: err.append(f"{rel}: {n} <h1> (deve ser 1)")
        for m in re.finditer(r'<img\b[^>]*>', h):
            if " alt=" not in m.group(0): err.append(f"{rel}: <img> sem alt")
        if re.search(r'hreflang="[a-z-]+"\s+href="(?!https?://)', h): (err if launch else warn).append(f"{rel}: hreflang com URL relativa (usar absoluta)")
for w in warn: print("AVISO ", w)
for e in err: print("ERRO  ", e)
print(f"\n{len(err)} erro(s), {len(warn)} aviso(s)")
sys.exit(1 if err else 0)
