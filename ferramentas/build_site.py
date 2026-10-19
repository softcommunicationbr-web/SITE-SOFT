#!/usr/bin/env python3
"""Gera a página mãe (PT na raiz e em pt/, FR em fr/, EN em en/) e as páginas legais (4 por idioma).
O desenho vem de assets/css/site.css; o conteúdo de vídeo vem do catálogo (assets/js/home.js).
uso: python3 build_site.py        (rode de novo sempre que mudar textos)
"""
import json, os, sys, html, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import legal_content as LC
import preloader as PL
OUT = os.path.abspath(os.path.join(HERE, '..', 'maquette'))

WA, EMAIL, PHONE = '68987043112', 'soft.communicationbr@gmail.com', '+689 87 04 31 12'
LANGS = ('pt', 'fr', 'en')
HTML_LANG = {'pt': 'pt-BR', 'fr': 'fr', 'en': 'en'}
LEGAL = {'pt': ['aviso-legal', 'politica-de-privacidade', 'politica-de-cookies', 'termos-de-uso'],
         'fr': ['mentions-legales', 'confidentialite', 'cookies', 'conditions-utilisation'],
         'en': ['legal', 'privacy', 'cookies', 'terms']}
e = html.escape

# ----------------------------------------------------------------- textos
S = {
'pt': dict(
 skip='Ir para o conteúdo', nav_aria='Navegação principal', mobile_aria='Navegação móvel',
 n_sel='Destaques', n_vid='Vídeos', n_srv='Serviços', n_about='Sobre', n_contact='Contato', n_cta='AGENDAR CHAMADA',
 lang_label='Alterar idioma. Idioma atual: Português', menu='Menu', close='Fechar', admin='Área Admin →', admin_short='ADMIN', banner='Área Administrativa',
 mcta='Agendar chamada', brand_alt='Soft Communication, início',
 title='Início · Soft Communication',
 desc='Filmes de marca, presença em conteúdos verticais 9:16 e visuais imobiliários com IA na Polinésia Francesa. Produções audiovisuais cinematográficas sob medida.',
 hero_tag='Polinésia Francesa · FR / EN / PT',
 h1='Filmes de Marca & Conteúdo de Impacto',
 lead='Produções cinematográficas para marcas na Polinésia Francesa.',
 hero_cta_wa='Conversar no WhatsApp', hero_proof='+20 marcas & resorts atendidos', hero_sublink='Ver seleção de projetos ↓',
 hero_wa_msg='Olá! Gostaria de falar sobre um projeto com a Soft Communication.',
 cta1='Agendar chamada', cta2='Ver destaques', pause='Pausar vídeo', play='Reproduzir vídeo',
 sel_eb='Seleção', sel_h2='Uma seleção de projetos.', sel_link='Todos os vídeos',
 b1_eb='Portfólio', b1_t='Ver os vídeos', b1_s='Cinema, Reels e laboratórios de IA em três faixas.',
 b2_eb='Método', b2_t='Nossa abordagem', b2_s='Ouvir, filmar, entregar.',
 bands_aria='Trechos do portfólio',
 bands_note='Trechos do portfólio e Reels. Passe o mouse para ver em movimento; toque para abrir em tela cheia.',
 s_eb='Serviços', s_h2='Três pilares, um único olhar.', s_tag='Portfólio & Produção', s_link='Solicitar proposta',
 s1=('01 / Cinema', 'Filmes de marca', 'Filme de branding institucional, filme cinematográfico, vídeo comercial.'),
 s2=('02 / Presença', 'Conteúdos curtos & UGC', 'Reels, presença autêntica em frente à câmera, pacote mensal contínuo.'),
 s3=('03 / Projeção', 'Imobiliário & IA', 'Mostre os seus espaços sem precisar alugar um cenário.'),
 s_note='Edição e estratégia de conteúdo integradas a todas as ofertas.',
 a_eb='Abordagem', a_h2='Ouvir, filmar, entregar.',
 a1=('Ouvir', 'O seu produto, o seu espaço, os seus clientes: partimos do que já existe de genuíno.'),
 a2=('Filmar', 'Luz natural, enquadramentos abertos, ritmo calmo: a Polinésia sem artifícios.'),
 a3=('Entregar', 'Formatos prontos para as suas redes e canais, em francês, inglês e português.'),
 soft_eb='O conceito soft', soft_q='Soft, porque a imagem não força nada. Mostra, com calma e precisão, o que torna uma marca desejável.',
 soft_cap='A filosofia da marca em uma frase.', soft_tag='Filosofia Soft',
 c_photo='Calebe', c_eb='O criador', c_h2='Uma pessoa, uma câmera, um olhar.',
 c_name='Calebe', c_role='Fundador & Diretor Criativo',
 c_bio='Direção de cena, cinematografia e visão criativa',
 c_text='Fundador da Soft Communication. Nascido no Brasil e ancorado na Polinésia Francesa, Calebe atua na direção de cena e cinematografia para marcas de luxo, hotelaria internacional e empreendimentos imobiliários no Pacífico.',
 c_subtext='Combinando lentes de cinema, luz natural e narrativas autênticas, cada projeto é construído sob medida para revelar o que há de mais desejável e genuíno em cada história.',
 k_eb='Contato', k_h2='Vamos conversar sobre o seu projeto.', k_text='Uma primeira conversa para entender o seu objetivo, sem compromisso.',
 k_wa='Agendar chamada pelo WhatsApp', k_mail='Enviar e-mail', k_wa_msg='Olá! Gostaria de agendar uma chamada com a Soft Communication.',
 k_lbl_wa='WhatsApp', k_lbl_mail='E-mail',
 f_title='Prefere escrever?', f_hint='Preencha e abrimos o WhatsApp com a mensagem pronta. Nada é enviado até você confirmar no WhatsApp.',
 f_name='Nome', f_company='Empresa', f_need='O que você precisa', f_msg='Mensagem',
 f_chips=('Filme de marca', 'Reels / UGC', 'Imobiliário & IA', 'Outro'),
 f_name_ph='Seu nome', f_company_ph='Sua marca ou empresa', f_msg_ph='Conte em poucas linhas o que você quer mostrar.',
 f_consent='Concordo em usar estas informações apenas para responder ao meu pedido.', f_privacy='política de privacidade',
 f_submit='Abrir WhatsApp com a mensagem', f_mail='Preparar por e-mail',
 f_tpl='Olá! Sou {name}{company}.{need}\n\n{message}', f_company_prefix=', da ', f_need_prefix=' Gostaria de falar sobre: ',
 f_wa_status='Abrimos o WhatsApp com a sua mensagem pronta. Falta só tocar em enviar.', f_open='Abrir WhatsApp novamente',
 f_mail_status='Abrimos o seu aplicativo de e-mail com a mensagem pronta.', f_subject='Contato pelo site da Soft Communication',
 f_legal='As suas informações servem apenas para responder ao seu pedido. Não são vendidas nem repassadas. Veja a',
 foot_explore='Explorar', foot_contact='Contato', foot_ig='Instagram · @soft.communicationbr', foot_region='Polinésia Francesa', foot_legal='Informações legais',
 consent_eb='Privacidade', consent_text='Medição de audiência sem cookies invasivos. Nenhum rastreamento sem o seu consentimento.',
 consent_tag='Privacidade', refuse='Recusar', accept='Aceitar', consent_more='Política de cookies', top='Voltar ao topo',
 lb_aria='Player de vídeo', lb_default='Soft Communication · Polinésia Francesa',
 sound_hint='Toque para ativar o som',
 ia_tag='Projeção IA', ia_caption='Mostre seus espaços sem alugar um cenário. Visual assistido por IA.',
 draft_notice='Pré-visualização local: há alterações do painel ainda não publicadas neste navegador.', draft_discard='Descartar',
 l_home='Início', l_crumb='Trilha de navegação', l_eb='Informações legais', l_nav='Páginas legais',
 l_upd='Última atualização:', l_upd_todo='19 de outubro de 2026', l_check='Versão oficial em vigor',
 l_names=('Aviso legal', 'Política de privacidade', 'Política de cookies', 'Termos de uso'),
 l_short=('Aviso legal', 'Privacidade', 'Cookies', 'Termos de uso'),
 l_intro=('Quem publica este site, quem o hospeda e como falar conosco.', 'Quais dados recebemos, para quê, e como exercer os seus direitos.',
          'O que o site grava no seu aparelho, e como a escolha continua sendo sua.', 'As regras simples que valem quando você usa este site.'),
),
'fr': dict(
 skip='Aller au contenu', nav_aria='Navigation principale', mobile_aria='Navigation mobile',
 n_sel='Sélection', n_vid='Vidéos', n_srv='Services', n_about='À propos', n_contact='Contact', n_cta='RÉSERVER UN APPEL',
 lang_label='Changer de langue. Langue actuelle : Français', menu='Menu', close='Fermer', admin='Espace admin →', admin_short='ADMIN', banner='Espace administration',
 mcta='Réserver un appel', brand_alt='Soft Communication, accueil',
 title='Accueil · Soft Communication',
 desc='Films de marque, présence en formats verticaux 9:16 et visuels immobiliers assistés par IA en Polynésie française. Productions audiovisuelles cinématographiques sur mesure.',
 hero_tag='Polynésie française · FR / EN / PT',
 h1='Films de Marque & Contenu d’Impact',
 lead='Productions cinématographiques pour les marques en Polynésie française.',
 hero_cta_wa='Discuter sur WhatsApp', hero_proof='+20 marques & resorts accompagnés', hero_sublink='Voir la sélection de projets ↓',
 hero_wa_msg='Bonjour ! Je souhaite parler d’un projet avec Soft Communication.',
 cta1='Réserver un appel', cta2='Voir la sélection', pause='Mettre en pause', play='Lire la vidéo',
 sel_eb='Sélection', sel_h2='Une sélection de projets.', sel_link='Toutes les vidéos',
 b1_eb='Portfolio', b1_t='Voir les vidéos', b1_s='Cinéma, Reels et laboratoires IA en trois bandes.',
 b2_eb='Méthode', b2_t='Notre approche', b2_s='Écouter, filmer, livrer.',
 bands_aria='Extraits du portfolio',
 bands_note='Extraits du portfolio et Reels. Survolez pour voir le mouvement ; touchez pour ouvrir en plein écran.',
 s_eb='Services', s_h2='Trois familles, un même regard.', s_tag='Portfolio & Production', s_link='Demander un devis',
 s1=('01 / Cinéma', 'Films de marque', 'Film média branding, film cinématographique, vidéo commerciale.'),
 s2=('02 / Présence', 'Contenus courts & UGC', 'Reels, présence face caméra, pack mensuel.'),
 s3=('03 / Projection', 'Immobilier & IA', 'Montrez vos espaces sans avoir besoin de louer un décor.'),
 s_note='Montage et stratégie de contenu, pour chaque famille.',
 a_eb='Approche', a_h2='Écouter, filmer, livrer.',
 a1=('Écouter', 'Votre produit, votre lieu, vos clients : nous partons de ce qui existe.'),
 a2=('Filmer', 'Lumière naturelle, plans ouverts, rythme lent : la Polynésie telle qu’elle est.'),
 a3=('Livrer', 'Des formats prêts pour vos canaux, en français, en anglais et en portugais.'),
 soft_eb='Le mot soft', soft_q='Soft, parce que l’image ne force rien. Elle montre, avec calme et précision, ce qui rend une marque désirable.',
 soft_cap='L’approche de la marque, en une phrase.', soft_tag='Philosophie Soft',
 c_photo='Calebe', c_eb='Le créateur', c_h2='Une personne, une caméra, un regard.',
 c_name='Calebe', c_role='Fondateur & Réalisateur',
 c_bio='Direction artistique, cinématographie et vision créative',
 c_text='Fondateur de Soft Communication. Ancré en Polynésie française, Calebe allie esthétique cinématographique en lumière naturelle, maîtrise des formats verticaux à fort impact et modélisation par intelligence artificielle pour l’hôtellerie de luxe et l’immobilier haut de gamme.',
 c_subtext='Entre Tahiti, les îles du Pacifique et les projets internationaux, chaque réalisation privilégie la vérité du lieu, le rythme calme et l’élégance visuelle.',
 k_eb='Contact', k_h2='Parlons de votre projet.', k_text='Un premier appel pour comprendre votre besoin, sans engagement.',
 k_wa='Réserver un appel sur WhatsApp', k_mail='Écrire un e-mail', k_wa_msg='Bonjour ! Je souhaite réserver un appel avec Soft Communication.',
 k_lbl_wa='WhatsApp', k_lbl_mail='E-mail',
 f_title='Vous préférez écrire ?', f_hint='Remplissez le formulaire : WhatsApp s’ouvre avec le message prêt. Rien n’est envoyé avant que vous ne validiez dans WhatsApp.',
 f_name='Nom', f_company='Entreprise', f_need='Votre besoin', f_msg='Message',
 f_chips=('Film de marque', 'Reels / UGC', 'Immobilier & IA', 'Autre'),
 f_name_ph='Votre nom', f_company_ph='Votre marque ou entreprise', f_msg_ph='Dites-nous en quelques lignes ce que vous voulez montrer.',
 f_consent='J’accepte que ces informations servent uniquement à répondre à ma demande.', f_privacy='politique de confidentialité',
 f_submit='Ouvrir WhatsApp avec le message', f_mail='Préparer par e-mail',
 f_tpl='Bonjour ! Je suis {name}{company}.{need}\n\n{message}', f_company_prefix=', de ', f_need_prefix=' Je souhaite parler de : ',
 f_wa_status='WhatsApp s’est ouvert avec votre message. Il ne reste qu’à appuyer sur envoyer.', f_open='Rouvrir WhatsApp',
 f_mail_status='Votre application de messagerie s’est ouverte avec le message prêt.', f_subject='Contact depuis le site Soft Communication',
 f_legal='Vos informations servent uniquement à répondre à votre demande. Elles ne sont ni vendues ni cédées. Voir la',
 foot_explore='Explorer', foot_contact='Contact', foot_ig='Instagram · @soft.communicationbr', foot_region='Polynésie française', foot_legal='Informations légales',
 consent_eb='Confidentialité', consent_text='Mesure d’audience respectueuse de votre vie privée. Aucun suivi sans votre accord.',
 consent_tag='Confidentialité', refuse='Refuser', accept='Accepter', consent_more='Politique de cookies', top='Haut de page',
 lb_aria='Lecteur vidéo', lb_default='Soft Communication · Polynésie française',
 sound_hint='Touchez pour activer le son',
 ia_tag='Projection IA', ia_caption='Montrez vos espaces sans louer un décor. Visuel assisté par IA.',
 draft_notice='Aperçu local : des modifications du panneau ne sont pas encore publiées dans ce navigateur.', draft_discard='Abandonner',
 l_home='Accueil', l_crumb='Fil d’Ariane', l_eb='Informations légales', l_nav='Pages légales',
 l_upd='Dernière mise à jour :', l_upd_todo='19 octobre 2026', l_check='Version officielle en vigueur',
 l_names=('Mentions légales', 'Politique de confidentialité', 'Politique de cookies', 'Conditions d’utilisation'),
 l_short=('Mentions légales', 'Confidentialité', 'Cookies', 'Conditions d’utilisation'),
 l_intro=('Qui édite ce site, qui l’héberge et comment nous joindre.', 'Quelles données nous recevons, pourquoi, et comment exercer vos droits.',
          'Ce que le site dépose sur votre appareil, et comment vous gardez le choix.', 'Les règles simples qui s’appliquent quand vous utilisez ce site.'),
),
'en': dict(
 skip='Skip to content', nav_aria='Main navigation', mobile_aria='Mobile navigation',
 n_sel='Featured', n_vid='Videos', n_srv='Services', n_about='About', n_contact='Contact', n_cta='BOOK A CALL',
 lang_label='Change language. Current language: English', menu='Menu', close='Close', admin='Admin area →', admin_short='ADMIN', banner='Admin area',
 mcta='Book a call', brand_alt='Soft Communication, home',
 title='Home · Soft Communication',
 desc='Brand films, high-impact 9:16 vertical content and AI-assisted property visuals in French Polynesia. Bespoke cinematic audiovisual productions.',
 hero_tag='French Polynesia · FR / EN / PT',
 h1='Brand Films & High-Impact Content',
 lead='Cinematic productions for brands in French Polynesia.',
 hero_cta_wa='Chat on WhatsApp', hero_proof='+20 brands & luxury resorts served', hero_sublink='See featured projects ↓',
 hero_wa_msg='Hello! I would like to discuss a project with Soft Communication.',
 cta1='Book a call', cta2='See the selection', pause='Pause video', play='Play video',
 sel_eb='Selection', sel_h2='A selection of projects.', sel_link='All videos',
 b1_eb='Work', b1_t='See the videos', b1_s='Cinema, Reels and AI labs in three strips.',
 b2_eb='Method', b2_t='Our approach', b2_s='Listen, film, deliver.',
 bands_aria='Portfolio excerpts',
 bands_note='Portfolio excerpts and Reels. Hover to see them move; tap to open full screen.',
 s_eb='Services', s_h2='Three families, one eye.', s_tag='Portfolio & Production', s_link='Request a quote',
 s1=('01 / Cinema', 'Brand films', 'Brand media film, cinematic film, commercial video.'),
 s2=('02 / Presence', 'Short-form content & UGC', 'Reels, on-camera presence, monthly pack.'),
 s3=('03 / Projection', 'Real Estate & AI', 'Showcase your spaces without needing to rent a set.'),
 s_note='Editing and content strategy, across every service.',
 a_eb='Approach', a_h2='Listen, film, deliver.',
 a1=('Listen', 'Your product, your place, your customers: we start from what is already there.'),
 a2=('Film', 'Natural light, open frames, a slow pace: French Polynesia as it is.'),
 a3=('Deliver', 'Formats ready for your channels, in French, English and Portuguese.'),
 soft_eb='The word soft', soft_q='Soft, because the image forces nothing. It shows, calmly and precisely, what makes a brand desirable.',
 soft_cap='The brand’s approach, in one sentence.', soft_tag='Soft Philosophy',
 c_photo='Calebe', c_eb='The founder', c_h2='One person, one camera, one eye.',
 c_name='Calebe', c_role='Founder & Creative Director',
 c_bio='Film direction, cinematography and creative vision',
 c_text='Founder of Soft Communication. Based in French Polynesia, Calebe merges natural light cinematography, high-impact vertical storytelling, and AI-assisted architectural projections for luxury hospitality and premier real estate developers.',
 c_subtext='Across Tahiti, the Pacific islands and international productions, every piece of work honors authentic truth, serene tempo, and visual distinction.',
 k_eb='Contact', k_h2='Let’s talk about your project.', k_text='A first call to understand your needs, with no commitment.',
 k_wa='Book a call on WhatsApp', k_mail='Send an email', k_wa_msg='Hello! I would like to book a call with Soft Communication.',
 k_lbl_wa='WhatsApp', k_lbl_mail='Email',
 f_title='Prefer to write?', f_hint='Fill in the form and WhatsApp opens with your message ready. Nothing is sent until you confirm in WhatsApp.',
 f_name='Name', f_company='Company', f_need='What you need', f_msg='Message',
 f_chips=('Brand film', 'Reels / UGC', 'Real Estate & AI', 'Other'),
 f_name_ph='Your name', f_company_ph='Your brand or company', f_msg_ph='Tell us in a few lines what you want to show.',
 f_consent='I agree that this information is used only to answer my enquiry.', f_privacy='privacy policy',
 f_submit='Open WhatsApp with the message', f_mail='Prepare by email',
 f_tpl='Hello! I am {name}{company}.{need}\n\n{message}', f_company_prefix=', from ', f_need_prefix=' I would like to talk about: ',
 f_wa_status='WhatsApp opened with your message ready. Just tap send.', f_open='Open WhatsApp again',
 f_mail_status='Your email app opened with the message ready.', f_subject='Contact from the Soft Communication site',
 f_legal='Your information is used only to answer your enquiry. It is never sold or passed on. See the',
 foot_explore='Explore', foot_contact='Contact', foot_ig='Instagram · @soft.communicationbr', foot_region='French Polynesia', foot_legal='Legal information',
 consent_eb='Privacy', consent_text='Privacy-first audience measurement. Nothing is tracked without your consent.',
 consent_tag='Privacy', refuse='Decline', accept='Accept', consent_more='Cookie policy', top='Back to top',
 lb_aria='Video player', lb_default='Soft Communication · French Polynesia',
 sound_hint='Tap to turn the sound on',
 ia_tag='AI projection', ia_caption='Showcase your spaces without renting a set. AI-assisted visual.',
 draft_notice='Local preview: the panel has changes not yet published in this browser.', draft_discard='Discard',
 l_home='Home', l_crumb='Breadcrumb', l_eb='Legal information', l_nav='Legal pages',
 l_upd='Last updated:', l_upd_todo='October 19, 2026', l_check='Official version in force',
 l_names=('Legal notice', 'Privacy policy', 'Cookie policy', 'Terms of use'),
 l_short=('Legal notice', 'Privacy', 'Cookies', 'Terms of use'),
 l_intro=('Who publishes this site, who hosts it and how to reach us.', 'What data we receive, why, and how to exercise your rights.',
          'What the site stores on your device, and how you keep the choice.', 'The simple rules that apply when you use this site.'),
),
}
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Poppins:wght@300;400;500&display=swap" rel="stylesheet">')

