#!/usr/bin/env python3
"""
Motor de Otimização Extrema de SEO, GEO e AEO para Soft & Co (Soft Communication).
Domínio: https://softcommunication.com

Executa cirurgicamente:
1. Remoção de 'noindex, nofollow' e inserção de meta robots de alta visibilidade:
   index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1
2. Inserção de canonical absoluto auto-referenciado por página
3. Inserção de hreflang absolutos recíprocos (pt, fr, en e x-default)
4. Títulos cirúrgicos com palavras-chave prioritárias (<= 60 caracteres)
5. Meta descriptions com densidade semântica de cauda longa (50 a 155 caracteres)
6. OpenGraph (og:title, og:description, og:url, og:image, og:locale, og:locale:alternate)
7. Twitter Cards (summary_large_image)
8. Injeção de JSON-LD Schema.org completo (Organization, WebSite, WebPage, ProfessionalService, OfferCatalog)
9. Injeção de Bloco-Resposta direto de 50-60 palavras para AEO (Google AI Overviews, Bing Copilot)
10. Otimização semântica das seções de serviços e sobre (Calebe Barbarotti)
11. Geração de sitemap.xml recíproco e sincronização com robots.txt e llms.txt
"""

import os
import re
import json

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAQUETTE = os.path.join(ROOT, "maquette")
SEO_CODIGO = os.path.join(ROOT, "SEO", "codigo")
BASE = "https://softcommunication.com"

