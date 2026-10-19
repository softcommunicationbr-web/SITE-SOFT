# Prompt | Réaliser le site Soft Communication et son espace admin

Statut : prompt de réalisation V1, à valider avant lancement.
À utiliser seul ou avec les fichiers 00 à 11 du dossier et le design system officiel de la marque.

---

Agis comme un développeur full-stack senior, un designer web et un concepteur-rédacteur bilingue français/anglais. Tu réalises le site vitrine de Soft Communication et son espace d'administration.

Le site reprend la structure, le rythme et l'expérience du site de référence *Backgrounds by VenustAI* (https://backgrounds.venust.ai), avec l'identité de Soft Communication. Il ne copie ni son code, ni ses textes, ni ses images, ni sa marque.

Travaille par étapes (section 11). Commence par une maquette privée. Ne publie rien, n'achète aucun domaine et n'active aucun service payant sans demande explicite.

## 1. Contexte confirmé

- Marque : Soft Communication. Le nom est provisoire `[À VALIDER]`. Il doit donc être une variable unique, modifiable depuis l'admin, jamais écrit en dur.
- Activité : films de marque, contenus courts et UGC, immobilier IA.
- Ancrage : Polynésie française.
- Public : propriétaires d'entreprise qui ont un produit ou un service. Priorité proposée : hospitalité/lifestyle et immobilier `[À VALIDER]`.
- Langues : français (par défaut) et anglais.
- Objectifs : vitrine premium, portfolio, prise de rendez-vous, demandes qualifiées.
- Pages : Accueil, Services, Portfolio, Page projet, À propos, Contact, Insights, Mentions légales, Confidentialité.
- Actions : réserver un appel (principale), voir le portfolio (secondaire), demander un devis, remplir le formulaire, écrire sur WhatsApp.

## 2. Ce qu'on reprend de la référence, page par page

