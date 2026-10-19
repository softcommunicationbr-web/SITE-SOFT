"""Conteúdo das páginas legais (PT/FR/EN). Textos oficiais completos e validados."""
BRAND = '<span data-brand>Soft Communication</span>'
MAIL = '<a href="mailto:soft.communicationbr@gmail.com">soft.communicationbr@gmail.com</a>'
TEL = '<a href="tel:+68987043112">+689 87 04 31 12</a>'

def sec(title, body):
    return '        <section>\n          <h2 class="heading">' + title + '</h2>\n' + body.strip('\n') + '\n        </section>'

# ------------------------------------------------------------------ FR
FR = {}
FR['mentions-legales'] = ('Qui édite ce site, qui l’héberge et comment nous joindre.', [
 sec('Éditeur du site', f'''
          <dl>
            <dt>Nom commercial</dt><dd>{BRAND} (Soft & Co)</dd>
            <dt>Statut</dt><dd>Entreprise individuelle patentée (patente), Polynésie française</dd>
            <dt>Exploitant</dt><dd>Calebe</dd>
            <dt>Numéro TAHITI</dt><dd>H02826</dd>
            <dt>Registre du commerce</dt><dd>RCS Papeete · Entreprise individuelle patentée</dd>
            <dt>Adresse professionnelle</dt><dd>Résidence Bel Air View, Pamatai, 98704 Faa’a, Tahiti, Polynésie française</dd>
            <dt>Téléphone</dt><dd>{TEL}</dd>
            <dt>E-mail</dt><dd>{MAIL}</dd>
            <dt>Adresse du site</dt><dd><a href="https://softcommunication.com">https://softcommunication.com</a></dd>
          </dl>'''),
 sec('Directeur de la publication', '          <p>Calebe.</p>'),
 sec('Hébergement', f'''
          <p>Le site est hébergé par Hostinger.</p>
          <p>Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Chypre · <a href="https://www.hostinger.com" target="_blank" rel="noopener">hostinger.com</a></p>'''),
 sec('Activité', f'''
          <p>{BRAND} est une agence de production audiovisuelle et de communication : création de films de marque cinématographiques, contenus courts et Reels 9:16, ainsi que modélisations et visuels immobiliers assistés par IA.</p>
          <p>Ce site présente nos services et réalisations. Il ne propose pas de vente en ligne directe. Il permet d’évaluer nos compétences, de nous contacter et de solliciter un devis personnalisé.</p>'''),
 sec('Propriété intellectuelle', f'''
          <p>Les textes, vidéos, photographies, logos, animations et éléments graphiques figurant sur ce site sont la propriété exclusive de {BRAND} ou font l’objet d’une autorisation expresse de diffusion.</p>
          <p>Toute reproduction, représentation, modification ou diffusion, intégrale ou partielle, est strictement interdite sans notre accord préalable par écrit.</p>
          <p>Crédits des contenus : Direction de création, réalisation, cinématographie, modélisation et montage par Soft Communication / Calebe. Tous droits réservés.</p>'''),
 sec('Responsabilité', '''
          <p>Nous veillons avec le plus grand soin à l’exactitude et à la mise à jour des informations publiées. Elles sont fournies à titre indicatif et ne sauraient engager contractuellement l’éditeur.</p>
          <p>Le site peut contenir des liens vers des services ou sites tiers. Nous déclinons toute responsabilité quant au contenu ou aux pratiques de ces plateformes externes.</p>'''),
 sec('Données personnelles et cookies', '''
          <p>Pour en savoir plus sur la gestion de vos données et le respect de votre vie privée, consultez notre <a href="confidentialite.html">politique de confidentialité</a> et notre <a href="cookies.html">politique de cookies</a>.</p>'''),
 sec('Droit applicable', '''
          <p>Le présent site est régi et interprété conformément au droit applicable en Polynésie française et à la réglementation française en vigueur.</p>'''),
 sec('Contact', f'''
          <p>Pour toute question ou démarche : {MAIL} ou {TEL}.</p>'''),
])

