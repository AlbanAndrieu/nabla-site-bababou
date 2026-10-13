# Intégration contrôlée — Cloudflare security-audit-skill

## Nature et provenance

Le projet [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) est un **skill générique d'audit de sécurité de code**. Il ne remplace ni un audit du compte Cloudflare (Access, WAF, DNS, Tunnel), ni Betterleaks, SAST, Playwright ou ZAP.

- Dépôt : `https://github.com/cloudflare/security-audit-skill`
- Révision upstream vérifiée : `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` (14 septembre 2026).
- Licence indiquée par GitHub : MIT ; conserver `LICENSE` avec toute copie.
- Répertoire upstream : `skills/security-audit/` ; `SKILL.md` blob Git `92178dad304d3f63e37582a297026a7874e12c62`.
- Ce document ne prétend pas que le skill a été installé ou exécuté. Le blob Git n'est pas un checksum SHA-256 d'une archive installée.

## Contrôle d'intégrité hors réseau

Pour un checkout upstream déjà disponible et vérifié depuis une source de confiance :

```bash
just audit-skill-test
just audit-skill-verify /chemin/vers/security-audit-skill
```

Le second contrôle compare les **22 blobs Git** présents dans l'arbre upstream épinglé (licence, guide, instructions, schéma et validateurs/tests). Il échoue sur toute modification ou absence de fichier et refuse les fichiers supplémentaires non déclarés ainsi que les liens symboliques. Seul le **répertoire `.git/` réel situé à la racine** d'un checkout est exclu du contrôle de contenu ; les autres fichiers étrangers restent bloquants. Le contrôle strict des fichiers supplémentaires s'applique au manifeste officiel complet, pas aux manifestes partiels utilisés dans les tests de fixtures. Il **ne** prouve **ni** que le commit du checkout est authentique, **ni** l'authenticité du contenu transporté, **ni** l'exécution d'un audit ; vérifier séparément la révision complète et l'ensemble des fichiers avant usage. Aucun téléchargement ou envoi de données n'est effectué.

## Procédure locale de qualification

1. Dans un checkout autorisé et sans sources privées, contrôler l'identité du commit upstream et la licence avant de copier ou installer le skill. Épingler le commit, pas une branche mutable.
2. Préparer un répertoire de résultats **hors du dépôt et de ses artefacts CI**. Interdire le transfert de `.private-publication-source/**`, `.redaction-work/**`, variables d'environnement et données de l'enfant. Désactiver le réseau pour toute exécution de code cible non fiable et appliquer un sandbox OS avec limites de ressources.
3. Définir le périmètre initial : diff de PR, `app/`, `lib/`, `scripts/`, `.github/workflows/`, `vercel.json`, chaînes de confiance et chemins de publication. Les configurations Cloudflare du compte nécessitent un audit séparé explicitement autorisé.
4. Suivre les six phases upstream : reconnaissance, chasse guidée par couverture, validation contradictoire, enregistrement structuré, vérification indépendante, rapports dérivés. Produire `architecture.md`, `coverage-ledger.json`, `findings.json`, `REPORT.md`, `FINDINGS-DETAIL.md` et `NEEDS-VALIDATION.md` conformément au skill.
5. Exécuter les validateurs upstream `validate-coverage-ledger.cjs` et `validate-findings.cjs` avec Node.js sur les fichiers réellement générés ; enregistrer les codes de sortie et le HEAD du dépôt audité. Un fichier vide ou absent ne constitue jamais une validation.
6. Confronter les constats aux tests existants et à STRIDE/DSOMM. Garder distincts `confirmed`, `needs_validation` et `rejected`, avec preuves et sévérité seulement si impact démontré.

## Contrat de preuve

Pour chaque campagne, indiquer : SHA de Site Bababou, SHA upstream, périmètre, date, commandes exécutées, sandbox, chemins des sorties **privées**, état des deux validateurs, couverture résiduelle, vulnérabilités reproductibles et revue indépendante. Signaler explicitement `NOT_RUN` si la chaîne n'a pas tourné. Ne jamais publier le contenu des preuves sensibles ni transformer une absence de résultats en « zéro vulnérabilité ».