PRELOAD_HEAD = ('<script>(function(){var h=document.documentElement,q=location.search,f=/[?&]intro=/.test(q),m=q.match(/[?&]intro=([a-z0-9]+)/);'
  'try{if(!f&&sessionStorage.getItem("soft-intro")==="1")return}catch(e){}'
  'if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;'
  'h.className+=" has-preloader";if(m&&m[1]==="s")h.setAttribute("data-intro","s")})()</script>\n')

# ----------------------------------------------------------------- caminhos
def rel(frm_dir, target):
    """Caminho relativo de uma página em frm_dir ('' = raiz) até target (a partir da raiz)."""
    if frm_dir == '': return target
    if target.startswith(frm_dir + '/'): return target[len(frm_dir) + 1:]
    return '../' + target
def page_target(lg, key, root_home=False):
    if key == 'home': return 'index.html' if root_home else lg + '/index.html'
    return '%s/%s.html' % (lg, LEGAL[lg][key])

# ----------------------------------------------------------------- blocos
def lang_menu(lg, loc, key, active_items=True):
    items = []
    names = {'fr': 'FR · Français', 'en': 'EN · English', 'pt': 'PT · Português'}
    for k in ('fr', 'en', 'pt'):
        tgt = page_target(k, key, root_home=(loc == '' and k == 'fr' and key == 'home'))
        cur = (k == lg)
        items.append('<a class="lang-item%s" href="%s" lang="%s" hreflang="%s"%s role="menuitem">%s</a>' % (
            ' is-active' if cur else '', rel(loc, tgt), k, k, ' aria-current="true"' if cur else '', names[k]))
    return '\n            '.join(items)