FR['confidentialite'] = ('Quelles données nous recevons, pourquoi, et comment exercer vos droits.', [
 sec('Qui est responsable de vos données', f'''
          <p>{BRAND}, Résidence Bel Air View, Pamatai, 98704 Faa’a, Tahiti, Polynésie française.</p>
          <p>Responsable du traitement : Calebe · Contact : {MAIL} · {TEL}.</p>'''),
 sec('Les données que nous recevons', f'''
          <ul>
            <li><strong>Formulaire de contact :</strong> nom, e-mail, marque ou entreprise, secteur d'activité, numéro WhatsApp, description de votre projet et délai souhaité.</li>
            <li><strong>Échanges directs :</strong> informations et précisions techniques transmises volontairement par WhatsApp, e-mail ou téléphone.</li>
            <li><strong>Prise de rendez-vous :</strong> nom, e-mail et créneau retenu via notre module de réservation en ligne (Cal.com) ou par messagerie directe.</li>
            <li><strong>Mesure de navigation :</strong> données techniques anonymisées d’audience, uniquement après recueil de votre consentement. Voir notre <a href="cookies.html">politique de cookies</a>.</li>
          </ul>
          <p>Nous ne collectons aucune donnée sensible ni aucune coordonnée bancaire sur ce site vitrine.</p>'''),
 sec('Pourquoi nous les utilisons', '''
          <ul>
            <li>Répondre précisément à vos demandes et établir des propositions de devis sur mesure.</li>
            <li>Organiser un échange préparatoire ou fixer un appel de cadrage.</li>
            <li>Assurer le suivi rigoureux de nos relations commerciales et artistiques.</li>
            <li>Analyser la fréquentation globale du site pour en améliorer l'ergonomie, sous réserve de votre consentement.</li>
          </ul>
          <p>Ces traitements reposent sur l'exécution de démarches précontractuelles à votre demande, sur votre consentement explicite, ou sur notre intérêt légitime à répondre aux sollicitations reçues.</p>'''),
 sec('Qui peut y accéder', f'''
          <p>Vos données sont strictement destinées à {BRAND}. En aucun cas vos données ne sont commercialisées, cédées ou louées à des tiers.</p>
          <p>Elles peuvent être traitées de façon confidentielle par nos prestataires techniques pour les stricts besoins de leurs prestations :</p>
          <ul>
            <li>Hébergement de l'infrastructure web : Hostinger.</li>
            <li>Messagerie et communication : WhatsApp Business et messagerie Google Workspace.</li>
            <li>Prise de rendez-vous : Cal.com (plateforme de réservation sécurisée).</li>
            <li>Mesure d’audience et réseaux : outils de mesure d'audience anonymes et pixels publicitaires Meta, activés exclusivement sur acceptation volontaire.</li>
          </ul>
          <p>Ces prestataires respectent les clauses contractuelles types de la Commission Européenne et les normes de protection des données conformes au RGPD et à la loi Informatique et Libertés.</p>'''),
 sec('Combien de temps nous les gardons', '''
          <ul>
            <li><strong>Demandes de devis et prises de contact :</strong> 3 ans à compter du dernier échange commercial.</li>
            <li><strong>Dossiers clients et contrats :</strong> 5 ans à compter de la fin de la prestation, conformément aux obligations légales et comptables.</li>
            <li><strong>Traceurs et données de navigation :</strong> 6 à 13 mois maximum à compter de leur enregistrement.</li>
          </ul>'''),
 sec('Vos droits', f'''
          <p>Conformément à la réglementation applicable en Polynésie française et à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée, vous disposez d’un droit d’accès, de rectification, d’effacement, d’opposition et de limitation du traitement de vos données personnelles.</p>
          <p>Vous pouvez faire valoir ces droits à tout moment en nous écrivant simplement à : {MAIL}. Une réponse vous sera apportée dans les meilleurs délais.</p>
          <p>Si vous estimez que vos droits ne sont pas respectés, vous avez la possibilité de saisir la Commission Nationale de l'Informatique et des Libertés (CNIL, cnil.fr).</p>'''),
 sec('Sécurité', '''
          <p>Nous mettons en œuvre toutes les mesures techniques et organisationnelles requises pour préserver la sécurité et la confidentialité de vos informations contre tout accès non autorisé.</p>'''),
 sec('Modification de cette politique', '''
          <p>La présente politique peut être actualisée pour refléter les évolutions de nos services ou de la législation. La date de dernière mise à jour figure en tête de page.</p>'''),
])

