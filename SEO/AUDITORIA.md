# Auditoria SEO — Fase 1 · Soft Communication (Soft&Co.)

**Data:** 29/10/2026 · **Branch:** `seo/fase-1-auditoria` · **Escopo:** working tree atual (inclui alterações ainda não commitadas) + deploy público `https://site-soft.vercel.app` (projeto Vercel `site-soft`).
**Método:** 6 auditorias independentes (arquitetura, indexação, performance, acessibilidade, dados estruturados/GEO, higiene/segurança), cada achado crítico ou alto reproduzido por um verificador cético. Lighthouse 12 (lab), `curl` no deploy e nos domínios, leitura do código e dos geradores. **Nada no site foi alterado nesta fase.**
**Convenções:** severidade = crítico / alto / médio / baixo. Impacto e esforço de 1 a 5. "Estimativa" = valor inferido, não medido. Nenhum volume de busca foi medido nesta fase.

> Este repositório está **público** no GitHub. Por isso o relatório omite de propósito o endereço citado nas páginas legais e os detalhes técnicos da falha do painel admin; esses dados foram passados diretamente ao dono.

---

## 1. Resumo executivo

1. **O site não está no domínio que ele declara.** Todos os canonicals, hreflang, `og:url`, sitemap, robots, JSON-LD, llms.txt e IndexNow apontam para `softcommunication.com`, que hoje é **uma página estacionada da GoDaddy com o domínio à venda**. O site real responde em `softcommunicaiton.com` (com erro de digitação), `www.softcommunicaiton.com` e `site-soft.vercel.app`, os três indexáveis e sem redirecionamento entre si. Enquanto isso não for resolvido, o Google não tem uma URL canônica válida para indexar. **Bloqueia todo o resto.**
2. **Risco de segurança fora do SEO, mas urgente:** o acesso ao painel admin é controlado só no navegador e há credencial exposta em código público (repositório GitHub público + JS publicado). Trocar a credencial e tornar o repositório privado antes de qualquer outra coisa.
3. **As alterações não commitadas mudam o posicionamento.** Elas tiram a Polinésia Francesa de títulos, descriptions, JSON-LD, FAQ e llms.txt (0 menções a "Polynésie" nas homes) e trocam por "international / Dubai / NY / Tóquio". Isso contradiz o briefing (mercado principal: Polinésia, negócios locais). Também trocam o muro de logos por marcas globais de luxo (Aman, Four Seasons, Bulgari…) sem comprovação.
4. **Os serviços do briefing não existem no site.** Branding, manual de marca, criação de site e automação de Instagram têm 0 ocorrências. O site e o plano SEO existente (`SEO/PLANO_SEO_AEO_GEO.md`) posicionam a Soft só como produtora de vídeo. Não há nenhuma página de serviço, case, blog nem "À propos": **hoje não há o que ranquear além da home**.
5. **O pipeline de build é uma armadilha.** As 4 homes foram editadas à mão. Rodar `ferramentas/build_site.py` ou `dev_watch.py` **apaga o layout atual** e volta ao antigo. Um segundo script reescreve o `<head>` por regex. Hoje o gerador só é fonte confiável das 12 páginas legais.
6. **Performance:** cada home baixa **~26 MB** no carregamento (98% são 3 vídeos em autoplay, inclusive masters 4K exibidos a ~100 px). O LCP mobile fica em 3,8–4,6 s, e ~1,2 s disso vem do preloader, que esconde o hero com `opacity:0`. TBT 0 ms e CLS ~0 nas homes com preloader.
7. **Lighthouse SEO 100 é enganoso:** ele não checa se o domínio canônico serve o site, nem duplicação de URLs. O `SEO/validar.py` do repositório também passa com 0 erros nesse estado.

## 2. Placar "antes" (Lighthouse 12, lab, site-soft.vercel.app, 29/10/2026)

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT | Peso |
|---|---|---|---|---|---|---|---|---|---|
| `/fr` | mobile | **71** | 86 | 100 | 100 | 4,6 s | 0 | 0 ms | 26,2 MB |
| `/fr` | desktop | n/d (sem LCP registrado) | 86 | 100 | 100 | — | 0,045 | — | 26,6 MB |
| `/pt` | mobile | 78 | 86 | 100 | 100 | 3,9 s | 0 | 0 ms | 26,3 MB |
| `/en` | mobile | 78 | 86 | 100 | 100 | 3,8 s | 0 | 0 ms | 26,5 MB |
| `/` | mobile | 78 | 86 | 100 | 100 | 3,8 s | 0 | 0 ms | 26,6 MB |
| `/fr/mentions-legales` | mobile | 90 | 100 | 100 | 100 | 2,9 s | 0,003 | 0 ms | 134 KB |

As 4 homes usam o mesmo template; a diferença entre 71 e 78 é variação entre execuções. INP não é medido em laboratório (TBT 0 ms é só um indicativo); o dado real virá do CrUX/RUM na Fase 6. O deploy corresponde ao último commit, não ao working tree. A estrutura de performance é a mesma nos dois.

## 3. Decisões que dependem do dono (bloqueiam a Fase 3)

| # | Decisão | Por quê | Opções |
|---|---|---|---|
| D1 | **Domínio definitivo** | Tudo aponta para `softcommunication.com`, que está à venda na GoDaddy | (a) comprar `softcommunication.com` e ligar na Vercel; (b) assumir outro domínio próprio (ex.: `.pf`); (c) manter `softcommunicaiton.com` (não recomendado: erro de digitação prejudica marca, digitação e confiança) |
| D2 | **Mercado e posicionamento** | O working tree muda de "Polinésia" para "internacional"; o briefing diz Polinésia + negócios locais | Confirmar Polinésia como mercado principal (recomendado pelo briefing) e se o "internacional" fica como linha secundária |
| D3 | **Catálogo real de serviços** | Briefing: branding, manual de marca, sites, motion/vídeo, automação de Instagram. Site: só vídeo | Confirmar a lista e o nome de cada serviço para criar uma página por serviço |
| D4 | **Prova social** | Muro de logos (local e global), "+50 marques", 8 depoimentos com foto, métricas de case (+3,8M views, ROAS 4,2×) | Confirmar cliente por cliente e número por número, com autorização de uso; o que não for confirmado sai |
| D5 | **Endereço nas páginas legais** | Endereço tipo "Résidence" publicado em 6 páginas legais, possivelmente residencial | Domiciliação comercial ou endereço profissional; nunca em JSON-LD, GBP ou diretórios |
| D6 | **Segurança do painel e do repositório** | Credencial exposta, repositório público | Trocar a credencial, tornar o repositório privado, Supabase Auth |
| D7 | **Destino das alterações não commitadas** | Elas carregam D2 e D4 | Commitar só o que for confirmado; o restante volta ao estado anterior |
| D8 | **Páginas de entrega a clientes** | `cliente.html` e `entrega-*.html` são públicas, sem login, e citadas no llms.txt | Confirmar se os clientes são reais; proteger ou retirar do deploy |

## 4. Prioridades consolidadas (impacto × esforço)

Achados repetidos entre áreas foram fundidos. Severidade já corrigida pela verificação.

### 4.1 Fazer primeiro (impacto alto, esforço baixo ou bloqueante)

| # | Problema | Sev. | Imp. | Esf. | Fase | IDs |
|---|---|---|---|---|---|---|
| 1 | Domínio canônico estacionado/à venda; site real no domínio com typo | crítico | 5 | 2 | dono → 3 | TEC-01, HIG-01, SD-06, TEC-06 |
| 2 | Credencial do painel exposta e repositório público | crítico | 5 | 2–3 | dono → 3 | HIG-03, HIG-11 |
| 3 | Diff não commitado tira a Polinésia e põe mercado "internacional" | crítico | 5 | 1 | dono | SD-01, MAP-05, TEC-08 |
| 4 | Logos de marcas e "+50 marques" sem comprovação (no ar e no diff) | crítico | 5 | 1 | dono | SD-02, SD-04 |
| 5 | 3 hosts servem o mesmo site sem 308 nem `X-Robots-Tag` no `*.vercel.app` | alto | 4 | 1 | 3 | TEC-02, HIG-02, MAP-10 |
| 6 | Canonical/hreflang/sitemap/JSON-LD usam `.html`, que dá 308 com `cleanUrls` | alto | 4 | 2 | 3 | MAP-03, TEC-03, SD-06 |
| 7 | Home FR em 4 URLs (`/`, `/fr`, `/nova-home`, `/index-classique`) | alto | 4 | 2 | 3 | MAP-04, TEC-04, HIG-08 |
| 8 | Endereço possivelmente residencial nas páginas legais | alto | 4 | 1–2 | dono | SD-03, HIG-04 |
| 9 | Imagem OG/Twitter quebrada (servida pelo domínio estacionado) | alto | 3 | 1 | 3 | TEC-06 |
| 10 | Link "Administration" no rodapé público; `/admin/` em Disallow esconde o noindex | médio | 3 | 1 | 3 | HIG-06, TEC-15 |
| 11 | Sem cache longo nos assets e sem cabeçalhos de segurança | médio | 3 | 1 | 3 | PERF-07, HIG-09 |
| 12 | Menções legais citam hospedagem Hostinger (é Vercel) | médio | 3 | 1 | dono | SD-14, HIG-10 |
| 13 | Sem página 404 própria | médio | 2 | 1 | 3 | TEC-09 |

### 4.2 Projetos estruturais (impacto alto, esforço médio/alto)

| # | Problema | Sev. | Imp. | Esf. | Fase | IDs |
|---|---|---|---|---|---|---|
| 14 | Gerador apaga as homes; `<head>` reescrito por regex; 3 fontes de verdade de SEO | alto | 5 | 3 | 3 | MAP-01, MAP-02, TEC-05, TEC-13, SD-07 |
| 15 | ~26 MB por carregamento (vídeos em autoplay, masters 4K a ~100 px) | crítico | 5 | 2–3 | 3 | PERF-01, PERF-02 |
| 16 | LCP 3,8–4,6 s: preloader + hero com `opacity:0`; desktop sem LCP | alto | 5 | 2 | 3 | PERF-03, PERF-04 |
| 17 | CSS render-blocking em cadeia (Google Fonts + `@import`) e CLS por fonte | alto | 4 | 2 | 3 | PERF-05, PERF-06 |
| 18 | Serviços do briefing ausentes; nenhuma página de serviço, case, blog ou "À propos" | alto | 5 | 4 | 4 | SD-05, SD-10, SD-15 |
| 19 | Vídeos do portfólio inacessíveis por teclado/leitor de tela; lightbox sem gestão de foco | alto | 4–5 | 2 | 3 | A11Y-01, A11Y-02 |
| 20 | JSON-LD incompleto: sem Service por serviço, VideoObject, BreadcrumbList; `areaServed` inválido | médio | 4 | 2–3 | 3 | SD-07, SD-10, SD-12 |
| 21 | Nome da entidade inconsistente (Soft Communication / Soft & Co / Soft&Co. / Studio Soft) | médio | 4 | 2 | dono → 3 | SD-08 |
| 22 | Páginas de entrega a clientes públicas e anunciadas no llms.txt | médio | 4 | 2 | dono → 3 | HIG-05, SD-11 |

### 4.3 Melhorias de menor impacto

Contraste na timeline "Méthode" e no rodapé (A11Y-03), gaveta de menu focável quando fechada (A11Y-04), animações sem `prefers-reduced-motion` (A11Y-05), ARIA inválido e rótulos (A11Y-06 a A11Y-12), vídeos com fala sem legenda (A11Y-13, depende de transcrição do dono), poster LCP em JPG 640×360 sem AVIF/`srcset` (PERF-08), posters carregados de imediato (PERF-09), main thread pesada no mobile (PERF-10), CSS sem minificação e JS de catálogo nas páginas legais (PERF-12, MAP-07), assets mortos (PERF-13), `lastmod` fixo no sitemap (TEC-10), verificação Google/IndexNow presos ao domínio errado (TEC-11, TEC-12, HIG-13), ícones/manifest incompletos (TEC-14), typo `softcommunicaiton.com` em canonicals e e-mails (TEC-07, MAP-06, HIG-07), e-mail Gmail como contato (HIG-14), `validar.py` com falso positivo (MAP-08, TEC-17), medição de campo inexistente (PERF-11).

## 5. O que já está bom (manter)

- Conteúdo das homes no HTML estático (≈1.500 palavras legíveis sem JS): bom para Google e para crawlers de IA.
- `robots.txt` bem pensado para buscadores de IA; `llms.txt` já existe (precisa de correção, não de criação).
- JSON-LD com sintaxe 100% válida (21 blocos, 0 erros de parse); a base Organization/WebSite/FAQPage existe.
- Estrutura por idioma (`/fr`, `/pt`, `/en`) e páginas legais nos 3 idiomas já existem.
- TTFB de 20–30 ms com cache da Vercel, TBT 0 ms, `display=swap` e `preconnect` nas fontes, `width/height` nas `<img>`.
- O plano `SEO/PLANO_SEO_AEO_GEO.md` tem boas regras de integridade (sem números sem fonte); o problema é que o conteúdo novo não as segue e o mapa de palavras-chave não cobre os serviços do briefing.

---

# Anexo A — Diagnóstico detalhado por área

## A.1 Mapa de páginas, rotas e geração do `<head>`

### 1. Inventário de páginas (`maquette/`, working tree atual)