def head(lg, loc, key, title, desc, root, preload=False):
    alts = []
    for k in LANGS:
        alts.append('<link rel="alternate" hreflang="%s" href="%s">' % (k, rel(loc, page_target(k, key, root_home=(k == 'fr' and key == 'home')))))
    alts.append('<link rel="alternate" hreflang="x-default" href="%s">' % rel(loc, page_target('fr', key, root_home=(key == 'home'))))
    extra = ''
    return f'''<!doctype html>
<html lang="{HTML_LANG[lg]}" data-root="{root}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="robots" content="noindex, nofollow">
{chr(10).join(alts)}
<link rel="icon" type="image/svg+xml" href="{root}assets/brand/soft-simbolo-tiki-chocolate.svg">
{FONTS}
{PRELOAD_HEAD if preload else ''}<link rel="stylesheet" href="{root}assets/css/tokens.css">
<link rel="stylesheet" href="{root}assets/css/site.css">
</head>'''

def header(lg, loc, key, root, home_anchor):
    s = S[lg]
    pre = '' if home_anchor else rel(loc, page_target(lg, 'home', root_home=(loc == '' and lg == 'fr')))
    if home_anchor: pre = ''
    a = lambda frag: (pre + frag) if home_anchor else (rel(loc, page_target(lg, 'home', root_home=(loc == '' and lg == 'fr'))) + frag)
    brand_href = '#conteudo' if home_anchor else rel(loc, page_target(lg, 'home', root_home=(loc == '' and lg == 'fr')))
    menu = lang_menu(lg, loc, key)
    lang_block = f'''<div class="lang-dropdown" data-dropdown>
          <button class="lang-trigger" type="button" aria-expanded="false" aria-haspopup="true" data-lang-toggle aria-label="{e(s['lang_label'])}">
            <span class="lang-current">{lg.upper()}</span>
            <span class="lang-arrow" aria-hidden="true">&#x25BE;</span>
          </button>
          <div class="lang-menu" role="menu" hidden>
            {menu}
          </div>
        </div>'''
    adm = root + 'admin/index.html'
    return f'''<header class="site-header t-chocolate">
  <div class="container">
    <a class="brand" href="{brand_href}" aria-label="{e(s['brand_alt'])}">
      <img class="logo-dark" src="{root}assets/brand/soft-horizontal-creme.svg" alt="Soft Communication" width="135" height="44">
      <img class="logo-light" src="{root}assets/brand/soft-horizontal-chocolate.svg" alt="Soft Communication" width="135" height="44">
    </a>
    <nav class="nav" aria-label="{e(s['nav_aria'])}">
      <div class="nav-links">
        <a href="{a('#selecao')}">{s['n_sel']}</a>
        <a href="{a('#faixas')}">{s['n_vid']} (<span data-video-count>52</span>)</a>
        <a href="{a('#servicos')}">{s['n_srv']}</a>
        <a href="{a('#sobre')}">{s['n_about']}</a>
        <a href="{a('#contato')}">{s['n_contact']}</a>
      </div>
      <div class="nav-actions">
        {lang_block}
        <a class="btn-nav-admin" href="{adm}" data-admin-link>{s['admin_short']}</a>
        <a class="btn btn-primary btn-nav-cta" href="{a('#contato')}">{s['n_cta']}</a>
      </div>
    </nav>
    <div class="mobile-actions">
      {lang_block}
      <a class="btn-nav-admin" href="{adm}" data-admin-link>{s['admin_short']}</a>
      <button class="menu-toggle btn btn-outline" type="button" aria-expanded="false" aria-controls="mobile-menu">{s['menu']}</button>
    </div>
  </div>
</header>

<div class="mobile-menu t-chocolate" id="mobile-menu" hidden>
  <div class="mobile-menu-head">
    <img src="{root}assets/brand/soft-horizontal-creme.svg" alt="Soft Communication" width="123" height="40">
    <button class="btn btn-outline" type="button" data-menu-close>{s['close']}</button>
  </div>
  <nav aria-label="{e(s['mobile_aria'])}">
    <a href="{a('#selecao')}" data-menu-close>{s['n_sel']}</a>
    <a href="{a('#faixas')}" data-menu-close>{s['n_vid']} (<span data-video-count>52</span>)</a>
    <a href="{a('#servicos')}" data-menu-close>{s['n_srv']}</a>
    <a href="{a('#sobre')}" data-menu-close>{s['n_about']}</a>
    <a href="{a('#contato')}" data-menu-close>{s['n_contact']}</a>
    <a href="{adm}" style="font-size:20px; color:var(--areia); margin-top:var(--space-2);" data-admin-link>{s['admin']}</a>
  </nav>
  <div class="actions" style="margin-top:auto;">
    <a class="btn btn-primary btn-block" href="{a('#contato')}" data-menu-close>{s['mcta']}</a>
  </div>
</div>'''

