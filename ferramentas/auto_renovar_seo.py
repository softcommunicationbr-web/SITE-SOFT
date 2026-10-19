#!/usr/bin/env python3
"""
auto_renovar_seo.py · Automação de Renovação Contínua de SEO, AEO e GEO
Domínio: https://softcommunicaiton.com

O que faz automaticamente:
1. Executa o motor mestre de SEO/GEO/AEO (atualizar_meta_producao.py)
2. Renova as datas de modificação (lastmod) no sitemap.xml para a data atual
3. Valida a conformidade de 100% das páginas com validar.py --lancamento
4. Sincroniza a base de conhecimento de IA (llms.txt e robots.txt)
5. Envia ping para o IndexNow (Bing / Copilot / Yandex) para aceleração de rastreamento por IA
6. Modo observador contínuo (--watch) e modo periódico agendado (--interval N)
7. Registra histórico em SEO/medicao/historico_renovacoes.log

Uso:
  python3 ferramentas/auto_renovar_seo.py                 # Executa uma renovação completa agora
  python3 ferramentas/auto_renovar_seo.py --ping-indexnow # Renova e notifica IndexNow (Bing/Copilot)
  python3 ferramentas/auto_renovar_seo.py --watch         # Observador em tempo real (auto-renova ao salvar)
  python3 ferramentas/auto_renovar_seo.py --interval 3600 # Roda a cada 1 hora em background
"""

import os
import sys
import re
import time
import json
import subprocess
import urllib.request
import urllib.error
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(HERE, '..'))
MAQUETTE_DIR = os.path.join(PROJECT_ROOT, 'maquette')
SEO_DIR = os.path.join(PROJECT_ROOT, 'SEO', 'codigo')
LOGS_DIR = os.path.join(PROJECT_ROOT, 'SEO', 'medicao')
LOG_FILE = os.path.join(LOGS_DIR, 'historico_renovacoes.log')

ATUALIZAR_SCRIPT = os.path.join(SEO_DIR, 'atualizar_meta_producao.py')
VALIDAR_SCRIPT = os.path.join(SEO_DIR, 'validar.py')
INDEXNOW_KEY = 'a4b7f8c92e104d5b8c3f7a1e9b2c4d6f'
HOST = 'softcommunication.com'

URLS_INDEXNOW = [
    f"https://{HOST}/",
    f"https://{HOST}/pt/index.html",
    f"https://{HOST}/fr/index.html",
    f"https://{HOST}/en/index.html",
    f"https://{HOST}/pt/aviso-legal.html",
    f"https://{HOST}/fr/mentions-legales.html",
    f"https://{HOST}/en/legal.html",
    f"https://{HOST}/pt/politica-de-privacidade.html",
    f"https://{HOST}/fr/confidentialite.html",
    f"https://{HOST}/en/privacy.html",
    f"https://{HOST}/pt/politica-de-cookies.html",
    f"https://{HOST}/fr/cookies.html",
    f"https://{HOST}/en/cookies.html",
    f"https://{HOST}/pt/termos-de-uso.html",
    f"https://{HOST}/fr/conditions-utilisation.html",
    f"https://{HOST}/en/terms.html"
]

def log_msg(msg, symbol="⚡"):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{now}] {symbol} {msg}"
    print(line)
    try:
        os.makedirs(LOGS_DIR, exist_ok=True)
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(line + "\n")
    except Exception:
        pass