FR['cookies'] = ('Ce que le site dépose sur votre appareil, et comment vous gardez le choix.', [
 sec('Qu’est-ce qu’un cookie', '''
          <p>Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette ou smartphone) lors de la consultation d’un site web. Il permet au site de mémoriser vos préférences et de faciliter votre navigation.</p>'''),
 sec('Votre choix', '''
          <p>Dès votre première visite, un bandeau d'information vous invite à accepter ou refuser les cookies non essentiels. Les deux options disposent de la même valeur et de la même accessibilité.</p>
          <p>Tant que vous n'avez pas exprimé votre accord, aucun cookie d'audience ou de publicité n'est déposé. Refuser les traceurs n'entrave en rien votre expérience de visite.</p>'''),
 sec('Les cookies utilisés', '''
          <ul>
            <li><strong>Nécessaires (techniques) :</strong> indispensables au fonctionnement fluide du site et à la mémorisation de votre consentement. Ils ne nécessitent pas d’accord préalable.</li>
            <li><strong>Mesure d’audience :</strong> outils respectueux de la vie privée permettant de mesurer de façon anonyme le volume de visites et les contenus les plus consultés.</li>
            <li><strong>Publicité et réseaux sociaux :</strong> pixels de mesure (Meta Pixel / Instagram) activés uniquement avec votre accord exprès pour analyser la pertinence de nos campagnes.</li>
            <li><strong>Réservation en ligne :</strong> cookies techniques propres au module Cal.com permettant la gestion de votre créneau horaire sélectionné.</li>
          </ul>
          <p>La liste complète des traceurs et de leurs finalités reste consultable sur demande auprès de notre équipe.</p>'''),
 sec('Durée', '''
          <p>Votre choix (acceptation ou refus) est conservé sur votre appareil pour une durée maximale de 6 mois. À l’issue de cette période, le bandeau de choix vous sera présenté à nouveau.</p>'''),
 sec('Changer d’avis', f'''
          <p>Vous êtes libre de modifier votre consentement à tout instant : <button class="link-plain" type="button" onclick="localStorage.removeItem('soft_consent');var c=document.getElementById('consent');if(c){{c.hidden=false;c.scrollIntoView({{behavior:'smooth'}});}}">Gérer mes préférences cookies</button>.</p>
          <p>Vous pouvez également supprimer ou bloquer les cookies à tout moment depuis les paramètres de votre navigateur internet.</p>'''),
 sec('En savoir plus', f'''
          <p>Pour approfondir la gestion de vos données personnelles, consultez notre <a href="confidentialite.html">politique de confidentialité</a>. Pour toute question : {MAIL}.</p>'''),
])

FR['conditions-utilisation'] = ('Les règles simples qui s’appliquent quand vous utilisez ce site.', [
 sec('Objet', f'''
          <p>Les présentes conditions définissent les règles d'accès et d'utilisation du site édité par {BRAND}. La navigation sur ce site emporte acceptation pleine et entière de ces conditions.</p>'''),
 sec('Ce que propose le site', '''
          <p>Le site a pour objet de présenter l’agence, son positionnement, sa direction artistique, ainsi qu’une sélection représentative de ses réalisations vidéo et créatives.</p>
          <p>Il ne s’agit pas d’une boutique de vente en ligne. Toute prestation audiovisuelle fait l’objet d'un devis préalable écrit et d'une contractualisation formalisée entre les parties. Les informations publiées ne valent pas offre contractuelle automatique.</p>'''),
 sec('Contenus du site et transparence IA', '''
          <p>L’ensemble des contenus (textes, vidéos, photographies, identité visuelle) est protégé par les lois régissant la propriété intellectuelle. Toute réutilisation commerciale ou éditoriale sans autorisation écrite est formellement prohibée.</p>
          <p>Les visuels immobiliers faisant appel à l’intelligence artificielle portent systématiquement la mention distinctive <strong>« Projection IA »</strong>. Il s'agit de propositions artistiques et non contractuelles : les aménagements intérieurs ou extérieurs générés par IA ne décrivent pas l'état physique actuel du bien.</p>'''),
 sec('Vos messages', '''
          <p>Lorsque vous utilisez notre formulaire de contact, WhatsApp ou notre adresse e-mail, vous vous engagez à transmettre des informations véridiques et à ne pas véhiculer de propos diffamatoires, illicites ou portant atteinte aux droits de tiers.</p>'''),
 sec('Disponibilité et responsabilité', '''
          <p>Nous veillons à maintenir le site disponible en continu et exempt d'anomalies. Cependant, l’accès peut être ponctuellement suspendu pour maintenance, mise à jour ou impératif technique indépendant de notre volonté.</p>
          <p>{BRAND} ne saurait être tenue responsable des dommages directs ou indirects résultant de l'utilisation du site ou de l'impossibilité d'y accéder.</p>'''),
 sec('Données personnelles', '''
          <p>Le traitement des données transmises via le site est détaillé dans notre <a href="confidentialite.html">politique de confidentialité</a> et notre <a href="cookies.html">politique de cookies</a>.</p>'''),
 sec('Évolution et droit applicable', '''
          <p>Les présentes conditions peuvent être modifiées à tout moment sans préavis. La version en vigueur est celle accessible en ligne à la date de votre visite.</p>
          <p>Elles sont soumises à la législation applicable en Polynésie française. Tout litige relatif à leur interprétation relève de la compétence des tribunaux compétents de Papeete.</p>'''),
 sec('Contact', f'''
          <p>Pour toute question relative aux conditions d’utilisation : {MAIL} · {TEL}.</p>'''),
])

