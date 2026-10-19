# Étape 1 | Maquette privée — rapport de livraison

Statut : maquette livrée, à valider avant l'étape 2 (Base : CMS, modèle de données, pages dynamiques).
Date : 11 octobre 2026. Rien n'est publié sur un domaine, aucun domaine n'a été acheté, aucun service payant n'a été activé.

## Comment ouvrir la maquette

- Sommaire : `maquette/index.html` (double-clic ; tout fonctionne en local, sans serveur).
- Site public FR : `maquette/fr/index.html` · EN : `maquette/en/index.html`. Le sélecteur FR / EN de l'en-tête mène à la même page dans l'autre langue.
- Admin : `maquette/admin/index.html` (tableau de bord), `projet.html` (fiche projet), `demandes.html` (demandes).
- Lien privé (artefact) : voir le message de livraison. Il sert à montrer la maquette sur téléphone sans copier de fichiers.

Tous les contenus sont factices et marqués comme tels : projets « Exemple 0X », client « [Client fictif] », étiquettes « … à fournir » et « … à valider ». Les formulaires n'envoient rien et le disent. Le bandeau « Maquette privée » apparaît sur chaque page.

## Ce qui a été fait

**Fondation (fichiers partagés)**

- `maquette/assets/css/tokens.css` : les jetons du design system officiel en variables CSS (4 couleurs, échelle typographique web avec `display-hero` 112/108, espaces base 4 px, rayons 2 / 8 / 16 px) et quatre thèmes de section (crème, chocolat, presque noir, sable) qui règlent seuls les couleurs des boutons, étiquettes, filets et anneaux de focus.
- `maquette/assets/css/site.css` : en-tête fixe (chocolat sur le hero, crème après défilement, logo qui change de couleur), menu mobile, hero vidéo, bandes défilantes (pause au survol et au focus, immobiles si « réduire les animations »), cartes projet et cartes « Projection IA », bento, services numérotés, fiche projet, filtres, visionneuse plein écran (`dialog`, Échap, focus piégé), formulaires (étapes numérotées, pastilles, champs soulignés), cartes d'appui, pied de page avec wordmark SVG, panneau de confidentialité, retour en haut, apparition des sections (fondu + 16 px, 400 ms, une fois).
- `maquette/assets/css/admin.css` et `admin.js` : coque admin (barre latérale sur ordinateur, barre basse sur téléphone), tuiles, alertes, barres, tableaux, onglets FR / EN, formulaires, listes ordonnables, tableau en colonnes, panneau latéral (`dialog`), messages « action non connectée ».
- `maquette/assets/js/site.js` : nom de marque en variable unique (`data-brand`), bascule de l'en-tête, menu mobile, apparition, pause vidéo, visionneuse, consentement (aucun suivi avant le choix), retour en haut, formulaires de maquette (message honnête, jamais de faux succès), filtres du portfolio.
- `maquette/assets/brand/` : les SVG officiels du design system (horizontal, principal, wordmark, tiki, selo, symbole secondaire) et les trois textures PNG. Rien n'a été redessiné.

**Pages publiques (FR et EN, 10 + 10)**