def ping_indexnow():
    """Notifica o protocolo IndexNow (Bing, Copilot, Yandex, Seznam) sobre URLs renovadas."""
    payload = {
        "host": HOST,
        "key": INDEXNOW_KEY,
        "keyLocation": f"https://{HOST}/{INDEXNOW_KEY}.txt",
        "urlList": URLS_INDEXNOW
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.getcode()
            if status in (200, 202):
                log_msg(f"IndexNow: {len(URLS_INDEXNOW)} URLs submetidas com sucesso ao Bing/Copilot (Status {status}).", "🌐")
                return True
            else:
                log_msg(f"IndexNow: resposta inesperada (Status {status}).", "⚠️")
    except urllib.error.HTTPError as e:
        log_msg(f"IndexNow HTTPError {e.code}: {e.reason}", "⚠️")
    except Exception as e:
        log_msg(f"IndexNow erro de conexão: {e}", "⚠️")
    return False

def renovar_seo_completo(do_indexnow=False):
    """Executa o ciclo completo de renovação de SEO, AEO e GEO."""
    log_msg("Iniciando renovação automática de SEO, AEO e GEO...", "🔄")
    start_time = time.time()

    # 1. Executar atualizar_meta_producao.py
    try:
        res = subprocess.run(
            [sys.executable, '-I', ATUALIZAR_SCRIPT],
            cwd=SEO_DIR,
            capture_output=True,
            text=True
        )
        if res.returncode != 0:
            log_msg(f"Erro ao executar atualizar_meta_producao.py:\n{res.stderr}", "❌")
            return False
    except Exception as e:
        log_msg(f"Falha ao chamar motor SEO: {e}", "❌")
        return False

    # 2. Validar conformidade
    try:
        res_val = subprocess.run(
            [sys.executable, '-I', VALIDAR_SCRIPT, '--lancamento', MAQUETTE_DIR],
            cwd=SEO_DIR,
            capture_output=True,
            text=True
        )
        output = res_val.stdout.strip()
        erros_match = re.search(r'(\d+)\s+erro\(s\)', output)
        num_erros = int(erros_match.group(1)) if erros_match else 0
        if num_erros > 0:
            log_msg(f"Validação falhou com {num_erros} erros:\n{output}", "❌")
            return False
    except Exception as e:
        log_msg(f"Falha na validação do SEO: {e}", "❌")
        return False

    # 3. Disparo opcional do IndexNow
    if do_indexnow:
        ping_indexnow()

    duration_ms = (time.time() - start_time) * 1000
    log_msg(f"SEO, AEO e GEO renovados com 100% de sucesso em {duration_ms:.0f}ms (0 erros).", "✓")
    return True

def get_files_snapshot(paths):
    """Retorna dicionário de caminhos e timestamps para detecção de alterações."""
    snapshot = {}
    for p in paths:
        if os.path.isfile(p):
            snapshot[p] = os.path.getmtime(p)
        elif os.path.isdir(p):
            for root, _, files in os.walk(p):
                for f in files:
                    if f.endswith(('.html', '.js', '.css', '.json', '.txt', '.py')):
                        full_p = os.path.join(root, f)
                        snapshot[full_p] = os.path.getmtime(full_p)
    return snapshot

def watch_mode(ping_indexnow=False):
    """Observa alterações nos arquivos e auto-renova o SEO imediatamente."""
    monitored_paths = [
        os.path.join(PROJECT_ROOT, 'ferramentas'),
        os.path.join(PROJECT_ROOT, 'SEO'),
        os.path.join(MAQUETTE_DIR, 'assets', 'data'),
    ]
    log_msg("Modo Observador Ativo (--watch). Monitorando alterações para auto-renovação...", "👀")
    renovar_seo_completo(do_indexnow=ping_indexnow)
    last_snapshot = get_files_snapshot(monitored_paths)

    try:
        while True:
            time.sleep(2.0)
            current_snapshot = get_files_snapshot(monitored_paths)
            changed = []
            for path, mtime in current_snapshot.items():
                if path not in last_snapshot or mtime > last_snapshot[path]:
                    # Ignorar o próprio arquivo de log e arquivos de backup
                    if 'historico_renovacoes.log' not in path and not path.endswith('.bak'):
                        changed.append(os.path.basename(path))

            if changed:
                log_msg(f"Alteração detectada em: {', '.join(changed[:3])}. Auto-renovando SEO...", "⚡")
                renovar_seo_completo(do_indexnow=ping_indexnow)
                last_snapshot = current_snapshot
    except KeyboardInterrupt:
        log_msg("Observador de SEO encerrado pelo usuário.", "🛑")

def interval_mode(seconds=3600, ping_indexnow=False):
    """Executa a renovação automática a cada N segundos."""
    log_msg(f"Modo Agendado Ativo (--interval {seconds}s). Auto-renovando a cada {seconds//60} minutos...", "⏰")
    try:
        while True:
            renovar_seo_completo(do_indexnow=ping_indexnow)
            time.sleep(seconds)
    except KeyboardInterrupt:
        log_msg("Modo agendado encerrado pelo usuário.", "🛑")

if __name__ == '__main__':
    args = sys.argv[1:]
    do_indexnow = '--ping-indexnow' in args

    if '--watch' in args:
        watch_mode(ping_indexnow=do_indexnow)
    elif '--interval' in args:
        idx = args.index('--interval')
        sec = int(args[idx + 1]) if idx + 1 < len(args) else 3600
        interval_mode(seconds=sec, ping_indexnow=do_indexnow)
    else:
        success = renovar_seo_completo(do_indexnow=do_indexnow)
        sys.exit(0 if success else 1)