| Página | Origem real | `lang` | robots | canonical | Palavras sem JS | JS externo |
|---|---|---|---|---|---|---|
| `index.html` | **Feita à mão** (cópia de `nova-home.html` + `<head>` SEO + preloader) | fr | index | `https://softcommunication.com/` | 1.569 | preloader.js (+ 17 KB inline) |
| `fr/index.html` | **Feita à mão** (idêntica a `index.html`, só muda canonical/og:url/@id e caminhos `../`) | fr | index | `…/fr/index.html` | 1.569 | preloader.js |
| `pt/index.html` | **Feita à mão** (layout novo traduzido, commit 00812e1) | **pt** (gerador usa pt-BR) | index | `…/pt/index.html` | 1.576 | preloader.js |
| `en/index.html` | **Feita à mão** | en | index | `…/en/index.html` | 1.471 | preloader.js |
| `nova-home.html` | Feita à mão (protótipo do layout atual) | fr | index (local) / **sem robots e sem canonical no deploy** | `…/` (local) | 1.569 | nenhum (só inline) |
| `index-classique.html` | Saída antiga do `build_site.py` (layout "classique") | fr | index | `…/` | 540 (hero/destaques/faixas montados por `home.js`) | preloader, config, catalog, soft-catalog, home, site |
| `{pt,fr,en}/<legais>.html` (12) | `build_site.py` + pós-processamento de `atualizar_meta_producao.py` | pt-BR/fr/en | index | `…/<slug>.html` | 387–679 | config, catalog, soft-catalog, site |
| `cliente.html` | À mão | fr | noindex | — | 191 | — (sem `<title>`) |
| `entrega-cinema.html`, `entrega-reels.html` | À mão | fr | noindex | `https://softcommunicaiton.com/…` (**erro de digitação**) | 375 / 584 | — (sem `<title>`) |
| `admin/index, kanban` | À mão | pt-BR | noindex | `softcommunication.com/admin/…` | — | admin-*.js |
| `admin/clientes, demandes, mediatheque` | À mão | fr/pt-BR | noindex | `softcommunicaiton.com/…` (**erro**) | — | admin-*.js |
| `admin/projet.html` | À mão (redirect meta refresh + JS para `index.html`) | pt-BR | — | — | 0 | — |
| `google805618d3b3339e62.html` | Verificação Search Console | — | — | — | — | — |
| `a4b7f8c92e104d5b8c3f7a1e9b2c4d6f.txt` | Chave IndexNow (`auto_renovar_seo.py:42`) | — | — | — | — | — |
| `robots.txt`, `sitemap.xml`, `llms.txt` | robots manual; sitemap por `atualizar_meta_producao.py:390-437`; llms copiado de `SEO/codigo` | — | — | — | — | — |

### 2. Como o `<head>` é montado hoje (pipeline em 3 camadas)

1. **`ferramentas/build_site.py`** (`head()`, linhas 236-255) escreve `<title>`, description, **`<meta name="robots" content="noindex, nofollow">`** e hreflang **relativos**. Ele gera `index.html` (FR na raiz, apesar do docstring/LEIA_ME dizerem "PT na raiz"), `{pt,fr,en}/index.html` e as 12 legais (linhas 686-691).
2. No fim, `build_site.py` (linhas 693-700) chama **`auto_renovar_seo.py`**, que roda **`SEO/codigo/atualizar_meta_producao.py`**. Esse script **reescreve por regex**: troca title/description, remove robots/canonical/hreflang/og/twitter/JSON-LD e injeta um bloco novo a partir do dicionário `PAGES` (16 entradas, `BASE="https://softcommunication.com"`, URLs **com `.html`**). Ele também **altera o conteúdo do corpo** (troca `service-desc` e remove "Barbarotti", linhas 330-384) e gera `sitemap.xml` com `lastmod` fixo `2026-10-19` (linha 425).
3. Depois `validar.py --lancamento` valida o resultado. Ele passa com **0 erros** no estado atual, porque não checa domínio, URLs que redirecionam, duplicatas nem páginas fora de `PAGES`.

Fontes paralelas que **não** alimentam o HTML: `SEO/codigo/metas.json` + `gerar_sitemap.py` descrevem rotas que não existem (`/fr/services`, `/fr/services/films-de-marque`…). `SEO/codigo/head-exemplo.fr-home.html` é só referência.

`dev_watch.py` roda `build_site.py` **na partida** (`run_build()` inicial) e a cada mudança. `auto_renovar_seo.py --watch` também observa `maquette/assets/data` (o catálogo) e reaplica `atualizar_meta_producao.py`.

### 3. Risco de sobrescrita (teste feito numa cópia em scratchpad)

| Ação | Efeito sobre o working tree |
|---|---|
| `python3 ferramentas/build_site.py` | `index.html`/`fr`/`pt`/`en` home: **~1.890 linhas de diff cada**. As homes voltam para o layout antigo (= `index-classique.html`, 544 linhas no lugar de 1.698), com títulos de `PAGES` e posicionamento diferente. Legais: só 6 a 38 linhas (meta og e JSON-LD). Mesmo a partir do HEAD commitado, o gerador já não reproduz as homes (1.841 a 1.845 linhas de diff). |
| Só `atualizar_meta_producao.py` (ou `auto_renovar_seo.py`, inclusive `--watch` ao mudar o catálogo) | Homes: 166–168 linhas alteradas. O título "Soft Communication · Vidéos Haute Performance…" vira "Films de marque et immobilier IA en Polynésie \| Soft & Co", o x-default muda de `/` para `/fr/index.html` e o JSON-LD é refeito a partir de `jsonld/01-organization-website.json`. |
| `dev_watch.py` | Mesmo efeito do `build_site.py`, **imediatamente ao iniciar**. |

`ferramentas/LEIA_ME.md:35` diz "Não edite essas páginas à mão: a próxima geração apaga", mas as homes atuais são justamente edições à mão. **Hoje o gerador é a fonte de verdade só das 12 legais.**

### 4. Home real e duplicação

- **Home real em produção:** o layout "nova-home" (seções `nh-hero`, `#showcase`, `#chiffres`, `#etudes`, `#methode`, `#avis`, `#diferenciais`, `#faq`, `#contact`), servido em `/`, `/fr`, `/pt` e `/en`.
- **`/` e `/fr` têm conteúdo idêntico.** O diff só muda canonical, og:url, @id e o link do logo. Cada uma declara canonical para si mesma (`/` e `/fr/index.html`).
- **`/nova-home`** (200) é a mesma home sem o preloader. No deploy ela não tem canonical nem robots, então é uma terceira cópia indexável.
- **`/index-classique`** (200) é a home antiga, com conteúdo diferente e `canonical=https://softcommunication.com/`, apontando para outra página.
- Resultado: 4 URLs públicas de "home FR" no deploy.

### 5. Renderização no cliente e o que um crawler sem JS vê

- **Homes novas:** o conteúdo está no HTML estático (1.569 palavras, 22 `<video>` com `poster` e `src` no Supabase Storage). O JS inline só cuida de menu, som e timecode, além da animação `nh-rise`. A classe é adicionada por JS, então quem não roda JS vê tudo. O preloader só ativa via script inline (`has-preloader`). **Leitura sem JS: boa.** Não carregam `site.js`, `home.js`, `soft-catalog.js` nem `catalog.js`.
- **`index-classique.html`:** hero, destaques e faixas são montados por `home.js` a partir de `catalog.js`/Supabase. Sem JS sobram 540 palavras.
- **Legais:** HTML estático. `site.js` cuida de consentimento, menu e idioma, mas elas também carregam `catalog.js` (31 KB) e `soft-catalog.js` (22 KB) sem usar (`build_site.py` `tail()`, linhas 377-380).
- **Âncoras quebradas:** o header e o footer das legais (gerados) apontam para `index.html#selecao`, `#faixas`, `#servicos`, `#sobre` e `#contato`. Nenhum desses ids existe na home atual (0 ocorrências). As homes novas linkam só 3 das 4 legais (falta `conditions-utilisation`).

### 6. Rotas efetivas na Vercel (`cleanUrls: true`, testado com curl em site-soft.vercel.app)

| Rota | HTTP | Observação |
|---|---|---|
| `/` | 200 | home FR |
| `/index`, `/index.html` | 308 → `/` | |
| `/fr`, `/fr/` | 200 / 200 | **barra final não normalizada** (duplicata) |
| `/fr/index`, `/fr/index.html`, `/fr/index/` | 308 → `/fr` | **canonical, hreflang, og:url, sitemap e IndexNow usam exatamente esta forma que redireciona** |
| `/pt`, `/en` | 200 | `/pt/index.html` e `/en/index.html` → 308 |
| `/pt/aviso-legal`, `/pt/aviso-legal/` | 200 / 200 | `.html` → 308 |
| `/fr/mentions-legales.html`, `/en/terms.html` | 308 → sem `.html` | as 12 legais seguem este padrão |
| `/nova-home`, `/index-classique` | 200 | duplicatas públicas |
| `/cliente`, `/entrega-cinema`, `/admin`, `/admin/`, `/admin/projet`, `/admin/clientes` | 200 | noindex. `/admin` sem barra não é coberto por `Disallow: /admin/` |
| `/google805618d3b3339e62.html` | **308** → `/google805618d3b3339e62` | o arquivo de verificação responde com redirect |
| `/a4b7…d6f.txt`, `/robots.txt`, `/sitemap.xml`, `/llms.txt` | 200 | `llms.txt` como `text/plain` |
| `/maquette` | 308 → `/` | |
| `/maquette/` | **404** | o redirect `/maquette/:path*` não cobre a barra vazia |
| `/maquette/fr/index.html` | 308 → `/maquette/fr` → 308 → `/fr` | 2 saltos (cleanUrls roda antes do redirect) |
| `/FR`, `/pagina-inexistente` | 404 | página padrão da Vercel ("NOT_FOUND"), sem `404.html` |
| `/fr?utm_source=x` | 200 | sem canonicalização de parâmetros (só o robots os bloqueia) |

Headers do deploy: sem `X-Robots-Tag` (o host `*.vercel.app` é indexável), `cache-control: public, max-age=0, must-revalidate`, HSTS presente. O deploy corresponde ao HEAD, não ao working tree: `/nova-home` no deploy ainda não tem canonical.

### 7. Domínio e erro de digitação codificados no código

- `https://softcommunication.com` aparece em `atualizar_meta_producao.py:28`, `auto_renovar_seo.py:43` (HOST do IndexNow), `robots.txt`, `llms.txt`, `jsonld/*.json` e `metas.json`, além de URLs absolutas no corpo das homes (ex.: `href="https://softcommunication.com/fr/index.html"` em `fr/index.html`).
- `softcommunicaiton.com` (erro): canonical de `entrega-cinema.html:9`, `entrega-reels.html:9`, `admin/clientes.html:9`, `admin/demandes.html:9` e `admin/mediatheque.html:9`; texto visível em `entrega-*.html`; e-mails em `assets/js/admin-auth.js:29` e `assets/js/soft-catalog.js:170-189`; docstring de `auto_renovar_seo.py:4`.

### 8. Insumos de `<head>` alterados e ainda não commitados

O `git diff` de `SEO/codigo/jsonld/01-organization-website.json` e de `metas.json` troca o posicionamento Polinésia por "international": `areaServed` passa de French Polynesia/EUA para **United Arab Emirates, Italy, UK, Switzerland, Japan…**; a descrição vira "Premier international boutique… Middle East, and Asia"; e "Production vidéo commerciale Polynésie française" vira "…internationale". Ao rodar o pipeline, isso entra no JSON-LD de todas as 16 páginas. Isso contraria o briefing (mercado principal: Polinésia Francesa, negócios locais).

### 9. O que a Fase 3 precisa mudar no gerador (não nos HTML)

1. **Uma fonte de verdade para as homes.** Portar o layout `nova-home` (HTML e STRINGS FR/PT/EN) para `build_site.py`, ou tirar as homes do gerador e documentar isso. Antes disso, desligar a chamada automática em `dev_watch.py` (build na partida).
2. **Montar o `<head>` completo dentro de `build_site.head()`**: canonical, hreflang absolutos, robots, OG/Twitter e JSON-LD a partir de um único arquivo de dados (`metas.json` revisado). Aposentar a reescrita por regex de `atualizar_meta_producao.py` e as trocas de conteúdo de corpo (`service-desc`, "Calebe"), que devem ir para STRINGS.
3. **Constante única `SITE_URL`** (config ou variável de ambiente), usada por build, robots, llms, sitemap, JSON-LD e IndexNow. Corrigir `softcommunicaiton`.
4. **URLs limpas** em canonical, hreflang, og:url, sitemap, JSON-LD e IndexNow: `/fr`, `/fr/mentions-legales`, sem `.html` nem barra final. Links internos também sem `.html`.
5. **Política da raiz:** `/` vira redirect para `/fr` (ou `/fr` sai e `/` passa a ser a home FR canônica), com x-default coerente. Remover `nova-home.html`/`index-classique.html` do output ou redirecioná-las em `vercel.json`.
6. **`vercel.json`:** `trailingSlash: false`, redirect `/maquette/` → `/`, redirects das páginas legadas, `404.html` próprio, `X-Robots-Tag: noindex` em `/admin`, `/cliente` e `/entrega-*` e para o host `*.vercel.app` depois que o domínio próprio estiver ativo.
7. **Sitemap único** gerado pelo build, com `lastmod` real por página. Aposentar `gerar_sitemap.py` ou alinhar `metas.json` às rotas existentes.
8. **`validar.py`:** reprovar canonical/hreflang com `.html` ou com domínio diferente do configurado, canonicals duplicados, páginas públicas fora do mapa (nova-home, index-classique), âncoras internas inexistentes, `lang` inconsistente (`pt` vs `pt-BR`) e reciprocidade de hreflang entre arquivos.
9. **Header/footer das legais** com as âncoras da home atual e link para as 4 legais. Remover `catalog.js`/`soft-catalog.js` das páginas que não usam.
10. **IndexNow:** só disparar com o domínio de produção ativo e com URLs limpas.

---

## A.2 SEO técnico on-page e indexação

### Resumo
O HTML é limpo: 1 H1 por página, sem saltos de hierarquia nas páginas públicas, hreflang absoluto e recíproco, OG 1200×630 válido, `validar.py --lancamento` passa com 0 erro. O problema é de **infraestrutura de domínio**. Todo o sinal de indexação (canonical, hreflang, og:url, og:image, sitemap, robots `Sitemap:`, IndexNow) aponta para `softcommunication.com`, que é uma página estacionada. Enquanto isso, o site é servido **sem redirecionamento** em três hosts:

| Host | Status | Ligado ao projeto Vercel `site-soft`? |
|---|---|---|
| `https://softcommunication.com/` (canônico no código) | 200, HTML de 114 bytes com `window.location.href="/lander"`. Responde 200 para qualquer URL: `/fr/index.html`, `/assets/brand/soft-tiki-og.png` (text/html), `/a4b7…d6f.txt`. O `sitemap.xml` dele lista só `/lander` | **Não** (estacionado) |
| `https://softcommunicaiton.com/` (grafia "errada") | 200, HTML **idêntico byte a byte** ao de site-soft.vercel.app | **Sim**, domínio verificado (`list_project_domains`), `redirect: null` |
| `https://www.softcommunicaiton.com/` | 200, sem redirect para o apex | **Sim**, `redirect: null` |
| `https://site-soft.vercel.app/` | 200, sem `X-Robots-Tag` | Sim |

