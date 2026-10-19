# Soft & Co — Plano de SEO, AEO e GEO

Data: 11/10/2026 · Escopo: site bilíngue FR/EN (maquete em `maquette/`) · Nome usado em tudo: **Soft & Co** (alternateName: Soft Communication) · Sem endereço público (negócio de área de atendimento).

**Como ler:** cada recomendação traz *Por quê* (a observação em que se apoia), *Falha se* (como saberíamos que errou) e *Indicador* (o que acompanhar sem refazer auditoria). Fatos verificados têm fonte em `FONTES.md`. O que não foi possível verificar está marcado **[não verificado]**. Nada aqui inventa cliente, número, prêmio ou avaliação.

---

## 0. Diagnóstico em 6 linhas

1. A maquete está **toda `noindex`** (correto agora) e usa `hreflang` **relativo** e **sem canonical**. Isso precisa virar absoluto + canonical no build, senão o hreflang é ignorado.
2. Títulos atuais ("Accueil · Soft Communication") não carregam palavra-chave nem o nome decidido (Soft & Co). Os novos estão em `codigo/metas.json`.
3. O H1 da home já descreve a oferta (bom, mantém). O nome fica no logo e no `<title>`.
4. Os serviços hoje apontam para uma página "à venir". **Sem páginas de serviço próprias não há o que ranquear.** Criar 3 páginas FR + 3 EN é a ação nº 1.
5. A SERP local é **fraca nos nichos que você vende**: ninguém na Polinésia tem página dedicada para "film de marque", UGC, nem para home staging/projeção por IA (pesquisa direcional, ver §2). Há 1 concorrente direto forte: **SkyFilm Tahiti**.
6. A demanda de busca local parece **pequena** (o autocomplete do Google para "vidéaste tahiti" devolveu só 6 sugestões e quase nada para as demais). Por isso o plano mira três coisas: dominar a cauda longa local, **ser a resposta que as IAs citam**, e captar inglês (turismo/hotelaria/imóvel internacional).

---

## 1. Entidade (a base de tudo: SEO, AEO e GEO dependem disso)

IAs e buscadores precisam saber **quem** é a Soft & Co e que é uma só coisa em todo lugar.

| Ação | Detalhe | Falha se | Indicador |
|---|---|---|---|
| **Nome único** | "Soft & Co" em title, schema, GBP, redes, diretórios, rodapé. "Soft Communication" só como `alternateName`. Variável única no CMS (a dossiê já exige). | Prompt "Soft Communication Tahiti" devolve outra empresa ou nada | `medicao/prompts-ia.csv` ids 7, 8, 15, 16 |
| **Frase-âncora** (idêntica em todo lugar) | FR: *Films de marque, contenus courts et immobilier IA en Polynésie française.* EN: *Brand films, short-form content and AI-assisted property visuals in French Polynesia.* | IAs descrevem o serviço diferente do real | idem, coluna `descreveu_correto` |
| **Schema Organization + WebSite** | `codigo/jsonld/01-...json`. Não usar LocalBusiness: o Google exige `address` nele e você não tem. **[inferência minha: Organization + areaServed é o caminho seguro; a doc do Google não cobre áreas de atendimento no schema]** | Rich Results Test acusa erro | Search Console > Melhorias |
| **sameAs** | Preencher só com perfis **reais e ativos** (Instagram, TikTok, YouTube, LinkedIn, Vimeo). Hoje está `[]` de propósito. | Perfil com nome diferente do site | `validar.py --lancamento` falha enquanto vazio |
| **Página À propos real** | Foto, nome e biografia verdadeiros do criador + `ProfilePage` (template 06). Sem diploma/prêmio inventado. | Página sem pessoa identificável | prompt 15/7: a IA cita o criador corretamente |
| **Wikidata / Wikipedia** | Não criar agora (sem notoriedade verificável, seria removido). Reavaliar após cobertura de mídia (§7). | — | — |

---

## 2. Pesquisa de mercado (o que o ambiente permitiu verificar)

