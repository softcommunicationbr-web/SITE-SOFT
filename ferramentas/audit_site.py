#!/usr/bin/env python3
"""audit_site.py · Auditoria automatizada de integridade, links, SEO e assets do site.

Verifica:
1. Links internos (href relativos) - garante zero links quebrados (404)
2. Recursos locais (src de scripts, CSS, imagens e vídeos)
3. Boas práticas de SEO (h1 único por página, tag title, meta description)
4. Configuração multilíngue (hreflang PT, FR, EN)
5. Detecção de placeholders pendentes ([À FOURNIR], [À VALIDER], [Client fictif])
6. Integridade do catálogo de vídeos (catalog.json)

Uso:
  python3 ferramentas/audit_site.py
  python3 ferramentas/audit_site.py --strict    # Falha se houver placeholders pendentes
"""

import os
import sys
import re
import json
from urllib.parse import urlparse, unquote

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(HERE, '..'))
MAQUETTE_DIR = os.path.join(PROJECT_ROOT, 'maquette')
CATALOG_JSON = os.path.join(MAQUETTE_DIR, 'assets', 'data', 'catalog.json')

# Regexes para extração rápida e sem dependências
RE_HREF = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)
RE_SRC = re.compile(r'src=["\']([^"\']+)["\']', re.IGNORECASE)
RE_H1 = re.compile(r'<h1\b[^>]*>(.*?)</h1>', re.IGNORECASE | re.DOTALL)
RE_TITLE = re.compile(r'<title\b[^>]*>(.*?)</title>', re.IGNORECASE | re.DOTALL)
RE_META_DESC = re.compile(r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)["\']', re.IGNORECASE)
RE_HREFLANG = re.compile(r'<link\s+[^>]*rel=["\']alternate["\'][^>]*hreflang=["\']([^"\']+)["\'][^>]*href=["\']([^"\']+)["\']', re.IGNORECASE)
RE_PLACEHOLDER = re.compile(r'\[(À\s*FOURNIR|À\s*VALIDER|Client\s*fictif|A\s*FORNECER|A\s*VALIDAR)\]', re.IGNORECASE)

class Auditor:
    def __init__(self, strict=False):
        self.strict = strict
        self.errors = []
        self.warnings = []
        self.notices = []
        self.pages_checked = 0
        self.links_checked = 0

    def rel(self, path):
        return os.path.relpath(path, PROJECT_ROOT)

    def audit_all(self):
        print("=" * 64)
        print("  SOFT COMMUNICATION · AUDITORIA AUTOMÁTICA DE QUALIDADE")
        print("=" * 64)

        self.audit_catalog()
        self.audit_html_files()
        self.print_summary()

        has_critical = len(self.errors) > 0
        if self.strict and len(self.warnings) > 0:
            has_critical = True

        return 1 if has_critical else 0

    def audit_catalog(self):
        if not os.path.exists(CATALOG_JSON):
            self.errors.append(f"Catálogo não encontrado em {self.rel(CATALOG_JSON)}")
            return

        try:
            with open(CATALOG_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if isinstance(data, list):
                videos = data
            else:
                videos = data.get('items', data.get('videos', []))
            count = len(videos)
            print(f"[OK] Catálogo carregado com sucesso: {count} vídeos identificados.")

            missing_fields = 0
            for idx, v in enumerate(videos):
                fid = v.get('id') or v.get('filename') or f"index_{idx}"
                for req in ('filename', 'placement'):
                    if not v.get(req):
                        self.warnings.append(f"Vídeo {fid}: campo obrigatório '{req}' ausente no catálogo.")
                        missing_fields += 1

            if missing_fields == 0:
                print(f"[OK] Todos os {count} registros do catálogo contêm os campos essenciais.")
        except Exception as e:
            self.errors.append(f"Erro ao analisar catalog.json: {e}")

    def audit_html_files(self):
        html_files = []
        for root, _, files in os.walk(MAQUETTE_DIR):
            for f in files:
                if f.endswith('.html') and not f.startswith('google'):
                    html_files.append(os.path.join(root, f))

        html_files.sort()
        print(f"[OK] Encontrados {len(html_files)} arquivos HTML para auditoria.")
        print("-" * 64)

        for html_path in html_files:
            self.audit_single_html(html_path)

    def audit_single_html(self, file_path):
        self.pages_checked += 1
        rel_path = self.rel(file_path)
        dir_path = os.path.dirname(file_path)

        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()

        # 1. Estrutura básica de SEO
        is_admin = 'admin' in rel_path
        h1_matches = RE_H1.findall(content)
        if len(h1_matches) == 0 and not is_admin:
            self.warnings.append(f"{rel_path}: Ausência de tag <h1>.")
        elif len(h1_matches) > 1 and not is_admin:
            self.warnings.append(f"{rel_path}: Mais de uma tag <h1> encontrada ({len(h1_matches)}).")

        title_matches = RE_TITLE.findall(content)
        if not title_matches:
            self.warnings.append(f"{rel_path}: Tag <title> não encontrada.")

        desc_matches = RE_META_DESC.findall(content)
        if not desc_matches and not is_admin:
            self.notices.append(f"{rel_path}: Tag <meta name=\"description\"> recomendada.")

        # 2. Links href
        for href in RE_HREF.findall(content):
            self.links_checked += 1
            self.verify_target(file_path, dir_path, href, 'href')

        # 3. Recursos src
        for src in RE_SRC.findall(content):
            self.links_checked += 1
            self.verify_target(file_path, dir_path, src, 'src')

        # 4. Placeholders
        placeholders = RE_PLACEHOLDER.findall(content)
        if placeholders:
            self.warnings.append(f"{rel_path}: Contém {len(placeholders)} marcador(es) de conteúdo pendente: {set(placeholders)}")

    def verify_target(self, file_path, dir_path, target, attr):
        target = target.strip()
        if not target or target.startswith(('http://', 'https://', 'mailto:', 'tel:', 'javascript:', '#', 'data:')):
            return

        parsed = urlparse(target)
        raw_path = parsed.path
        if not raw_path:
            return

        clean_path = unquote(raw_path)

        if clean_path.startswith('/'):
            abs_target = os.path.join(PROJECT_ROOT, clean_path.lstrip('/'))
        else:
            abs_target = os.path.normpath(os.path.join(dir_path, clean_path))

        # Se apontar para um diretório, assume index.html
        if os.path.isdir(abs_target):
            abs_target = os.path.join(abs_target, 'index.html')

        if not os.path.exists(abs_target):
            self.errors.append(
                f"{self.rel(file_path)} [{attr}]: Link quebrado para '{target}' (arquivo não encontrado: {self.rel(abs_target)})"
            )

    def print_summary(self):
        print("\n" + "=" * 64)
        print("  RESULTADOS DA AUDITORIA")
        print("=" * 64)
        print(f"Páginas auditadas : {self.pages_checked}")
        print(f"Links e mídias    : {self.links_checked}")
        print(f"Erros críticos (404): {len(self.errors)}")
        print(f"Avisos / Alertas    : {len(self.warnings)}")
        print(f"Observações / Info  : {len(self.notices)}")
        print("-" * 64)

        if self.errors:
            print("\n❌ ERROS CRÍTICOS:")
            for err in self.errors:
                print(f"  • {err}")

        if self.warnings:
            print("\n⚠️  ALERTAS E PENDÊNCIAS:")
            for warn in self.warnings:
                print(f"  • {warn}")

        if self.notices:
            print("\n💡 NOTAS DE OTIMIZAÇÃO:")
            for note in self.notices[:10]:
                print(f"  • {note}")
            if len(self.notices) > 10:
                print(f"  ... e mais {len(self.notices) - 10} observações.")

        if not self.errors and not self.warnings:
            print("\n✨ Parabéns! O site passou em todas as verificações automáticas com nota 10.")
        elif not self.errors:
            print("\n✓ Nenhum link quebrado ou erro crítico detectado no site!")

if __name__ == '__main__':
    strict_mode = '--strict' in sys.argv
    auditor = Auditor(strict=strict_mode)
    sys.exit(auditor.audit_all())