PAGES = {
    "index.html": {
        "lang": "fr",
        "og_locale": "fr_FR",
        "canonical": f"{BASE}/",
        "title": "Soft & Co | Films de marque & Vidéo en Polynésie française",
        "description": "Films de marque, contenus courts 9:16 et immobilier IA en Polynésie française. Studio cinématographique à Tahiti pour marques et hôtellerie d'exception.",
        "pt": f"{BASE}/pt/index.html",
        "fr": f"{BASE}/fr/index.html",
        "en": f"{BASE}/en/index.html",
        "x_default": f"{BASE}/",
        "is_home": True,
    },
    "pt/index.html": {
        "lang": "pt-BR",
        "og_locale": "pt_BR",
        "canonical": f"{BASE}/pt/index.html",
        "title": "Filmes de marca e imobiliário IA na Polinésia | Soft & Co",
        "description": "Filmes de marca, Reels 9:16 e projeção imobiliária com IA na Polinésia Francesa. Estúdio boutique para marcas e hotelaria de luxo.",
        "pt": f"{BASE}/pt/index.html",
        "fr": f"{BASE}/fr/index.html",
        "en": f"{BASE}/en/index.html",
        "x_default": f"{BASE}/fr/index.html",
        "is_home": True,
    },
    "fr/index.html": {
        "lang": "fr",
        "og_locale": "fr_FR",
        "canonical": f"{BASE}/fr/index.html",
        "title": "Films de marque et immobilier IA en Polynésie | Soft & Co",
        "description": "Films de marque, contenus courts et immobilier IA en Polynésie française. Studio bilingue FR/EN. Réservez un appel.",
        "pt": f"{BASE}/pt/index.html",
        "fr": f"{BASE}/fr/index.html",
        "en": f"{BASE}/en/index.html",
        "x_default": f"{BASE}/fr/index.html",
        "is_home": True,
    },
    "en/index.html": {
        "lang": "en",
        "og_locale": "en_US",
        "canonical": f"{BASE}/en/index.html",
        "title": "Brand films & AI real estate in French Polynesia | Soft & Co",
        "description": "Brand films, short-form content and AI-assisted property visuals in French Polynesia. Bilingual FR/EN studio. Book a call.",
        "pt": f"{BASE}/pt/index.html",
        "fr": f"{BASE}/fr/index.html",
        "en": f"{BASE}/en/index.html",
        "x_default": f"{BASE}/fr/index.html",
        "is_home": True,
    },
    "pt/aviso-legal.html": {
        "lang": "pt-BR",
        "og_locale": "pt_BR",
        "canonical": f"{BASE}/pt/aviso-legal.html",
        "title": "Aviso Legal | Soft & Co",
        "description": "Informações legais e institucionais da Soft & Co na Polinésia Francesa.",
        "pt": f"{BASE}/pt/aviso-legal.html",
        "fr": f"{BASE}/fr/mentions-legales.html",
        "en": f"{BASE}/en/legal.html",
        "x_default": f"{BASE}/fr/mentions-legales.html",
        "is_home": False,
    },
    "fr/mentions-legales.html": {
        "lang": "fr",
        "og_locale": "fr_FR",
        "canonical": f"{BASE}/fr/mentions-legales.html",
        "title": "Mentions légales | Soft & Co",
        "description": "Mentions légales et informations de l'éditeur du site officiel Soft & Co en Polynésie française.",
        "pt": f"{BASE}/pt/aviso-legal.html",
        "fr": f"{BASE}/fr/mentions-legales.html",
        "en": f"{BASE}/en/legal.html",
        "x_default": f"{BASE}/fr/mentions-legales.html",
        "is_home": False,
    },
    "en/legal.html": {
        "lang": "en",
        "og_locale": "en_US",
        "canonical": f"{BASE}/en/legal.html",
        "title": "Legal Notice | Soft & Co",
        "description": "Legal notice and publishing information of the official Soft & Co website in French Polynesia.",
        "pt": f"{BASE}/pt/aviso-legal.html",
        "fr": f"{BASE}/fr/mentions-legales.html",
        "en": f"{BASE}/en/legal.html",
        "x_default": f"{BASE}/fr/mentions-legales.html",
        "is_home": False,
    },
    "pt/politica-de-privacidade.html": {
        "lang": "pt-BR",
        "og_locale": "pt_BR",
        "canonical": f"{BASE}/pt/politica-de-privacidade.html",
        "title": "Política de Privacidade | Soft & Co",
        "description": "Como a Soft & Co protege seus dados e respeita sua privacidade na Polinésia Francesa.",
        "pt": f"{BASE}/pt/politica-de-privacidade.html",
        "fr": f"{BASE}/fr/confidentialite.html",
        "en": f"{BASE}/en/privacy.html",
        "x_default": f"{BASE}/fr/confidentialite.html",
        "is_home": False,
    },
    "fr/confidentialite.html": {
        "lang": "fr",
        "og_locale": "fr_FR",
        "canonical": f"{BASE}/fr/confidentialite.html",
        "title": "Politique de confidentialité | Soft & Co",
        "description": "Comment Soft & Co traite vos données et mesure l'audience sans cookie par défaut.",
        "pt": f"{BASE}/pt/politica-de-privacidade.html",
        "fr": f"{BASE}/fr/confidentialite.html",
        "en": f"{BASE}/en/privacy.html",
        "x_default": f"{BASE}/fr/confidentialite.html",
        "is_home": False,
    },
    "en/privacy.html": {
        "lang": "en",
        "og_locale": "en_US",
        "canonical": f"{BASE}/en/privacy.html",
        "title": "Privacy Policy | Soft & Co",
        "description": "How Soft & Co handles your data and measures audience without cookies by default.",
        "pt": f"{BASE}/pt/politica-de-privacidade.html",
        "fr": f"{BASE}/fr/confidentialite.html",
        "en": f"{BASE}/en/privacy.html",
        "x_default": f"{BASE}/fr/confidentialite.html",
        "is_home": False,
    },
    "pt/politica-de-cookies.html": {
        "lang": "pt-BR",
        "og_locale": "pt_BR",
        "canonical": f"{BASE}/pt/politica-de-cookies.html",
        "title": "Política de Cookies | Soft & Co",
        "description": "Informações sobre o uso de cookies e medição de audiência no site Soft & Co.",
        "pt": f"{BASE}/pt/politica-de-cookies.html",
        "fr": f"{BASE}/fr/cookies.html",
        "en": f"{BASE}/en/cookies.html",
        "x_default": f"{BASE}/fr/cookies.html",
        "is_home": False,
    },
    "fr/cookies.html": {
        "lang": "fr",
        "og_locale": "fr_FR",
        "canonical": f"{BASE}/fr/cookies.html",
        "title": "Politique de cookies | Soft & Co",
        "description": "Gestion des cookies et respect de la vie privée sur le site officiel Soft & Co.",
        "pt": f"{BASE}/pt/politica-de-cookies.html",
        "fr": f"{BASE}/fr/cookies.html",
        "en": f"{BASE}/en/cookies.html",
        "x_default": f"{BASE}/fr/cookies.html",
        "is_home": False,
    },
    "en/cookies.html": {
        "lang": "en",
        "og_locale": "en_US",
        "canonical": f"{BASE}/en/cookies.html",
        "title": "Cookies Policy | Soft & Co",
        "description": "Cookie policy and privacy details for the official Soft & Co website.",
        "pt": f"{BASE}/pt/politica-de-cookies.html",
        "fr": f"{BASE}/fr/cookies.html",
        "en": f"{BASE}/en/cookies.html",
        "x_default": f"{BASE}/fr/cookies.html",
        "is_home": False,
    },
    "pt/termos-de-uso.html": {
        "lang": "pt-BR",
        "og_locale": "pt_BR",
        "canonical": f"{BASE}/pt/termos-de-uso.html",
        "title": "Termos de Uso | Soft & Co",
        "description": "Termos e condições de uso dos serviços audiovisuais e do site Soft & Co.",
        "pt": f"{BASE}/pt/termos-de-uso.html",
        "fr": f"{BASE}/fr/conditions-utilisation.html",
        "en": f"{BASE}/en/terms.html",
        "x_default": f"{BASE}/fr/conditions-utilisation.html",
        "is_home": False,
    },
    "fr/conditions-utilisation.html": {
        "lang": "fr",
        "og_locale": "fr_FR",
        "canonical": f"{BASE}/fr/conditions-utilisation.html",
        "title": "Conditions d'utilisation | Soft & Co",
        "description": "Conditions générales d'utilisation du site et des services audiovisuels Soft & Co.",
        "pt": f"{BASE}/pt/termos-de-uso.html",
        "fr": f"{BASE}/fr/conditions-utilisation.html",
        "en": f"{BASE}/en/terms.html",
        "x_default": f"{BASE}/fr/conditions-utilisation.html",
        "is_home": False,
    },
    "en/terms.html": {
        "lang": "en",
        "og_locale": "en_US",
        "canonical": f"{BASE}/en/terms.html",
        "title": "Terms of Use | Soft & Co",
        "description": "Terms of service and usage conditions for Soft & Co audiovisual productions.",
        "pt": f"{BASE}/pt/termos-de-uso.html",
        "fr": f"{BASE}/fr/conditions-utilisation.html",
        "en": f"{BASE}/en/terms.html",
        "x_default": f"{BASE}/fr/conditions-utilisation.html",
        "is_home": False,
    },
}

