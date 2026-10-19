# Ferramentas do site Soft Communication

Estas pastas ficam fora de `maquette/` de propósito: não vão para a hospedagem.

| Arquivo | Para quê |
| --- | --- |
| `build_site.py` | Gera a página mãe em PT (raiz e `pt/`), FR e EN, e as 4 páginas legais de cada idioma. Rode de novo ao mudar qualquer texto. |
| `dev_watch.py` | **Automação**: Watcher de auto-build em tempo real + servidor HTTP local embutido (`--serve`). |
| `audit_site.py` | **Automação**: Auditoria automática de integridade, links (zero 404), SEO e ativos do catálogo. |
| `sync_catalog.py` | **Automação**: Baixa e sincroniza o catálogo mais recente do Supabase para os arquivos locais. |
| `test_lead_notification.py` | **Automação**: Testador e disparador de notificações de leads (Discord, Telegram, Resend). |
| `legal_content.py` | Texto das páginas legais (PT/FR/EN). Campos desconhecidos ficam entre colchetes. |
| `build_catalog.py` | Gera `assets/data/catalog.js` e `catalog.json` (os 52 vídeos, com proporção real, capas e traduções). |
| `origem/` | Dados de entrada do catálogo (extraídos da página, da mediateca e medidos nos arquivos). |
| `automacoes_supabase.sql` | Triggers de Lead Scoring inteligente, atualização automática de data e fila de webhooks. |
| `supabase.sql`, `supabase_seed.sql` | Tabela, permissões e catálogo inicial para o Supabase. |
| `SETUP_SUPABASE.md`, `GUIA_AUTOMACAO.md` | Guias de configuração e automações ativas no projeto. |

| `preloader.py` | Monta o SVG do preloader a partir do logo oficial: separa S, O, F, T e as 13 letras de COMMUNICATION e define as linhas de escrita (`STROKES`). |

## Rodar automações
```
python3 ferramentas/dev_watch.py --serve   # Watcher com auto-build ao vivo + servidor HTTP
python3 ferramentas/audit_site.py          # Auditoria de links, SEO e catálogo
python3 ferramentas/sync_catalog.py        # Sincronizar catálogo do Supabase para o site
```

## Onde mexer
- Textos fixos da página: `STRINGS` em `build_site.py` (chaves por idioma).
- Contato: `WA`, `EMAIL`, `PHONE` no topo de `build_site.py` e `maquette/assets/js/config.js`.
- Vídeos, ordem, títulos, direitos: pelo painel `admin/mediatheque.html` e `admin/projet.html`.
- Desenho: `maquette/assets/css/tokens.css` e `site.css` (quatro cores da marca, Cormorant e Poppins).

## Atenção
- `build_site.py` reescreve `index.html`, `pt|fr|en/*.html`. Não edite essas páginas à mão: a próxima geração apaga.
- O painel não altera arquivos: ele grava no Supabase (ou no navegador, em modo local).

## Preloader (surge do chão em 3D, perfil « motion limpo »)
- Sequência: linha de horizonte se estende (0,15 s) → o wordmark SOFT nasce deitado atrás da linha e se levanta em 3D (0,4–1,3 s) → COMMUNICATION vem atrás (1,0–1,7 s) → pausa → cortina sobe (2,25–2,9 s). Total 2,9 s.
- Arquivos: `ferramentas/preloader.py` (`svg3d()`, vetor oficial em dois SVG), `maquette/assets/js/preloader.js` (linha do tempo `T` e os 4 SFX), `maquette/assets/audio/`, bloco `.preloader` em `site.css`.
- Ver de novo: `?intro=1`. Clique, Esc, Enter ou espaço pulam. Uma vez por sessão; some com "reduzir movimento".
- Som só depois de um toque do visitante (regra dos navegadores). Sem toque: roda mudo e mostra "Toque para ativar o som".