# ------------------------------------------------------------------ EN
EN = {}
EN['legal'] = ('Who publishes this site, who hosts it and how to reach us.', [
 sec('Site publisher', f'''
          <dl>
            <dt>Trading name</dt><dd>{BRAND} (Soft & Co)</dd>
            <dt>Status</dt><dd>Licensed sole proprietorship (“patente”), French Polynesia</dd>
            <dt>Operator</dt><dd>Calebe</dd>
            <dt>TAHITI number</dt><dd>H02826</dd>
            <dt>Trade register</dt><dd>RCS Papeete · Licensed sole proprietorship</dd>
            <dt>Business address</dt><dd>Résidence Bel Air View, Pamatai, 98704 Faa’a, Tahiti, French Polynesia</dd>
            <dt>Phone</dt><dd>{TEL}</dd>
            <dt>Email</dt><dd>{MAIL}</dd>
            <dt>Site address</dt><dd><a href="https://softcommunication.com">https://softcommunication.com</a></dd>
          </dl>'''),
 sec('Publication director', '          <p>Calebe.</p>'),
 sec('Hosting', f'''
          <p>The site is hosted by Hostinger.</p>
          <p>Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Cyprus · <a href="https://www.hostinger.com" target="_blank" rel="noopener">hostinger.com</a></p>'''),
 sec('Activity', f'''
          <p>{BRAND} is a boutique audiovisual production studio and creative agency: crafting cinematic brand films, high-impact 9:16 vertical Reels, and AI-assisted architectural projections for luxury hospitality and prestigious real estate.</p>
          <p>This showcase site presents our services and portfolio. It does not sell products online. It allows prospective clients to review our standards, initiate contact, and request tailored production proposals.</p>'''),
 sec('Intellectual property', f'''
          <p>All texts, videos, photographs, logos, animations, and design assets appearing on this site are the exclusive property of {BRAND} or are displayed with explicit permission.</p>
          <p>Any reproduction, representation, modification, or distribution, whether partial or full, is strictly forbidden without our prior written authorization.</p>
          <p>Content credits: Direction, cinematography, AI architectural projections, and post-production by Soft Communication / Calebe. All rights reserved.</p>'''),
 sec('Liability', '''
          <p>We take every reasonable measure to ensure that information published on this site is precise and up to date. Information is provided for indicative purposes and does not constitute a formal contractual commitment.</p>
          <p>The site may contain links to external third-party services. We assume no liability for the content or privacy practices of these external platforms.</p>'''),
 sec('Personal data and cookies', '''
          <p>To learn how your privacy is protected and how personal data is handled, please review our <a href="privacy.html">privacy policy</a> and <a href="cookies.html">cookie policy</a>.</p>'''),
 sec('Governing law', '''
          <p>This site is governed by and construed in accordance with the laws applicable in French Polynesia and French regulations.</p>'''),
 sec('Contact', f'''
          <p>For any enquiries or assistance: {MAIL} or {TEL}.</p>'''),
])

EN['privacy'] = ('What data we receive, why, and how to exercise your rights.', [
 sec('Who is responsible for your data', f'''
          <p>{BRAND}, Résidence Bel Air View, Pamatai, 98704 Faa’a, Tahiti, French Polynesia.</p>
          <p>Data controller: Calebe · Contact: {MAIL} · {TEL}.</p>'''),
 sec('The data we receive', f'''
          <ul>
            <li><strong>Contact form:</strong> your name, email, company or brand, industry sector, WhatsApp number, project summary, and desired timeline.</li>
            <li><strong>Direct correspondence:</strong> information and details shared voluntarily when communicating via WhatsApp, email, or telephone.</li>
            <li><strong>Call bookings:</strong> name, email address, and selected time slot via our online scheduling module (Cal.com) or direct messaging.</li>
            <li><strong>Browsing telemetry:</strong> anonymized technical audience metrics, collected only after your express consent. See our <a href="cookies.html">cookie policy</a>.</li>
          </ul>
          <p>We do not collect sensitive personal data or financial payment information on this website.</p>'''),
 sec('Why we use it', '''
          <ul>
            <li>To address your enquiries and formulate tailored production quotes.</li>
            <li>To schedule introductory discovery calls and consultations.</li>
            <li>To maintain seamless business and artistic communications.</li>
            <li>To analyze general website usage trends and improve usability, subject to your consent.</li>
          </ul>
          <p>These activities are based on steps taken at your request prior to entering into a contract, on your express consent, or on our legitimate business interest in responding to enquiries.</p>'''),
 sec('Who can access it', f'''
          <p>Your personal data is solely intended for {BRAND}. We never sell, lease, or trade your personal information to third parties.</p>
          <p>It may be processed confidentially by our trusted technical partners strictly within the scope of their assigned services:</p>
          <ul>
            <li>Web infrastructure hosting: Hostinger.</li>
            <li>Communications: WhatsApp Business and Google Workspace mail.</li>
            <li>Online scheduling: Cal.com (secure booking integration).</li>
            <li>Audience measurement & social: privacy-focused analytics and Meta advertising pixels, enabled strictly upon explicit opt-in.</li>
          </ul>
          <p>Our providers comply with European Commission Standard Contractual Clauses (SCC) and international data protection standards aligned with GDPR.</p>'''),
 sec('How long we keep it', '''
          <ul>
            <li><strong>Enquiries and quotes:</strong> 3 years from the date of the last commercial contact.</li>
            <li><strong>Client accounts and contracts:</strong> 5 years from project delivery, pursuant to statutory legal and accounting obligations.</li>
            <li><strong>Analytics cookies and telemetry:</strong> 6 to 13 months maximum from initial placement.</li>
          </ul>'''),
 sec('Your rights', f'''
          <p>In accordance with data protection regulations applicable in French Polynesia and the amended French Data Protection Act of 6 January 1978, you have the right to access, rectify, erase, restrict, and object to the processing of your personal data.</p>
          <p>You can exercise these rights at any time by sending a message to: {MAIL}. We will respond promptly.</p>
          <p>If you believe your rights have not been respected, you are entitled to file a complaint with the French Data Protection Authority (CNIL, cnil.fr).</p>'''),
 sec('Security', '''
          <p>We enforce rigorous technical and organizational safeguards to ensure the security, integrity, and confidentiality of your information against unauthorized access.</p>'''),
 sec('Changes to this policy', '''
          <p>We may update this policy periodically to reflect evolving practices or legal requirements. The latest revision date is displayed at the top of the page.</p>'''),
])