- Accueil : écran d'ouverture (signature principale), hero vidéo plein écran (emplacement de la boucle muette, image d'attente, bouton pause), étiquette « Polynésie française · FR / EN », H1 en `display-hero`, deux actions, sélection de 4 projets, deux cartes bento, trois bandes défilantes en sens alternés, services 01 / Cinéma · 02 / Présence · 03 / Projection + transversal, approche en trois temps + bloc « soft » en citation, le créateur (photo et biographie à fournir), contact final, pied de page avec wordmark.
- Portfolio / Work : fil d'Ariane, « Dernier projet » avec visionneuse, compteur « 06 / 06 », filtres par service et par secteur, six cartes numérotées, état vide, collections, appel final.
- Page projet (6 exemples) : fil d'Ariane, étiquettes, lecteur, fiche (client, secteur, rôle exact, livrables, formats, date, crédits, droits, visuels IA), « Le brief et l'approche », galerie, trois projets similaires, appel « Un projet similaire ? ». L'exemple 03 montre le traitement « Projection IA » : étiquette et mention « Visuel non contractuel. Aménagements générés par IA. » sur chaque média, réel et projection côte à côte. L'exemple 04 est un « Concept personnel ».
- Contact : accroche et image légendée, formulaire en trois étapes (01 besoin en pastilles, 02 vous, 03 projet), consentement obligatoire, champ piège, bouton d'envoi, message de maquette, réservation (emplacement Cal.com), cartes WhatsApp, e-mail et devis.
- Pages de l'étape 2 (Services, À propos, Insights, Mentions légales, Confidentialité) : une page d'attente honnête, pour qu'aucun lien ne soit vide.

**Écrans admin (3, en français, pensés pour le téléphone)**

- Tableau de bord : demandes sur 7 et 30 jours, délai moyen de première réponse, rendez-vous à venir, projets les plus vus, sources des visites, quatre alertes (demande sans réponse > 24 h, traduction EN manquante, brouillon > 14 jours, lien de réservation non configuré), dernières demandes, automatisations prévues.
- Fiche projet : champs FR / EN côte à côte (onglets sur mobile) avec traduction EN incomplète signalée, classement, médias, trois cases obligatoires (droits, client / concept, visuels IA), statut, complétude, garde-fous de publication bloquants (bouton Publier désactivé), ordre de la sélection d'accueil (glisser ou flèches), historique des versions, aperçus FR / EN vers les vraies pages de la maquette.
- Demandes : colonnes Nouvelle → Qualifiée → Appel prévu → Devis envoyé → Gagnée / Perdue, huit demandes factices, fiche en panneau latéral (besoins, message, résumé et score indicatif, langue, source et UTM, consentement, historique, réponses types FR / EN, notes, rappel, actions e-mail / WhatsApp / devis / déplacer), export CSV (réservé au Propriétaire), règles P1 / P2.

**Contrôles effectués**

- Rendu vérifié par captures à 1440 px et 390 px (émulation mobile réelle) sur chaque page, y compris en mode « réduire les animations » pour l'accueil.
- Contrôle statique : liens et ancres, `src`, `alt`, identifiants uniques, un seul `h1` par page, couleurs limitées à la palette, aucune ombre / opacité / dégradé, aucun marqueur brut dans le contenu.
- Relectures indépendantes (design system, accessibilité, règles de vérité et liens, parité FR / EN, couverture du prompt, rendu visuel), contre-vérification de chaque constat, puis correction. Détail en fin de rapport.

## Ce qui reste à faire (étapes suivantes du prompt)

1. Validation de cette maquette par le client (décisions ci-dessous).
2. Base : Next.js + Payload CMS + PostgreSQL, deux langues avec `hreflang` réels, jetons du design system, pages dynamiques, pages Services, À propos, Insights, Mentions légales, Confidentialité.
3. Conversion : formulaire connecté (validation serveur, limite de débit, Turnstile), réservation Cal.com, e-mails P1 (Resend), tests de bout en bout.
4. Admin complet (rôles, journal, médiathèque, traductions, réglages, devis, rendez-vous) et garde-fous de publication bloquants.
5. Automatisations P2, puis P3 sur demande.
6. Recette selon la section 12 du prompt, puis mise en ligne uniquement sur demande explicite.

## Éléments manquants (à fournir avant la mise en ligne)

