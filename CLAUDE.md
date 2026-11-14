# Claude Code — Site Bababou / workstation

**Rédiger en français.** `AGENTS.md` reste canonique ; ne pas le recopier dans les autres instructions. Le guide `docs/agent-execution-modes.md` distingue capacités locales et travail Codex sans checkout.

## Boucle workstation

1. Vérifier `git rev-parse --show-toplevel`, la branche, `git status --short` et le SHA réel. Lire uniquement le BB-xx concerné, le diff et le skill utile.
2. `just agent-plan` : voir les outils et CPU/RAM détectés, sans exécuter ni installer. Pour une itération rapide, `just agent-verify offline` ou `just agent-verify p0`.
3. Après un patch, exécuter le test concerné ; si nécessaire `just quality-fix`, revoir les mutations puis committer. Une seule publication `just agent-verify publish`, qui inclut déjà la quality gate ; vérifier `just publish-status` sur le HEAD final.
4. Avec navigateurs disponibles, `just agent-verify browser` utilise un plafond `PLAYWRIGHT_WORKERS` dérivé des ressources. La CI conserve ses workers définis. Ne pas lancer plusieurs builds/scan complets simultanés.
5. PR Draft pendant l'itération, aucune fusion/activation automatique. Faire la revue de confidentialité `protect-family-privacy` avant toute page, identité, document ou référence familiale.

**Sans checkout ou outils** : même sous Claude, passer en mode isolé ; ne pas forcer Docker, DNS, SSH, installation npm, accès TrueNAS ou navigateur. Une lecture distante est L0, pas un build. Reporter `SHA | changement | PASS/FAIL/NOT_RUN | blocage | prochaine action`.

**Architecture** : Next App Router FR/EN/DE/NO sous `app/`, documents historiques sous `public/`, `proxy.ts` et `lib/homeCutoverPolicy.mjs` pour le verrou de l'accueil, procédures GO/rollback dans `docs/homepage-react-cutover.md`. WCAG 2.2 AA, SEO, privacy, BetterLeaks, SAST/SCA/DAST et parité historique restent obligatoires selon le scope.

**Gestion des PR :** réutiliser la PR compatible, rebaser et résoudre ses
conflits **avant** modification, éviter les commits minuscules publiés
séparément. Un seul lot après les tests ; exception corrective urgente
Production ou migration multi-services terminée. Ne jamais fusionner sans GO.
