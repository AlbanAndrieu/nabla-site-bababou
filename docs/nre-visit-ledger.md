# NRE — source, extension du calendrier et compteur de présence

## État documentaire au 31 octobre 2026

La page Next.js `/nre` et ses variantes `/en/nre`, `/de/nre` et `/no/nre` utilisent les contenus natifs FR/EN/DE/NO et conservent la table historique publiée dans `public/nre-en.html` / `public/nre-fr.html`.

- **Historique** : 108 premiers week-ends mensuels, de mars 2017 à février 2026 (102 marqués « NRE » dans la table originelle et six exceptions). Il s'agit d'un inventaire publié par le propriétaire, **pas de 102 condamnations pénales ou constatations judiciaires**.
- **Anomalie chronologique** : le week-end des 4–5 mars 2017 est antérieur à la décision du 31 mars 2017 invoquée comme base ; il est désormais affiché séparément « à vérifier » et exclu du calcul horaire.
- **Extension** : génération déterministe des premiers week-ends complets jusqu'à la date actuelle de Paris (un dimanche n'est terminé qu'à partir du lundi 00 h 00, heure de Paris, y compris lors des changements d'heure). Au 31/10/2026 : huit nouveaux week-ends (mars–octobre 2026), classés **« à vérifier »**, jamais « NRE » par défaut. La date est réévaluée chaque minute côté navigateur pour éviter un calendrier figé lors d'un long intervalle sans déploiement.
- **Contexte judiciaire déclaré** : suspension des visites en Allemagne signalée du 26/02/2026 au 25/02/2027, **texte intégral/dispositif non vérifié** ici. Ne pas présenter les mois suivants comme des refus illicites ni comme des visites judiciairement exigibles sans examen du titre applicable.
- **Résultat à date** : 116 dates visibles, **101 NRE déclarées après le 31/03/2017**, six exceptions historiques, **une date antérieure** et **huit dates récentes à vérifier**.

## Plaintes déclarées depuis 2017

La page indique désormais en première personne que des plaintes ont été déposées en **France, en Norvège et en Allemagne depuis le jugement du 31 mars 2017**. Le document français déjà présent reste lié ; il n'est pas présenté comme preuve d'une condamnation ou d'un résultat définitif.

## Reconstitution indicative des périodes passées ensemble

Ce calcul est fondé sur les dernières durées déclarées par le propriétaire, et non sur les **10 h mensuelles de visites prévues**, qui n'ont pas été effectivement respectées selon son récit.

| Période | Hypothèse de calcul | Contribution au sous-total |
| --- | --- | --- |
| Vacances en France | Deux séjours d'une semaine + un séjour de quatre semaines = 42 jours ; convention de **24 h calendaires de présence par jour de séjour** | **1 008 h** |
| Allemagne | Retrouvailles d'environ **1 h**, puis **un week-end ultérieur de 24 h** | **25 h** |
| Norvège | Rencontres parfois très brèves, **environ 1 h par week-end effectivement rencontré** ; aucune date de ces rencontres ne peut être isolée avec certitude des périodes de vacances dans les archives | **non inclus**, nombre de rencontres inconnu |
| **Sous-total partiel** | 1 008 h + 25 h, sans supposer d'autres rencontres | **1 033 h** |

**Ce sous-total n'est pas un nombre d'heures actives vérifiées** : 24 h par journée de vacances signifie *présence/garde sur une journée civile*, y compris nuits et temps non partagés directement. Les trois séjours français n'ont pas encore de dates vérifiées ; les anciennes exceptions mentionnent des séjours de 14 jours, de quatre semaines, de 7 jours et de 10 jours, incompatibles avec une attribution automatique des deux semaines et des quatre semaines nouvelles. Il est donc interdit de les additionner séparément ou de prétendre qu'une ligne précise correspond nécessairement à un séjour français.

Le calendrier historique contient six exceptions ; elles ne prouvent ni une heure de rencontre chacune, ni que tous les week-ends inventoriés ont donné lieu à une heure de contact. La visite de mars 2022 est mentionnée comme interrompue ; une visite honorée apparaît en novembre 2022, mais les dates des 1 h + 24 h allemandes ne sont pas confirmées en correspondance avec ces lignes.

Le champ de saisie local a été supprimé. Le compteur en temps réel déduit **1 033 h indicatives** de la durée civile depuis le 6 juin 2015 ; il affiche explicitement une **estimation partielle**, pas le temps de visite légalement perdu. Les contacts norvégiens non datés ne sont pas ajoutés ; les périodes de vacances ne sont comptées qu'une seule fois.

## Contrôles et publications

- Garder les libellés FR/EN/DE/NO alignés ; afficher les plaintes dans les trois pays sans leur attribuer un résultat judiciaire.
- Conserver l'article 227-5 du Code pénal pour le seul contexte français.
- Afficher environ **une heure** pour la rencontre ponctuelle ; distinguer les séjours longs, afin de ne pas leur attribuer fictivement une durée d'une heure.
- Aucune liste de dates de contacts ponctuels norvégiens n'est vérifiée ; le moteur possède une liste explicite vide à compléter seulement lorsque des éléments concordants existent.
- Ne pas présenter la somme de 1 033 heures comme une durée effectivement mesurée.
- Pour établir le temps de présence réel, recouper dates de début/fin, pays et éventuels chevauchements avec des preuves privées sans reproduire d'identifiants protégés dans le site public.

## Validation

- Moteur pur : `lib/nreVisitLedger.mjs` ; test `unit-tests/nreVisitLedger.test.mjs` (calendrier, dates 2026, statuts non automatiques, hypothèses France/Allemagne, absence de dates Norvège, calcul sans saisie, catalogues FR/EN/DE/NO).
- Interface : `app/[locale]/nre/NreHistory.tsx`, `NreLiveHours.tsx`, `sections.tsx`, `page.module.css` ; filtre annuel, chronologie dépliable et tableau imprimable.
- Recette navigateur : `tests/nre.spec.ts` et contrôles axe/Playwright déjà disponibles, à exécuter sur le **SHA candidat**. Ne pas confondre tests de modèle, build Next et recette navigateur.

## Points à vérifier avec les sources

- Le dispositif original des décisions des **31/03/2017 et février 2026** : champ territorial, dates d'effet, suspension et rythme exact des visites. En cas de décision ultérieure, revoir les statuts plutôt que simplement prolonger le calendrier.
- Les preuves des week-ends signalés NRE et des exceptions, spécialement celles de mars 2017 et mars 2022 (visite partielle/interrompue).
- Les heures exactes **réellement passées ensemble** et leur périmètre (rencontres physiques, durée de présence, éventuelles visites hors week-end), avant toute publication d'un **solde net factuel**.
- La revue éditoriale et les mesures de confidentialité exigées par `.agents/skills/protect-family-privacy/SKILL.md`.

**Référence normative française** : [Code pénal, art. 227-5](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006418025) ; l'étiquette « NRE » dans un calendrier personnel ne suffit pas à établir à elle seule l'infraction.