## Séparation des contrôles

- **Code et supply chain** : security-audit-skill et SAST/Betterleaks.
- **Navigateur et site exposé** : Playwright, ZAP et tests sur Preview Vercel exact-SHA.
- **Compte Cloudflare et origine** : audit opérationnel distinct, en lecture seule et avec autorisation explicite.
- **Publication familiale** : gate de confidentialité existante, qui demeure bloquante.

**État initial au 11 octobre 2026** : provenance et structure vérifiées depuis GitHub ; installation, exécution du skill, validateurs sur résultats, tests runtime et audit Cloudflare du compte : **NOT_RUN**.

## Résultats de sécurité et distinction des preuves

**Au 12 octobre 2026 : aucun finding confirmé par le skill sur le code Site Bababou.** Cela signifie que l'audit complet **n'a pas été réalisé**, et non que le site est exempt de vulnérabilités.

Trois niveaux de preuve sont indépendants :

1. **Provenance / intégrité** : comparaison des identifiants Git des 22 fichiers officiels ; ne certifie pas l'authenticité d'un téléchargement et ne teste pas Bababou.
2. **Fonctionnement des outils** : exécution des tests unitaires du vérificateur et, ultérieurement, des validateurs upstream sur de vrais résultats ; ces tests ne découvrent aucune vulnérabilité applicative.
3. **Audit de sécurité du site** : reconnaissance, ledger de couverture, recherche de candidats, vérification indépendante, résultats structurés et rapports. Sans `architecture.md`, `coverage-ledger.json`, `findings.json` et validation effective des outputs, statut **NOT_RUN**.

Le skill ne fournit pas automatiquement une analyse d'un compte Cloudflare ; cet audit IAM/Access/Tunnel/WAF relève d'un chantier distinct, avec accès autorisé en lecture seule.

## Reprise sans intervention sur la workstation

- Terminer en premier les éventuels échecs de formatage de la CI avant les nouveaux changements.
- Exécuter les tests ciblés dans un environnement local isolé ; lorsqu'aucun checkout complet n'est disponible, indiquer `NOT_RUN` au lieu d'inventer un succès.
- Ne pas consommer de nouvelles exécutions CI pour le seul diagnostic d'un `git_info_fail` historique de production. Ne jamais contourner la gate de baseline.
- Après vérification de l'upstream complet, conduire un **audit réel du code**, sans corpus privé : renseigner les preuves et les lacunes de couverture, puis réconcilier les findings avec les contrôles BetterLeaks, SAST, Playwright, ZAP et la modélisation STRIDE/DSOMM.

## Revue de code manuelle limitée — 12 octobre 2026

Revue statique ciblée sur le HEAD de PR `7eb920d28b43ff6db84472e4b521e1b0133099da`, fichiers `app/global-not-found.tsx` et `components/ThemeBootstrap.tsx`, consultés via GitHub. **Ce n'est pas une exécution du skill ni un audit de l'application entière.**

- `ThemeBootstrap.tsx` : script constant embarqué dans le code ; valeur de thème en stockage local limitée à `light`, `dark`, `auto` puis assignée à `dataset.theme`. Aucun flux contrôlé arbitrairement vers le script HTML identifié dans ce périmètre.
- `global-not-found.tsx` : injection du corps de `public/404.html` (ressource versionnée), après retrait des balises `script` via une expression régulière. Aucun paramètre utilisateur n'est apparent à cet appel ; **absence de vulnérabilité confirmée**, mais la regex ne doit pas être présentée comme une sanitisation HTML générique. La sûreté dépend de la provenance du fichier statique et de la politique de revue des modifications.
- Couverture partielle : aucune tentative dynamique de XSS, aucun navigateur ou scanner DAST exécuté, aucune revue indépendante, aucun résultat `findings.json` produit. Les autres surfaces (API, authentification, dépendances, en-têtes, déploiement) restent **NOT_RUN**.

Cette revue est une **observation à valider**, pas un verdict `confirmed` du skill.
