#!/usr/bin/env python3
"""sync_catalog.py · Sincroniza o catálogo local com o Supabase em tempo real.

Busca os vídeos atualizados na tabela 'portfolio_videos' do Supabase e regrava
maquette/assets/data/catalog.json e catalog.js, mantendo backup automático.

Uso:
  python3 ferramentas/sync_catalog.py
"""

import os
import sys
import re
import json
import urllib.request
import urllib.error
import shutil
import time

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(HERE, '..'))
CONFIG_JS = os.path.join(PROJECT_ROOT, 'maquette', 'assets', 'js', 'config.js')
OUT_DIR = os.path.join(PROJECT_ROOT, 'maquette', 'assets', 'data')
OUT_JSON = os.path.join(OUT_DIR, 'catalog.json')
OUT_JS = os.path.join(OUT_DIR, 'catalog.js')

def extract_config():
    if not os.path.exists(CONFIG_JS):
        raise FileNotFoundError(f"Arquivo config.js não encontrado em {CONFIG_JS}")

    with open(CONFIG_JS, 'r', encoding='utf-8') as f:
        text = f.read()

    def get_var(name):
        m = re.search(r"['\"]?" + name + r"['\"]?\s*:\s*['\"]([^'\"]+)['\"]", text)
        return m.group(1) if m else None

    url = get_var('supabaseUrl')
    key = get_var('supabaseAnonKey')
    table = get_var('table') or 'portfolio_videos'
    bucket = get_var('bucket') or 'videos-portifolio'

    if not url or not key:
        raise ValueError("supabaseUrl ou supabaseAnonKey não definidos em config.js")

    return url.rstrip('/'), key, table, bucket

def sync():
    print("=" * 64)
    print("  SOFT COMMUNICATION · SINCRONIZAÇÃO DE CATÁLOGO COM SUPABASE")
    print("=" * 64)

    url, key, table, bucket = extract_config()
    print(f"📡 Conectando ao Supabase: {url}")
    print(f"📦 Tabela: {table} | Bucket: {bucket}")

    endpoint = f"{url}/rest/v1/{table}?order=placement.asc,position.asc"
    req = urllib.request.Request(endpoint)
    req.add_header('apikey', key)
    req.add_header('Authorization', f'Bearer {key}')
    req.add_header('Accept', 'application/json')

    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            if res.status != 200:
                print(f"❌ Erro HTTP {res.status} ao consultar Supabase.")
                return 1
            body = res.read().decode('utf-8')
            rows = json.loads(body)
    except Exception as e:
        print(f"❌ Falha de conexão com o Supabase: {e}")
        return 1

    print(f"✓ {len(rows)} vídeos recuperados com sucesso do banco.")

    if not rows:
        print("⚠️  Aviso: Nenhum vídeo retornado. Mantendo arquivos locais intactos.")
        return 0

    # Estrutura base pública de arquivos
    base_storage = f"{url}/storage/v1/object/public/{bucket}/"
    version_tag = time.strftime("%Y-%m-%d.%H%M")

    # Mapear e normalizar registros
    items = []
    for r in rows:
        item = {
            'id': r.get('id'),
            'filename': r.get('filename'),
            'aspect': r.get('aspect') or '16:9',
            'w': r.get('w') or 1920,
            'h': r.get('h') or 1080,
            'duration': float(r.get('duration') or 0.0),
            'size': int(r.get('size') or 0),
            'placement': r.get('placement') or 'library',
            'position': int(r.get('position') or 0),
            'title': r.get('title') or '',
            'label': r.get('label') or r.get('title') or '',
            'tags': r.get('tags') or '',
            'alt': r.get('alt') or '',
            'active': bool(r.get('active', True)),
            'hero': bool(r.get('hero', False)),
            'rights': r.get('rights') or 'a-confirmar',
            'note': r.get('note') or '',
            'poster': r.get('poster') or '',
            'i18n': r.get('i18n') or {}
        }
        for opt in ('service', 'sector', 'meta', 'ai'):
            if opt in r and r[opt] is not None:
                item[opt] = r[opt]
        items.append(item)

    catalog_data = {
        'version': version_tag,
        'base': base_storage,
        'items': items
    }

    # Backup antes de sobrescrever
    os.makedirs(OUT_DIR, exist_ok=True)
    if os.path.exists(OUT_JSON):
        shutil.copy2(OUT_JSON, OUT_JSON + '.bak')
    if os.path.exists(OUT_JS):
        shutil.copy2(OUT_JS, OUT_JS + '.bak')

    # Salva catalog.json
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(catalog_data, f, ensure_ascii=False, indent=1)

    # Salva catalog.js
    js_content = (
        '/* Catálogo sincronizado do Supabase por ferramentas/sync_catalog.py */\n'
        'window.SOFT_CATALOG = ' + json.dumps(catalog_data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    )
    with open(OUT_JS, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"✓ Arquivos locais atualizados com sucesso:")
    print(f"  • {os.path.relpath(OUT_JSON, PROJECT_ROOT)}")
    print(f"  • {os.path.relpath(OUT_JS, PROJECT_ROOT)}")
    print(f"  (Backups de segurança .bak criados)")
    print("=" * 64)
    return 0

if __name__ == '__main__':
    sys.exit(sync())
