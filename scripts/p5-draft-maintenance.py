#!/usr/bin/env python3

import json
import os
import sys
from pathlib import Path

before_path = Path(sys.argv[1])
lock_path = Path("package-lock.json")
package_path = Path("package.json")
roadmap_path = Path("docs/roadmap.md")

before = json.loads(before_path.read_text())
after = json.loads(lock_path.read_text())
package = json.loads(package_path.read_text())

before["packages"][""]["engines"] = package["engines"]
if before != after:
    raise SystemExit("package-lock changed beyond expected root engines metadata")
if after["packages"][""]["engines"] != package["engines"]:
    raise SystemExit("package-lock root engines are not synchronized with package.json")

text = roadmap_path.read_text()

old_runtime = """- [x] Aligner local/CI et Vercel sur une ligne Node supportée : #182 remplace Node `25.9.0` EOL par Node `24.21.0` LTS dans `.nvmrc`, mise, direnv, tests et instructions agents ; `package.json#engines.node` reste `>=24.11.0 <26` et npm `>=11.17.0 <12`.
  - [x] Réconcilier les métadonnées `engines` racine du lockfile lors de la régénération atomique du lockfile (#123), puis après le correctif de compatibilité Vercel post-#150."""
new_runtime = """- [ ] Séparer le runtime de développement/CI du runtime Vercel : #185 aligne dev/agents/CI principale sur Node `26.8.2` Current tout en conservant Vercel `24.x` comme cible de compatibilité production ; `package.json#engines.node` devient `>=24.11.0 <27` et npm reste `>=11.17.0 <12`.
  - [x] Synchroniser proprement les métadonnées `engines` racine de `package-lock.json` avec le manifeste via npm 11.17, sans changement du graphe de dépendances.
  - [x] Ajouter un check Node 24 ciblé et peu coûteux (`v24.11.0`, `npm ci`, tests unitaires seulement), skippé en Draft et sans dupliquer Next/Docker/SAST/DAST.
  - [ ] Au checkpoint Ready de #185, prouver la Quality complète sous Node 26 et la compatibilité Node 24 avant publication."""

old_node_ci = "- [x] Centraliser la version Node des workflows GitHub sur `.nvmrc` (`v25.9.0`) ; conserver séparément l'engine package compatible Vercel `>=24.11.0 <26`."
new_node_ci = "- [x] #185 fait de Node `26.8.2` Current la source de vérité dev/agents/CI via `.nvmrc`, mise et direnv, tout en conservant Vercel Node `24.x` comme cible de compatibilité production explicite et testée séparément."

old_docker = "- [ ] Au prochain checkpoint Ready de #182, exécuter réellement Docker CI sur le HEAD exact pour valider le smoke étendu aux JS, CSS et webfonts Font Awesome vendus ainsi que le chemin Trivy report-before-fail avant publication."
new_docker = "- [x] Preuve post-merge #182 sur `1330279fae1db3006221d6d191173ea22d361614` : Docker CI #72 est verte ; build, smoke étendu du fallback et scan Trivy ont réellement réussi, avec conservation SARIF d'échec et enforcement naturellement skippés puisque le scan est sain."

for old, new, label in [
    (old_runtime, new_runtime, "runtime Node P1"),
    (old_node_ci, new_node_ci, "runtime Node P5"),
    (old_docker, new_docker, "checkpoint Docker #182"),
]:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"expected exactly one {label} roadmap block, found {count}")
    text = text.replace(old, new)

marker = "### Checkpoint post-#182 et lot Node #185"
if marker in text:
    raise SystemExit("post-#182 checkpoint already exists")

heading = "## P5 — Nettoyage technique, performance et CI\n"
checkpoint = """
### Checkpoint post-#182 et lot Node #185

- [x] #182 a été mergée sur `master` au SHA `1330279fae1db3006221d6d191173ea22d361614`; Vercel, `Production Post-deploy Smoke` et `Production DAST` sont verts sur cette baseline production.
- [x] La baseline DAST production post-#182 est `H0 M4 L4 I5`, contre `H0 M4 L6 I5` avant #182 : les LOW passent réellement de 6 à 4 sans masquer artificiellement les alertes restantes.
- [x] Docker CI #72 sur le merge SHA est verte : build, smoke du fallback et Trivy ont réellement tourné avec succès.
- [x] Diagnostiquer la Quality `master` #594 (`34668252882`) : elle est rouge sur trois contrats unitaires devenus obsolètes après #182 ; #185 corrige ces trois régressions. La baseline exploitable reste `npm ci=18s`, `node_modules=693 MiB`; `full_checks`, Next build et `.next` sont `n/a` car les tests unitaires ont arrêté le job avant build.
- [ ] Collecter plusieurs nouvelles baselines complètes et vertes avant toute promotion des budgets CI warning-only vers des seuils bloquants.
- [x] #181 est fermée sans merge : son travail Tailwind/PostCSS est superseded par #182, donc aucun rebase artificiel n'est requis.
- [ ] Terminer #185 en Draft à faible coût, puis seulement au checkpoint Ready exécuter Quality Node 26, compatibilité Node 24, Docker/Trivy, Vercel exact-SHA, Playwright et ZAP ; ne pas merger automatiquement.

"""
if text.count(heading) != 1:
    raise SystemExit("expected exactly one P5 heading")
text = text.replace(heading, heading + checkpoint, 1)
roadmap_path.write_text(text)
