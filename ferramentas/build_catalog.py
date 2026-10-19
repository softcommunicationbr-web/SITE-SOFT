#!/usr/bin/env python3
"""Gera maquette/assets/data/catalog.json e catalog.js (catálogo padrão dos 52 vídeos).
Fonte: origem/*.json (extraídos da home, da mediateca e das medições reais dos arquivos).
uso: python3 -I build_catalog.py
"""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'maquette', 'assets', 'data')
O = lambda n: json.load(open(os.path.join(HERE, 'origem', n), encoding='utf-8'))
home, adm, pm, sizes = O('home_tiles.json'), O('admin_catalog.json'), O('posters_meta.json')['meta'], O('sizes.json')
A = {a['filename']: a for a in adm}
BASE = 'https://xvabghgvrhpnyywpmodb.supabase.co/storage/v1/object/public/videos-portifolio/'

def aspect_label(w, h):
    r = w / h
    for lab, v in (('16:9', 16/9), ('9:16', 9/16), ('1:1', 1.0), ('21:9', 21/9), ('2:1', 2.0), ('4:5', 0.8), ('3:4', 0.75), ('4:3', 4/3)):
        if abs(r - v) / v < 0.045: return lab
    return '%d:%d' % (round(r * 10), 10) if r > 1 else '%d:%d' % (10, round(10 / r))

# ---- traduções (PT -> FR, EN) dos rótulos e títulos existentes ----
LAB = {
 'Calebe · Final': ('Calebe · Final', 'Calebe · Final'), 'Miria · Campanha': ('Miria · Campagne', 'Miria · Campaign'),
 'Ilhas · Luz Natural': ('Îles · Lumière naturelle', 'Islands · Natural light'), 'Polinésia 02': ('Polynésie 02', 'Polynesia 02'),
 'Luz do Pacífico': ('Lumière du Pacifique', 'Pacific light'), 'Lagoa & Cores': ('Lagon & couleurs', 'Lagoon & colors'),
 'Cultura Viva': ('Culture vivante', 'Living culture'), 'Retrato Ilhas': ('Portrait îles', 'Island portrait'),
 'Arquitetura': ('Architecture', 'Architecture'), 'Sunset Vibes': ('Sunset Vibes', 'Sunset Vibes'),
 'Motion & Luz': ('Motion & lumière', 'Motion & light'), 'Detalhes 10': ('Détails 10', 'Details 10'),
 'Atmosfera & Mar': ('Ambiance & mer', 'Atmosphere & sea'), 'Natureza Viva': ('Nature vivante', 'Living nature'),
 'Horizonte 13': ('Horizon 13', 'Horizon 13'), 'Comunicação 14': ('Communication 14', 'Communication 14'),
 'Serviços Soft': ('Services Soft', 'Soft services'), 'Calebe': ('Calebe', 'Calebe'),
 'Motion 60fps': ('Motion 60fps', 'Motion 60fps'), 'Impacto Reel': ('Reel impact', 'Impact Reel'),
 'Gastronomia': ('Gastronomie', 'Gastronomy'), 'Moda & Presença': ('Mode & présence', 'Fashion & presence'),
 'Storytelling': ('Storytelling', 'Storytelling'), 'UGC Autêntico': ('UGC authentique', 'Authentic UGC'),
 'Social Trends': ('Tendances sociales', 'Social trends'), 'Motion Art': ('Motion Art', 'Motion Art'),
 'Bastidores': ('Coulisses', 'Behind the scenes'), 'Render 18': ('Render 18', 'Render 18'),
 'Motion 19': ('Motion 19', 'Motion 19'), 'Loop 20': ('Loop 20', 'Loop 20'),
}
TIT = {
 'Calebe · Produção Final': ('Calebe · Production finale', 'Calebe · Final production'),
 'Miria Project · Campanha de Marca': ('Miria Project · Campagne de marque', 'Miria Project · Brand campaign'),
 'Cinematografia Polinésia 01': ('Cinématographie Polynésie 01', 'Polynesian cinematography 01'),
 'Cinematografia Polinésia 02': ('Cinématographie Polynésie 02', 'Polynesian cinematography 02'),
 'Cinematografia Ilhas 03': ('Cinématographie îles 03', 'Island cinematography 03'),
 'Lagoa & Cores 04': ('Lagon & couleurs 04', 'Lagoon & colors 04'),
 'Cultura & Paisagens 05': ('Culture & paysages 05', 'Culture & landscapes 05'),
 'Luz Natural & Retrato 06': ('Lumière naturelle & portrait 06', 'Natural light & portrait 06'),
 'Arquitetura Tropical 07': ('Architecture tropicale 07', 'Tropical architecture 07'),
 'Sunset & Texturas 08': ('Sunset & textures 08', 'Sunset & textures 08'),
 'Motion & Luz 09': ('Motion & lumière 09', 'Motion & light 09'),
 'Detalhes Cinematográficos 10': ('Détails cinématographiques 10', 'Cinematic details 10'),
 'Atmosfera & Mar 11': ('Ambiance & mer 11', 'Atmosphere & sea 11'),
 'Natureza Viva 12': ('Nature vivante 12', 'Living nature 12'),
 'Aventuras & Horizonte 13': ('Aventures & horizon 13', 'Adventures & horizon 13'),
 'Comunicação Criativa 14': ('Communication créative 14', 'Creative communication 14'),
 'Serviços Soft Motion': ('Services Soft Motion', 'Soft Motion services'),
 'Apresentação Calebe · Stories': ('Présentation Calebe · Stories', 'Calebe introduction · Stories'),
 'Soft Motion Reel · 60fps': ('Soft Motion Reel · 60fps', 'Soft Motion Reel · 60fps'),
 'Reel Impacto Visual': ('Reel impact visuel', 'Visual impact reel'),
 'Gastronomia & Lifestyle': ('Gastronomie & lifestyle', 'Gastronomy & lifestyle'),
 'Estilo & Presença em Câmera': ("Style & présence à l’écran", 'Style & on-camera presence'),
 'Storytelling Vertical': ('Storytelling vertical', 'Vertical storytelling'),
 'UGC & Conexão de Marca': ('UGC & lien de marque', 'UGC & brand connection'),
 'Tendências & Som Social': ('Tendances & son social', 'Trends & social sound'),
 'Motion Art': ('Motion Art', 'Motion Art'),
 'Bastidores de Gravação': ('Coulisses de tournage', 'Behind the scenes'),
 'Render Conceitual 18': ('Rendu conceptuel 18', 'Concept render 18'),
 'Motion Short 19': ('Motion court 19', 'Motion short 19'),
 'Loop Experimento 20': ('Boucle expérimentale 20', 'Experimental loop 20'),
}
def tr_label(pt):
    m = re.match(r'^IA Lab (\d+)$', pt)
    if m: return ('Lab IA ' + m.group(1), 'AI Lab ' + m.group(1))
    return LAB.get(pt, (pt, pt))