**Correção do contexto:** "softcommunicaiton.com" não é só um erro de digitação. É o domínio que de fato está conectado e servindo o site. O domínio usado nos canonicals (`softcommunication.com`) não está no projeto. A escolha do domínio definitivo é do dono.

### Inventário por página (working tree)

| Página | lang | Title (car.) | Description (car.) | H1 | Hierarquia | Canonical | robots | hreflang / x-default | OG / Twitter |
|---|---|---|---|---|---|---|---|---|---|
| `index.html` (raiz) | fr | "Soft Communication · Vidéos Haute Performance & Films de Marque" (63) | 165, sem CTA, **sem "Polynésie"** | 1 | h1 1, h2 8, h3 23, ok | `/` | index | pt/fr/en `.html` + x-default `/` | completo, 1200×630 |
| `fr/index.html` | fr | **idêntico à raiz** (63) | **idêntica à raiz** (165) | 1 | ok | `/fr/index.html` (308 → `/fr`) | index | x-default `/` | completo |
| `pt/index.html` | **pt** (as legais PT usam pt-BR) | "Soft Communication · Vídeos de Alta Performance & Filmes de Marca" (65) | **171** | 1 | ok | `/pt/index.html` | index | x-default `/` | completo |
| `en/index.html` | en | "…High-Performance Videos & Brand Films" (58) | 155 | 1 | ok | `/en/index.html` | index | x-default `/` | completo |
| 12 páginas legais (pt/fr/en) | pt-BR/fr/en | 23–40, padrão "X \| Soft & Co" | 69–96 (curtas, sem CTA, aceitável) | 1 | ok | self `.html` | index | recíproco, x-default = versão FR | sem `og:image:width/height` |
| `nova-home.html` | fr | **idêntico à raiz** | **idêntica à raiz** | 1 | ok | `/` | **index** | igual à raiz | completo |
| `index-classique.html` | fr | "Soft & Co \| Films de marque & Vidéo en Polynésie française" (58) | 152 | 1 | ok | `/` (conteúdo diferente da raiz) | **index** | igual à raiz | sem dimensões |
| `cliente.html` | fr | "Espace Client · Soft Communication" | 67 | 1 ("Hôtel Polynesian Sun Resort") | ok | **ausente** | noindex | — | — |
| `entrega-cinema.html` | fr | 58 | 142 | 1 | **h2→h4** | `https://softcommunicaiton.com/entrega-cinema.html` (l.9) | noindex | — | — |
| `entrega-reels.html` | fr | **73** | 169 | 1 | ok | `https://softcommunicaiton.com/entrega-reels.html` (l.9) | noindex | — | — |
| `admin/*.html` | fr/pt-BR misturados | — | — | 1 | clientes h1→h3 | 3 com typo (clientes, demandes, mediatheque), 2 com `softcommunication.com` (index, kanban) | noindex (exceto `projet.html`, que é um meta-refresh sem robots) | — | — |

Ícones: só `<link rel="icon" type="image/svg+xml">` relativo. **Não há** `apple-touch-icon`, manifest, `theme-color` nem `favicon.ico` (`/favicon.ico` e `/apple-touch-icon.png` retornam 404 no deploy). Imagem OG: o arquivo `maquette/assets/brand/soft-tiki-og.png` existe e mede 1200×630 PNG (286 KB). Porém, a URL declarada `https://softcommunication.com/assets/brand/soft-tiki-og.png` devolve `text/html` (página estacionada), então **toda prévia de compartilhamento quebra**.

### Duplicação
- Title e description idênticos em `index.html`, `fr/index.html` e `nova-home.html`. A raiz e `/fr/` diferem só em caminhos relativos e no canonical: são **duas URLs com o mesmo conteúdo, cada uma autocanônica**.
- `nova-home.html` e `index-classique.html` (órfãs, sem link interno) estão `index, follow` com canonical para `/`. O `index-classique` tem conteúdo diferente da raiz, então o canonical é contraditório.
- Os idiomas não se duplicam entre si, porque os titles são traduzidos.

### Hreflang e x-default
- No HTML das homes pt/fr/en, x-default = `https://softcommunication.com/` (l.13). No `sitemap.xml`, as entradas pt/fr/en têm x-default = `/fr/index.html`, e só a entrada raiz tem `/`: há **divergência entre sitemap e HTML**. O próprio `SEO/codigo/atualizar_meta_producao.py:52,64,76` define `/fr/index.html`, então o HTML atual não saiu desse script (há várias fontes de verdade).
- A raiz `/` não aparece como `hreflang="fr"` (o fr aponta para `/fr/index.html`), mas tem canonical próprio. Isso gera um cluster FR ambíguo.
- Todas as URLs do hreflang usam `.html`. Com `cleanUrls: true`, cada uma responde **308** para a versão sem extensão (`/fr/index.html` → `/fr`, `/fr/mentions-legales.html` → `/fr/mentions-legales`). **Canonical, hreflang, og:url e sitemap apontam para URLs que redirecionam.**

### Sitemap e robots
- `maquette/sitemap.xml` tem 16 URLs, todas `.html` (redirecionam), no domínio estacionado. O `lastmod` é **fixo**, `2026-10-19`, escrito direto no código (`atualizar_meta_producao.py`, bloco de sitemap ~l.431), mesmo havendo mudanças posteriores na home (working tree de 26/10). `priority` é ignorado pelo Google. Repo e deploy estão em sincronia.
- `robots.txt` (repo = servido): `Disallow: /admin/` **não bloqueia `/admin`** (a URL limpa de `admin/index.html`, que responde 200). Isso é aceitável porque essa página tem noindex, mas a home pública tem link "Administration" para `admin/index.html` (`index.html:1248`, `fr/index.html:1248`). `Sitemap:` aponta para o domínio estacionado. `/cliente` e `/entrega-*` não estão bloqueados; isso está correto, porque o noindex precisa ser rastreado.

### 404 e redirects
- Não existe `maquette/404.html`. `/qualquer-coisa` retorna 404 `text/plain` "The page could not be found NOT_FOUND" (padrão da Vercel, sem marca nem navegação).
- `vercel.json`: `/maquette/:path*` → `/:path*`. Com cleanUrls, `/maquette/fr/index.html` vira uma cadeia de 2 saltos (→ `/maquette/fr` → `/fr`). `/FR` retorna 404 (sensível a maiúsculas, aceitável). Não há redirect de host (www → apex, vercel.app → domínio próprio).
- Slugs: as legais estão localizadas (bom); as homes são `/{lang}/index.html`.

### Arquivos de verificação
- `google805618d3b3339e62.html`: conteúdo correto. Mas `/google805618d3b3339e62.html` responde **308** → `/google805618d3b3339e62` (efeito do cleanUrls), e o Search Console espera o arquivo na URL exata. Risco de falha ou perda da verificação (estimativa). Não há evidência no repo de qual propriedade foi verificada.
- `a4b7f8c92e104d5b8c3f7a1e9b2c4d6f.txt` é a chave IndexNow usada em `ferramentas/auto_renovar_seo.py:41-43`, com `HOST='softcommunication.com'` e `keyLocation` no domínio estacionado. Qualquer ping falha na validação da chave ou envia URLs que não são do dono. O docstring (l.4) cita `softcommunicaiton.com`.

### Sincronia repo × deploy
Iguais: robots, sitemap, 12 legais, index-classique, cliente, entrega-*. Diferentes: `index.html`, `{pt,fr,en}/index.html`, `nova-home.html`, `llms.txt`. O servido é igual ao `HEAD` e as diferenças são as alterações não commitadas. Essas alterações **removem "Polynésie française / Polinésia Francesa / French Polynesia"** das descriptions das homes nos 3 idiomas (trocado por "à l'international / no mundo inteiro / worldwide"). As menções a Polynésie/Tahiti em `fr/index.html` caem de 18 (HEAD) para 1 (working tree), o que é uma regressão para o mercado principal, local.

### Ferramentas de validação
`validar.py --lancamento` retorna "0 erro(s)", mas ignora `admin/`, `cliente` e `entrega` (`is_private`), por isso não detecta o typo nos canonicals. Também valida comprimentos em `metas.json`, não no HTML: as descriptions de 165 e 171 caracteres passam. E não verifica a coerência `.html` × cleanUrls. Há 3 fontes de verdade divergentes: `metas.json` (paths `/fr`, title "Films de marque, présence 9:16 et immobilier IA | Soft & Co"), o dicionário `PAGES` em `atualizar_meta_producao.py` (URLs `.html`, x-default `/fr/index.html`) e o HTML publicado. `build_site.py:249` emite `noindex, nofollow` e hreflang relativo. Se o build rodar sem o pós-processamento, a produção volta a ficar noindex.

---

## A.3 Performance e Core Web Vitals

> Medido com Lighthouse 12 (lab, Moto G simulado com throttling de 4G lento, e desktop) em **https://site-soft.vercel.app** no dia 29/10/2026. Os JSON brutos estão em relatórios JSON do Lighthouse (fora do repositório).
> **Atenção:** o deploy não é o working tree atual. `/fr` publicado tem 95.782 bytes; `maquette/fr/index.html` local tem 100.314. A estrutura de performance (vídeos, preloader, fontes, CSS) é a mesma nos dois.
> **INP não é medido em laboratório.** O proxy usado aqui é o TBT (0 ms em todas as páginas). INP real só sai do CrUX ou de RUM (Vercel Speed Insights / web-vitals.js), o que é tarefa da fase 6.

### 1. Resultados Lighthouse

| Página | Perfil | Perf | A11y | BP | SEO | FCP | LCP | SI | TBT | CLS | Peso | Req. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| /fr | mobile | **71** | 86 | 100 | 100 | 3,7 s | **4,6 s** | 6,2 s | 0 ms | 0 | **26.224 KiB** | 39 |
| /fr | desktop | **n/d (NO_LCP)** | 86 | 100 | 100 | 1,0 s | — | 1,6 s | — | 0,045 | 26.593 KiB | 39 |
| /pt | mobile | 78 | 86 | 100 | 100 | 3,5 s | 3,9 s | 5,0 s | 0 ms | 0 | 26.306 KiB | 39 |
| /en | mobile | 78 | 86 | 100 | 100 | 3,5 s | 3,8 s | 5,6 s | 0 ms | 0 | 26.468 KiB | 39 |
| / | mobile | 78 | 86 | 100 | 100 | 3,5 s | 3,8 s | 5,5 s | 0 ms | 0 | 26.551 KiB | 39 |
| /nova-home | mobile | 86 | 86 | 100 | 100 | 2,7 s | 3,0 s | 2,7 s | 0 ms | **0,114** | 26.599 KiB | 38 |
| /fr/mentions-legales | mobile | 90 | 100 | 100 | 100 | 2,9 s | 2,9 s | 2,9 s | 0 ms | 0,003 | 134 KiB | 16 |

- As 4 homes saem do mesmo template. A diferença 71 vs 78 é variação entre execuções, não diferença real entre idiomas.
- Valores observados sem throttling no /fr mobile: FCP e LCP de 2,9 s, DOMContentLoaded de 0,75 s. O gargalo não é o servidor (TTFB de 20 a 30 ms, `x-vercel-cache: HIT`).
- **Desktop /fr: o Lighthouse não registrou LCP nenhum** (`NO_LCP`), então não há nota de Performance. Hipótese provável: o hero inteiro fica com `opacity:0` até o fim do preloader (ver §3).

### 2. Elemento LCP e decomposição (mobile)

O elemento LCP em todas as homes é o `<video id="nhHeroVideo">`, com o poster `posters/calebe-versao-final.jpg` (`maquette/fr/index.html:316-320`).

| Página | TTFB | Load delay | Load time | **Render delay** |
|---|---|---|---|---|
| /fr | 780 ms | 0 | 0 | **3.825 ms (83%)** |
| /pt | 606 ms | 237 ms | 282 ms | 2.764 ms (71%) |
| / | 609 ms | 0 | 0 | 3.183 ms (84%) |
| /nova-home (sem preloader) | 623 ms | 0 | 449 ms | 1.945 ms (64%) |

O LCP não espera a rede: o poster tem 30 KB e baixa cedo. O que atrasa o LCP é a **renderização**:
1. **CSS bloqueante em cadeia.** O Google Fonts CSS é cross-origin e o Lighthouse estima 950 ms de economia possível só nele. Depois vêm `tokens.css` → `nova-home.css` (59 KB, sem minificação) → `@import url('preloader.css')` (`assets/css/nova-home.css:1`), uma 3ª ida e volta. O `preloader.js` é síncrono no `<body>` (`fr/index.html:207`). Economia estimada pelo Lighthouse: **2,44 a 2,52 s**.
2. **Preloader + reveal.** O preloader segura a tela por 60 ms + 680 ms de entrada, 1.350 ms de hold e 820 ms de saída (`assets/js/preloader.js:58-79,89-125`). Durante esse tempo o `.nh-hero-video-wrap` recebe `.nh-rise` (`opacity:0`, `assets/css/nova-home.css:2515-2526`), com delay de 300 ms, e só aparece em `soft-preloader-exit` + 90 ms (`fr/index.html:1631-1636`). Comparando `/` (com preloader, render delay de 3,18 s) e `/nova-home` (sem preloader, 1,94 s): o preloader custa **cerca de 1,2 s de LCP** (estimativa lab).

### 3. Por que a página pesa ~26 MB

| Recurso | Origem | Tamanho do arquivo | Baixado no load (mobile) | Exibido em |
|---|---|---|---|---|
| `calebe-versao-final.webm` (hero, `autoplay preload="metadata"`) | Supabase Storage | 18,3 MB | **~16,2 MB** | ≤1040 px de largura |
| `miria-s-project-final-v01-1-2.webm` (clip-b, `autoplay`) | Supabase | 18,9 MB | **~6,4 MB** | **82 a 112 px** de largura (`nova-home.css:2225-2226`) |
| `soft-motion-fr-9x16-60fps-1.webm` (clip-a, `autoplay`) | Supabase | 4,8 MB | **~3,1 MB** | 82 a 112 px |
| 19 posters JPG (todos os cards, inclusive `preload="none"`) | Vercel | ~350 KB | 346 KB | cards |
| Fontes Google (7 woff2) | gstatic | — | 114 KB | — |