- Projets réels, médias et droits de diffusion confirmés (les six exemples disparaissent).
- Vidéo du hero (boucle muette 16:9) et image d'attente ; extraits pour les bandes ; sous-titres FR / EN quand il y a de la voix.
- Photo et biographie du créateur.
- E-mail, numéro WhatsApp, réseaux sociaux.
- Compte de réservation (Cal.com ou autre).
- Nom de domaine et comptes d'hébergement.
- Informations légales de l'entreprise ; pages légales et textes de consentement à faire vérifier par un professionnel.
- Chiffres sourcés si une rangée de chiffres est souhaitée (sinon elle reste masquée) ; un premier article validé pour activer Insights.

## Décisions à valider

| Sujet | Proposition dans la maquette | Alternative |
| --- | --- | --- |
| Nom de marque | « Soft Communication », variable unique dans la maquette (`data-brand`) | Le logo officiel porte « COMMUNICATION » en dur : un changement de nom implique un nouveau fichier de logo |
| Titre du hero | Phrase complète (« Films de marque, contenus courts et immobilier IA en Polynésie française. ») en `display-hero` 112 px, superposée à la vidéo | Variante B : titre court (« Films de marque. ») et phrase en appui, ou titre sous la vidéo si les plans sont trop clairs |
| Proportions de couleur | Sections alternées chocolat / crème, vitrines vidéo presque noires (on s'éloigne du 50 % crème du manuel) | Plus de crème (services et approche sur crème, approche sur crème au lieu de sable) |
| Bloc « soft » | « Soft, parce que l'image ne force rien. Elle montre, avec calme et précision, ce qui rend une marque désirable. » | Texte du client |
| Titres de section | « Trois familles, un même regard. », « Écouter, filmer, livrer. », « Une personne, une caméra, un regard. » | Textes du client |
| Secteurs prioritaires | Hospitalité / lifestyle et immobilier en tête des filtres et de la sélection | Selon les preuves réelles |
| Formulaire | 8 besoins en pastilles, 7 secteurs, 4 échéances, budget indicatif facultatif sans fourchette | Retirer le budget ; ajuster les listes |
| Boutons « à fournir » (WhatsApp, e-mail) | Bouton désactivé barré + étiquette « à fournir » | Étiquette seule, sans bouton, tant que la donnée manque |
| Favicon | Tiki en SVG (16 px dans l'onglet, sous le minimum de 24 px du manuel) | Favicon dédié validé par la marque |
| Collections du portfolio | Un clic sur une collection remplace le filtre en cours | Combiner avec le filtre actif |
| « Lire le film » | Bouton plein, à côté du « Réserver un appel » de l'en-tête | Bouton contour pour garder un seul bouton plein par écran |
| Admin : publication | Bloquée tant que crédits, traduction EN ou référencement EN manquent | Autoriser avec marqueur visible (déconseillé) |
| Admin : rôles | Seul le Propriétaire publie et exporte ; l'Éditeur édite | Autre répartition |
| Pile technique | Next.js + Payload + PostgreSQL (Neon ou Supabase), Mux ou Cloudflare Stream, R2, Resend, Cal.com, Plausible ou Umami, Vercel | Framer + CMS (plus rapide, admin et automatisations limités) |

Chaque service payant sera listé avec son coût estimé et attendra un accord explicite avant activation.

## Choix de réalisation à connaître

- La rangée de chiffres, le bloc Insights, la section « preuves » et le lien Insights de la navigation sont volontairement absents : ils n'apparaîtront qu'avec des données réelles et sourcées.
- Le hero utilise la variante « titre superposé à la vidéo » ; la vidéo choisie devra laisser une zone calme pour le texte, sinon on passera à la variante B.
- Les boutons de l'admin qui ne sont pas encore connectés affichent un message « Maquette : … » au lieu de simuler un succès.
- La maquette charge Cormorant Garamond et Poppins depuis Google Fonts ; le site final les auto-hébergera.
- La mesure d'audience, les e-mails, la réservation et WhatsApp ne sont pas connectés : ce sont des emplacements.

## Relectures et corrections (détail)

À compléter en fin de session : nombre de constats par lentille, constats confirmés et corrigés, points restants.