def tr_title(pt):
    m = re.match(r'^IA Generativa · Lab (\d+)$', pt)
    if m: return ('IA générative · Lab ' + m.group(1), 'Generative AI · Lab ' + m.group(1))
    return TIT.get(pt, (pt, pt))

# ---- destaques (4 cartões), textos por idioma ----
CARDS = [
 ('mkt.webm', 'Hotel na Lagoa · Refúgio Exclusivo', 'Filmes de marca', 'Hotelaria', 'Direção, cinematografia, edição', False,
  dict(fr=('Hôtel de Lagon · Écrin Préservé', 'Films de marque', 'Hôtellerie', 'Réalisation, image, montage'),
       en=('Lagoon Hotel · Serene Haven', 'Brand films', 'Hospitality', 'Direction, cinematography, editing'))),
 ('generation-1.webm', 'Villa Sunset · Projeção & Arquitetura IA', 'Imobiliário IA', 'Imobiliário', 'Direção de arte, geração por IA, retoque', True,
  dict(fr=('Villa Sunset · Projection & Architecture IA', 'Immobilier IA', 'Immobilier', 'Direction artistique, génération IA, retouche'),
       en=('Villa Sunset · AI Architectural Projection', 'AI property visuals', 'Real estate', 'Art direction, AI generation, retouching'))),
 ('generation.webm', 'À Beira-Mar · Gastronomia & Lifestyle', 'Conteúdos curtos & UGC', 'Gastronomia', 'Captação, edição, presença em câmera', False,
  dict(fr=('Bord de Mer · Gastronomie & Art de Vivre', 'Contenus courts & UGC', 'Restauration', 'Tournage, montage, présence face caméra'),
       en=('Seaside Restaurant · Gastronomy & Lifestyle', 'Short-form & UGC', 'Restaurants', 'Filming, editing, on-camera presence'))),
 ('defender-dakar-introducing-the-d7x-r-rally-car-d.webm', 'Rallye D7X · Performance & Dinamismo', 'Filmes de ação', 'Automotivo', 'Ação cinematográfica, dinamismo e performance', False,
  dict(fr=('Rallye D7X · Performance & Dynamisme', "Films d’action", 'Automobile', 'Action cinématographique, dynamisme et performance'),
       en=('D7X Rally · Performance & Dynamism', 'Action films', 'Automotive', 'Cinematic action, dynamism and performance'))),
]
NOTES = {  # marca de terceiros visível (observado nas capas) : confirmar autorização
 'defender-dakar-introducing-the-d7x-r-rally-car-d.webm': 'Vídeo e texto oficiais da Land Rover Defender (marca de terceiros). Confirmar licença ou remover.',
 'img-4728.webm': 'Logotipo Ford visível (marca de terceiros). Confirmar autorização.',
 'hf-20260824-000231-2fe11333-8f72-49d5-811f-84a4d.webm': 'Logotipo "Pacific Solaire" visível. Confirmar se é cliente ou conceito.',
 'hf-20260916-121927-1205b7db-e9d4-4899-9b7b-79a52.webm': 'Embalagem "Easy Dose" visível. Confirmar se é cliente ou conceito.',
 'mkt.webm': 'Produto "Rosehip Morning Society" visível. Confirmar se é cliente ou conceito.',
 'miria-s-project-final-v01-1-2.webm': 'Aparece "Pedra Branca". Confirmar autorização do cliente.',
}
ALT_FIX = {'miria-s-project-final-v01-1-2.webm': ('Cinema, Moda', 'Projeto Miria, corte final')}

