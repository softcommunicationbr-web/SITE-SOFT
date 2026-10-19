#!/usr/bin/env python3
"""dev_watch.py · Observador de arquivos com auto-build em tempo real e servidor local.

Recursos:
- Monitora ferramentas/build_site.py, legal_content.py, preloader.py e origem/
- Recompila automaticamente o site em menos de 1 segundo ao salvar qualquer arquivo
- Servidor HTTP local embutido com rota direta para maquette/
- Zero dependências externas (roda 100% com a biblioteca padrão do Python)

Uso:
  python3 ferramentas/dev_watch.py             # Apenas auto-build contínuo
  python3 ferramentas/dev_watch.py --serve     # Auto-build + Servidor HTTP na porta 8080
  python3 ferramentas/dev_watch.py --serve 3000 --open  # Com porta personalizada e abre no navegador
"""

import os
import sys
import time
import subprocess
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(HERE, '..'))
BUILD_SITE_PY = os.path.join(HERE, 'build_site.py')
BUILD_CATALOG_PY = os.path.join(HERE, 'build_catalog.py')
ORIGEM_DIR = os.path.join(HERE, 'origem')
CSS_DIR = os.path.join(PROJECT_ROOT, 'maquette', 'assets', 'css')

WATCH_FILES = [
    BUILD_SITE_PY,
    os.path.join(HERE, 'auto_renovar_seo.py'),
    os.path.join(HERE, 'legal_content.py'),
    os.path.join(HERE, 'preloader.py'),
]

WATCH_DIRS = [
    ORIGEM_DIR,
]

def log(msg, symbol="⚡"):
    now = time.strftime("%H:%M:%S")
    print(f"[{now}] {symbol} {msg}")

def get_snapshot():
    snapshot = {}
    for f in WATCH_FILES:
        if os.path.exists(f):
            snapshot[f] = os.path.getmtime(f)
    for d in WATCH_DIRS:
        if os.path.exists(d):
            for root, _, files in os.walk(d):
                for f in files:
                    if f.endswith('.json') or f.endswith('.py'):
                        fp = os.path.join(root, f)
                        snapshot[fp] = os.path.getmtime(fp)
    return snapshot

def run_build(changed_file=None):
    if changed_file and 'origem' in changed_file:
        log(f"Alteração detectada em {os.path.basename(changed_file)}. Reconstruindo catálogo e site...", "🔄")
        try:
            res_cat = subprocess.run([sys.executable, '-I', BUILD_CATALOG_PY], cwd=PROJECT_ROOT, capture_output=True, text=True)
            if res_cat.returncode == 0:
                log("Catálogo reconstruído com sucesso.", "✓")
            else:
                log(f"Erro no catálogo: {res_cat.stderr}", "✗")
        except Exception as e:
            log(f"Falha ao rodar build_catalog: {e}", "✗")

    log(f"Reconstruindo páginas do site...", "🔨")
    start = time.time()
    try:
        res = subprocess.run([sys.executable, '-I', BUILD_SITE_PY], cwd=PROJECT_ROOT, capture_output=True, text=True)
        dur = (time.time() - start) * 1000
        if res.returncode == 0:
            log(f"Site reconstruído em {dur:.0f}ms (16 páginas atualizadas em PT, FR, EN).", "✓")
        else:
            log(f"Erro na reconstrução:\n{res.stderr}", "✗")
    except Exception as e:
        log(f"Falha ao executar build_site: {e}", "✗")

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_ROOT, **kwargs)

    def log_message(self, format, *args):
        # Silencia logs normais de 200/304 para manter o terminal limpo
        if len(args) > 1 and str(args[1]) in ('200', '304'):
            return
        super().log_message(format, *args)

def start_server(port=8080, auto_open=False):
    server = HTTPServer(('0.0.0.0', port), CustomHandler)
    url = f"http://localhost:{port}/maquette/"
    log(f"Servidor HTTP iniciado em {url}", "🌐")
    log("Pressione Ctrl+C para encerrar.", "ℹ")

    if auto_open:
        def _open():
            time.sleep(0.6)
            webbrowser.open(url)
        threading.Thread(target=_open, daemon=True).start()

    server.serve_forever()

def main():
    args = sys.argv[1:]
    serve = '--serve' in args
    auto_open = '--open' in args
    port = 8080

    for idx, arg in enumerate(args):
        if arg == '--serve' and idx + 1 < len(args) and args[idx + 1].isdigit():
            port = int(args[idx + 1])

    print("=" * 64)
    print("  SOFT COMMUNICATION · WATCHER E AUTO-BUILD EM TEMPO REAL")
    print("=" * 64)
    log("Monitorando arquivos de configuração, textos e catálogo...")

    # Executa build inicial para garantir sincronismo
    run_build()

    if serve:
        server_thread = threading.Thread(target=start_server, args=(port, auto_open), daemon=True)
        server_thread.start()

    last_snapshot = get_snapshot()

    try:
        while True:
            time.sleep(0.5)
            current_snapshot = get_snapshot()
            changed = None

            for path, mtime in current_snapshot.items():
                if path not in last_snapshot or mtime > last_snapshot[path]:
                    changed = path
                    break

            if changed:
                last_snapshot = current_snapshot
                run_build(changed)

    except KeyboardInterrupt:
        print("\n")
        log("Watcher finalizado com sucesso. Até logo!", "👋")

if __name__ == '__main__':
    main()
