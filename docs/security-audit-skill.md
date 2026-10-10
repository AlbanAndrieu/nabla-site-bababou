# Intégration contrôlée — Cloudflare security-audit-skill

## Nature et provenance

Le projet [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) est un **skill générique d'audit de sécurité de code**. Il ne remplace ni un audit du compte Cloudflare (Access, WAF, DNS, Tunnel), ni Betterleaks, SAST, Playwright ou ZAP.

- Dépôt : `https://github.com/cloudflare/security-audit-skill`
- Révision upstream vérifiée : `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` (14 septembre 2026).
- Licence indiquée par GitHub : MIT ; conserver `LICENSE` avec toute copie.
- Répertoire upstream : `skills/security-audit/` ; `SKILL.md` blob Git `92178dad304d3f63e37582a297026a7874e12c62`.
- Ce document ne prétend pas que le skill a été installé ou exécuté. Le blob Git n'est pas un checksum SHA-256 d'une archive installée.

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