Limite honesto: a busca usada **não é o Google geolocalizado em Papeete** e não há ferramenta de volume. Confirmar tudo no Google com localização "Papeete" antes de fechar as palavras-chave. **Nenhum volume foi medido.**

| Cluster | Quem aparece | Leitura | Oportunidade |
|---|---|---|---|
| Produção de vídeo / vidéaste | Diretório governamental DGEN "Sociétés de production" (29 empresas, muitas só com Facebook), páginas de Tahiti Tourisme, skyfilm-tahiti.com, tahitivideoproduction.com e outras | Média a fraca; maioria foca TV, documentário e filmagem estrangeira, não marketing de PME | Página dedicada + conteúdo de prova |
| "Film de marque" | Nenhuma empresa local; só cinema/Wikipedia | **Lacuna** | Dona do termo na Polinésia |
| Agência de comunicação / community manager / criação de conteúdo | novacom.pf, PITAYA, tahitipub.pf e outras; em "community manager Tahiti" dominam Malt/Codeur/LinkedIn | Moderada em "agence de communication"; **fraca** nos demais | Página de serviço UGC/conteúdo |
| UGC | Nenhuma empresa da Polinésia; só Paris e marketplaces do Havaí | **Lacuna** (volume local provavelmente baixo, **[não verificado]**) | Página + inglês |
| Vídeo/foto imobiliária | immovisiontahiti.com, alikaphoto.com, skyfilm (página de films immobiliers), mooreaphoto.com (EN) | Moderada a fraca (3–4 páginas dedicadas) | Diferencial é a IA |
| Home staging virtual / projeção IA | Ninguém na Polinésia, em FR ou EN | **Lacuna aberta** | Seu nicho mais defensável |
| Vídeo de hotel (EN) | Fotógrafos individuais com foco em casamento/lua de mel | Sem página B2B dedicada | Página/setor hotelaria (fase 2) |