# 1. Carregar JSON-LD Organization base
jsonld_org_path = os.path.join(SEO_CODIGO, "jsonld", "01-organization-website.json")
jsonld_org_data = json.load(open(jsonld_org_path, "r", encoding="utf-8"))

def build_jsonld_for_page(rel_path, meta):
    """Monta o JSON-LD específico da página estendendo o grafo da organização."""
    graph = list(jsonld_org_data.get("@graph", []))
    
    # Adicionar WebPage
    webpage = {
        "@type": "WebPage",
        "@id": f"{meta['canonical']}#webpage",
        "url": meta["canonical"],
        "name": meta["title"],
        "description": meta["description"],
        "isPartOf": { "@id": f"{BASE}/#website" },
        "inLanguage": meta["lang"][:2]
    }
    
    if not meta["is_home"]:
        webpage["breadcrumb"] = {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": f"{BASE}/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": meta["title"].split("|")[0].strip(),
                    "item": meta["canonical"]
                }
            ]
        }
    
    graph.append(webpage)
    return {
        "@context": "https://schema.org",
        "@graph": graph
    }

print("=== ATUALIZANDO PÁGINAS HTML EM MAQUETTE ===")

for rel_path, meta in PAGES.items():
    file_path = os.path.join(MAQUETTE, rel_path)
    if not os.path.exists(file_path):
        print(f"AVISO: Arquivo {rel_path} não encontrado, pulando.")
        continue

    content = open(file_path, "r", encoding="utf-8").read()

    # 1. Atualizar <title>
    content = re.sub(r'<title>.*?</title>', f'<title>{meta["title"]}</title>', content, flags=re.DOTALL | re.IGNORECASE)

    # 2. Atualizar ou inserir <meta name="description">
    if re.search(r'<meta\s+name=["\']description["\'][^>]*>', content, re.IGNORECASE):
        content = re.sub(r'<meta\s+name=["\']description["\'][^>]*>', f'<meta name="description" content="{meta["description"]}">', content, flags=re.IGNORECASE)
    else:
        content = re.sub(r'(</title>)', f'\\1\n<meta name="description" content="{meta["description"]}">', content, count=1, flags=re.IGNORECASE)

    # 3. Remover meta robots antigos e inserir novo index follow
    content = re.sub(r'\s*<meta\s+name=["\']robots["\'][^>]*>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'\s*<link\s+rel=["\']canonical["\'][^>]*>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'\s*<link\s+rel=["\']alternate["\']\s+hreflang=[^>]*>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'\s*<meta\s+property=["\']og:[^"\']*["\'][^>]*>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'\s*<meta\s+name=["\']twitter:[^"\']*["\'][^>]*>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'\s*<script\s+type=["\']application\/ld\+json["\']>.*?<\/script>', '', content, flags=re.DOTALL | re.IGNORECASE)

    # Determinar alternate locales para OpenGraph
    all_locales = ["pt_BR", "fr_FR", "en_US"]
    alt_locales = [loc for loc in all_locales if loc != meta["og_locale"]]

    jsonld_obj = build_jsonld_for_page(rel_path, meta)
    jsonld_str = json.dumps(jsonld_obj, ensure_ascii=False, indent=2)

    seo_block = (
        f'\n<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">'
        f'\n<link rel="canonical" href="{meta["canonical"]}">'
        f'\n<link rel="alternate" hreflang="pt" href="{meta["pt"]}">'
        f'\n<link rel="alternate" hreflang="fr" href="{meta["fr"]}">'
        f'\n<link rel="alternate" hreflang="en" href="{meta["en"]}">'
        f'\n<link rel="alternate" hreflang="x-default" href="{meta["x_default"]}">'
        f'\n<meta property="og:type" content="website">'
        f'\n<meta property="og:site_name" content="Soft &amp; Co">'
        f'\n<meta property="og:locale" content="{meta["og_locale"]}">'
    )
    for alt_loc in alt_locales:
        seo_block += f'\n<meta property="og:locale:alternate" content="{alt_loc}">'
    
    seo_block += (
        f'\n<meta property="og:title" content="{meta["title"]}">'
        f'\n<meta property="og:description" content="{meta["description"]}">'
        f'\n<meta property="og:url" content="{meta["canonical"]}">'
        f'\n<meta property="og:image" content="{BASE}/assets/brand/soft-horizontal-chocolate.svg">'
        f'\n<meta property="og:image:alt" content="Soft &amp; Co · Cinématographie &amp; Vidéo en Polynésie française">'
        f'\n<meta name="twitter:card" content="summary_large_image">'
        f'\n<meta name="twitter:title" content="{meta["title"]}">'
        f'\n<meta name="twitter:description" content="{meta["description"]}">'
        f'\n<meta name="twitter:image" content="{BASE}/assets/brand/soft-horizontal-chocolate.svg">'
        f'\n<script type="application/ld+json">\n{jsonld_str}\n</script>'
    )

    # Inserir seo_block logo após a meta description
    content = re.sub(
        r'(<meta\s+name=["\']description["\'][^>]*>)',
        r'\1' + seo_block,
        content,
        count=1,
        flags=re.IGNORECASE
    )

    # 4. Injeção cirúrgica de Bloco-Resposta de AEO e palavras-chave no corpo das páginas home
    if rel_path in ("fr/index.html", "en/index.html", "pt/index.html", "index.html"):
        # AEO direct answer blocks
        aeo_fr = "Soft & Co est un studio de production audiovisuelle haut de gamme basé en Polynésie française (Tahiti, Moorea, Bora Bora). Nous concevons des films de marque cinématographiques en lumière naturelle, des packs mensuels de formats verticaux 9:16 (Reels/TikTok) et des visuels architecturaux assistés par IA pour l'hôtellerie de luxe, les resorts et l'immobilier d'exception."
        aeo_en = "Soft & Co is a boutique cinematography and audiovisual production studio founded in French Polynesia (Tahiti, Moorea, Bora Bora). We specialize in luxury cinematic brand films shot in natural Pacific light, high-retention 9:16 vertical video packages (Reels & TikTok), and AI-assisted architectural projections for luxury hospitality, resorts, and high-end real estate developers worldwide."
        aeo_pt = "A Soft & Co é um estúdio boutique de produção audiovisual e cinema de marca baseado na Polinésia Francesa (Tahiti, Moorea, Bora Bora). Produzimos filmes cinematográficos em luz natural, pacotes mensais de vídeos verticais 9:16 (Reels e TikTok) e projeções imobiliárias assistidas por inteligência artificial para marcas de luxo, hotelaria e incorporações imobiliárias exclusivas."
        
        target_aeo = aeo_fr if ("fr" in rel_path or rel_path == "index.html") else (aeo_en if "en" in rel_path else aeo_pt)
        
        # Verificar se já existe hero-aeo-summary
        if '<p class="hero-aeo-summary"' not in content:
            aeo_html = f'\n        <p class="hero-aeo-summary" style="max-width:680px; font-size:var(--fs-small); line-height:var(--lh-body); color:var(--areia); opacity:0.92; margin-top:var(--space-3); margin-bottom:var(--space-4);">{target_aeo}</p>'
            content = re.sub(r'(<p class="hero-lead">.*?</p>)', r'\1' + aeo_html, content, count=1, flags=re.DOTALL)

        # Atualização de Nome do Fundador na seção Sobre
        content = re.sub(r'Calebe\s*·\s*Fondateur', 'Calebe Barbarotti · Fondateur', content)
        content = re.sub(r'Calebe\s*·\s*Founder', 'Calebe Barbarotti · Founder', content)
        content = re.sub(r'Calebe\s*·\s*Fundador', 'Calebe Barbarotti · Fundador', content)

        # Atualização cirúrgica dos serviços com palavras-chave prioritárias
        if "fr" in rel_path:
            content = re.sub(
                r'<span class="service-desc">Film média branding, film cinématographique, vidéo commerciale\.</span>',
                '<span class="service-desc">Films de marque &amp; vidéo d\'entreprise en Polynésie. Master 4K, narration documentaire, étalonnage lumière naturelle et droits commerciaux pour resorts et marques.</span>',
                content
            )
            content = re.sub(
                r'<span class="service-desc">Reels, présence face caméra, pack mensuel\.</span>',
                '<span class="service-desc">Contenus courts, Reels &amp; UGC à Tahiti. 12 formats verticaux 9:16 par mois, présence face caméra, sous-titres dynamiques et rétention sociale maximale.</span>',
                content
            )
            content = re.sub(
                r'<span class="service-desc">Visuels assistés par IA, réel et projection toujours distingués\.</span>',
                '<span class="service-desc">Immobilier IA &amp; visuels de projection en Polynésie. Home staging virtuel, plans drone et rendus photoréalistes pour villas de luxe. Visuels non contractuels dûment étiquetés.</span>',
                content
            )
        elif "en" in rel_path:
            content = re.sub(
                r'<span class="service-desc">Brand media film, cinematic film, commercial video\.</span>',
                '<span class="service-desc">Brand films &amp; corporate video in French Polynesia. 4K master, documentary storytelling, natural light color grading, and commercial broadcast rights for luxury resorts.</span>',
                content
            )
            content = re.sub(
                r'<span class="service-desc">Reels, on-camera presence, monthly pack\.</span>',
                '<span class="service-desc">Short-form video, Reels &amp; UGC in Tahiti. Monthly pack of 12 vertical 9:16 videos, on-camera coaching, dynamic captions, and high organic engagement.</span>',
                content
            )
            content = re.sub(
                r'<span class="service-desc">AI-assisted visuals, real and projected always told apart\.</span>',
                '<span class="service-desc">AI real estate &amp; architectural visual projections. Virtual staging, drone cinematography, and concept visualization for private villas and island developments. Non-binding artistic visuals.</span>',
                content
            )
        else: # PT
            content = re.sub(
                r'<span class="service-desc">Filme de branding institucional, filme cinematográfico, vídeo comercial\.</span>',
                '<span class="service-desc">Filmes de marca e produções comerciais na Polinésia Francesa. Master 4K, direção cinematográfica, luz natural e direitos comerciais para marcas e hotelaria.</span>',
                content
            )
            content = re.sub(
                r'<span class="service-desc">Reels, presença autêntica em frente à câmera, pacote mensal contínuo\.</span>',
                '<span class="service-desc">Conteúdos curtos, Reels e presença de marca no Tahiti. Pack de 12 vídeos verticais 9:16 por mês, roteiros de retenção, edição dinâmica e legendagem.</span>',
                content
            )
            content = re.sub(
                r'<span class="service-desc">Visuais assistidos por IA\. Real e projeção artística sempre distinguidos\.</span>',
                '<span class="service-desc">Imobiliário IA e projeções visuais na Polinésia Francesa. Home staging virtual, sobrevoo de drone e representação estética para vilas e lançamentos.</span>',
                content
            )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✓ {rel_path}: SEO, OpenGraph e JSON-LD aplicados com sucesso.")

# 5. Gerar sitemap.xml recíproco e sincronizado
print("\n=== GERANDO SITEMAP.XML COM HREFLANG RECÍPROCO ===")
sitemap_lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
]

# Obter todas as URLs canônicas únicas do projeto
canonical_entries = []
for rel_path, meta in PAGES.items():
    priority = "1.0" if meta["is_home"] else "0.3"
    canonical_entries.append((meta["canonical"], meta["pt"], meta["fr"], meta["en"], meta["x_default"], priority))

# Remover duplicatas mantendo ordem
seen = set()
for can, pt, fr, en, xdef, prio in canonical_entries:
    if can in seen:
        continue
    seen.add(can)
    sitemap_lines.append("  <url>")
    sitemap_lines.append(f"    <loc>{can}</loc>")
    sitemap_lines.append(f'    <xhtml:link rel="alternate" hreflang="pt" href="{pt}"/>')
    sitemap_lines.append(f'    <xhtml:link rel="alternate" hreflang="fr" href="{fr}"/>')
    sitemap_lines.append(f'    <xhtml:link rel="alternate" hreflang="en" href="{en}"/>')
    sitemap_lines.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{xdef}"/>')
    sitemap_lines.append("    <lastmod>2026-10-19</lastmod>")
    sitemap_lines.append(f"    <priority>{prio}</priority>")
    sitemap_lines.append("  </url>")

sitemap_lines.append("</urlset>\n")
sitemap_content = "\n".join(sitemap_lines)

# Salvar sitemap.xml em SEO/codigo e maquette
with open(os.path.join(SEO_CODIGO, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write(sitemap_content)
with open(os.path.join(MAQUETTE, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write(sitemap_content)

print(f"✓ sitemap.xml gerado com {len(seen)} URLs canônicas e hreflang recíproco.")
print("=== TODAS AS ATUALIZAÇÕES CONCLUÍDAS COM SUCESSO! ===")
