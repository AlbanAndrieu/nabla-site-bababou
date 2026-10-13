# Récupération vérifiable de la liaison Vercel / GitHub

**Incident :** CI PR #230, `PROD_BASE_UNHEALTHY` sur le commit `73b8cca53349928f14ef262ba16ce2113a988b23`.

## Faits vérifiés le 13 octobre 2026

- `master` pointe vers `f218b877ef04c99ce7149ab893ba948bcc514cd4` pour la base de cette PR.
- Sur `f218b877`, le statut Vercel `success` signifie **« Canceled by Ignored Build Step »**, et non un déploiement réellement validé.
- Le saut vers le parent `73b8cca` est autorisé uniquement parce qu'il s'agit d'un commit semantic-release limité aux métadonnées.
- Sur `73b8cca`, GitHub rapporte `Vercel=failure`; le déploiement de production Vercel `dpl_78nerRgqZcGwTf2H98RgPej4Dbb6` est en état `ERROR`, code `git_info_fail`.
- Le projet Vercel `prj_9eUAYmWQtHFIRKIOBYsumhU3QLU0` est **lié** à `AlbanAndrieu/nabla-site-bababou`. Cela n'établit pas que l'installation GitHub de **Vercel** a toujours ses autorisations d'accès au dépôt.
- L'interrogation des événements du déploiement échoué n'a retourné **aucun événement**, donc aucune cause profonde plus précise n'est démontrée.

## Procédure sûre de résolution

1. Inspecter dans Vercel **Project → Settings → Git** la connexion GitHub et le dépôt ciblé, ainsi que l'installation GitHub de **Vercel** (ne pas confondre avec la connexion GitHub de l'agent ChatGPT). Comparer le propriétaire et les autorisations d'accès au dépôt privé. Ne réautoriser l'installation que si les droits manquent.
2. Examiner le déploiement `dpl_78nerRgqZcGwTf2H98RgPej4Dbb6` et les événements Git / audit disponibles dans le tableau de bord Vercel ; consigner la cause exacte si elle est visible. Le seul code `git_info_fail` ne permet pas de conclure à un problème de permissions.
3. Après résolution de la liaison ou du problème Git, obtenir **un nouveau déploiement de production réellement `READY`** issu du commit Git et vérifier son association à la révision exacte. Un statut `success` provenant d'un build ignoré ne constitue pas cette preuve.
4. Exécuter les contrôles de production **Post-deploy Smoke** et **DAST** sur la révision effectivement publiée, et conserver les états GitHub authentiques. Préserver ZAP, Playwright, SAST et BetterLeaks ; aucune attestation synthétique.
5. Si la base de la PR reste `f218b877`, vérifier que son mécanisme d'héritage autorisé mène à un commit ayant **Vercel, Smoke et DAST tous réussis**, sans traverser de statut en échec. Si ce n'est pas possible, réparer légitimement la base de production plutôt que modifier le garde pour l'ignorer.

## Contrôle et limites

Les commandes de contrôle sont `scripts/verify-production-baseline.sh` (avec `BASE_SHA`, `GITHUB_REPOSITORY` et un jeton à droits minimaux) et les workflows existants de production. Ne jamais recopier de jetons dans les logs.

**Statut : BLOCKED_EXTERNAL.** Aucun redéploiement en production, altération de commit-status GitHub, modification de politique de branches ou merge n'est effectué par cette procédure. Les corrections de code et les tests locaux peuvent progresser séparément, mais la PR ne devient pas éligible à la fusion sans preuves réelles.