EN['cookies'] = ('What the site stores on your device, and how you keep the choice.', [
 sec('What a cookie is', '''
          <p>A cookie is a compact text file stored on your device (computer, tablet, or mobile) when visiting a website. It allows the site to remember your preferences and ensure smooth navigation.</p>'''),
 sec('Your choice', '''
          <p>Upon your first visit, a privacy banner invites you to either accept or decline non-essential cookies. Both choices carry equal prominence and are equally straightforward.</p>
          <p>Until you provide your explicit consent, no audience measurement or advertising cookies are deployed. Choosing to decline will never restrict your ability to browse our website.</p>'''),
 sec('The cookies we use', '''
          <ul>
            <li><strong>Essential (Technical):</strong> necessary for core website functions and for remembering your privacy choices. These do not require prior consent.</li>
            <li><strong>Audience measurement:</strong> privacy-preserving tools designed to assess aggregate traffic and identify the most viewed sections anonymously.</li>
            <li><strong>Advertising & social:</strong> campaign pixels (Meta / Instagram), enabled only with your explicit permission to evaluate campaign effectiveness.</li>
            <li><strong>Online booking:</strong> functional cookies deployed by Cal.com to manage and hold your selected discovery call slot.</li>
          </ul>
          <p>Detailed technical specifications of active trackers remain available upon request.</p>'''),
 sec('Duration', '''
          <p>Your preference choice (acceptance or refusal) is retained on your device for up to 6 months. After this time, the consent banner will be presented again.</p>'''),
 sec('Changing your mind', f'''
          <p>You may adjust or revoke your cookie choices at any time: <button class="link-plain" type="button" onclick="localStorage.removeItem('soft_consent');var c=document.getElementById('consent');if(c){{c.hidden=false;c.scrollIntoView({{behavior:'smooth'}});}}">Manage cookie preferences</button>.</p>
          <p>You can also clear or block cookies directly through your web browser settings at any moment.</p>'''),
 sec('Find out more', f'''
          <p>For additional details regarding your personal data rights, please consult our <a href="privacy.html">privacy policy</a>. For any questions: {MAIL}.</p>'''),
])