items = []; seq = [0]
def mk(fn, placement, position, title, label, extra=None):
    seq[0] += 1
    m = pm[fn]; w, h = m['vw'], m['vh']
    a = A.get(fn, {})
    tags = a.get('tags') or ALT_FIX.get(fn, ('', ''))[0]
    alt = a.get('alt') or ALT_FIX.get(fn, ('', ''))[1]
    t = re.sub(r'\s*\(1:1\)\s*$', '', title)
    ft, et = tr_title(t); fl, el = tr_label(label)
    it = dict(id='v-%02d' % seq[0], filename=fn, aspect=aspect_label(w, h), w=w, h=h, duration=m['duration'], size=sizes[fn],
              placement=placement, position=position, title=t, label=label, tags=tags, alt=alt, active=True,
              hero=False, rights='a-confirmar', note=NOTES.get(fn, ''), poster='assets/posters/' + m['poster'],
              i18n=dict(fr=dict(title=ft, label=fl), en=dict(title=et, label=el)))
    if extra: it.update(extra)
    items.append(it)

for i, (fn, t, svc, sec, meta, ai, tr) in enumerate(CARDS):
    ex = dict(service=svc, sector=sec, meta=meta, ai=ai)
    mk(fn, 'grid-%d' % (i + 1), i + 1, t, t, ex)
    it = items[-1]
    for lg in ('fr', 'en'):
        it['i18n'][lg] = dict(title=tr[lg][0], label=tr[lg][0], service=tr[lg][1], sector=tr[lg][2], meta=tr[lg][3])
bands = {1: [], 2: [], 3: []}
for x in home: bands[x['band']].append(x)
for b in (1, 2, 3):
    for p, x in enumerate(bands[b], 1):
        mk(x['file'], 'band-%d' % b, p, x['title'], x['label'])
mk('preview-30fps-1.webm', 'library', 1, 'Soft Motion Reel · Apresentação', 'Soft Reel')
items[-1]['i18n'] = dict(fr=dict(title='Soft Motion Reel · Présentation', label='Soft Reel'), en=dict(title='Soft Motion Reel · Introduction', label='Soft Reel'))
HERO = 'hf-20260918-032056-188e0b0e-dcc5-45ea-9d7b-752d3.webm'
for it in items:
    if it['filename'] == HERO: it['hero'] = True
assert len(items) == 52 and sum(1 for i in items if i['hero']) == 1 and len({i['filename'] for i in items}) == 52
cat = dict(version='2026-10-12.1', base=BASE, items=items)
os.makedirs(OUT, exist_ok=True)
json.dump(cat, open(os.path.join(OUT, 'catalog.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(OUT, 'catalog.js'), 'w', encoding='utf-8').write(
    '/* Catálogo padrão (gerado por ferramentas/build_catalog.py). Publicar = substituir este arquivo. */\n'
    'window.SOFT_CATALOG = ' + json.dumps(cat, ensure_ascii=False, separators=(',', ':')) + ';\n')
by = {}
for i in items: by[i['placement']] = by.get(i['placement'], 0) + 1
print('itens', len(items), by, '| hero:', [i['id'] for i in items if i['hero']])
print('verticais', sum(1 for i in items if i['h'] > i['w']), 'horizontais', sum(1 for i in items if i['w'] > i['h']), 'quadrados', sum(1 for i in items if i['w'] == i['h']))
print('aspectos', sorted({i['aspect'] for i in items}))