def footer(lg, loc, root, home_anchor):
    s = S[lg]
    home = rel(loc, page_target(lg, 'home', root_home=(loc == '' and lg == 'fr')))
    a = lambda frag: frag if home_anchor else home + frag
    legal_links = '\n          '.join(
        '<li><a href="%s">%s</a></li>' % (rel(loc, page_target(lg, i)), e(s['l_short'][i])) for i in range(4))
    return f'''<footer class="site-footer t-chocolate">
  <div class="container">
    <div class="footer-grid">
      <div>
        <h2 class="eyebrow">{s['foot_explore']}</h2>
        <ul>
          <li><a href="{a('#selecao')}">{s['n_sel']}</a></li>
          <li><a href="{a('#faixas')}">{s['n_vid']} (<span data-video-count>52</span>)</a></li>
          <li><a href="{a('#servicos')}">{s['n_srv']}</a></li>
          <li><a href="{a('#sobre')}">{s['n_about']}</a></li>
          <li><a href="{a('#contato')}">{s['n_contact']}</a></li>
          <li><a href="{root}admin/index.html" data-admin-link>Admin</a></li>
        </ul>
      </div>
      <div>
        <h2 class="eyebrow">{s['foot_contact']}</h2>
        <ul>
          <li><a href="https://wa.me/{WA}" target="_blank" rel="noopener">WhatsApp · {PHONE}</a></li>
          <li><a href="mailto:{EMAIL}">{EMAIL}</a></li>
          <li><a href="https://instagram.com/soft.communicationbr" target="_blank" rel="noopener">{s['foot_ig']}</a></li>
        </ul>
      </div>
      <div class="footer-right">
        <p class="eyebrow">{s['foot_region']}</p>
        <ul>
          {legal_links}
        </ul>
        <p class="small">© 2026 <span data-brand>Soft Communication</span></p>
      </div>
    </div>
  </div>
  <div class="container wordmark-wrap">
    <img class="wordmark" src="{root}assets/brand/soft-wordmark-creme.svg" alt="SOFT" width="624" height="212">
  </div>
</footer>'''