EN['terms'] = ('The simple rules that apply when you use this site.', [
 sec('Purpose', f'''
          <p>These terms govern access to and usage of the website published by {BRAND}. By navigating this website, you accept these terms in full.</p>'''),
 sec('What the site offers', '''
          <p>The primary purpose of this website is to showcase our agency, creative vision, services, and a curated selection of our commercial and artistic productions.</p>
          <p>This is not an e-commerce platform. Any audiovisual production assignment requires a bespoke written proposal and mutual contract execution. Information published on this site does not constitute an automatic binding offer.</p>'''),
 sec('Site content and AI transparency', '''
          <p>All materials (text, film footage, imagery, logos, design) are legally protected under intellectual property legislation. Any commercial reuse without prior written permission is strictly prohibited.</p>
          <p>Architectural property visuals created with generative artificial intelligence are systematically labeled with the distinct marker <strong>“AI projection”</strong>. These represent artistic concepts and are non-contractual: AI-rendered fixtures and interiors do not reflect the current physical state of the property.</p>'''),
 sec('Your messages', '''
          <p>When contacting us via the website form, WhatsApp, or email, you agree to provide accurate information and refrain from submitting unlawful, defamatory, or third-party proprietary content without authorization.</p>'''),
 sec('Availability and liability', '''
          <p>We endeavor to keep the website continuously accessible and error-free. However, access may be momentarily suspended for scheduled maintenance, system enhancements, or technical events beyond our control.</p>
          <p>{BRAND} shall not be held liable for any direct or indirect inconvenience arising from website use or temporary unavailability.</p>'''),
 sec('Personal data', '''
          <p>Details regarding data collection and privacy management are set forth in our <a href="privacy.html">privacy policy</a> and <a href="cookies.html">cookie policy</a>.</p>'''),
 sec('Changes and governing law', '''
          <p>These terms may be revised at any time without prior notice. The version published online at the time of your visit governs your usage.</p>
          <p>They are governed by the laws applicable in French Polynesia. Any dispute concerning their interpretation shall fall within the jurisdiction of the competent courts in Papeete.</p>'''),
 sec('Contact', f'''
          <p>For any enquiries regarding these terms of use: {MAIL} · {TEL}.</p>'''),
])

# ------------------------------------------------------------------ PT
PT = {}
PT['aviso-legal'] = ('Quem publica este site, quem o hospeda e como falar conosco.', [
 sec('Responsável pelo site', f"""
          <dl>
            <dt>Nome comercial</dt><dd>{BRAND} (Soft & Co)</dd>
            <dt>Estatuto</dt><dd>Atividade individual em regime de patente, Polinésia Francesa</dd>
            <dt>Titular</dt><dd>Calebe</dd>
            <dt>Número TAHITI</dt><dd>H02826</dd>
            <dt>Registro comercial</dt><dd>RCS Papeete · Empresa individual sob regime de patente</dd>
            <dt>Endereço profissional</dt><dd>Résidence Bel Air View, Pamatai, 98704 Faa’a, Tahiti, Polinésia Francesa</dd>
            <dt>Telefone</dt><dd>{TEL}</dd>
            <dt>E-mail</dt><dd>{MAIL}</dd>
            <dt>Endereço do site</dt><dd><a href="https://softcommunication.com">https://softcommunication.com</a></dd>
          </dl>"""),
 sec('Responsável pela publicação', '          <p>Calebe.</p>'),
 sec('Hospedagem', f"""
          <p>O site é hospedado pela Hostinger.</p>
          <p>Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Chipre · <a href="https://www.hostinger.com" target="_blank" rel="noopener">hostinger.com</a></p>"""),
 sec('Atividade', f"""
          <p>A {BRAND} é uma agência de comunicação e produtora audiovisual: criação de filmes de marca cinematográficos, conteúdos curtos e Reels em formato 9:16, e visuais arquitetônicos assistidos por inteligência artificial para o mercado imobiliário e hospitalidade de luxo.</p>
          <p>Este site apresenta os nossos serviços e portfólio. Não há venda online direta. Ele permite conhecer a nossa qualidade, entrar em contato e solicitar uma proposta comercial sob medida.</p>"""),
 sec('Propriedade intelectual', f"""
          <p>Os textos, vídeos, fotografias, logotipos e elementos visuais deste site pertencem com exclusividade à {BRAND} ou contam com autorização expressa de exibição.</p>
          <p>Qualquer reprodução, modificação ou redistribuição, mesmo que parcial, depende da nossa autorização prévia por escrito.</p>
          <p>Créditos dos conteúdos: Direção cinematográfica, captação, modelagem por inteligência artificial e pós-produção por Soft Communication / Calebe. Todos os direitos reservados.</p>"""),
 sec('Responsabilidade', """
          <p>Cuidamos para que as informações publicadas estejam sempre precisas e atualizadas. Elas possuem caráter indicativo e não constituem compromisso contratual automático.</p>
          <p>O site pode conter links para plataformas e serviços externos. Não nos responsabilizamos pelo conteúdo ou pelas políticas dessas páginas de terceiros.</p>"""),
 sec('Dados pessoais e cookies', """
          <p>Para detalhes sobre a proteção de dados e privacidade, veja a nossa <a href="politica-de-privacidade.html">política de privacidade</a> e a nossa <a href="politica-de-cookies.html">política de cookies</a>.</p>"""),
 sec('Lei aplicável', """
          <p>Este site está sujeito à legislação aplicável na Polinésia Francesa e às normas regulamentares francesas em vigor.</p>"""),
 sec('Contato', f"""
          <p>Para qualquer dúvida ou contato profissional: {MAIL} ou {TEL}.</p>"""),
])