**Concorrente a observar mensalmente:** SkyFilm Tahiti (FR/EN, páginas de film d'entreprise, drone, immobilier, blog, cliente de resort exibido).

### Mapa de palavras-chave por URL (1 intenção principal por página, sem canibalização)

| URL (FR) | Principal | Secundárias |
|---|---|---|
| `/fr` | film de marque Polynésie française | production vidéo Tahiti, agence contenu Polynésie |
| `/fr/services/films-de-marque` | film de marque Polynésie | film d'entreprise Tahiti, vidéo commerciale Tahiti, film média branding |
| `/fr/services/contenus-courts-ugc` | contenu UGC Polynésie | créateur de contenu Tahiti, Reels entreprise Tahiti, pack mensuel contenu |
| `/fr/services/immobilier-ia` | vidéo immobilière Tahiti | home staging virtuel Polynésie, visuel immobilier IA, projection IA villa |
| `/fr/portfolio` | portfolio vidéo Polynésie | (navegação, sem alvo comercial) |

| URL (EN) | Principal | Secundárias |
|---|---|---|
| `/en` | brand film French Polynesia | video production Tahiti |
| `/en/services/brand-films` | brand film production Tahiti | corporate video French Polynesia, hotel video production Polynesia |
| `/en/services/short-form-ugc` | UGC creator French Polynesia | Reels production Tahiti, social content resort |
| `/en/services/ai-real-estate` | AI virtual staging Tahiti | real estate video Tahiti, property projection French Polynesia |

Regra: EN **não é tradução literal**; reescrever para quem compra de fora (hotel internacional, dono estrangeiro de villa). Fonte do perfil do comprador: 42% dos 281.227 turistas de 2025 vieram da América do Norte (ISPF via Outremers360).

---

## 3. SEO técnico (cirúrgico)

### 3.1 Arquitetura e URLs (já definidas na dossiê; acréscimos em negrito)

`/fr` · `/en` · `/fr/services` + **3 páginas filhas** · `/fr/portfolio` · `/en/work` · `/fr/portfolio/[slug]` · `/fr/a-propos` · `/fr/contact` · `/fr/insights` (oculta até haver artigo) · legais.

- Slugs EN **diferentes** dos FR (work/about/legal) → hreflang deve apontar para o par certo, nunca para a mesma rota. O gerador de sitemap já faz isso.
- Raiz `/` → redirect 302/307 por `Accept-Language` **somente se** o crawler puder acessar `/fr` e `/en` diretamente; `x-default` aponta para `/fr`.
- Sem parâmetros indexáveis (`?utm_`, `?fbclid` bloqueados no robots).

### 3.2 Renderização (crítico para GEO)

Vercel + MERJ (dez/2024) mediram que **os crawlers de IA principais não executam JavaScript** (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, etc.); Googlebot e Applebot executam. Exigência para o build: **HTML completo no servidor (SSG/SSR/ISR)**. Título, H1, textos de serviço, legendas, rótulo "Projection IA" e JSON-LD **têm de estar no HTML inicial**. *Falha se:* `curl` da página sem JS mostra corpo vazio. *Indicador:* teste de `curl` no CI.

### 3.3 Tags por página
Padrão completo em `codigo/head-exemplo.fr-home.html`. Pontos que a maquete não tem: `canonical` absoluto, `hreflang` absoluto e recíproco, `og:*`, `max-image-preview:large`, `apple-touch-icon`. Conferido por `validar.py`.

### 3.4 Core Web Vitals (limiares atuais do Google)
LCP ≤ 2,5 s · INP < 200 ms · CLS < 0,1, no percentil 75. Vídeo do hero: poster AVIF/WebP com `fetchpriority="high"`, `<video muted playsinline preload="metadata">`, vídeo carregado depois do LCP; fontes auto-hospedadas (já na dossiê); reservar `aspect-ratio` em todo vídeo/imagem (CLS). A maquete anima faixas de miniaturas: manter `prefers-reduced-motion`.

### 3.5 Indexação, sitemap, robots
- `codigo/robots.txt` e `codigo/sitemap.xml` (20 URLs, hreflang recíproco, x-default=FR) prontos. Regerar com `python3 gerar_sitemap.py https://SEU-DOMINIO 2026-XX-XX`. Projetos do portfólio entram por `projetos.json`.
- **Insights fora do sitemap** até o primeiro artigo publicado (`"sitemap": false` em `metas.json`).
- Sitemap de vídeo: suportado pelo Google (doc atualizada 20/05/2026); adicionar quando houver ≥3 projetos publicados.
- **IndexNow** (Bing, Yandex etc.; o Google não participa) + Bing Webmaster Tools: reduz atraso de atualização para Copilot/Bing.

### 3.6 Lançamento: trava de segurança
Remover `noindex` da maquete **só** no lançamento. Rodar `python3 validar.py --lancamento ../maquette` (ou pasta do build): falha se houver noindex, canonical ausente, hreflang relativo, `softcommunicaiton.com`, `{{...}}`, `sameAs` vazio, `<img>` sem alt ou ≠1 H1.

---

## 4. SEO on-page e conteúdo

### 4.1 Estrutura de cada página de serviço (modelo)
1. **H1 = oferta + lugar** (ex.: "Films de marque en Polynésie française").
2. **Bloco-resposta de 40–60 palavras** logo abaixo do H1 (o que é, para quem, o que se entrega). É o trecho que IAs e snippets extraem (§5).
3. O que está incluído (entregáveis e formatos) · Como trabalhamos (Écouter, Filmer, Livrer, já na home) · Para quais setores (hospedagem/lifestyle, imobiliário) · Projetos reais **ou** nenhum (nunca exemplo fictício sem rótulo) · CTA "Réserver un appel".
4. Preço "a partir de" **só se o dono informar**.
5. Links internos: serviço ↔ projetos relacionados ↔ contato.

*Falha se:* página < 300 palavras úteis ou sem projeto real após 90 dias → não vai ranquear acima dos 3–4 concorrentes imobiliários.

### 4.2 Regras de integridade (herdadas da dossiê, aplicam-se ao SEO)
Sem cliente, resultado, número ou avaliação inventados. Números só com fonte registrada no admin. Depoimento só com autorização escrita. Isso também protege contra a política do Google de avaliações falsas e evita que a IA repita invenção.

### 4.3 Imagens e vídeo
- `alt` descritivo em FR/EN, sempre; legendas de vídeo e transcrição (acessibilidade e texto indexável).
- Nome de arquivo descritivo (`villa-moorea-projection-ia.avif`).
- **Uma vídeo principal por página de projeto**: o Google só mostra resultado de vídeo quando o vídeo é o conteúdo principal da página. Galerias secundárias são imagens.
- Thumbnail estável, formato suportado (AVIF/WebP/JPEG), não bloqueada no robots.
- Schema `VideoObject` (template 05): obrigatórios `name`, `thumbnailUrl`, `uploadDate` com fuso (Tahiti é UTC-10).
- Se hospedar no YouTube/Vimeo: o Google pode indexar o vídeo na página do host e na sua; manter o `VideoObject` na sua. Para vídeos com direitos de cliente, preferir hospedagem própria com `contentUrl`.

### 4.4 Conteúdo editorial (Insights) — só publicar quando houver autor real e substância
Lista priorizada (cada título responde uma pergunta literal; bloco-resposta no topo):

| # | FR | EN | Intenção |
|---|---|---|---|
| 1 | Qu'est-ce qu'un film de marque et à quoi ça sert ? | What is a brand film and what is it for? | Definição (AEO) |
| 2 | Combien de temps pour produire un film de marque ? | How long does a brand film take to produce? | Processo (sem preço inventado) |
| 3 | Comment étiqueter une image immobilière générée par IA | How to label AI-generated property images | Posicionamento ético (diferencial) |
| 4 | Home staging virtuel : réel, projection et honnêteté | Virtual staging: real vs projected | Educação imobiliária |
| 5 | UGC pour un hôtel ou un restaurant : par où commencer | UGC for a hotel or restaurant: where to start | Hotelaria |
| 6 | Filmer en Polynésie : lumière, saison, autorisations | Filming in French Polynesia: light, season, permits | Local; checar fatos antes |
| 7 | Reels : quel rythme pour une marque locale | Reels cadence for a local brand | Operacional |

Regra de prova: afirmações factuais sobre leis, autorizações de drone, etc. exigem fonte citada no texto. Sem fonte → não publicar.

---

## 5. AEO — ser a resposta (Google AI Overviews/AI Mode, snippets, assistentes)

O que muda o resultado, em ordem de impacto esperado:

1. **Resposta primeiro.** Cada página abre com 40–60 palavras que respondem sozinhas. *Por quê:* é o formato que buscadores e assistentes copiam; o Bing recomenda títulos claros, tabelas, dados e fontes. *Falha se:* o trecho citado por IA vem de outro site mesmo com a sua página no índice.
2. **Uma pergunta por H2/H3**, em linguagem de cliente ("Combien coûte…" só se houver preço real).
3. **Tabelas curtas** (entregáveis por serviço; formatos de saída 16:9, 9:16, 1:1).
4. **Dados com fonte e data**, citados no texto (o paper de GEO de Aggarwal et al., KDD 2024, achou ganho de visibilidade com citações, estatísticas e citação de fontes; keyword stuffing foi negativo).
5. **Texto idêntico em HTML, legenda e transcrição** sobre as mesmas entidades (Bing: consistência entre texto, imagem e vídeo).
6. **Não use FAQPage por ganho de SERP.** O Google aposentou os rich results de FAQ para todos os sites em 07/05/2026. Pode existir seção de perguntas **como conteúdo visível**; sem schema e sem promessa de benefício. `HowTo` também está descontinuado desde 2023. Use `QAPage` só se houver pergunta real de usuário.
7. **Google diz que não precisa de arquivos especiais para IA** (guia de otimização de IA, 15/05/2026): nada de reescrever "para IA" nem "chunking" artificial. Escreva claro; é o suficiente para o Google.

*Indicador:* relatório **Generative AI** do Search Console (impressões em AI Overviews/AI Mode; só impressões, sem cliques nem consultas, **[detalhe vindo de fonte secundária]**).

---

## 6. GEO — ser citado por ChatGPT, Claude, Perplexity, Gemini, Copilot

### 6.1 O que se sabe (com limite)
Os assistentes citam, em geral, **fontes de terceiros** mais do que o site da própria marca (Chen et al., arXiv 2509.08919, set/2025: "viés sistemático e esmagador para mídia conquistada"). Na pesquisa da Ahrefs (75 mil marcas, mai/2025), **menções à marca na web** correlacionaram mais com visibilidade em AI Overviews (0,664) do que backlinks (0,218); os próprios autores avisam que é correlação. Conclusão prática: **GEO é, em grande parte, relações públicas locais + entidade consistente**, não truque de texto.

### 6.2 Acesso dos crawlers (já aplicado em `robots.txt`)
- **Buscar/recuperar (liberar):** OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Applebot, MistralAI-Index/User, DuckAssistBot, Meta-WebIndexer, Amzn-SearchBot.
- **Treinar (decisão sua):** GPTBot, ClaudeBot, Google-Extended, Applebot-Extended. Padrão do arquivo: **liberado** (a marca quer estar no conhecimento dos modelos). Bloqueio é opcional e documentado no arquivo. Bloquear treino **não** tira o site das buscas de IA.
- **AI Overviews/AI Mode não são controlados por Google-Extended.** O controle é "Search generative AI" nas configurações do Search Console. Não ligar.
- ChatGPT-User e Perplexity-User podem ignorar robots.txt (dizem as próprias docs); OpenAI pede liberar também no CDN/firewall os IPs publicados. **Não ativar bloqueio de bots no Cloudflare/CDN sem checar isso.**
- Compliance do Bytespider é contestado **[não verificado]**; sem regra específica.

### 6.3 Quais índices alimentam cada assistente (e a ação correspondente)
| Assistente | Índice | Ação |
|---|---|---|
| Google AI Overviews/AI Mode, Gemini | Índice do Google | Search Console, sitemap, schema válido |
| Copilot | Bing | **Bing Webmaster Tools + IndexNow** |
| ChatGPT search | Parceiros + índice próprio; exige OAI-SearchBot liberado. "ChatGPT roda no Bing" é simplificação **[Peec AI, fonte secundária]** | Bing + robots + CDN |
| Perplexity | Índice próprio (PerplexityBot) | robots liberado |
| Claude | Subprocessadores de busca reportados: Brave, turbopuffer **[fonte secundária, não confirmado na página oficial]** | Presença forte no índice aberto da web |
| Apple/Siri | Applebot | robots liberado |

### 6.4 llms.txt
`codigo/llms.txt` está pronto, bilíngue. **Honestidade:** o Google diz que Search **não usa** llms.txt e que não tem efeito de ranking; nenhuma OpenAI/Anthropic/Perplexity/Microsoft confirmou uso **[não verificado]**. O Lighthouse 13.3 (Chrome) passou a auditar o arquivo para navegação por agentes. Custo: ~5 min; benefício: pequeno e incerto. Manter, sem esperar efeito.

### 6.5 Autoridade externa (a alavanca mais forte, e a mais lenta)
Alvos reais na Polinésia (todos com URL na pesquisa): **DGEN diretório "Sociétés de production"** (link governamental de autoridade; contato `contact.dgen@administration.gov.pf`; critério de entrada **[não verificado]**), **Tahiti Tourisme "référencement"** (gratuito via Apidae; elegibilidade de agência B2B **[não verificada]** → perguntar ao suporte), **FPAIM** (federação de agentes imobiliários), associação de hotéis de família, **French Tech Polynésie / Tech4Islands / PRISM**, mídias: Tahiti Infos, TNTV, Radio1, Polynésie la 1ère, Outremers360. Cada projeto real publicado com autorização do cliente vira pauta (case + vídeo).
*Falha se:* após 6 meses, 0 menções externas. *Indicador:* nº de domínios únicos que citam "Soft & Co" (busca manual + Search Console Links).

### 6.6 Medição de GEO (sem ferramenta paga)
`medicao/prompts-ia.csv` (16 prompts FR/EN: descoberta, explicação, marca). Rodar **uma vez por mês**, em ChatGPT, Claude, Perplexity, Gemini e Copilot, e registrar em `medicao/registro-mensal.csv`: marca citada? URL própria citada? concorrente citado? descrição correta? Repetir o mesmo prompt 3 vezes (respostas variam). **Bing Webmaster Tools "AI Performance"** (preview desde 10/02/2026) mostra citações em Copilot e resumos do Bing.

---

## 7. SEO local sem endereço público

- **Google Business Profile como negócio de área de atendimento:** permitido sem endereço, até 20 áreas, ~2 h de carro, sem raio. **Disponibilidade na Polinésia francesa: [não verificado]** — testar o cadastro; se recusar, seguir sem GBP e reforçar o resto. Atenção: a elegibilidade do Google exige contato presencial com clientes; filmagem no local do cliente costuma se enquadrar, mas confirmar na tela de verificação.
- **Apple Business Connect:** a Polinésia consta na lista de suporte, mas relatos de 2024 dizem que Apple exige loja/ponto comercial **[fonte secundária]** → provavelmente não elegível.
- **Bing Places:** endereço oculto possível; áreas de atendimento só nos EUA (segundo Yext).
- **Annuaire officiel de Polynésie (annuaire.pf):** a seção "Pages jaunes" cobre assinantes de **linha fixa** profissionais → exigiria linha fixa **[não verificado se aceita sem]**.
- **NAP consistente** (Nome, e-mail, WhatsApp, área) em todo lugar. Sem endereço, o "A" é a área de atendimento: "Polynésie française (Tahiti, Moorea, Bora Bora et îles)" — só listar ilhas onde de fato atende.
- **Avaliações:** pedir só a clientes reais, no GBP/Google, nunca no próprio site como `Review` com schema (autoavaliação é inelegível). Depoimento no site: com autorização escrita.
- Regra do skill de SEO: alerta a partir de 30 páginas de localização; **não criar páginas por ilha/bairro** sem conteúdo único ≥60%.

### Domínio
- **.pf:** exige N° TAHITI no RTE ou marca INPI; o domínio deve coincidir com nome empresarial/sigla/nome comercial (documentos com < 6 meses); só letras, dígitos e hífen (**"&" é proibido**); 12 meses renovável; preço 3.000 XPF/ano sem imposto no formulário Vini/Mana (documento sem data). Se o nome comercial registrado for "Soft & Co", o `.pf` precisaria casar (ex.: softandco.pf ou softco.pf) **[inferência]**.
- **.com:** neutro geograficamente; geotargeting vem de hreflang + sinais locais. O Google trata ccTLD como sinal forte de país e `.pf` não está na lista de ccTLDs genéricos. Recomendação: **.pf como domínio principal se elegível** (sinal local forte para o público da Polinésia) **e** registrar o .com equivalente com 301 para ele; se o público de maior valor for o estrangeiro, o .com como principal também é defensável. Decisão do dono.

---

## 8. Imagens e vídeo gerados por IA (SEO + confiança + risco legal)

| Camada | Regra |
|---|---|
| **Visível** | Tag "Projection IA" + legenda "Visuel non contractuel. Aménagements générés par IA." / "Non-binding visual. Interiors generated by AI." (já na maquete). Nunca sem legenda, nem em OG image. |
| **Texto** | `alt` começa com "Projection IA :" / "AI projection:". Título da página de projeto idem quando for projeção. |
| **Metadado** | Gravar **IPTC Digital Source Type** `trainedAlgorithmicMedia` (gerado) ou `compositeWithTrainedAlgorithmicMedia` (foto real + elementos IA) nos arquivos. O Google extrai esse campo, mas **não** afirma que mostra rótulo só por ele **[não verificado]**. |
| **C2PA** | Se a ferramenta de edição suportar, assinar com Content Credentials (Google pode exibir em "Sobre esta imagem" apenas com C2PA ≥ 2.1 e certificado da lista de confiança). |
| **Política Google** | Conteúdo com IA não é penalizado em si; páginas em massa sem valor viram "scaled content abuse". Portfólio curado e com direito confirmado está seguro. |

**Jurídico (checar com advogado local — não é parecer):** a lei francesa 2023-451 (art. 5/2 C) exige "Images retouchées"/"Images virtuelles" para rostos e silhuetas; ambiente sem pessoas não parece ativar **[leitura minha]**; **provavelmente não se aplica na Polinésia** sem menção expressa **[incerto]**. O Art. 50 do AI Act da UE (marcação legível por máquina e aviso de deepfake) vale desde 02/08/2026 (sistemas anteriores têm até 02/12/2026) e a Polinésia (OCT) não é UE, mas o ato cobre quem usa a saída na UE (campanhas para compradores na Europa); uma projeção de imóvel real pode, plausivelmente, entrar em "deep fake" **[interpretação]**. Postura segura: rotular **tudo**, em qualquer mercado.

---

## 9. Roadmap de 90 dias (dependências explícitas)

| Quando | Entrega | Depende de | Pronto quando |
|---|---|---|---|
| **Antes do build** | Decidir domínio (.pf/.com), trocar `softcommunicaiton.com`, confirmar nome comercial, definir perfis sociais | dono | `validar.py` sem placeholder |
| **Semana 1–2 (build)** | SSR/SSG; `<head>` completo por página a partir de `metas.json`; 3+3 páginas de serviço com bloco-resposta; JSON-LD 01–04; robots/sitemap/llms | domínio | `validar.py --lancamento` = 0 erros; `curl` mostra o conteúdo |
| **Semana 2** | Rich Results Test e validador de schema; PageSpeed mobile; teste de hreflang | build | LCP/INP/CLS dentro dos limiares |
| **Lançamento** | Remover `noindex`; verificar domínio no **Search Console** e **Bing Webmaster Tools**; enviar sitemap; ativar IndexNow; checar que "Search generative AI" **não** está bloqueado | todos acima | páginas "Indexadas" |
| **Semana 3–4** | Pedido de listagem DGEN e Tahiti Tourisme; tentar GBP de área de atendimento; fechar perfis sociais com o mesmo nome/frase-âncora | lançamento | pedidos enviados |
| **Mês 2** | 3 primeiros projetos **reais com direitos**, cada um com página + VideoObject; sitemap de vídeo; 2 artigos Insights (#1 e #3) | clientes/autorizações | Insights sai do modo oculto |
| **Mês 3** | Primeira rodada de PR (case de projeto real + pauta "projeção IA com honestidade"); primeira medição de 16 prompts; revisar palavras-chave com dados reais do Search Console | projetos | linha de base registrada |
| **Todo mês** | Rodada de prompts; relatório GSC (consultas, páginas) + AI Performance (Bing) + Generative AI (GSC); olhar SkyFilm | — | `registro-mensal.csv` atualizado |

---

## 10. Lista "não fazer"

- Não criar página para cada ilha/bairro sem conteúdo único.
- Não usar `FAQPage`/`HowTo` para ganhar destaque; não usar `LocalBusiness` sem endereço.
- Não marcar `Review`/`AggregateRating` do próprio site.
- Não publicar projeto sem direitos confirmados, nem número sem fonte, nem "bientôt" vazio.
- Não ocultar o rótulo IA para "ficar mais bonito".
- Não prometer ranking, posição ou citação a ninguém: nenhum dos dados acima permite garantir isso.
- Não ativar bloqueio de bots no CDN sem liberar os crawlers de busca de IA.

---

## 11. Premissas e pendências do dono

1. Domínio e nome comercial registrado (afeta .pf).
2. Perfis sociais reais, e-mail e WhatsApp públicos (hoje "à fournir").
3. Nome, foto e biografia reais do criador.
4. Se aceita treino de modelos (padrão: sim).
5. Quais ilhas atende de fato.
6. Quais projetos têm direitos confirmados para publicar.
7. A frase "Une personne, une caméra, un regard" da home está marcada `[À VALIDER]` na maquete; **não usei "equipe de uma pessoa" em nenhum texto de SEO** por isso.