def tail(lg, loc, root, extra_scripts=''):
    s = S[lg]
    cookies = rel(loc, page_target(lg, 2))
    return f'''<div class="consent t-creme" id="consent" hidden role="region" aria-label="{e(s['consent_eb'])}">
  <p class="eyebrow">{s['consent_eb']}</p>
  <p class="small">{s['consent_text']} <a class="link-plain" href="{cookies}">{s['consent_more']}</a></p>
  <div class="actions">
    <button class="btn btn-outline" type="button" data-consent="refuse">{s['refuse']}</button>
    <button class="btn btn-outline" type="button" data-consent="accept">{s['accept']}</button>
  </div>
</div>
<button class="back-to-top btn btn-secondary" type="button" hidden>{s['top']}</button>
<a class="maquette-banner" href="{root}admin/index.html" data-admin-link>{s['banner']}</a>

<script src="{root}assets/js/config.js"></script>
<script src="{root}assets/data/catalog.js"></script>
<script src="{root}assets/js/soft-catalog.js"></script>
{extra_scripts}<script src="{root}assets/js/site.js"></script>
</body>
</html>
'''

# ----------------------------------------------------------------- página mãe
def home(lg, root_page):
    loc = '' if root_page else lg
    root = '' if root_page else '../'
    s = S[lg]
    priv = rel(loc, page_target(lg, 1))
    wa_href = 'https://wa.me/%s?text=%s' % (WA, __import__('urllib.parse', fromlist=['quote']).quote(s['k_wa_msg']))
    chips = ''.join('<label class="chip"><input type="checkbox" name="need" value="%s"><span>%s</span></label>' % (e(c), e(c)) for c in s['f_chips'])
    ui = {k: s[k] for k in ('ia_tag', 'ia_caption', 'draft_notice', 'draft_discard')}
    scripts = '<script>window.SOFT_UI = %s;</script>\n<script src="%sassets/js/home.js"></script>\n' % (json.dumps(ui, ensure_ascii=False), root)
    body = f'''<body>
<a class="skip-link btn btn-primary" href="#conteudo">{s['skip']}</a>
<div class="preloader" id="preloader" aria-hidden="true">
  <div class="preloader-stage">
    <div class="preloader-ground">{PL.svg3d()}</div>
    <div class="preloader-floor"></div>
  </div>
  <button class="preloader-sound" type="button" hidden>{s['sound_hint']}</button>
</div>
<script src="{root}assets/js/preloader.js"></script>

{header(lg, loc, 'home', root, True)}

<main id="conteudo">

  <!-- 1. Hero : Imagem de fundo Foliage / Folhas com Prova Social e WhatsApp -->
  <section class="hero t-chocolate" data-hero aria-labelledby="hero-title">
    <div class="hero-media" aria-hidden="true">
      <img class="hero-bg-img" src="{root}assets/posters/hero-meadow-sunrise.jpg" alt="" width="1920" height="1080" fetchpriority="high" decoding="async">
    </div>
    <div class="container hero-body">
      <div class="hero-content">
        <h1 id="hero-title" class="display-hero">{s['h1']}</h1>
        <p class="hero-lead">{s['lead']}</p>
        <div class="hero-cta-group">
          <a class="hero-btn-wa" href="https://wa.me/{WA}?text={urllib.parse.quote(s['hero_wa_msg'])}" target="_blank" rel="noopener">
            <svg class="icon-wa" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.84a8.188 8.188 0 0 1-5.83 2.41c-1.46 0-2.89-.39-4.14-1.13l-.3-.18-3.09.81.82-3.01-.2-.31a8.16 8.16 0 0 1-1.25-4.43c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z"/>
            </svg>
            <span>{s['hero_cta_wa']}</span>
          </a>
          <a class="hero-social-proof" href="https://wa.me/{WA}?text={urllib.parse.quote(s['hero_wa_msg'])}" target="_blank" rel="noopener" aria-label="{s['hero_proof']} - WhatsApp">
            <div class="avatar-stack" aria-hidden="true">
              <img class="avatar" src="{root}assets/brand/avatars/client-1.jpg" alt="" width="38" height="38" loading="eager">
              <img class="avatar" src="{root}assets/brand/avatars/client-2.jpg" alt="" width="38" height="38" loading="eager">
              <img class="avatar" src="{root}assets/brand/avatars/client-3.jpg" alt="" width="38" height="38" loading="eager">
              <span class="avatar-more" aria-label="+">+</span>
            </div>
            <div class="proof-info">
              <div class="proof-stars" aria-hidden="true">★★★★★</div>
              <span class="proof-text">{s['hero_proof']}</span>
            </div>
          </a>
        </div>
        <div class="hero-sublink">
          <a href="#selecao">{s['hero_sublink']}</a>
        </div>
      </div>
    </div>
  </section>

  <!-- 2. Seleção + faixas : montadas por home.js a partir do catálogo -->
  <section class="section t-noir" id="selecao" data-reveal aria-labelledby="selection-title">
    <div class="container">
      <div class="section-head">
        <div class="stack-3">
          <p class="eyebrow">{s['sel_eb']}</p>
          <h2 id="selection-title" class="display-xl">{s['sel_h2']}</h2>
        </div>
        <a class="link-arrow" href="#faixas">{s['sel_link']}</a>
      </div>
      <div class="grid grid-4" data-render="cards"></div>
      <div class="bento home-bento">
        <a class="bento-card is-areia" href="#faixas">
          <span class="eyebrow">{s['b1_eb']}</span>
          <span class="display">{s['b1_t']}</span>
          <span class="small">{s['b1_s']}</span>
        </a>
        <a class="bento-card is-creme" href="#metodo">
          <span class="eyebrow">{s['b2_eb']}</span>
          <span class="display">{s['b2_t']}</span>
          <span class="small">{s['b2_s']}</span>
        </a>
      </div>
    </div>
    <div class="bands home-bands" id="faixas" aria-label="{e(s['bands_aria'])}">
      <div class="band" data-band="band-1" data-direction="left"><div class="band-track"></div></div>
      <div class="band" data-band="band-2" data-direction="right"><div class="band-track"></div></div>
      <div class="band" data-band="band-3" data-direction="left"><div class="band-track"></div></div>
    </div>
    <div class="container">
      <p class="small home-bands-note">{s['bands_note']}</p>
    </div>
  </section>

  <!-- 3. Serviços -->
  <section class="section t-creme" id="servicos" data-reveal aria-labelledby="services-title">
    <div class="container">
      <div class="section-head">
        <div class="stack-3">
          <p class="eyebrow">{s['s_eb']}</p>
          <h2 id="services-title" class="display-xl">{s['s_h2']}</h2>
        </div>
        <a class="link-arrow" href="#contato">{s['s_link']}</a>
      </div>
      <div class="services">
        <a class="service" href="#contato">
          <span class="service-num">{s['s1'][0]}</span>
          <span class="display">{e(s['s1'][1])}</span>
          <span class="service-desc">{s['s1'][2]}</span>
        </a>
        <a class="service" href="#contato">
          <span class="service-num">{s['s2'][0]}</span>
          <span class="display">{e(s['s2'][1])}</span>
          <span class="service-desc">{s['s2'][2]}</span>
        </a>
        <a class="service" href="#contato">
          <span class="service-num">{s['s3'][0]}</span>
          <span class="display">{e(s['s3'][1])}</span>
          <span class="service-desc">{s['s3'][2]}</span>
        </a>
      </div>
      <p class="small home-services-note">{s['s_note']}</p>
    </div>
  </section>

  <!-- 4. Abordagem + bloco « soft » -->
  <section class="section t-areia" id="metodo" data-reveal aria-labelledby="abordagem-title">
    <div class="container">
      <div class="split">
        <div class="stack-8">
          <div class="stack-3">
            <p class="eyebrow">{s['a_eb']}</p>
            <h2 id="abordagem-title" class="display">{s['a_h2']}</h2>
          </div>
          <div class="home-steps">
            <div class="stack-2"><h3 class="title">{s['a1'][0]}</h3><p class="measure">{s['a1'][1]}</p></div>
            <div class="stack-2"><h3 class="title">{s['a2'][0]}</h3><p class="measure">{s['a2'][1]}</p></div>
            <div class="stack-2"><h3 class="title">{s['a3'][0]}</h3><p class="measure">{s['a3'][1]}</p></div>
          </div>
        </div>
        <figure class="block block-chocolate stack-4" style="--ink:var(--creme);--ink-accent:var(--areia);--line-strong:var(--areia);color:var(--creme)">
          <p class="eyebrow">{s['soft_eb']}</p>
          <blockquote class="quote">{s['soft_q']}</blockquote>
          <figcaption class="small">{s['soft_cap']}</figcaption>
        </figure>
      </div>
    </div>
  </section>

  <!-- 5. O criador -->
  <section class="section t-creme" id="sobre" data-reveal aria-labelledby="createur-title">
    <div class="container">
      <div class="split split-wide" style="align-items:center;">
        <div class="media-4x5" style="position:relative; overflow:hidden; border:1px solid var(--areia); background:var(--chocolate);">
          <img src="{root}assets/brand/calebe.jpg" alt="{e(s['c_name'])} · Soft Communication" width="600" height="750" loading="lazy" style="width:100%; height:100%; object-fit:cover; display:block;">
        </div>
        <div class="stack-8">
          <div class="stack-3">
            <p class="eyebrow">{s['c_eb']}</p>
            <h2 id="createur-title" class="display">{s['c_h2']}</h2>
            <p class="eyebrow" style="color:var(--chocolate); font-weight:600; letter-spacing:0.08em; text-transform:uppercase;">{s['c_name']} · {s['c_role']}</p>
          </div>
          <div class="stack-3">
            <p class="measure" style="font-size:var(--fs-body); line-height:var(--lh-body); color:var(--ink);">{s['c_text']}</p>
            <p class="measure" style="font-size:var(--fs-small); line-height:var(--lh-body); color:var(--ink-accent);">{s['c_subtext']}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 6. Contato : WhatsApp, e-mail e formulário que prepara a mensagem -->
  <section class="section t-chocolate" id="contato" data-reveal aria-labelledby="contact-title">
    <div class="container contact-grid">
      <div class="stack-8">
        <div class="stack-3">
          <p class="eyebrow">{s['k_eb']}</p>
          <h2 id="contact-title" class="display-xl">{s['k_h2']}</h2>
          <p class="measure">{s['k_text']}</p>
        </div>
        <div class="actions">
          <a class="btn btn-primary" href="{wa_href}" target="_blank" rel="noopener" data-contact-wa>{s['k_wa']}</a>
          <a class="link-arrow" href="mailto:{EMAIL}">{s['k_mail']}</a>
        </div>
        <ul class="contact-lines small">
          <li>{s['k_lbl_wa']} · <a href="https://wa.me/{WA}" target="_blank" rel="noopener">{PHONE}</a></li>
          <li>{s['k_lbl_mail']} · <a href="mailto:{EMAIL}">{EMAIL}</a></li>
        </ul>
      </div>
      <form class="contact-form" data-wa-form aria-labelledby="form-title"
            data-template="{e(s['f_tpl'])}" data-company-prefix="{e(s['f_company_prefix'])}" data-need-prefix="{e(s['f_need_prefix'])}"
            data-wa-status="{e(s['f_wa_status'])}" data-open-label="{e(s['f_open'])}" data-mail-status="{e(s['f_mail_status'])}" data-subject="{e(s['f_subject'])}">
        <div class="stack-2">
          <h3 id="form-title" class="heading">{s['f_title']}</h3>
          <p class="small">{s['f_hint']}</p>
        </div>
        <div class="fields">
          <div class="field">
            <label for="cf-name">{s['f_name']} *</label>
            <input class="input" id="cf-name" name="name" type="text" autocomplete="name" required placeholder="{e(s['f_name_ph'])}">
          </div>
          <div class="field">
            <label for="cf-company">{s['f_company']}</label>
            <input class="input" id="cf-company" name="company" type="text" autocomplete="organization" placeholder="{e(s['f_company_ph'])}">
          </div>
        </div>
        <fieldset>
          <legend class="field-label eyebrow">{s['f_need']}</legend>
          <div class="chips">{chips}</div>
        </fieldset>
        <div class="field">
          <label for="cf-message">{s['f_msg']} *</label>
          <textarea class="textarea" id="cf-message" name="message" rows="4" required placeholder="{e(s['f_msg_ph'])}"></textarea>
        </div>
        <label class="checkbox">
          <input type="checkbox" name="consent" required>
          <span>{s['f_consent']} <a class="link-plain" href="{priv}">({s['f_privacy']})</a></span>
        </label>
        <div class="actions">
          <button class="btn btn-primary" type="submit">{s['f_submit']}</button>
          <button class="btn btn-outline" type="button" data-mail-button>{s['f_mail']}</button>
        </div>
        <p class="small">{s['f_legal']} <a class="link-plain" href="{priv}">{s['f_privacy']}</a>.</p>
        <p class="form-status" data-form-status role="status" aria-live="polite" hidden></p>
      </form>
    </div>
  </section>

</main>

<dialog class="lightbox" id="visionneuse" aria-label="{e(s['lb_aria'])}">
  <div class="lightbox-stage">
    <button class="lightbox-close btn btn-outline btn-small" type="button" data-lightbox-close>{s['close']}</button>
    <div class="media media-16x9">
      <video controls playsinline></video>
      <img class="selo-mark" src="{root}assets/brand/soft-selo-creme.svg" alt="" aria-hidden="true">
    </div>
    <p class="lightbox-caption" id="lightbox-caption" data-default="{e(s['lb_default'])}">{e(s['lb_default'])}</p>
  </div>
</dialog>

{footer(lg, loc, root, True)}

{tail(lg, loc, root, scripts)}'''
    return head(lg, loc, 'home', s['title'], s['desc'], root, preload=True) + '\n' + body