PT['politica-de-privacidade'] = ('Quais dados recebemos, para quê, e como exercer os seus direitos.', [
 sec('Quem é responsável pelos seus dados', f"""
          <p>{BRAND}, Résidence Bel Air View, Pamatai, 98704 Faa’a, Tahiti, Polinésia Francesa.</p>
          <p>Encarregado pelo tratamento: Calebe · Contato: {MAIL} · {TEL}.</p>"""),
 sec('Os dados que recebemos', f"""
          <ul>
            <li><strong>Formulário de contato:</strong> nome, e-mail, marca ou empresa, setor de atuação, número de WhatsApp, descrição do seu projeto e prazo desejado.</li>
            <li><strong>Comunicações diretas:</strong> dados e detalhes compartilhados voluntariamente ao escrever ou ligar por WhatsApp, e-mail ou telefone.</li>
            <li><strong>Agendamento de chamada:</strong> nome, e-mail e horário selecionado através do nosso sistema integrado Cal.com ou por mensagem direta.</li>
            <li><strong>Métricas de navegação:</strong> dados técnicos anonimizados de audiência, coletados estritamente mediante o seu consentimento. Veja a nossa <a href="politica-de-cookies.html">política de cookies</a>.</li>
          </ul>
          <p>Não solicitamos dados sensíveis nem dados bancários ou de pagamento neste site institucional.</p>"""),
 sec('Para que usamos', """
          <ul>
            <li>Responder com precisão ao seu pedido e estruturar orçamentos personalizados.</li>
            <li>Agendar chamadas de alinhamento e reuniões de diagnóstico.</li>
            <li>Acompanhar o relacionamento comercial e artístico.</li>
            <li>Analisar a audiência geral do site para aprimorar a experiência do visitante, quando autorizado por você.</li>
          </ul>
          <p>O tratamento desses dados se apoia em providências solicitadas por você antes de uma contratação, no seu consentimento explícito, ou em nosso legítimo interesse de responder aos contatos recebidos.</p>"""),
 sec('Quem tem acesso', f"""
          <p>Os seus dados são utilizados estritamente pela {BRAND}. Não comercializamos, alugamos nem cedemos dados a terceiros em hipótese alguma.</p>
          <p>Eles podem ser tratados sob sigilo pelos nossos prestadores técnicos essenciais:</p>
          <ul>
            <li>Hospedagem da infraestrutura: Hostinger.</li>
            <li>Comunicação e e-mail: WhatsApp Business e Google Workspace.</li>
            <li>Agendamento online: Cal.com (sistema seguro de calendário).</li>
            <li>Medição de audiência e redes: ferramentas de métricas com foco em privacidade e pixels de campanha Meta, ativados apenas sob permissão expressa.</li>
          </ul>
          <p>Esses provedores atendem a cláusulas contratuais padrão e normas de segurança internacional compatíveis com o RGPD e a legislação de dados.</p>"""),
 sec('Por quanto tempo guardamos', """
          <ul>
            <li><strong>Pedidos de orçamento e contatos:</strong> até 3 anos a contar do último contato comercial.</li>
            <li><strong>Documentos contratuais de clientes:</strong> 5 anos a contar da entrega do projeto, em cumprimento a deveres legais e contábeis.</li>
            <li><strong>Cookies e métricas de navegação:</strong> de 6 a 13 meses a contar da coleta.</li>
          </ul>"""),
 sec('Os seus direitos', f"""
          <p>Em conformidade com a legislação aplicável na Polinésia Francesa e a lei de proteção de dados, você tem o direito de solicitar acesso, correção, exclusão, oposição ou limitação do tratamento das suas informações.</p>
          <p>Para exercer qualquer um desses direitos, basta enviar uma mensagem para: {MAIL}. Responderemos no menor prazo possível.</p>
          <p>Se julgar que os seus direitos não foram devidamente atendidos, você pode recorrer à autoridade competente de proteção de dados (CNIL, cnil.fr).</p>"""),
 sec('Segurança', """
          <p>Adotamos medidas técnicas e administrativas rigorosas para manter as suas informações em segurança e protegidas contra acessos indevidos.</p>"""),
 sec('Alterações desta política', """
          <p>Esta política pode ser periodicamente revisada para acompanhar melhorias nos serviços. A data da versão mais recente consta no topo da página.</p>"""),
])

