# NRE — source, extension du calendrier et compteur de présence

## État documentaire au 31 octobre 2026

La page Next.js `/nre` et ses variantes `/en/nre`, `/de/nre` et `/no/nre` utilisent les contenus natifs FR/EN/DE/NO et conservent la table historique publiée dans `public/nre-en.html` / `public/nre-fr.html`.

- **Historique** : 108 premiers week-ends mensuels, de mars 2017 à février 2026 (102 marqués « NRE » dans la table originelle et six exceptions). Il s'agit d'un inventaire publié par le propriétaire, **pas de 102 condamnations pénales ou constatations judiciaires**.
- **Anomalie chronologique** : le week-end des 4–5 mars 2017 est antérieur à la décision du 31 mars 2017 invoquée comme base ; il est désormais affiché séparément « à vérifier » et exclu du calcul horaire.
- **Extension** : génération déterministe des premiers week-ends complets jusqu'à la date actuelle de Paris (un dimanche n'est terminé qu'à partir du lundi 00 h 00, heure de Paris, y compris lors des changements d'heure). Au 31/10/2026 : huit nouveaux week-ends (mars–octobre 2026), classés **« à vérifier »**, jamais « NRE » par défaut. La date est réévaluée chaque minute côté navigateur pour éviter un calendrier figé lors d'un long intervalle sans déploiement.
- **Contexte judiciaire déclaré** : suspension des visites en Allemagne signalée du 26/02/2026 au 25/02/2027, **texte intégral/dispositif non vérifié** ici. Ne pas présenter les mois suivants comme des refus illicites ni comme des visites judiciairement exigibles sans examen du titre applicable.
- **Résultat à date** : 116 dates visibles, **101 NRE déclarées après le 31/03/2017**, six exceptions historiques, **une date antérieure** et **huit dates récentes à vérifier**.

## Deux modèles horaires — à ne pas confondre

1. **Heures théoriques des visites signalées manquées** : `101 × 10 h = 1 010 h`, en supposant applicable le rythme annoncé de 10 h le premier week-end mensuel. C'est un **indicateur d'inventaire**, sans reconstitution des horaires samedi/dimanche, et pas un montant d'heures juridiquement établi. Les six exceptions et les mois 2026 non vérifiés ne sont pas inclus dans les 101.
2. **Durée civile écoulée** : compteur temps réel à partir du **6 juin 2015**, date utilisée dans le message historique. L'heure exacte du point de départ n'est pas connue ; le code utilise la convention `2015-06-06T00:00:00Z`, approximation à la journée. Ce temps **n'est pas une durée de droit de visite non exécuté**.
3. **Déduction des heures effectives** : aucun total d'heures réellement passées ensemble n'est établi. L'ancienne valeur globale de jours ensemble a été contestée par le propriétaire et retirée des deux pages HTML NRE historiques. Les six exceptions ne démontrent pas de durée réelle. Le compteur net affiche donc « à renseigner » tant que les heures précises ne sont pas fournies ; une saisie locale temporaire les soustrait sans les enregistrer ou les transmettre. Ne pas ajouter de données nominatives dans le dépôt.

## Validation

- Moteur pur : `lib/nreVisitLedger.mjs` ; test `unit-tests/nreVisitLedger.test.mjs` (calendrier, dates 2026, statut juridique non automatique, calcul horaire, présence réellement renseignée, catalogues FR/EN/DE/NO).
- Interface : `app/[locale]/nre/NreHistory.tsx`, `NreLiveHours.tsx`, `sections.tsx`, `page.module.css` ; filtre annuel, chronologie dépliable et tableau imprimable.
- Recette navigateur : `tests/nre.spec.ts` et contrôles axe/Playwright déjà disponibles, à exécuter sur le **SHA candidat**. Ne pas confondre tests de modèle, build Next et recette navigateur.

## Points à vérifier avec les sources

- Le dispositif original des décisions des **31/03/2017 et février 2026** : champ territorial, dates d'effet, suspension et rythme exact des visites. En cas de décision ultérieure, revoir les statuts plutôt que simplement prolonger le calendrier.
- Les preuves des week-ends signalés NRE et des exceptions, spécialement celles de mars 2017 et mars 2022 (visite partielle/interrompue).
- Les heures exactes **réellement passées ensemble** et leur périmètre (rencontres physiques, durée de présence, éventuelles visites hors week-end), avant toute publication d'un **solde net factuel**.
- La revue éditoriale et les mesures de confidentialité exigées par `.agents/skills/protect-family-privacy/SKILL.md`.

**Référence normative française** : [Code pénal, art. 227-5](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006418025) ; l'étiquette « NRE » dans un calendrier personnel ne suffit pas à établir à elle seule l'infraction.