# ----------------------------------------------------------------- páginas legais
def legal(lg, i):
    loc = lg; root = '../'; s = S[lg]
    slug = LEGAL[lg][i]
    intro, sections = LC.CONTENT[lg][slug]
    nav = '\n'.join('          <li><a href="%s.html"%s>%s</a></li>' % (LEGAL[lg][j], ' aria-current="page"' if j == i else '', e(s['l_names'][j])) for j in range(4))
    main = f'''<main id="conteudo">
  <section class="section t-chocolate" data-hero aria-labelledby="legal-title">
    <div class="container stack-6">
      <nav aria-label="{e(s['l_crumb'])}">
        <ol class="breadcrumb">
          <li><a href="index.html">{s['l_home']}</a></li>
          <li aria-current="page">{e(s['l_names'][i])}</li>
        </ol>
      </nav>
      <div class="stack-4">
        <p class="eyebrow">{s['l_eb']}</p>
        <h1 id="legal-title" class="display-xl">{e(s['l_names'][i])}</h1>
        <p class="measure">{e(intro)}</p>
        <p class="small">{s['l_upd']} <time datetime="2026-10-19">{s['l_upd_todo']}</time></p>
      </div>
    </div>
  </section>

  <section class="section t-creme" aria-label="{e(s['l_names'][i])}">
    <div class="container legal-layout">
      <nav class="legal-nav" aria-label="{e(s['l_nav'])}">
        <ul>
{nav}
        </ul>
      </nav>
      <article class="legal">
{chr(10).join(sections)}
      </article>
    </div>
  </section>
</main>'''
    body = f'''<body>
<a class="skip-link btn btn-primary" href="#conteudo">{s['skip']}</a>

{header(lg, loc, i, root, False)}

{main}

{footer(lg, loc, root, False)}

{tail(lg, loc, root)}'''
    return head(lg, loc, i, s['l_names'][i] + ' · Soft Communication', intro, root) + '\n' + body

def write(path, content):
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, 'w', encoding='utf-8').write(content)
    print('escrito', path)

if __name__ == '__main__':
    write('index.html', home('fr', True))
    for lg in LANGS:
        write('%s/index.html' % lg, home(lg, False))
        for i in range(4):
            write('%s/%s.html' % (lg, LEGAL[lg][i]), legal(lg, i))

    # Auto-renovação de SEO, AEO e GEO em produção
    try:
        import subprocess
        auto_seo_py = os.path.join(HERE, 'auto_renovar_seo.py')
        if os.path.exists(auto_seo_py):
            subprocess.run([sys.executable, '-I', auto_seo_py], check=True)
    except Exception as err:
        print(f"Aviso ao renovar SEO automaticamente: {err}")