PT['politica-de-cookies'] = ('O que o site grava no seu aparelho, e como a escolha continua sendo sua.', [
 sec('O que é um cookie', """
          <p>Um cookie é um pequeno arquivo de texto salvo no seu navegador ou dispositivo quando você acessa uma página na internet. Ele permite memorizar preferências e garantir uma navegação fluida.</p>"""),
 sec('A sua escolha', """
          <p>Na sua primeira visita, um aviso claro permite aceitar ou recusar cookies não essenciais. Ambas as escolhas têm o mesmo peso e facilidade de acesso.</p>
          <p>Enquanto você não fizer uma escolha, nenhum cookie de audiência ou de publicidade é ativado. Recusar os cookies não prejudica a sua navegação no site.</p>"""),
 sec('Os cookies usados', """
          <ul>
            <li><strong>Necessários (técnicos):</strong> fundamentais para o funcionamento do site e para registrar a sua decisão de privacidade. Não dependem de autorização prévia.</li>
            <li><strong>Medição de audiência:</strong> recursos respeitosos com a privacidade que avaliam estatísticas agregadas de visitas e navegação.</li>
            <li><strong>Publicidade e redes sociais:</strong> pixels de campanha (Meta / Instagram), acionados exclusivamente se você aceitar, para mensurar a eficiência dos nossos anúncios.</li>
            <li><strong>Agendamento:</strong> cookies técnicos do módulo Cal.com para reter o horário escolhido para a sua conversa.</li>
          </ul>
          <p>A lista completa de identificadores e funções técnicas pode ser solicitada à nossa equipe a qualquer momento.</p>"""),
 sec('Duração', """
          <p>A sua escolha fica gravada no seu dispositivo por até 6 meses. Após esse período, o aviso de consentimento será apresentado novamente.</p>"""),
 sec('Mudar de ideia', f"""
          <p>Você pode alterar as suas preferências a qualquer momento: <button class="link-plain" type="button" onclick="localStorage.removeItem('soft_consent');var c=document.getElementById('consent');if(c){{c.hidden=false;c.scrollIntoView({{behavior:'smooth'}});}}">Gerenciar preferências de cookies</button>.</p>
          <p>Você também pode apagar ou bloquear cookies diretamente nas configurações do seu navegador web.</p>"""),
 sec('Saiba mais', f"""
          <p>Para mais informações sobre o tratamento de informações pessoais, consulte a nossa <a href="politica-de-privacidade.html">política de privacidade</a>. Em caso de dúvidas: {MAIL}.</p>"""),
])

PT['termos-de-uso'] = ('As regras simples que valem quando você usa este site.', [
 sec('Objeto', f"""
          <p>Estes termos estabelecem as regras de uso do site da {BRAND}. Ao navegar pelo site, você concorda integralmente com as condições aqui descritas.</p>"""),
 sec('O que o site oferece', """
          <p>O objetivo deste site é apresentar a Soft Communication, a sua visão cinematográfica, as famílias de serviços oferecidas e um portfólio selecionado de produções audiovisuais.</p>
          <p>Não realizamos vendas diretas online. Qualquer contratação de serviço é precedida por orçamento personalizado e formalização de contrato entre as partes. Os dados exibidos no site não constituem proposta vinculante imediata.</p>"""),
 sec('Conteúdos do site e transparência com IA', """
          <p>Todos os conteúdos (filmes, fotografias, textos, marcas e layout) são protegidos pela legislação de propriedade intelectual. É proibida qualquer reprodução ou uso comercial sem consentimento prévio por escrito.</p>
          <p>Os projetos imobiliários que utilizam inteligência artificial trazem obrigatoriamente a etiqueta <strong>« Projeção IA »</strong>. Trata-se de composições artísticas e conceituais, não contratuais: as projeções geradas por IA não descrevem o estado físico atual da propriedade.</p>"""),
 sec('As suas mensagens', """
          <p>Ao utilizar o formulário de contato, WhatsApp ou e-mail, você concorda em enviar apenas informações verdadeiras e não enviar materiais ilícitos, ofensivos ou que violem direitos de terceiros.</p>"""),
 sec('Disponibilidade e responsabilidade', """
          <p>Empenhamo-nos em manter o site acessível ininterruptamente e em perfeito funcionamento. No entanto, o acesso pode sofrer pausas técnicas momentâneas para manutenção, atualizações ou imprevistos fora do nosso controle.</p>
          <p>A {BRAND} não responde por eventuais indisponibilidades pontuais ou danos decorrentes da navegação na rede.</p>"""),
 sec('Dados pessoais', """
          <p>O tratamento de dados transmitidos pelo site segue a nossa <a href="politica-de-privacidade.html">política de privacidade</a> e a nossa <a href="politica-de-cookies.html">politica de cookies</a>.</p>"""),
 sec('Alterações e lei aplicável', """
          <p>Estes termos de uso podem ser atualizados periodicamente. A versão aplicável é a que estiver online no momento do seu acesso.</p>
          <p>Eles são regidos pelas leis vigentes na Polinésia Francesa. Quaisquer divergências serão submetidas aos tribunais competentes de Papeete.</p>"""),
 sec('Contato', f"""
          <p>Para dúvidas sobre os termos de uso: {MAIL} · {TEL}.</p>"""),
])

CONTENT = {'fr': FR, 'en': EN, 'pt': PT}
