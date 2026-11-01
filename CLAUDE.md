# Claude Code — Site Bababou

**Langue de communication : toujours le français.** Ce dépôt est un projet personnel : rédiger la documentation, les comptes rendus et les descriptions/titres de PR en **français**. Les identifiants de code, API et noms techniques peuvent rester en anglais selon les conventions du dépôt. Cette politique est distincte des dépôts professionnels Wakam, dont les livrables techniques et PR doivent être en anglais, tout en conservant la conversation en français.

## Instructions prioritaires

- Lire `AGENTS.md` : politique Git/PR, sécurité, protection des crédits CI, preuves exact-SHA et autonomie d'exécution.
- Consulter **uniquement la section active** de `docs/roadmap.md`. Les anciens SHA et PR fusionnées ne sont pas des tâches à reprendre.
- Pour les contenus familiaux : appliquer `.agents/skills/protect-family-privacy/SKILL.md` ; les informations identifiantes de l'ancien index ne sont pas librement réutilisables.
- Ne jamais modifier `master` directement, fusionner automatiquement, affaiblir les contrôles de sécurité ou prétendre qu'un test non exécuté est passé.

## Architecture actuelle

- `app/` : Next.js App Router et routes locales FR/EN/DE/NO.
- `public/index.html` : homepage publique historique conservée pour la bascule et le rollback.
- `app/[locale]/home-preview/page.tsx` : Home React de revue (5 cartes).
- `app/[locale]/abduction/page.tsx` : parents, traducteurs et notice (7 cartes).
- `lib/homeAudienceCopy.mjs` : textes natifs des deux parcours.
- `proxy.ts` + `lib/homeCutoverPolicy.mjs` : verrou serveur de publication, désactivé par défaut.
- `docs/homepage-migration-parity.md` : comportements attendus ; `docs/homepage-react-cutover.md` : seule procédure de GO/NO-GO.

## Boucle locale

```bash
mise install
just install
just dev
just offline-l1
just offline-contracts
just homepage-validation-list
just homepage-validation
just p0
just quality
```

Sélectionner les contrôles selon le périmètre de la modification. `offline-*` n'atteste pas le build ni les scanners ; `homepage-validation` suppose Playwright installé. Pour publier, utiliser la procédure canonique de `AGENTS.md`, sur un commit et un SHA exact. Aucune réexécution GitHub Actions inutile et aucune fusion automatique.

## Qualité

- WCAG **2.2 AA** : clavier, focus, contrastes, zoom/reflow, lecteur d'écran, reduced-motion, responsive et impression.
- Sécurité et vie privée : BetterLeaks, SAST/SCA, DAST/ZAP, audit réseau et revue des informations personnelles.
- SEO : `lang`, canonical/hreflang, sitemap/robots, Open Graph et indexation contrôlée.
- Conserver le rendu protégé de `public/404.html` selon la politique de confidentialité.
- Résumé final court : **modifications ; tests réellement exécutés ; limites ; prochaine action**.

**Sources de vérité** : [roadmap](docs/roadmap.md), [opérations](docs/operations.md), [bascule](docs/homepage-react-cutover.md), [confidentialité](.agents/skills/protect-family-privacy/SKILL.md).

