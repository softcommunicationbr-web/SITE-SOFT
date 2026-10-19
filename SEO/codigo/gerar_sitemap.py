#!/usr/bin/env python3
"""Gera sitemap.xml (com hreflang recíproco + x-default=FR) a partir de metas.json.
Uso: python3 gerar_sitemap.py DOMINIO [AAAA-MM-DD]   ex.: python3 gerar_sitemap.py https://exemplo.com 2026-10-11
Projetos do portfólio: acrescente em projetos.json (lista de {fr:'/fr/portfolio/x', en:'/en/work/x', lastmod:'AAAA-MM-DD'})."""
import json, sys, os
from xml.sax.saxutils import escape
here = os.path.dirname(os.path.abspath(__file__))
dom = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "https://DOMAIN_PLACEHOLDER"
lastmod = sys.argv[2] if len(sys.argv) > 2 else None
pages = json.load(open(os.path.join(here, "metas.json"), encoding="utf-8"))["pages"]
items = [(p["fr"]["path"], p["en"]["path"], p["priority"], lastmod) for p in pages if p["sitemap"]]
pj = os.path.join(here, "projetos.json")
if os.path.exists(pj):
    for x in json.load(open(pj, encoding="utf-8")):
        items.append((x["fr"], x["en"], "0.7", x.get("lastmod", lastmod)))
out = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
for fr, en, prio, lm in items:
    for loc in (fr, en):
        out.append("  <url>")
        out.append(f"    <loc>{escape(dom+loc)}</loc>")
        out.append(f'    <xhtml:link rel="alternate" hreflang="fr" href="{escape(dom+fr)}"/>')
        out.append(f'    <xhtml:link rel="alternate" hreflang="en" href="{escape(dom+en)}"/>')
        out.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{escape(dom+fr)}"/>')
        if lm: out.append(f"    <lastmod>{lm}</lastmod>")
        out.append(f"    <priority>{prio}</priority>")
        out.append("  </url>")
out.append("</urlset>")
open(os.path.join(here, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print(f"sitemap.xml: {len(items)*2} URLs")