| Référence VenustAI | Soft Communication |
| --- | --- |
| **Accueil.** Image plein écran, titre très court, une action principale, un lien secondaire. | Vidéo réelle en boucle, muette, avec image d'attente et bouton pause. Titre en `display-hero`. « Réserver un appel » + « Voir le portfolio ». |
| **Badge sur le hero** (« CC0 · Free to use »). | Étiquette « Polynésie française · FR / EN ». |
| **Rangée de chiffres** (600+, 50+, 600+). | Chiffres du travail (films livrés, marques accompagnées…). Uniquement avec une source saisie dans l'admin. Sinon, la rangée ne s'affiche pas. |
| **Cartes bento** « Find your background » / « Make it your own ». | Deux cartes : « Voir les projets » et « Notre approche ». |
| **Trois bandes de vignettes défilantes**, en sens alternés. | Bandes d'extraits du portfolio et de Reels, choisis dans l'admin. Pause au survol, à l'arrêt si l'utilisateur demande moins d'animations. |
| **« New every week »** et cartes « coming soon ». | Bloc Insights, affiché seulement quand un article est publié. Jamais de carte « bientôt » vide. |
| **Bloc définition** « Venust : beautiful, graceful… ». | Bloc « soft » : l'approche de la marque en citation italique. Texte `[À VALIDER]`. |
| **Services numérotés** 01 / WEB · 02 / BUILD · 03 / CONNECT. | 01 / CINÉMA · 02 / PRÉSENCE · 03 / PROJECTION. Montage et stratégie de contenu en transversal. |
| **Mot géant en pied de page** (« Backgrounds. »). | Wordmark SOFT officiel en pleine largeur (fichier SVG, jamais du texte tapé). |
| **Page Thèmes.** Collections avec compteur « 01 / 11 », mise en avant « Latest collection ». | Page Portfolio : collections par famille de service et par secteur, « Dernier projet » en tête, compteur « 01 / 06 ». Filtres simples par service et par secteur. |
| **Page asset.** Fil d'Ariane, visionneuse plein écran, fiche détails, étiquettes, « More from… », « Explore similar ». | Page projet : fil d'Ariane, lecteur vidéo plein écran, fiche (client, secteur, rôle exact, livrables, formats, crédits), « Le brief et l'approche » à la place du prompt, projets similaires, appel à l'action « Un projet similaire ? Réserver un appel ». |
| **Contact.** Accroche, image légendée, formulaire en 3 étapes numérotées avec choix en pastilles, mention de consentement, cartes d'appui. | Contact : 01 Votre besoin (pastilles), 02 Vous (nom, e-mail, entreprise, secteur, WhatsApp facultatif), 03 Votre projet (texte libre, échéance, budget indicatif facultatif `[À VALIDER]`). Puis réservation intégrée, WhatsApp et e-mail. |
| **« For Restaurants »**, page dédiée à un secteur. | Phase 2 : pages par secteur (« Pour les hôtels », « Pour l'immobilier »), seulement avec des projets réels du secteur. |
| **Panneau de confidentialité.** Choix clairs, « Refuser » aussi visible qu'« Accepter ». | Même principe. Aucun suivi avant le choix. Mesure d'audience sans cookie par défaut. |
| **Lien d'évitement, retour en haut, menu mobile compact.** | Identique. |

**Ce qu'on ne reprend pas :** le Hero Builder, les téléchargements et la licence CC0, la connexion publique, le sélecteur d'apparence et les images générées par IA en décoration.

Les créations « immobilier IA » sont toujours étiquetées « Projection IA ». Elles portent la mention « Visuel non contractuel. Aménagements générés par IA. »

## 3. Identité visuelle (design system officiel, prioritaire)

Couleurs : uniquement ces quatre, sans teintes intermédiaires, transparences ni dégradés.

| Jeton | HEX | Usage web |
| --- | --- | --- |
| `chocolate` | `#3B2A20` | Fond du hero, du portfolio, du contact final et du pied de page. Texte et bouton principal sur crème. |
| `creme` | `#F3EDE3` | Sections de lecture (services, à propos, formulaire). Texte sur fonds sombres. |
| `areia` | `#D8C8B0` | Surtitres et détails sur chocolate, étiquettes, cartes d'appui. |
| `quase-preto` | `#1A1A1A` | Cadres vidéo, séquences nocturnes, règle de 4 px sur crème. |

- Paires interdites : sable sur crème (1,4:1) et chocolat sur presque noir (1,3:1).
- Aucun gris : la hiérarchie vient de la taille, de la graisse et de la famille de police.
- Le site alterne les sections chocolat et crème. Les proportions s'éloignent du manuel (crème 50 %) : `[À VALIDER]`.

Typographie :

- Titres : Cormorant Garamond (Google Fonts).
- Textes, boutons et libellés : Poppins.
- Échelle :
  - `display-hero` 112/108 (nouveau, uniquement pour le hero) `[À VALIDER]`
  - `display-xl` 72/76
  - `display` 48/54
  - `heading` 32/40
  - `quote` 28/38 italique
  - `title` 20/28
  - `body` 16/26
  - `small` 14/22
- Surtitre : 12/16, capitales, espacement 0,32em. Bouton : 13/16, capitales, 0,16em.
- Mobile : `display-hero` passe à 56/56 et `display-xl` à 44/48.

Forme et espace :

- Rayons : 2 px pour les boutons et champs, 8 px pour les cartes, 16 px pour les médias, pastille uniquement pour les étiquettes.
- Base de 4 px. 96 px entre sections. Marges de 64 px sur ordinateur, 24 px sur mobile.
- Aucune ombre : la séparation vient du changement de couleur de section ou de la règle de 4 px.
- Ce design system prévaut sur le fichier 11, qui proposait 6 px de rayon et un espacement nul.

Logo : utiliser uniquement les SVG officiels du design system, sans les redessiner.

- Horizontale crème dans l'en-tête sur chocolat, horizontale chocolat dans l'en-tête après défilement sur crème.
- Signature principale pour l'écran d'ouverture.
- Wordmark en pied de page.
- Tiki seul pour le favicon et les avatars, 24 px minimum.
- Sceau en filigrane des vidéos.

## 4. Pages et routes

Routes dans les deux langues, avec `hreflang` et un sélecteur FR/EN qui ramène à la même page dans l'autre langue :

- `/fr` · `/en`
- `/fr/services` · `/en/services`
- `/fr/portfolio` · `/en/work`
- `/fr/portfolio/[slug]` · `/en/work/[slug]`
- `/fr/a-propos` · `/en/about`
- `/fr/contact` · `/en/contact`
- `/fr/insights` · `/en/insights` (masquée tant qu'aucun article n'est publié)
- `/fr/mentions-legales` · `/en/legal`
- `/fr/confidentialite` · `/en/privacy`

Accueil, dans cet ordre :

1. Hero (chocolat)
2. Sélection de projets et bandes défilantes (presque noir)
3. Services 01 / 02 / 03 (crème)
4. Approche et bloc « soft » (sable)
5. Le créateur : photo et biographie réelles `[À FOURNIR]` (crème)
6. Preuves, seulement si elles existent (crème)
7. Contact final « Réserver un appel » (chocolat)
8. Pied de page avec wordmark (chocolat)

Textes de départ :

- FR : « Films de marque, contenus courts et immobilier IA en Polynésie française. »
- EN : « Brand films, short-form content and AI-assisted property visuals in French Polynesia. »

Le H1 décrit l'offre. Le nom de la marque reste dans le logo et le titre de la page.

## 5. Mouvement et interactions

- Apparition des sections : fondu et montée de 16 px en 400 ms, une seule fois.
- Bandes défilantes lentes, pause au survol et au focus clavier.
- Visionneuse vidéo plein écran, fermeture par Échap, focus piégé dans la visionneuse.
- Respect de `prefers-reduced-motion` : tout s'arrête et le hero affiche son image fixe.
- Vidéos : WebM/MP4 légers, `preload="none"` hors écran, sous-titres FR/EN quand il y a de la voix.

## 6. Pile technique recommandée `[À VALIDER]`

Utilise les dernières versions stables au moment de la réalisation.

- **Next.js** (App Router) + TypeScript + Tailwind. Les jetons sont des variables CSS générées depuis le design system.
- **Payload CMS** intégré à Next.js : l'admin de la section 7 est construit sur Payload, avec des vues personnalisées.
- **PostgreSQL** hébergé (Neon ou Supabase).
- **Médias** : vidéos sur Mux ou Cloudflare Stream (encodage, vignettes, lecture adaptative), images sur un stockage compatible S3 (Cloudflare R2).
- **E-mails** transactionnels : Resend.
- **Réservation** : Cal.com, en intégration et par webhook.
- **Mesure d'audience** sans cookie : Plausible ou Umami.
- **Traductions** : `next-intl`. Hébergement : Vercel.
- **Alternative sans code** : Framer + CMS. Plus rapide à lancer, mais l'admin, les demandes et les automatisations seraient limités.

Chaque service payant est listé avec son coût estimé et attend l'accord explicite avant activation.

## 7. Espace admin (`/admin`)

Interface en français, utilisable sur téléphone (le propriétaire gère souvent depuis son mobile), installable comme application (PWA) avec notifications.

**Accès**

- Connexion par lien magique ou mot de passe + double authentification.
- Rôles : Propriétaire (tout), Éditeur (contenus, sans réglages ni export des demandes), Lecture.
- Journal de toutes les modifications (qui, quoi, quand).

**Tableau de bord**

- Demandes reçues sur 7 et 30 jours.
- Délai moyen de première réponse.
- Rendez-vous à venir.
- Projets les plus vus.
- Sources des visites (UTM, Instagram, recherche).
- Alertes : demande sans réponse depuis plus de 24 h, traduction EN manquante, projet en brouillon depuis plus de 14 jours, lien de réservation cassé.

**Projets (portfolio)**

- Champs FR/EN : titre, client, secteur, services, rôle exact, livrables, formats, brief et approche, crédits, date, résultats avec source.
- Médias : vidéo principale, image d'attente, galerie, extrait pour la bande défilante.
- Cases obligatoires : « Droits de diffusion confirmés », « Projet client » ou « Concept personnel », « Contient des visuels IA ». La dernière ajoute l'étiquette « Projection IA » et la mention légale.
- Statuts : brouillon, en relecture, programmé, publié, archivé.
- Ordre de la sélection d'accueil et des bandes défilantes par glisser-déposer.
- Indicateur de complétude par projet : média, droits, traduction EN, texte alternatif, référencement.

**Accueil et pages**

- Vidéo du hero, titres et boutons FR/EN.
- Rangée de chiffres : chaque chiffre exige une source, sinon il reste masqué.
- Bloc « soft », biographie du créateur.
- Aperçu FR et EN avant publication. Historique des versions avec retour en arrière.

**Services**

- Les trois familles et les deux prestations transversales : textes, périmètre, livrables proposés, projets associés.
- Prix « à partir de » facultatif et masqué par défaut. Jamais de prix sans saisie du propriétaire.

**Insights**

- Articles FR/EN, auteur réel, programmation, champs de référencement, image de partage.
- La rubrique se publie automatiquement au premier article publié.

**Demandes (CRM léger)**

- Tableau en colonnes : Nouvelle → Qualifiée → Appel prévu → Devis envoyé → Gagnée / Perdue.
- Fiche par demande : besoins cochés, message, langue, source, historique des échanges, notes internes, rappel.
- Réponses types FR/EN, bouton « Ouvrir WhatsApp » avec message prérempli, export CSV.

**Devis**

- Brouillon de devis depuis une demande : prestations du catalogue et quantités. Les prix sont saisis par le propriétaire.
- Export PDF à l'identité de la marque. Envoi uniquement après validation.

**Rendez-vous**

- Liste synchronisée avec Cal.com : statut, lien visio, questionnaire avant appel, notes après appel liées à la demande.

**Médiathèque**

- Envoi des vidéos et images, compression automatique, choix de l'image d'attente, texte alternatif FR/EN, sous-titres.
- Indication des médias utilisés et non utilisés.

**Traductions**

- Vue côte à côte FR/EN de tous les contenus, avec les champs manquants signalés.
- Brouillon de traduction par IA marqué « à relire », jamais publié sans validation.

**Réglages**

- Nom de marque, coordonnées, numéro WhatsApp, lien de réservation, réseaux sociaux.
- Informations légales, textes de consentement, activation de la mesure d'audience, adresses de notification.

**Garde-fous de publication** (bloquants) :

- Aucun marqueur `[À FOURNIR]` ou `[À VALIDER]` sur une page publique.
- Pas de projet publié sans droits confirmés, sans statut client/concept ou sans traduction EN complète.
- Pas d'étiquette IA manquante sur un projet qui contient des visuels IA.
- Pas de lien vide, pas de chiffre sans source.

## 8. Automatisations

Règle : tout message qui part vers un client est validé par le propriétaire, sauf les accusés de réception et les confirmations de rendez-vous.

| Priorité | Déclencheur | Action |
| --- | --- | --- |
| P1 | Nouvelle demande | Enregistrement en base. Notification au propriétaire (e-mail + notification mobile). Accusé de réception FR ou EN au prospect avec le lien de réservation. |
| P1 | Rendez-vous réservé | Événement d'agenda, rappel 24 h avant, questionnaire avant appel. La demande passe en « Appel prévu ». |
| P1 | Formulaire ou réservation en échec | Alerte au propriétaire. Message d'erreur honnête à l'utilisateur, jamais de faux succès. |
| P2 | Demande sans réponse depuis 24 h | Rappel au propriétaire avec un brouillon de réponse. |
| P2 | Pas de retour 3 et 7 jours après un devis | Brouillon de relance à valider. |
| P2 | Nouvelle demande | Résumé et score indicatif (secteur prioritaire, échéance, besoin clair). Aide au tri, pas une décision. |
| P2 | Vidéo envoyée dans la médiathèque | Encodage, vignettes, extrait court pour la bande défilante, sous-titres proposés. |
| P2 | Projet publié | Plan du site et image de partage mis à jour. Brouillon de légende Instagram FR/EN à valider. |
| P2 | Chaque lundi | Rapport par e-mail : visites, demandes, rendez-vous, projets les plus vus. |
| P3 | Fin de projet | Demande d'avis client. L'avis est publié seulement avec l'accord écrit du client. |
| P3 | Espace client | Portail de validation des livrables : versions V1/V2, commentaires horodatés sur la vidéo, approbation finale. |
| P3 | WhatsApp Business API | Réponses et notifications par WhatsApp. Service payant, sur demande. |

Les connexions à l'agenda, à la messagerie ou à un CRM existant se font uniquement avec les comptes que le propriétaire fournit.

## 9. Modèle de données (base)

- `Project` : slug, titres FR/EN, client, secteur, services[], rôle, livrables, formats, brief FR/EN, crédits, résultats[] (valeur + source), médias, `rightsConfirmed`, `type` (client|concept), `containsAI`, statut, ordre, référencement FR/EN.
- `Service`, `Sector`, `Post`, `Media`.
- `Lead` : besoins[], nom, e-mail, entreprise, secteur, WhatsApp, message, échéance, budget, langue, source/UTM, statut, notes, score, consentement (date et texte).
- `Booking`, `Quote`, `Testimonial` (avec preuve d'accord).
- Globaux `Home`, `Settings`, `Legal`.
- `User`, `AuditLog`.

## 10. Sécurité, conformité, qualité

- Secrets uniquement en variables d'environnement, jamais dans le code ni le navigateur.
- Formulaires : validation côté serveur, limite de débit, champ piège et anti-robot sans traçage (Cloudflare Turnstile).
- Sauvegarde quotidienne de la base et export possible.
- Consentement journalisé. Mesure d'audience sans cookie par défaut.
- Les pages légales et la conformité des données sont à faire vérifier par un professionnel. Ne pas présenter une conformité comme acquise.
- Accessibilité WCAG 2.2 AA :
  - navigation clavier complète, focus visible (2 px, 3 px d'écart) ;
  - contrastes conformes à la section 3 ;
  - textes alternatifs, sous-titres, langue de page correcte.
- Performance : LCP < 2,5 s sur mobile 4G, Lighthouse ≥ 90 sur les quatre axes, images AVIF/WebP, polices auto-hébergées ou préchargées.

## 11. Étapes de livraison

1. **Maquette privée** : Accueil, Portfolio, Page projet, Contact et trois écrans admin (tableau de bord, projet, demandes). Contenus factices clairement marqués. Validation avant la suite.
2. **Base** : CMS, modèle de données, deux langues, jetons du design system, pages dynamiques.
3. **Conversion** : formulaire, réservation, e-mails P1, tests de bout en bout.
4. **Admin complet et garde-fous de publication.**
5. **Automatisations P2**, puis P3 sur demande.
6. **Recette** (section 12), puis mise en ligne uniquement sur demande explicite.

## 12. Critères de recette

- Chaque page existe en FR et EN, avec `hreflang`, sans texte de l'autre langue.
- Aucun marqueur interne, chiffre sans source, client, avis ou résultat inventé en ligne.
- Le formulaire envoie, enregistre, notifie et confirme. En cas d'échec, l'erreur est affichée.
- La réservation crée bien l'événement. Le lien WhatsApp ouvre le bon numéro.
- Tout projet IA porte son étiquette. Tout projet publié a ses droits confirmés.
- Navigation complète au clavier. Animations coupées avec `prefers-reduced-motion`.
- Logo, couleurs et polices conformes au design system officiel.
- L'admin bloque toute publication qui enfreint la section 7.

## 13. Éléments à fournir avant la mise en ligne

- Projets et médias avec droits de diffusion `[À FOURNIR]`.
- Photo et biographie du créateur `[À FOURNIR]`.
- E-mail, numéro WhatsApp, réseaux sociaux `[À FOURNIR]`.
- Compte de réservation (Cal.com ou autre) `[À FOURNIR]`.
- Nom de domaine et comptes d'hébergement `[À FOURNIR]`.
- Informations légales de l'entreprise `[À FOURNIR]`.
- Validation du nom de marque, du texte du bloc « soft » et de `display-hero` `[À VALIDER]`.

## 14. Règles de vérité

- Ne jamais inventer clients, témoignages, résultats, partenaires, prix, disponibilités, coordonnées ou liens.
- Une marque contactée n'est pas une référence client.
- Un concept personnel est présenté comme tel.
- Les résultats sont des objectifs, jamais une garantie.
- Les visuels immobiliers IA ne doivent jamais faire passer une projection pour la réalité du bien.
- Les marqueurs `[À FOURNIR]` et `[À VALIDER]` restent internes.

Livre à chaque étape : ce qui a été fait, ce qui reste à faire, les éléments manquants, et les décisions à valider.
