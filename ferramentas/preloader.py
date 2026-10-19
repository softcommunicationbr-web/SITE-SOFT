"""Preloader da Soft: o logo oficial é "escrito" letra por letra com máscaras de traço
(o desenho continua sendo o vetor oficial; a máscara só decide o que já apareceu)."""
import re, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
BRAND = os.path.join(HERE, '..', 'maquette', 'assets', 'brand', 'soft-principal-creme.svg')

# Linhas de escrita (coordenadas do SVG oficial 624.5 x 276.8). w = espessura da "caneta".
# ordem: o primeiro traço de cada letra é o que se escreve primeiro.
STROKES = {
  'S': [dict(d='M112 40 C104 12 84 7 62 7 C32 7 14 28 14 52 C14 78 40 92 62 108 C92 128 112 140 112 162 C112 190 92 205 64 205 C36 205 18 190 8 152', w=52)],
  'O': [dict(d='M236.6 57 A66 74 0 1 0 236.6 205.6 A66 74 0 1 0 236.6 57', w=50)],
  'F': [dict(d='M376 54 L376 206', w=46),            # haste
        dict(d='M336 58 L452 58 M449 56 L449 100', w=26),   # barra superior e ponta
        dict(d='M390 134 L448 134', w=26),            # barra do meio
        dict(d='M338 205 L426 205', w=16)],           # serifa de base
  'T': [dict(d='M476 59 L624 59', w=34),              # barra
        dict(d='M481 50 L484 108 M614 50 L614 106', w=22),  # serifas da barra
        dict(d='M545 52 L545 206', w=56),             # haste
        dict(d='M506 205 L592 205', w=16)],           # serifa de base
}

def _parse(svg):
    paths = re.findall(r'<path[^>]*\sd="([^"]+)"', svg)
    return paths[0], paths[1]

def _split(d):
    return [p for p in re.split(r'(?=M)', d.strip()) if p.strip()]

def _bbox(sp):
    toks = re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?', sp); i = 0; cmd = None; x = y = 0; xs = []; ys = []
    while i < len(toks):
        if re.match(r'[A-Za-z]', toks[i]): cmd = toks[i]; i += 1; continue
        if cmd in ('M', 'L'): x, y = float(toks[i]), float(toks[i + 1]); i += 2
        elif cmd == 'H': x = float(toks[i]); i += 1
        elif cmd == 'V': y = float(toks[i]); i += 1
        elif cmd == 'Q': xs.append(float(toks[i])); ys.append(float(toks[i + 1])); x, y = float(toks[i + 2]), float(toks[i + 3]); i += 4
        else: i += 1
        xs.append(x); ys.append(y)
    return (min(xs), min(ys), max(xs), max(ys))

def _cluster(subs):
    bbs = [_bbox(s) for s in subs]
    order = sorted(range(len(subs)), key=lambda k: (bbs[k][2] - bbs[k][0]) * (bbs[k][3] - bbs[k][1]), reverse=True)
    cl = []
    for k in order:
        b = bbs[k]
        for c in cl:
            cb = bbs[c[0]]
            if b[0] >= cb[0] - .3 and b[1] >= cb[1] - .3 and b[2] <= cb[2] + .3 and b[3] <= cb[3] + .3:
                c.append(k); break
        else: cl.append([k])
    cl.sort(key=lambda c: bbs[c[0]][0])
    return [''.join(subs[k] for k in sorted(c)) for c in cl]

def glyphs():
    svg = open(BRAND, encoding='utf-8').read()
    word, comm = _parse(svg)
    w = _cluster(_split(word)); c = _cluster(_split(comm))
    assert len(w) == 4 and len(c) == 13, (len(w), len(c))
    return dict(zip('SOFT', w)), c

def svg(show_rest=True):
    """SVG do preloader. Cada traço de máscara tem pathLength=1 para animar dashoffset de 1 a 0."""
    g, comm = glyphs()
    defs = []; body = []
    for ch in 'SOFT':
        strokes = ''.join(
            f'<path class="pl-stroke" data-letter="{ch}" data-i="{i}" d="{s["d"]}" pathLength="1" fill="none" stroke="#fff" stroke-width="{s["w"]}" stroke-linecap="round" stroke-linejoin="round"/>'
            for i, s in enumerate(STROKES[ch]))
        defs.append(f'<mask id="pl-m-{ch}" maskUnits="userSpaceOnUse" x="-30" y="-30" width="690" height="280">{strokes}</mask>')
        rule = ' fill-rule="evenodd"'
        body.append(f'<g class="pl-letter" data-letter="{ch}" mask="url(#pl-m-{ch})"><path class="pl-glyph"{rule} d="{g[ch]}"/></g>')
    defs.append('<clipPath id="pl-row"><rect x="-6" y="246" width="636" height="36"/></clipPath>')
    comm_g = ''.join(f'<path class="pl-c" data-i="{i}" d="{d}"/>' for i, d in enumerate(comm))
    body.append(f'<g class="pl-comm" clip-path="url(#pl-row)">{comm_g}</g>')
    return ('<svg class="preloader-logo" xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 636.5 288.8" role="presentation" focusable="false">'
            f'<defs>{"".join(defs)}</defs>{"".join(body)}</svg>')

if __name__ == '__main__':
    print(len(svg()), 'bytes')

def svg3d():
    """Versão « surge do chão » : wordmark e COMMUNICATION em dois SVG separados (mesmo viewBox),
    para cada um receber a própria rotação 3D. Nenhuma máscara: é o vetor oficial inteiro."""
    svg = open(BRAND, encoding='utf-8').read()
    word, comm = _parse(svg)
    head = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 624.5 276.8" role="presentation" focusable="false" class="pl3-svg %s">'
    return (head % 'pl3-word' + f'<path class="pl-glyph" fill-rule="evenodd" d="{word}"/></svg>' +
            head % 'pl3-comm' + f'<path class="pl-glyph" d="{comm}"/></svg>')