- O atributo `autoplay` anula o `preload="metadata"`: os 3 vídeos começam a baixar no load, inclusive os 2 clips do bloco "Expert", que ficam bem abaixo da dobra (`fr/index.html:1103,1107`). Mídia = **25,7 MB de 26,2 MB** (98%).
- O hero é um master de 18 MB servido igual para todo dispositivo: não há versão mobile, `<source>` alternativo nem AV1/H.264 leve.
- Cache do Supabase: o GET devolve `cache-control: public, max-age=3600` (o HEAD devolve `private, no-cache`). O Lighthouse aponta 3 recursos com TTL curto (21 MB "desperdiçados" em revisita).
- Os 16 cards de portfólio usam `preload="none"` e começam a tocar só na interação/IO, o que está correto. O custo deles são os posters, que carregam todos no início (`<video poster>` não tem lazy).

### 4. Imagens

| Arquivo | Real | Exibido | Peso | Observação |
|---|---|---|---|---|
| `posters/*.jpg` (53) | 360×640 / 640×360 | cards | 2 a 52 KB (1,3 MB no total) | só JPG. O Lighthouse estima 43 KiB economizáveis com WebP/AVIF e 150 KiB com dimensionamento |
| `posters/calebe-versao-final.jpg` (poster LCP) | 640×360 | até 1040×585 | 30 KB | **baixa resolução para desktop/retina** (upscale de 1,6× a 3×); grande demais para mobile |
| `brand/avatars/client-*.jpg` (9) | 300×300 | 48×48 | ~26 KB cada | 6× maior que o necessário (com `loading="lazy"`, OK) |
| `brand/calebe.jpg` e `calebe-barbarotti.jpg` | 896×1200 | — | 747 KB cada (duplicados) | sem referência nas homes; peso morto no deploy |
| `posters/hero-meadow-sunrise.jpg` | 1024×576 | — | 209 KB | sem uso encontrado nas homes |
| `<img>` nas homes | — | — | — | 3 tags, todas com `width/height`; nenhuma tem `fetchpriority` |

### 5. Fontes

- Google Fonts com `display=swap` e `preconnect` para googleapis e gstatic (`fr/index.html:191-193`). OK.
- 10 estilos pedidos (Cormorant 400/500/600/400i/500i + Poppins 300 a 700); 7 woff2 baixados (114 KB).
- O `swap` sem fallback ajustado (`size-adjust`/`ascent-override`) causa **CLS 0,114 na /nova-home e 0,045 no desktop /fr**. O culpado é `.nh-hero-video-wrap`, com causa "Web font loaded". Nas homes com preloader o shift fica escondido sob o overlay em mobile.
- O CSS do Google Fonts é render-blocking cross-origin. Self-host (woff2 subset latin em `/assets/fonts`) elimina 1 ou 2 idas e voltas.

### 6. HTML, JS e CSS

- HTML de ~100 KB (25 KB em brotli): 22 KB de SVG inline (tiki do preloader + ícones), 18 KB de script inline (dados dos depoimentos + lógica), 6,5 KB de JSON-LD, o resto é markup de ~19 cards de vídeo. O custo é baixo depois do brotli. Mover o script inline para um arquivo com cache ajuda pouco.
- Main thread mobile: 10,5 s (/fr), quase tudo "Other" e "Style & Layout", e só 77 ms de JS. É decodificação de 3 vídeos + 17 animações `infinite` + 14 `backdrop-filter` (`nova-home.css`). Há forced reflow de 50 ms (`fr/index.html:~1323`, `timeupdate` do timecode). O TBT segue em 0 ms, então o risco de INP ruim é **baixo**, mas há risco em celular fraco: o `timeupdate` reescreve texto ~4×/s e os marquees rodam continuamente (estimativa).
- `nova-home.css` com 59 KB e `site.css` com 55 KB, os dois sem minificação.
- Páginas legais carregam `catalog.js` (30 KB) + `soft-catalog.js` + `site.js` (`fr/mentions-legales.html:409-412`) sem precisar do catálogo (a verificar se `site.js` depende dele).

### 7. Cache no deploy (Vercel)

`curl -I` em HTML, CSS, JS, posters e SVG: todos com `cache-control: public, max-age=0, must-revalidate`. Não existe bloco `headers` no `vercel.json`. Os assets já usam `?v=` em CSS, então dá para servir `/assets/*` com `max-age=31536000, immutable` desde que se versionem também JS e imagens.

### 8. Metas e caminho (sem quebrar o design)

| Métrica | Hoje (lab mobile) | Meta | Caminho |
|---|---|---|---|
| LCP | 3,8 a 4,6 s | **< 2,5 s** (p75 de campo) | (1) não esconder o hero: tirar `.nh-hero-video-wrap` e o H1 do `nh-rise`, ou animar só `transform` com opacity inicial ≥ 0,01 e o poster já visível; (2) encurtar o preloader para ≤ 600 ms ou rodá-lo só na 1ª visita (sessionStorage), com o hero pintado por baixo; (3) `<link rel="preload" as="image" fetchpriority="high">` no poster LCP, em AVIF/WebP com `srcset` 640/1280; (4) self-host das fontes + `preload` das 2 principais; (5) remover o `@import` e inlinear `preloader.css` + CSS crítico do hero. |
| CLS | 0 a 0,114 | **< 0,1** (idealmente < 0,05) | fallback `@font-face` com `size-adjust`/`ascent-override` para Poppins e Cormorant; `aspect-ratio` fixo no wrap do hero (já é 16:9). |
| INP | n/d (TBT 0 ms) | **< 200 ms** | medir em campo; reduzir o `timeupdate` para rAF a 4 fps; pausar marquees e vídeos fora da viewport (IO); limitar `backdrop-filter`. |
| Peso inicial | 26 MB | **< 2 MB** antes da interação | hero: versão de 720p a 1,5 a 2 Mb/s (2 a 4 MB) com `<source media>` mobile ou HLS/Mux/Cloudflare Stream; clips de 112 px: transcodificar para ~240 px (≤ 300 KB) ou trocar por imagem animada e iniciar via IntersectionObserver; `autoplay` só quando visível. |

**Ordem sugerida (fase 3):** vídeos (maior ganho de bytes) → preloader/reveal (maior ganho de LCP) → fontes e CSS crítico → headers de cache → posters AVIF/`srcset` → limpeza de assets mortos. Tudo pode ser gerado via `ferramentas/build_site.py` + `nova-home.css`, sem alterar a direção de arte. A cortina do preloader pode continuar como transição visual sem segurar a primeira pintura do hero.

---

## A.4 Acessibilidade e semântica

### Lighthouse (deploy site-soft.vercel.app, área de acessibilidade)

| URL | Formato | Nota a11y | Auditorias com falha |
|---|---|---|---|
| `/` (raiz, FR) | mobile | **86** | aria-hidden-focus (1), aria-required-children (1), color-contrast (25 nós) |
| `/fr` | mobile e desktop | **86** | as mesmas 3 |
| `/en` | mobile (rodada só de a11y) | **86** | as mesmas 3 |
| `/pt` | mobile | **86** | as mesmas 3 |
| `/nova-home` | mobile | **86** | as mesmas 3 (mesmo template) |
| `/fr/mentions-legales` | mobile | **100** | label-content-name-mismatch (1, aviso que não pesa na nota) |

As quatro homes (raiz, FR, EN, PT) usam o mesmo template "nova-home" (`body.nova-home-body`), então cada defeito aparece nos 4 idiomas. As páginas legais, geradas por `build_site.py`/`site.css`, estão em bom estado.

**Detalhe das falhas na home:**

| Auditoria | Elemento | Medição |
|---|---|---|
| aria-hidden-focus | `div#nhLightbox` (`fr/index.html:1229`) | O botão "Fermer" e o `<video controls>` continuam focáveis dentro de `aria-hidden="true"`. O CSS só aplica `opacity:0; pointer-events:none` (`nova-home.css:2418-2431`). |
| aria-required-children | `div.nh-cases-filters[role=tablist]` (`fr/index.html:594`) | Os filhos são `<button>` sem `role="tab"`, sem `aria-selected` e sem tabpanel. |
| color-contrast | `.timeline .step h3` | 2,16:1 (#494642 sobre #070504, 20px) |
| color-contrast | `.step h3 span.num` | 1,86:1 (12,5px) |
| color-contrast | `.step-card` | 1,74:1 (14px) |
| color-contrast | `.nh-footer-copy` | 3,68:1 (rgba(255,255,255,.4) sobre #050403, 12,5px) |

A causa do contraste na timeline é `.step { opacity:0.28 }`, que passa a 0,68 só quando a etapa vira "seen" (`nova-home.css:1517-1540`). Calculei os valores: creme a 0,28 dá 2,17:1 e text-secondary a 0,28 dá 1,73:1. A 0,68 eles sobem para 8,1:1 e 5,19:1. Ou seja, quem lê sem rolar, usa zoom, imprime ou tem leitor de tela com realce visual encontra 9 etapas ilegíveis.

### Contraste das 4 cores da marca (`assets/css/tokens.css:11-14`)

| Combinação | Razão | Texto normal (AA 4,5) | Texto grande ou UI (3,0) |
|---|---|---|---|
| Creme #F3EDE3 × Quase-preto #1A1A1A | **14,95** | ✅ | ✅ |
| Chocolate #3B2A20 × Creme | **11,73** | ✅ | ✅ |
| Areia #D8C8B0 × Quase-preto | **10,62** | ✅ | ✅ |
| Chocolate × Areia | **8,33** | ✅ | ✅ |
| Creme × Areia | **1,41** | ❌ | ❌ (proibir para texto) |
| Chocolate × Quase-preto | **1,27** | ❌ | ❌ (proibir para texto) |

A home não usa só os tokens: `nova-home.css:11-24` cria uma paleta própria, com fundo #070504, #C8B9A6, gradientes e rgba. Isso quebra a regra "4 cores, sem transparência, sem degradê" do design system. Medidas sobre o fundo da home (#070504): creme 17,47, #C8B9A6 10,60, areia 12,41, #B89F80 (fim do degradê `.nh-gradient-text`) 8,05 e **chocolate 1,49**. O chocolate nunca deve virar texto sobre o fundo escuro. Botão do seletor de idioma ativo (creme sobre chocolate): 11,73 ✅. CTA do cabeçalho: 17,16 ✅.

### Análise estática (working tree)

**Estrutura e semântica: está boa**
- `lang` correto em cada idioma (`fr`, `en`, `pt`). A raiz `index.html` usa `lang="fr"`, coerente com o x-default em FR.
- Landmarks: 1 `header`, 1 `nav` com rótulo, **1 único `main`** e 1 `footer`.
- Hierarquia de títulos: 1 `h1`, depois h2 e h3 em sequência, sem pulos (heading-order passa).
- Imagens: só 2 `<img>` estáticas, ambas logos com `alt="Soft Communication"`. A do cabeçalho fica dentro de um link com `aria-label="Soft Communication, accueil"`, o que está correto.
- Nenhum link ou botão sem nome acessível: o script contou 30 `a` e 10 `button`. Os SVG decorativos (WhatsApp, setas, ícone de tela cheia) têm `aria-hidden`.
- A home não tem formulário. O contato é por WhatsApp e mailto. O formulário de `index-classique.html:444-461` tem `label for`, `fieldset` e `legend`, e está OK.

**Problemas encontrados**
1. **Vídeos do portfólio inacessíveis por teclado.** Os 12 cards da vitrine (`div.nh-video-card`, `fr/index.html:410-520`) e os 6 estudos de caso (`article.nh-case-card`, linhas 604-769) só abrem por `click` e `mouseenter`. Não têm `tabindex`, `role="button"` nem nome acessível. O "▶ Voir le film" está com `aria-hidden`. Quem navega por teclado ou por leitor de tela não consegue assistir a nenhum vídeo.
2. **Lightbox de vídeo** (`fr/index.html:1229-1234` e o JS por volta da linha 1500): tem `role="dialog"`, mas falta `aria-modal` e falta nome. O foco não vai para o diálogo ao abrir, não volta ao card ao fechar e não fica preso dentro dele. Fechado, continua focável (a falha do Lighthouse).
3. **Gaveta de menu mobile sempre focável.** `.nh-mobile-drawer` fica só com `opacity:0; pointer-events:none` (`nova-home.css:230-254`) e nenhuma media query a esconde no desktop. São 10 paradas de Tab invisíveis (3 de idioma e 7 links) em qualquer largura, e o leitor de tela lê a navegação duas vezes. O botão `#nhMenuToggle` alterna `aria-expanded`, mas não tem `aria-controls` nem fecha com Escape.
4. **Movimento sem pausa e sem respeitar `prefers-reduced-motion`.** O `nova-home.css` tem cerca de 18 animações infinitas (ticker de 32s na linha 806, marquee de depoimentos de 64s na linha 1660, bento, REC piscando etc.). O único bloco reduced-motion (`nova-home.css:2530`) cobre só `.nh-rise`. O vídeo hero (`fr/index.html:316`) e 2 clipes do bento (linhas 1103 e 1107) tocam em `autoplay loop` sem botão de pausa (critério WCAG 2.2.2). A timeline anima por lerp no scroll. O preloader respeita a preferência: o script inline da linha 194 não ativa e `preloader.css:97` o esconde.
5. **Depoimentos duplicados para o leitor de tela.** `setA.concat(setA)` (`fr/index.html:1408-1409`) renderiza cada depoimento duas vezes sem `aria-hidden` na cópia. O avatar recebe `alt` igual ao nome que já aparece ao lado (linha 1394, redundante), e as 5 estrelas "★" não têm equivalente textual (por exemplo "5 sur 5").
6. **Botão de som com estado errado.** O `aria-label="Activer le son"` é fixo e só o texto visível muda para "Couper le son" (linhas 1294 e 1298). O leitor de tela sempre anuncia "Activer le son". Faltam `aria-pressed` ou a atualização do label.
7. **Rótulos ARIA em francês nas páginas EN e PT.** `aria-label="Navigation principale"` aparece em `en/index.html:218` e `pt/index.html:219`. Os demais rótulos foram traduzidos.
8. **Seletor de idioma da home** (`fr/index.html:226-230` e 244-248): é uma `div` com `aria-label` e sem role, então o rótulo é ignorado. Faltam `aria-current` no idioma ativo e `hreflang` nos links, e o texto "FR/EN/PT" não tem nome por extenso. Há `lang` em cada link. As páginas legais fazem isso corretamente (`fr/mentions-legales.html:229-231`). Mesmo problema em `.reviews-shell` com `aria-label`.
9. **Sem skip link na home.** As páginas legais e a `index-classique` têm "Aller au contenu". As homes nova-home, não.
10. **Foco visível:** o `nova-home.css` não define nenhuma regra `:focus` ou `:focus-visible` e depende do anel padrão do navegador, inclusive sobre cards e vídeos. Em `site.css:1319` e `admin.css:483` há `outline:none` (os campos têm borda alternativa no foco).
11. **Preloader:** fica com `aria-hidden` e o conteúdo abaixo continua no leitor de tela, o que é aceitável. Mas por cerca de 2,2s (fallback de 2,75s) `preloader.js:146-151` captura **Enter e Espaço** no documento com `preventDefault`, e o foco pode ir para elementos escondidos atrás do overlay. Também não há fallback em CSS: se `preloader.js` falhar ao carregar, a página fica coberta e com `overflow:hidden` para sempre (`preloader.css:11-31`).
12. **Vídeos sem legendas.** Nenhum `<video>` tem `<track>`. O hero tem som (há um botão de áudio) e o lightbox tem `controls`. Se houver fala, falta legenda (critério 1.2.2). Não verifiquei o áudio: fica como estimativa para o dono confirmar.
13. **Alvos de toque:** o Lighthouse aprovou target-size (mínimo de 24px). Medidas de referência: links de idioma com cerca de 27px de altura (estimativa: 11,5px de fonte mais 10px de padding), filtros com 36px, menu com 36×36, carrossel com 42×42 e botão de fechar com 40×40. Todos ficam abaixo dos 44px recomendados para mobile.
14. **Páginas privadas** (`entrega-cinema.html`, `cliente.html`): `lang="fr"` com conteúdo misturado em PT e FR (por exemplo "Central de Arquivos" na linha 399), salto de `h2` para `h4` (linha 504) e `img` sem dimensões (`cliente.html:467`). Prioridade baixa, porque têm noindex.

**Fora do escopo de a11y, mas vale avisar:** o ticker com `aria-hidden` (`fr/index.html:372-393`) lista marcas como Aman, Four Seasons e Ritz-Carlton como "nos font confiance". Se isso não estiver documentado, é dado inventado (para a área de conteúdo validar com o dono).

### Prioridade sugerida (fase 3)
1. Tornar os cards de vídeo operáveis por teclado e corrigir o lightbox (foco, `aria-modal`, `inert` quando fechado).
2. Usar `hidden`/`inert` na gaveta quando fechada e esconder no desktop.
3. Corrigir o contraste da timeline (aplicar o dim só ao trilho, nunca ao texto) e do rodapé (usar #C8B9A6 ou areia).
4. Trocar `role=tablist` por um grupo de botões com `aria-pressed`.
5. Criar um bloco reduced-motion global (animações, marquee, autoplay) e um botão de pausa no hero.
6. Marcar a duplicata dos depoimentos com `aria-hidden` e usar `alt=""` nos avatares.
7. Traduzir o `nav_aria` em EN e PT, adicionar skip link e corrigir o `aria-label` do botão de som.

---

## A.5 Dados estruturados, entidade, GEO/IA e alinhamento com o briefing

### Resumo
- **O working tree está saindo do briefing.** As alterações ainda não commitadas (homes FR/EN/PT/raiz, `nova-home.html`, `llms.txt` e `SEO/codigo/jsonld/01-organization-website.json`) **tiram a Polinésia Francesa** do site e reposicionam a Soft como "studio international" (Dubai, NY, Tóquio…). O deploy atual (`site-soft.vercel.app`) ainda mostra a versão "Polynésie", porque `/llms.txt` no ar começa com "founded in French Polynesia".
- **Prova social sem fonte:** um muro de logos de redes hoteleiras (Aman, Four Seasons, Bulgari, Ritz-Carlton…), 8 depoimentos internacionais com foto e métricas de case (+3,8M de views, ROAS 4.2×, 100% de satisfação). O próprio `SEO/PLANO_SEO_AEO_GEO.md` §10 proíbe "número sem fonte".
- **Endereço residencial publicado:** um endereço tipo "Résidence …" em Faa'a (omitido aqui de propósito) aparece em 6 páginas legais e já está no ar.
- **JSON-LD:** sintaxe válida em 100% dos blocos (21 páginas com bloco, 0 erros de parse). A semântica é fraca: domínio errado, URLs `.html` que redirecionam, `areaServed` contraditório, `sameAs` com `wa.me`, nenhum `Service` próprio, nenhum `VideoObject` e nenhum `BreadcrumbList` nas homes.
- **Serviços do briefing ausentes:** branding/identidade, manual de marca, criação de sites e automação de Instagram não aparecem no site nem no plano de SEO.

### 1. Inventário de JSON-LD (working tree)
| Página | Tipos | Observações |
|---|---|---|
| `index.html`, `fr/`, `en/`, `pt/index.html`, `nova-home.html` | Organization+ProfessionalService, WebSite, WebPage, FAQPage | Bloco escrito à mão, sem origem em script (não existe gerador com "Worldwide"/FAQPage). `areaServed:"Worldwide"`. `sameAs` inclui `https://wa.me/68987043112`. O mesmo `@id` `https://softcommunication.com/#faq` é usado em 4 idiomas, com conteúdos diferentes. Não há BreadcrumbList. |
| 15 páginas legais + `index-classique.html` | Organization+ProfessionalService, WebSite, WebPage(+breadcrumb nas legais) | JSON-LD antigo: "based in French Polynesia", areaServed com Polinésia + 5 estados dos EUA + `GeoShape` só com `name` (inválido: GeoShape exige box/circle/polygon). |
| `cliente.html`, `entrega-*.html`, `admin/*` | nenhum | noindex. Canonical com o erro de digitação `softcommunicaiton.com` em 5 arquivos. |

Problemas transversais:
- Todos os `url`/`@id`/`logo` usam `https://softcommunication.com`, que hoje é página estacionada da GoDaddy.
- `WebPage.url` em `.../fr/index.html`: em produção, `/fr/index.html` responde **308 → /fr** (cleanUrls), então canonical, @id e sitemap apontam para URLs que redirecionam.
- `ProfessionalService` é subtipo de LocalBusiness, e o próprio plano (§1 e §10) diz para não usar LocalBusiness sem `address`.
- `hasOfferCatalog` com 3 "Combos" de vídeo, sem `Service` próprio (sem url, `areaServed` ou `provider`). Os templates `SEO/codigo/jsonld/02–04` apontam para `/fr/services/...`, páginas que não existem.
- `VideoObject`: 0 no site. O catálogo tem 52 vídeos (34 ativos), todos com poster e duração, mas **todos com `rights:"a-confirmar"`**.
- FAQPage: desde 2023 não gera rich result para sites comerciais. O conteúdo marcado traz promessas comerciais que o dono precisa confirmar: "révisions illimitées", "14 jours ouvrés", "réponse sous 24h".

**Pedido do dono x situação**
| Esperado | Situação |
|---|---|
| Organization | Existe; nome, domínio e área inconsistentes |
| ProfessionalService/LocalBusiness + areaServed Polinésia | Existe o tipo, mas `areaServed:"Worldwide"` nas homes; a Polinésia foi removida no diff |
| WebSite | Existe (`name` "Soft Communication" ≠ Organization "Soft & Co") |
| BreadcrumbList | Só nas legais, aninhado em WebPage |
| Service (1 por serviço) | Ausente (só Offer→Service genérico) |
| FAQPage | Existe (4 idiomas, @id duplicado) |
| CreativeWork/VideoObject nos cases | Ausente; não existem páginas de case |

### 2. Entidade / NAP
| Atributo | Variações encontradas | Onde |
|---|---|---|
| Nome | "Soft Communication" (303×), "Soft & Co" (136×), "Soft & Co" (36×), "Soft & Co." (16×), "Studio Soft" (5×) | O title das homes usa "Soft Communication"; o das legais, "Soft & Co"; `legal_content.py:2` BRAND="Soft Communication"; Organization.name "Soft & Co"; WebSite.name "Soft Communication". O plano §1 manda "Soft & Co" como nome único. |
| Telefone/WhatsApp | +689 87 04 31 12 / wa.me/68987043112 (consistente) | config.js:7, legal_content.py:4, homes, llms.txt |
| E-mail | soft.communicationbr@gmail.com; `admin@softcommunicaiton.com` (typo) | soft-catalog.js (3×) |
| Instagram | instagram.com/soft.communicationbr (config.js:9). Também `instagram.com/softcommunication` e `linkedin.com/company/soft-communication` em `sameAs` de JSON-LD/legais, sem confirmação de que esses perfis sejam da Soft | 01-organization-website.json, páginas legais |
| Cidade/área | Homes: "International"/"Worldwide", Polinésia ausente (só "Perles de Tahiti" e "Pacifique" em legendas). Legais: Faa'a/Papeete/Polynésie. index-classique: "Polynésie" 17×. llms.txt: Dubai, Paris, NY, Milão, Tóquio, Genebra, Londres, São Paulo | conflito direto |
| Fundador | "Calebe" (só o primeiro nome) em JSON-LD/legais. A nova home não tem mais seção "Le créateur" (só `index-classique.html:398`) | E-E-A-T |
| Hospedagem (legal) | "hébergé par Hostinger" (`legal_content.py:26`), mas o site está na Vercel | informação legal incorreta |

### 3. llms.txt
- `maquette/llms.txt` e `SEO/codigo/llms.txt` são **idênticos**. No ar está a versão commitada (Polinésia); a do working tree remove a Polinésia e lista 8 metrópoles internacionais.
- Formato: H1 e blockquote estão corretos. Os problemas:
  - a seção "Primary Keyword Clusters & Intent Matching" é uma lista de palavras-chave para IA, o que soa como manipulação e não traz informação útil;
  - "Official Web Resources" lista páginas noindex/privadas (`cliente.html`, `entrega-cinema.html`, `entrega-reels.html`) e não lista as legais nem os serviços;
  - todas as URLs estão em `softcommunication.com` (estacionado) e em `.html` (308).
- Afirmações sem fonte que as IAs vão repetir: "premier international", "unlimited revisions", "14 business days" e "Every AI-assisted visual is transparently designated…". Esta última é falsa na home atual: 0 ocorrências de "non contractuel" em `fr/index.html`, embora haja o card "Villa Sunset · Architecture IA" (`fr/index.html:420`).
- Os serviços do briefing não aparecem.

### 4. Alinhamento com o briefing
| Serviço do briefing | Página própria | Seção/texto no site | Evidência |
|---|---|---|---|
| Branding / identidade visual | Não | Não (só "Image de Marque" no sentido de filme) | 0 ocorrências de "identité visuelle/charte" em fr/index |
| Manual de marca | Não | Não | 0 ocorrências |
| Criação de sites | Não | Não | "site web" só aparece no contexto de direitos de uso |
| Motion/vídeo | Não | Sim (3 Combos de vídeo, 6 cases, showreel) | fr/index.html: "01 / Cinéma", "02 / Présence", "03 / Projection" |
| Automação de Instagram | Não | Não (há "Reels" como formato de vídeo) | 0 ocorrências de "automati*" |
| Público "negócios locais" | — | Não: o site mira "hôtellerie d'exception", palaces, "USA · EU" | hero e cases |

- Páginas de serviço, de case, blog e "À propos": **nenhuma existe**. A FAQ fica só na home (6 perguntas, todas sobre vídeo).
- Respostas diretas citáveis: não há uma frase-âncora de 1 a 2 linhas que diga "o que é a Soft e onde atua". A frase-âncora do plano ("…en Polynésie française") não aparece em nenhuma home do working tree.
- O próprio `SEO/PLANO_SEO_AEO_GEO.md` também posiciona a Soft como produtora de vídeo (3 clusters: film de marque, UGC, immobilier IA) e ignora branding, sites e automação. O plano precisa ser revisto junto com o site.

### 5. Dados a confirmar com o dono (possivelmente inventados ou sensíveis)
| Item | Evidência | Situação |
|---|---|---|
| Muro de logos "+50 marques… nous font confiance" | No working tree: AMAN, FOUR SEASONS, BULGARI, RITZ-CARLTON, CHEVAL BLANC, MANDARIN ORIENTAL, SOTHEBY'S, BELMOND, ROSEWOOD, ST. REGIS (`fr/index.html:370-384`). No ar: AIR TAHITI NUI, CONRAD BORA BORA, FOUR SEASONS BORA BORA, THE BRANDO, INTERCONTINENTAL TAHITI… | Confirmar relação comercial e autorização de uso de marca |
| 8 depoimentos com nome, cargo, cidade e foto | `fr/index.html:1326-1373` (Amira Al-Mansoor/Dubai, Marcus Vance/NY, Yuka Takahashi/Tóquio…). Avatares em `assets/brand/avatars/client-1..9.jpg` (200–300 px). Nenhum depoimento é da Polinésia | Confirmar autoria, autorização escrita e direito de imagem |
| Métricas | "100% satisfaction", "50+ clients", "30+ vidéos/mois", "★★★★★ Satisfaction certifiée", "+3,8M vues", "-24% CAC", "4.2× ROAS", "+140% CA", "300%", "ROI dès 14 jours" | Sem fonte; contraria o plano §10 |
| Nomes do "casting" | Manatea, Vaitea, Lucas, Kahaia, Teiki, Hina (`fr/index.html:1067+`) | Confirmar se são pessoas reais com autorização |
| Direitos dos vídeos | `catalog.json`: 52/52 com `rights:"a-confirmar"`, 34 ativos e públicos | Confirmar antes de qualquer VideoObject |
| Endereço | um endereço tipo "Résidence …" em Faa'a (omitido aqui de propósito) em `legal_content.py:19,48,148,177,277,306` → 6 páginas legais, **no ar** | Possível endereço residencial. Decisão do dono: domiciliação ou endereço profissional |
| Registro | "Numéro TAHITI H02826", "RCS Papeete" (`legal_content.py:17-18`) | Confirmar se está correto (patente ≠ RCS) |
| Fundador | Só o primeiro nome "Calebe"; foto em `assets/brand/calebe.jpg` (usada só em index-classique) | OK em privacidade; confirmar se quer exibir |

---

## A.6 Higiene, exposição e riscos (SEO + reputação)

> Método: leitura do working tree atual (sem alterar nada), `curl` em site-soft.vercel.app, softcommunicaiton.com, softcommunication.com e GitHub, verificador de links próprio (scratchpad) e `python3 -B ferramentas/audit_site.py` (só leitura; confirmei que ele não grava arquivos). Nenhum segredo é reproduzido aqui: cito só o nome da variável e arquivo:linha.

### 1. Domínios: o que responde de fato

| Host | Resposta medida | O que significa |
|---|---|---|
| `softcommunication.com` (canônico no código) | 200, HTML de 114 bytes com `window.location.href="/lander"`; `/lander` → `forsale.godaddy.com/forsale/softcommunication.com`; `robots.txt` da GoDaddy; `sitemap.xml` lista só `/lander`; **`llms.txt` diz "softcommunication.com is a domain name currently listed for sale on GoDaddy"** | Todos os canonicals, hreflang, og:url, sitemap e JSON-LD apontam para um domínio de terceiros que está à venda. Hoje as IAs que leem o llms.txt desse domínio recebem "domínio à venda". |
| `www.softcommunication.com` | 200, mesma página estacionada | idem |
| **`softcommunicaiton.com`** (com erro de digitação) | **200, `server: Vercel`, mesmo HTML que site-soft.vercel.app (95 607 bytes)**; `/admin/`, `/cliente`, `/entrega-reels`, `/fr/`, `/sitemap.xml` com 200 | Na prática, o único domínio próprio que serve o site é o que tem o erro de digitação. |
| `www.softcommunicaiton.com` | 200 (95 607 bytes), **sem redirecionar** | host duplicado |
| `http://softcommunicaiton.com` | 308 → https | ok |
| `site-soft.vercel.app` | 200, sem `X-Robots-Tag` | terceiro host indexável |
| `softcommunication.pf` / `www.` | não respondeu (000) | sem site |

Resultado: há 3 hosts indexáveis (`site-soft.vercel.app`, `softcommunicaiton.com` e `www.softcommunicaiton.com`) com conteúdo idêntico, `index, follow`, e canonical para um 4º domínio que não é do dono. É o risco nº 1 desta área. A escolha do domínio cabe ao dono: comprar o `.com` correto, adotar o `.pf` ou manter o domínio com erro de digitação.

### 2. Páginas que não deveriam ser públicas nem indexáveis

| Página (deploy) | HTTP | meta robots | canonical | No sitemap | robots.txt | Links de entrada |
|---|---|---|---|---|---|---|
| `/admin/` (index) | 200 | noindex,nofollow | softcommunication.com | não | **Disallow: /admin/** (o Google não consegue ler o noindex) | **link visível "Administration" no rodapé das 3 homes** (`fr/index.html:1248`, `en/index.html:1248`, `index.html:1248`, `nova-home.html:1238`) + 5 links ocultos por CSS em cada página legal (`en/cookies.html:234,250,267,351,388` etc.) e em `index-classique.html:226,242,259,498,535` |
| `/admin/clientes`, `/demandes`, `/mediatheque` | 200 | noindex,nofollow | **softcommunicaiton.com** (linha 9) | não | Disallow | links do painel |
| `/admin/kanban` | 200 | noindex,nofollow | softcommunication.com | não | Disallow | painel |
| `/admin/projet` | 200 | **nenhum** (página de redirecionamento meta-refresh + JS) | — | não | Disallow | — |
| `/cliente` | 200 | noindex,nofollow | nenhum | não | permitido (ok, o noindex é lido) | **`llms.txt:53`** ("Client Portal") |
| `/entrega-cinema`, `/entrega-reels` | 200 | noindex,nofollow | **softcommunicaiton.com** (linha 9) | não | permitido | **`llms.txt:54-55`** (como "Official Web Resources"), `admin/demandes.html:223` |
| `/nova-home` | 200 | **index,follow** | `softcommunication.com/` | não | permitido | painel (`admin/index.html:74,157` etc.), autolink |
| `/index-classique` | 200 | **index,follow** | `softcommunication.com/` + hreflang de home | não | permitido | nenhum encontrado |

Observações:
- `cliente.html` e `entrega-*.html` não têm controle de acesso: o único JS (`cliente.html:489`) só mostra um botão para o admin. Os "masters" ficam no bucket público `videos-portifolio` do Supabase (`cliente.html:403,426,437`). `cliente.html` mostra o cliente "Hôtel Polynesian Sun Resort". Se esse cliente for fictício, uma página pública com cara de entrega real é um risco de reputação. **O dono precisa confirmar.**
- `index-classique.html` tem título e descrição diferentes da home ("Soft & Co | Films de marque & Vidéo… immobilier IA… Studio cinématographique à Tahiti"), com posicionamento diferente do briefing.

### 3. Segredos e autenticação no front

| Item | Onde | Avaliação |
|---|---|---|
| JWT Supabase `role=anon` (projeto `xvabghgv…`, mesma chave em todos) | `assets/js/config.js:16` (`supabaseAnonKey`), `admin-auth.js:10` (`SUPABASE_ANON`), `site.js:457` (`SUPABASE_ANON`), `admin/index.html:185` e `admin/kanban.html:695` (`API_KEY`), `admin/demandes.html:325` (`SUPABASE_ANON`) | Chave pública: é aceitável **somente se o RLS estiver correto**. Não há `service_role`, `sb_secret`, token do Telegram, webhook do Discord nem chave do Resend no front nem no histórico git (busca no `git log -p --all`). As edge functions leem esses dados de `Deno.env` (`supabase/functions/lead-notifier/index.ts:57-60`, `cal-webhook/index.ts:21`): ok. |
| **Autenticação do painel admin** | `assets/js/admin-auth.js`, `assets/js/soft-catalog.js` e histórico git | **Crítico (segurança).** O controle de acesso do painel é feito só no navegador e há credencial exposta em código público. Detalhes técnicos foram passados diretamente ao dono e **não ficam registrados aqui**, porque este repositório está público no GitHub. Ação: trocar a credencial, tornar o repositório privado e migrar o painel para Supabase Auth com RLS revisado. |
| E-mail fictício com erro de digitação | `admin@softcommunicaiton.com` em `admin-auth.js:29`, `soft-catalog.js:170,171,177,189` | Só cosmético, mas reforça a confusão de domínio. |

### 4. Exposição de dados pessoais (regra do briefing)
- As páginas legais publicam um **endereço tipo "Résidence …" em Faa'a** como "Adresse professionnelle" (`fr/mentions-legales.html:311`, `pt/aviso-legal.html:311`, `en/legal.html:311`, também em `confidentialite`/`privacy`/`politica-de-privacidade` e na fonte `ferramentas/legal_content.py:19,48,148,177,277,306`). Tudo indica ser residencial, o que contraria a regra "localização só no nível de mercado". O dono precisa confirmar e, se for o caso, contratar uma domiciliação comercial. Também consta só o primeiro nome do responsável ("Exploitant Calebe").
- Telefone e WhatsApp comerciais (`+689 87 04 31 12`) e e-mail Gmail são contatos de negócio: aceitável. O Gmail (77 ocorrências) enfraquece a credibilidade de uma agência.

### 5. Informação legal incorreta
- As menções legais dizem que o site "é hospedado pela Hostinger" (`fr/mentions-legales.html:323-324`, `pt/aviso-legal.html:323-324`, `en/legal.html:323-324`, `legal_content.py:26-27,70,155-156,199,284-285,328`), mas o deploy responde `server: Vercel`. A informação obrigatória está errada (LCEN), o que pesa em confiança e E-E-A-T.

### 6. Arquivos e pastas publicados

| Teste no deploy | Resultado |
|---|---|
| `/.claude/`, `/.claude/.cc-writes/`, `/admin/.claude/`, `/assets/.claude/`, `/assets/js/.claude/`, `/assets/brand/.claude/` | 404 em todos. As 5 pastas `.claude/` dentro de `maquette/` estão **vazias** e no `.gitignore` (`.gitignore:23`). |
| `/.git/config`, `/.env`, `/.gitignore`, `/vercel.json`, `/ferramentas/build_site.py`, `/SEO/PLANO_SEO_AEO_GEO.md`, `/00_LIRE_EN_PREMIER.md` | 404 (fora do `outputDirectory`) |
| `/assets/js/config.js`, `/assets/js/admin-auth.js`, `/assets/data/catalog.json` | 200 (esperado; ver item 3) |
| `/a4b7f8c92e104d5b8c3f7a1e9b2c4d6f.txt` | 200 (provável chave do IndexNow; ok) |
| `/google805618d3b3339e62.html` | **308 → `/google805618d3b3339e62`** por causa do `cleanUrls`. Confirmar no Search Console que a verificação continua válida. |

Nada de PDF, md ou scripts sai pelo deploy. Mas o **repositório GitHub público** expõe o PDF "Soft Communication — Direção Web.pdf", os prompts `11_`/`12_`/`13_`, o plano de SEO, `ferramentas/` e `supabase/functions/`.

### 7. Links, `target=_blank` e mixed content
- Verificador próprio (28 HTMLs): **1 recurso quebrado**, o poster `assets/posters/preview-30fps-1-hero.jpg` em `cliente.html:403`. O `audit_site.py` relatou "0 erros em 1406 links": é um falso negativo (ele não verifica `poster`).
- `target="_blank"` sem `rel="noopener"`: **0**.
- Mixed content (`http://` em src/href): **0**.
- Atenção (área técnica): o sitemap e os hreflang usam `/fr/index.html` etc., e o deploy responde **308** para `/fr` (`cleanUrls: true`). As URLs canônicas não são as URLs finais.

### 8. Cabeçalhos HTTP (`curl -I` em `/`, `/admin/`, JS, JSON)

| Cabeçalho | Valor |
|---|---|
| `strict-transport-security` | `max-age=63072000; includeSubDomains; preload` (vercel.app); `max-age=63072000` (softcommunicaiton.com) ✅ |
| `cache-control` | `public, max-age=0, must-revalidate` **também em JS e JSON**: sem cache longo para assets (pesa sobre os 26 MB medidos pelo Lighthouse) |
| `content-security-policy`, `x-content-type-options`, `x-frame-options`, `referrer-policy`, `permissions-policy` | **ausentes** (o `vercel.json` não tem bloco `headers`) |
| `x-robots-tag` | ausente em todos os hosts, inclusive `/admin/` e `*.vercel.app` |
| `access-control-allow-origin` | `*` (padrão da Vercel para estáticos; ok) |

### 9. Pontos positivos
Nenhuma chave secreta no front nem no histórico; edge functions usam variáveis de ambiente; nenhum link `_blank` sem `rel`; nenhum mixed content; pastas internas e `.claude/` não são servidas; páginas de cliente e de entrega têm `noindex` e não estão no sitemap.

---

# Anexo B — Lista completa de achados

Severidade final = após verificação adversarial (achados críticos e altos foram reproduzidos de forma independente). Prefixos: MAP arquitetura, TEC indexação, PERF performance, A11Y acessibilidade, SD dados estruturados/conteúdo, HIG higiene/segurança.

| ID | Achado | Sev. inicial | Sev. final | Verificação | Imp. | Esf. | Fase | Recomendação |
|---|---|---|---|---|---|---|---|---|
| MAP-01 | build_site.py (e dev_watch.py ao iniciar) apagaria as 4 homes atuais e voltaria ao layout antigo | critico | alto | confirmado | 5 | 3 | 3 | Antes de qualquer correção: não rodar build_site.py/dev_watch.py. Na Fase 3, portar o layout nova-home para o gerador (template + STRINGS FR/PT/EN) ou retirar as homes do gerador explicitamente, e atualizar LEIA_ME. |
| MAP-02 | O <head> é reescrito por regex em pós-processamento; auto_renovar_seo (inclusive --watch) altera homes e legais | alto | alto | confirmado | 4 | 3 | 3 | Mover toda a montagem do <head> para build_site.head(), alimentada por um único arquivo de dados (metas.json revisado). Aposentar a reescrita por regex e passar as trocas de conteúdo para STRINGS. |
| MAP-03 | Canonical, hreflang, og:url, sitemap e IndexNow usam URLs .html que dão 308 na Vercel | alto | alto | confirmado | 4 | 2 | 3 | No gerador, emitir URLs limpas (/fr, /fr/mentions-legales) em canonical, hreflang, og:url, JSON-LD, sitemap, IndexNow e links internos, a partir de uma constante SITE_URL única. |
| MAP-04 | Home FR publicada em 4 URLs: /, /fr, /nova-home e /index-classique | alto | medio | confirmado | 4 | 2 | 3 | Definir a política da raiz: / redireciona para /fr com x-default=/fr, ou / é a home FR canônica e /fr redireciona. Remover nova-home.html e index-classique.html do output (ou redirect 308 em vercel.json). |
| MAP-05 | Posicionamento 'internacional/UAE' não commitado em metas.json e JSON-LD contraria o briefing | alto | alto | parcial | 4 | 1 | dono | O dono precisa confirmar o mercado (briefing: Polinésia Francesa, negócios locais) antes de commitar. Reverter areaServed e descrições para o foco local se for o caso, e não inventar mercados. |
| MAP-06 | Domínio codificado em vários scripts e erro 'softcommunicaiton.com' em canonicals e JS | medio | medio | não verificado (médio/baixo) | 3 | 2 | 3 | Uma única constante SITE_URL (config ou variável de ambiente) para todos os geradores. Corrigir o erro de digitação. O domínio final depende de decisão do dono (hoje softcommunication.com está estacionado). |
| MAP-07 | Páginas legais geradas linkam âncoras que não existem mais na home e carregam JS de catálogo sem uso | medio | medio | não verificado (médio/baixo) | 2 | 2 | 3 | No gerador, alinhar header e footer às seções da home atual, incluir as 4 legais no footer das homes e carregar só config.js e site.js nas legais. |
| MAP-08 | validar.py aprova (0 erros) um estado com duplicatas, URLs que redirecionam e domínio errado; dois geradores de sitemap | medio | medio | não verificado (médio/baixo) | 3 | 2 | 3 | Ampliar validar.py com essas checagens e testar rotas contra o output real. Manter um só gerador de sitemap com lastmod real. Alinhar ou aposentar metas.json/gerar_sitemap.py. |
| MAP-09 | Barra final não normalizada e redirect /maquette incompleto | medio | medio | não verificado (médio/baixo) | 2 | 1 | 3 | vercel.json: 'trailingSlash': false, redirect explícito de /maquette/ para /, e 404.html próprio (hoje é o texto padrão 'NOT_FOUND' da Vercel). |
| MAP-10 | Deploy *.vercel.app indexável e arquivos de verificação/IndexNow ligados ao domínio estacionado | medio | medio | não verificado (médio/baixo) | 3 | 1 | 3 | Depois do domínio próprio ativo: X-Robots-Tag noindex condicionado ao host *.vercel.app, verificação por DNS ou meta tag, e IndexNow apontando para o host real. |
| MAP-11 | Inconsistências menores de lang, title e robots em páginas privadas | baixo | baixo | não verificado (médio/baixo) | 1 | 1 | 3 | Padronizar lang no gerador, dar <title> às páginas privadas e tratar /admin via X-Robots-Tag em vez de robots.txt. |
| TEC-01 | Domínio canônico softcommunication.com está estacionado; o site real roda em softcommunicaiton.com | critico | critico | confirmado | 5 | 2 | dono | O dono decide o domínio definitivo: comprar softcommunication.com e conectá-lo à Vercel, ou assumir oficialmente softcommunicaiton.com (ou outro, ex. .pf). Depois, trocar BASE em atualizar_meta_producao.py:28, metas.json, auto_renovar_seo.py:42, robots e llms.txt, regenerar e verificar. Até lá, o site não é indexável sob a URL canônica declarada. |
| TEC-02 | Três hosts servem o mesmo conteúdo sem redirect (vercel.app, apex e www) | alto | alto | confirmado | 4 | 1 | 3 | Depois de definir o domínio (TEC-01), configurar na Vercel redirect 308 de www → apex (ou o inverso) e de qualquer domínio secundário → principal. Para *.vercel.app, usar o redirect de domínio ou X-Robots-Tag noindex via headers no vercel.json. |
| TEC-03 | Canonical, hreflang, og:url e sitemap usam URLs .html que redirecionam (308) por causa do cleanUrls | alto | alto | confirmado | 4 | 2 | 3 | Gerar canonical, hreflang, og:url, sitemap e links internos sem extensão (/fr, /fr/mentions-legales), alinhando atualizar_meta_producao.py e build_site.py (page_target) com metas.json, que já usa /fr e /en. |
| TEC-04 | Home duplicada: raiz / e /fr/ têm o mesmo conteúdo, cada uma autocanônica; nova-home e index-classique indexáveis | alto | alto | parcial | 4 | 2 | 3 | Escolher uma URL para a home FR: ou 308 de / → /fr (ou de /fr → /) com canonical único, ou manter / como a home FR e redirecionar /fr. Colocar noindex ou remover do deploy nova-home.html e index-classique.html (ou redirecionar 308 para a home). |
| TEC-05 | x-default divergente entre HTML e sitemap, e várias fontes de verdade de SEO | medio | medio | não verificado (médio/baixo) | 3 | 2 | 3 | Uma única fonte (metas.json) para title, desc, paths e x-default; atualizar_meta e gerar_sitemap leem só dela. Definir x-default = home FR canônica e aplicar o mesmo valor no HTML e no sitemap. |
| TEC-06 | Imagem OG e twitter:image quebradas (servidas pelo domínio estacionado) | alto | alto | confirmado | 3 | 1 | 3 | Com o domínio corrigido (TEC-01), revalidar no Facebook Sharing Debugger e no WhatsApp. Adicionar width/height/alt também nas legais. |
| TEC-07 | Typo softcommunicaiton.com hardcoded em canonicals, rodapés e e-mails de admin | medio | medio | não verificado (médio/baixo) | 2 | 1 | 3 | Depois da decisão de domínio (TEC-01), padronizar em uma constante. Nas páginas noindex, basta remover o canonical. Incluir as páginas privadas na varredura de typo do validar.py. |
| TEC-08 | Descriptions das homes perderam a localização (Polynésie) no working tree e excedem o tamanho | alto | alto | parcial | 4 | 1 | 4 | Não commitar a remoção da localidade sem validar com o dono (mercado principal = Polinésia Francesa). Reescrever title e description FR/PT/EN com serviço + Polynésie/Tahiti + CTA, em até 155 caracteres. |
| TEC-09 | Sem página 404 personalizada | medio | medio | não verificado (médio/baixo) | 2 | 1 | 3 | Criar maquette/404.html (a Vercel o usa automaticamente) com navegação, links para as 3 homes e noindex. |
| TEC-10 | lastmod do sitemap fixo no código e pipeline que força lastmod artificial | medio | medio | não verificado (médio/baixo) | 2 | 1 | 3 | lastmod = data real de modificação do conteúdo de cada página (git log ou hash); nunca a data do dia em massa. Remover priority. |
| TEC-11 | Verificação do Google por arquivo HTML sofre 308 do cleanUrls | medio | medio | não verificado (médio/baixo) | 3 | 1 | 6 | Verificar a propriedade de domínio via DNS TXT no domínio definitivo (preferível) ou adicionar uma exceção/rewrite para o .html. O dono confirma qual propriedade existe no Search Console. |
| TEC-12 | IndexNow configurado para o domínio estacionado | medio | medio | não verificado (médio/baixo) | 2 | 1 | 6 | Não rodar --ping-indexnow até TEC-01 estar resolvido. Depois, apontar HOST para o domínio real, usar URLs limpas, gerar uma chave nova aleatória e pingar só URLs alteradas. |
| TEC-13 | Build base emite noindex e hreflang relativo; produção depende de pós-processamento | medio | medio | não verificado (médio/baixo) | 3 | 2 | 3 | Mover canonical/hreflang/robots/OG para dentro de build_site.py (ou um único script 'build:prod') e adicionar uma checagem de CI/pre-deploy que falhe se houver noindex nas páginas públicas. |
| TEC-14 | Ícones incompletos: sem apple-touch-icon, manifest, favicon.ico e theme-color | baixo | baixo | não verificado (médio/baixo) | 2 | 1 | 3 | Adicionar favicon.ico ou PNG 48px, apple-touch-icon 180×180, site.webmanifest e theme-color, gerados a partir do símbolo oficial. |
| TEC-15 | robots.txt: Disallow /admin/ não cobre /admin, e a home pública linka para o admin | baixo | baixo | não verificado (médio/baixo) | 1 | 1 | 3 | Usar 'Disallow: /admin' (sem barra final), tirar o link Administration do rodapé público e colocar noindex no projet.html. As páginas admin já têm noindex. |
| TEC-16 | Inconsistências menores de lang, hierarquia e title nas páginas privadas e PT | baixo | baixo | não verificado (médio/baixo) | 1 | 1 | 3 | Padronizar lang (pt-BR ou pt) nas páginas PT. Corrigir os saltos de cabeçalho. Confirmar com o dono se 'Hôtel Polynesian Sun Resort' é demo ou cliente real (não deve parecer cliente real se for placeholder). |
| TEC-17 | O validar.py dá falso positivo de conformidade (0 erro) | medio | medio | não verificado (médio/baixo) | 2 | 2 | 6 | Estender o validador: ler title/desc do HTML, comparar hreflang HTML × sitemap, exigir URLs sem .html, checar typo em todas as páginas e fazer um HEAD no domínio canônico para confirmar que ele serve o site. |
| PERF-01 | 3 vídeos com autoplay baixam ~25,7 MB no carregamento inicial (98% do peso) | critico | critico | confirmado | 5 | 3 | 3 | Transcodificar o hero para 720p/1080p a ~1,5-2 Mb/s (2-4 MB) com <source media> para mobile, ou usar streaming adaptativo (HLS/Mux/Cloudflare Stream). Tirar o autoplay dos clips abaixo da dobra e iniciá-los via IntersectionObserver com preload=none. Meta: < 2 MB antes da interação. |
| PERF-02 | Clips do bloco 'Expert' são masters 4K de 18,9 MB exibidos a ~100 px | alto | alto | parcial | 4 | 2 | 3 | Gerar versões de ~240 px de largura (≤300 KB, WebM/AV1 + MP4 H.264) só para esses clips; manter os masters apenas no lightbox. |
| PERF-03 | LCP de 3,8-4,6 s em mobile: render delay de 71-84% causado pelo preloader + hero com opacity:0 | alto | alto | confirmado | 5 | 2 | 3 | Deixar o hero (poster + H1) pintado desde o 1º frame. A cortina pode subir por cima sem esconder o conteúdo (animar só transform, ou opacity inicial ≥0,01). Encurtar o preloader para ≤600 ms ou exibi-lo só na 1ª visita da sessão. Adicionar <link rel=preload as=image fetchpriority=high> no poster LCP. |
| PERF-04 | Desktop /fr sem LCP registrado (NO_LCP): sem nota de Performance | alto | medio | parcial | 3 | 2 | 3 | Corrigir junto com PERF-03 (conteúdo do hero visível desde a pintura inicial). Depois revalidar no Lighthouse desktop e no PageSpeed Insights. |
| PERF-05 | Cadeia de CSS render-blocking: Google Fonts cross-origin + @import do preloader.css | alto | alto | confirmado | 4 | 2 | 3 | Self-host das fontes (woff2 subset latin) com preload das 2 principais; trocar o @import por inline do CSS crítico (preloader + hero) no <head> e carregar o restante normalmente; preloader.js com defer ou inline. |
| PERF-06 | CLS por troca de fonte no hero (0,114 na /nova-home, 0,045 no desktop /fr) | medio | medio | não verificado (médio/baixo) | 3 | 2 | 3 | Usar @font-face de fallback com size-adjust/ascent-override/descent-override calibrados para Poppins e Cormorant; reduzir os 10 estilos pedidos ao que for realmente usado. |
| PERF-07 | Nenhum cache longo em assets estáticos na Vercel | medio | medio | não verificado (médio/baixo) | 3 | 1 | 3 | Adicionar headers no vercel.json: /assets/(.*) com 'public, max-age=31536000, immutable' (versionar JS/imagens com ?v= ou hash no build_site.py). No Supabase, subir os vídeos com cacheControl longo (ex.: 31536000). |
| PERF-08 | Poster LCP em JPG de 640×360: subdimensionado no desktop, sem AVIF/WebP nem srcset | medio | medio | não verificado (médio/baixo) | 3 | 2 | 3 | Gerar posters em AVIF/WebP (com fallback JPG) em 2 tamanhos. Para o LCP, usar <picture>/<img> sobreposto ao vídeo com srcset 640/1280 e fetchpriority=high. |
| PERF-09 | 19 posters baixados de imediato, inclusive dos cards fora da tela | baixo | baixo | não verificado (médio/baixo) | 2 | 2 | 3 | Para cards abaixo da dobra, aplicar o poster via data-poster e IntersectionObserver, ou usar <img loading=lazy> como capa e criar o <video> só no hover/clique. |
| PERF-10 | Main thread de 6,4-10,5 s em mobile: decodificação de vídeo, animações infinitas e backdrop-filter | medio | medio | não verificado (médio/baixo) | 3 | 3 | 3 | Pausar vídeos e marquees fora da viewport (IntersectionObserver + animation-play-state); limitar backdrop-filter a 1-2 camadas; atualizar o timecode via rAF com throttle. Medir INP real (fase 6). |
| PERF-11 | INP e Core Web Vitals de campo não são medidos | medio | medio | não verificado (médio/baixo) | 3 | 1 | 6 | Ativar Vercel Speed Insights ou web-vitals.js (LCP/CLS/INP com atribuição) e acompanhar o p75 por idioma; validar no PSI/CrUX depois que o domínio servir o site. |
| PERF-12 | CSS sem minificação e scripts desnecessários nas páginas legais | baixo | baixo | não verificado (médio/baixo) | 2 | 1 | 3 | Minificar CSS/JS no build_site.py; carregar catalog.js/soft-catalog.js só nas páginas que usam catálogo (confirmar dependências do site.js). |
| PERF-13 | Peso morto no deploy: fotos duplicadas e assets sem uso | baixo | baixo | não verificado (médio/baixo) | 1 | 1 | 3 | Remover duplicatas e .bak do outputDirectory; gerar avatares em 96×96 WebP. Confirmar com o dono antes de apagar as fotos de fundador. |
| PERF-14 | Deploy defasado em relação ao working tree auditado | baixo | baixo | não verificado (médio/baixo) | 2 | 1 | 6 | Repetir o Lighthouse após cada deploy das correções; registrar a linha de base com o commit e a URL medidos. |
| A11Y-01 | Vídeos do portfólio e estudos de caso não abrem por teclado nem por leitor de tela | alto | alto | confirmado | 5 | 2 | 3 | Envolver cada card em um <button type=button> (ou adicionar tabindex=0, role=button, aria-label 'Voir le film : <título>' e handler para Enter e Espaço). Ajuste no template da home dos 3 idiomas. |
| A11Y-02 | Lightbox de vídeo sem gestão de foco e focável quando fechado (Lighthouse aria-hidden-focus) | alto | alto | confirmado | 4 | 2 | 3 | Usar <dialog> nativo com showModal(), ou aplicar inert/hidden quando fechado e aria-modal=true e aria-label quando aberto. Mover o foco para o botão de fechar, prender o Tab dentro do diálogo e devolver o foco ao card de origem ao fechar. |
| A11Y-03 | Contraste insuficiente na timeline da Méthode (1,74 a 2,16:1) e no copyright do rodapé (3,68:1) | alto | medio | parcial | 4 | 1 | 3 | Aplicar o efeito de progressão só ao trilho ou marcador, deixando o texto sempre opaco (creme 17,47:1 ou #C8B9A6 10,6:1). Trocar o footer-copy por #C8B9A6 ou areia (12,41:1). |
| A11Y-04 | Gaveta de menu mobile invisível mas focável em qualquer largura | alto | medio | parcial | 4 | 1 | 3 | Usar hidden ou inert (ou visibility:hidden) quando fechada, display:none em ≥960px, aria-controls='nhMobileDrawer', fechar com Escape e devolver o foco ao toggle. |
| A11Y-05 | Animações infinitas e vídeos em autoplay sem pausa e sem respeitar prefers-reduced-motion | medio | medio | não verificado (médio/baixo) | 3 | 2 | 3 | Criar um bloco global @media (prefers-reduced-motion: reduce) com animation:none e pausar via JS os vídeos com autoplay. Adicionar botão Pause/Play no hero e pausar os marquees no :focus-within (hoje pausa só no :hover, linha 1667). |
| A11Y-06 | role=tablist inválido nos filtros dos estudos de caso (Lighthouse aria-required-children) | medio | medio | não verificado (médio/baixo) | 2 | 1 | 3 | Remover role=tablist, usar role=group com aria-label e aria-pressed=true/false nos botões (atualizado no JS do filtro), e anunciar o número de resultados em uma região aria-live. |
| A11Y-07 | Depoimentos lidos duas vezes e estrelas sem equivalente textual | medio | medio | não verificado (médio/baixo) | 3 | 1 | 3 | Marcar a segunda cópia com aria-hidden=true e inert, usar alt='' nos avatares e trocar as estrelas por <span role=img aria-label='5 sur 5'>. Usar <section aria-label> ou role=region. |
| A11Y-08 | Botão de som anuncia sempre 'Activer le son' | medio | medio | não verificado (médio/baixo) | 2 | 1 | 3 | Remover o aria-label e deixar o texto visível como nome, ou atualizar o aria-label junto com o texto, ou usar aria-pressed. |
| A11Y-09 | Rótulo ARIA da navegação em francês nas páginas EN e PT | baixo | baixo | não verificado (médio/baixo) | 2 | 1 | 3 | Usar 'Main navigation' e 'Navegação principal', ligando o template da home às STRINGS por idioma. |
| A11Y-10 | Seletor de idioma da home sem aria-current, hreflang e nome por extenso | baixo | baixo | não verificado (médio/baixo) | 2 | 1 | 3 | Usar <nav aria-label='Langue'> ou role=group, adicionar hreflang em cada link, aria-current='page' no ativo e aria-label 'Français', 'English' e 'Português' (ou texto visualmente oculto). |
| A11Y-11 | Home sem skip link e sem estilos de foco próprios | baixo | baixo | não verificado (médio/baixo) | 2 | 1 | 3 | Adicionar <a class=skip-link href='#conteudo'> e id no main. Definir :focus-visible com outline de 2px em creme ou areia e offset, visível sobre o fundo escuro. |
| A11Y-12 | Preloader captura Enter e Espaço e não tem fallback se o JS falhar | baixo | baixo | não verificado (médio/baixo) | 2 | 1 | 3 | Interceptar só Escape (ou não interceptar nada), adicionar uma animação CSS de saída como fallback (por exemplo, animation com delay de 3s até visibility:hidden) e não bloquear o scroll. |
| A11Y-13 | Vídeos com som sem legendas (<track>) | medio | medio | não verificado (médio/baixo) | 3 | 3 | dono | O dono deve confirmar quais vídeos têm fala. Para esses, gerar arquivos WebVTT em FR, EN e PT e adicionar <track kind=captions srclang>. Vídeos só com música podem ficar sem. |
| A11Y-14 | Paleta da home fora das 4 cores e combinações proibidas para texto | baixo | baixo | não verificado (médio/baixo) | 2 | 2 | 3 | Documentar no design system que creme sobre areia e chocolate sobre quase-preto ou #070504 são proibidos para texto, e alinhar as variáveis --nh-* aos tokens. |
| A11Y-15 | Páginas privadas com idioma misto e salto de títulos | baixo | baixo | não verificado (médio/baixo) | 1 | 1 | 3 | Unificar o idioma (ou marcar trechos com lang), usar h3 no lugar de h4 e adicionar dimensões às imagens. |
| SD-01 | Alterações não commitadas removem a Polinésia Francesa (mercado principal) de JSON-LD, metas, FAQ e llms.txt | critico | critico | confirmado | 5 | 2 | dono | Não publicar esse diff. O dono precisa decidir o posicionamento: o briefing diz mercado principal FR/Polinésia e negócios locais. Restaurar areaServed {AdministrativeArea: Polynésie française} e a frase-âncora do plano §1 em title, description, JSON-LD e llms.txt. |
| SD-02 | Muro de logos de marcas globais/locais e '+50 marques nous font confiance' sem comprovação | critico | critico | confirmado | 5 | 1 | dono | Remover até o dono confirmar, cliente por cliente, que houve trabalho real e que há autorização de uso da marca. Usar só nomes confirmados. |
| SD-03 | Endereço possivelmente residencial publicado nas páginas legais (já em produção) | critico | alto | parcial | 4 | 1 | dono | O dono decide entre endereço de domiciliação ou profissional e o que a lei local exige nas mentions légales. Nunca colocar esse endereço em JSON-LD, llms.txt ou diretórios. Depois, regenerar as legais por legal_content.py. |
| SD-04 | Depoimentos, métricas de cases e números de prova social sem fonte | alto | alto | confirmado | 5 | 2 | dono | O dono confirma cada depoimento (autorização escrita e de imagem) e cada número (fonte). O que não for confirmado sai. Não marcar com Review/AggregateRating. |
| SD-05 | Serviços do briefing (branding, manual de marca, sites, automação Instagram) inexistentes no site e no plano | alto | alto | confirmado | 5 | 4 | 4 | Com o dono, confirmar o catálogo real de serviços. Criar uma página por serviço (FR primeiro) com bloco-resposta de 1 a 2 frases, um Service JSON-LD com provider/areaServed e uma FAQ própria. Revisar o mapa de palavras-chave do plano. |
| SD-06 | Todas as URLs de JSON-LD apontam para domínio estacionado e para .html que redireciona (308) | alto | alto | confirmado | 4 | 2 | 3 | Depois que o dono definir o domínio, gerar @id/url sem .html (/fr, /fr/mentions-legales) a partir de uma constante BASE única. Corrigir o typo. |
| SD-07 | JSON-LD das homes é editado à mão e diverge do gerador e do JSON de referência | alto | alto | confirmado | 4 | 3 | 3 | Ter uma única fonte de verdade (jsonld/*.json + gerador) que rode no build para todas as páginas. Deixar de editar JSON-LD direto em maquette/*.html. |
| SD-08 | Nome da entidade inconsistente (Soft Communication x Soft & Co x Studio Soft) | medio | medio | não verificado (médio/baixo) | 4 | 2 | dono | O dono escolhe o nome principal (e o nome comercial registrado). Aplicar em title, og:site_name, Organization.name, WebSite.name, rodapé, llms.txt e perfis, com o outro nome só em alternateName. |
| SD-09 | sameAs com wa.me e perfis não confirmados | medio | medio | não verificado (médio/baixo) | 3 | 1 | 3 | sameAs só com perfis reais e ativos confirmados pelo dono. Remover wa.me (vai em contactPoint/telephone). |
| SD-10 | Sem VideoObject nem páginas de case, embora o catálogo tenha 52 vídeos com direitos 'a-confirmar' | medio | medio | não verificado (médio/baixo) | 4 | 3 | 4 | Depois de confirmar os direitos, criar uma página por case com o vídeo principal + VideoObject (name, description, thumbnailUrl, uploadDate, duration, contentUrl) + BreadcrumbList e um sitemap de vídeo. |
| SD-11 | llms.txt com URLs privadas, lista de palavras-chave e afirmações não verificadas | medio | medio | não verificado (médio/baixo) | 3 | 2 | 4 | Reescrever com: descrição de 2 frases (área = Polinésia), serviços reais com links para páginas de serviço, contato e páginas legais. Remover clusters de palavras-chave e URLs privadas. Gerar a partir da mesma fonte da entidade. |
| SD-12 | ProfessionalService (LocalBusiness) sem address e GeoShape inválido em areaServed | medio | medio | não verificado (médio/baixo) | 2 | 1 | 3 | Usar Organization (ou ProfessionalService com areaServed AdministrativeArea 'Polynésie française' e sem endereço público, por decisão consciente). Remover o GeoShape. |
| SD-13 | FAQPage com @id duplicado entre idiomas e promessas comerciais a confirmar | baixo | baixo | não verificado (médio/baixo) | 2 | 1 | 4 | @id por página (…/fr#faq). O dono confirma prazos e revisões. Acrescentar perguntas sobre área (Polinésia), serviços do briefing e preços/processo. |
| SD-14 | Informação legal incorreta: hospedagem declarada como Hostinger | medio | medio | não verificado (médio/baixo) | 2 | 1 | dono | Corrigir o hospedeiro para Vercel Inc. O dono confirma o nº TAHITI e o regime (patente/RCS). |
| SD-15 | Sem página/seção 'À propos' nem bloco-resposta citável na home atual | medio | medio | não verificado (médio/baixo) | 3 | 2 | 4 | Criar uma página À propos (ProfilePage, template 06) com dados que o dono aprovar e um parágrafo-resposta de 1 a 2 frases no topo da home e de cada serviço. |
| SD-16 | Card de vídeo IA sem rótulo 'Visuel non contractuel' na home | baixo | baixo | não verificado (médio/baixo) | 2 | 1 | 4 | Adicionar a legenda de transparência IA em todo card/case IA e o alt 'Projection IA :'. |
| HIG-01 | Domínio canônico softcommunication.com está à venda na GoDaddy e recebe todos os sinais de SEO | critico | critico | confirmado | 5 | 2 | dono | O dono decide o domínio definitivo (comprar o .com, adotar .pf ou manter softcommunicaiton.com). Depois, trocar a base de URL em build_site.py, SEO/metas.json, jsonld, llms.txt, sitemap e robots, regerar e validar com SEO/validar.py. |
| HIG-02 | O site é servido em 3 hosts indexáveis (incluindo o domínio com erro de digitação) sem redirecionamento para um host único | critico | alto | parcial | 5 | 2 | 3 | Definir um host primário na Vercel e fazer 308 dos demais (www e vercel.app) para ele. Adicionar X-Robots-Tag: noindex ao *.vercel.app via headers condicionais por host no vercel.json. Alinhar o canonical ao host que realmente serve o site. |
| HIG-03 | Senha do painel em texto claro no JS público e no repositório GitHub público; login só no navegador com chave anon | critico | critico | confirmado | 5 | 3 | 3 | Trocar a credencial, tornar o repositório privado, migrar o painel para Supabase Auth e revisar o RLS (detalhes passados diretamente ao dono). |
| HIG-04 | Possível endereço residencial do responsável publicado nas páginas legais | alto | alto | confirmado | 4 | 2 | dono | O dono confirma se o endereço é residencial. Se for, contratar domiciliação comercial (ou caixa postal admitida) e atualizar legal_content.py, depois regerar. Não usar o endereço em JSON-LD nem no GBP. |
| HIG-05 | Páginas de entrega a clientes são públicas, sem controle de acesso, e anunciadas às IAs no llms.txt | alto | medio | parcial | 4 | 2 | 3 | Tirar as três URLs do llms.txt. Proteger as entregas com link assinado ou expiração (storage privado + signed URLs) ou mover para fora do site público. Se forem demonstrações, rotular como exemplo ou remover. O dono confirma se o cliente existe. |
| HIG-06 | Link 'Administration' visível no rodapé das homes e /admin/ bloqueado no robots (o noindex fica invisível ao Google) | alto | medio | parcial | 3 | 1 | 3 | Remover os links de admin do HTML público (template em build_site.py:374 e rodapé da home). Proteger /admin com autenticação real. Para noindex confiável: tirar o Disallow de /admin/ e enviar X-Robots-Tag: noindex via headers no vercel.json, ou manter o Disallow só depois que não houver links. |
| HIG-07 | Erro de digitação softcommunicaiton.com em canonicals, textos visíveis, e-mails e script | medio | medio | não verificado (médio/baixo) | 3 | 1 | 3 | Depois da decisão do HIG-01, padronizar um único domínio em todos os arquivos. Remover canonical de páginas noindex privadas (é desnecessário) e adicionar noindex em admin/projet.html. |
| HIG-08 | nova-home.html e index-classique.html publicadas como indexáveis, com hreflang de home e posicionamento divergente | medio | medio | não verificado (médio/baixo) | 3 | 1 | 3 | Aplicar noindex ou redirecionar 308 para /fr/ (ou remover do output). Tirar o hreflang dessas cópias. Atualizar os links do painel para a home oficial. |
| HIG-09 | Faltam cabeçalhos de segurança e cache longo para assets estáticos | medio | medio | não verificado (médio/baixo) | 3 | 2 | 3 | Adicionar headers no vercel.json: nosniff, Referrer-Policy strict-origin-when-cross-origin, frame-ancestors 'none' (CSP básica compatível com Supabase, YouTube e fonts), Permissions-Policy mínima. Usar Cache-Control longo com nome versionado (?v= já existe) para /assets/*. |
| HIG-10 | Menções legais declaram hospedagem na Hostinger, mas o site está na Vercel | medio | medio | não verificado (médio/baixo) | 3 | 1 | dono | Corrigir o hospedeiro (Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, EUA, a confirmar no site da Vercel) em legal_content.py e regerar. O dono confirma os dados de identificação exigidos por lei. |
| HIG-11 | Repositório GitHub público expõe documentos internos (PDF de direção, prompts, plano SEO, ferramentas) | medio | medio | não verificado (médio/baixo) | 2 | 1 | dono | Tornar o repositório privado. A Vercel continua fazendo deploy por integração Git privada. |
| HIG-12 | Poster quebrado em cliente.html; audit_site.py não detecta | baixo | baixo | não verificado (médio/baixo) | 1 | 1 | 3 | Corrigir o caminho do poster. Incluir poster, srcset e URLs em JS inline no audit_site.py. |
| HIG-13 | Arquivo de verificação do Google redireciona (308) por causa do cleanUrls | baixo | baixo | não verificado (médio/baixo) | 2 | 1 | 6 | Confirmar no Search Console que a propriedade segue verificada. Se não, usar verificação por DNS ou meta tag no domínio definitivo. |
| HIG-14 | E-mail de contato em Gmail em vez do domínio da marca | baixo | baixo | não verificado (médio/baixo) | 2 | 2 | dono | Depois de definir o domínio, criar contato@<domínio> e trocar via config.js e build_site.py. |
| HIG-15 | Pastas .claude/ vazias dentro de maquette/ (não publicadas) | baixo | baixo | não verificado (médio/baixo) | 1 | 1 | 3 | Sem risco atual. Opcionalmente adicionar .vercelignore com .claude/ por precaução em deploys via CLI. |

---

*Próximo passo: Fase 2 (KEYWORDS.md). A Fase 3 só deve começar depois das decisões D1–D3 e D7.*
