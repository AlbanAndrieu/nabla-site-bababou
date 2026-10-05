# Publication sûre du corpus familial et juridique

Ce runbook s'applique aux fichiers récupérés destinés à `public/ca/**` et à
`public/abduction-norway-lawyers.html`. Les originaux sensibles restent hors Git.

## Principes

- Ne jamais committer un original non caviardé pour le corriger ensuite : Git conserverait
  l'historique sensible.
- Les sources `.eml`, `.docx`, `.odg` et `.xoj` ne sont pas des formats de publication.
  Elles restent dans le worktree/archive privée et sont converties vers une copie publique.
- Pour les documents juridiques : utiliser `l'enfant` / `the child`, `Mr A`, `Mme B` / `Ms B` selon
  `.agents/skills/protect-family-privacy/SKILL.md`.
- Une information protégée mais essentielle est conservée contextuellement avec un marqueur
  visible de caviardage ; la valeur originale ne doit plus exister dans le fichier publié.
- Les images/scans sont refusés par le gate initial. Les convertir vers une copie aplatie et
  revue (généralement PDF), puis publier cette copie seulement.

## Répertoires privés locaux

Les chemins suivants sont ignorés par Git :

```text
.private-publication-source/
.redaction-work/
public/eml/
```

Conserver également l'archive de récupération hors du dépôt. Ne jamais déplacer l'archive
dans un chemin suivi par Git.

## Audit privé avant publication

Auditer les originaux directement dans le workspace ignoré par Git :

```bash
npm run privacy:audit-private -- \
  .private-publication-source/recovered-20261003/public
```

La console n'affiche ni valeur détectée ni chemin d'origine. Le détail actionnable est écrit
uniquement dans `.redaction-work/private-audit.json`, lui-même ignoré par Git. Ce rapport
local contient les chemins, lignes et catégories nécessaires au caviardage.

Pour un premier lot HTML ciblé :

```bash
npm run privacy:audit-private -- \
  .private-publication-source/recovered-20261003/public/ca/gmail-clarifications-maintien-demande-fr.html
```

Les PDF sont inspectés avec `pdftotext`, `pdfinfo` et `pdfdetach`. Un PDF sans texte
extractible est marqué pour revue visuelle/OCR manuelle ; les images et formats source bruts
sont également marqués pour transformation manuelle. L'audit privé ne rend jamais un
artefact publiable à lui seul.

## Consolidation avant caviardage

Pour le dossier « demande d'explications des autorités compétentes », les sources sont
déclarées dans `config/private-consolidation.json`. Le manifeste référence seulement les
noms de fichiers ; aucun contenu privé n'est versionné.

Générer le bundle local :

```bash
npm run privacy:consolidate-private -- demande-explications-autorites-competentes
```

La commande fonctionne avec Node seul, sans `node_modules`. Elle extrait localement le texte
du PDF et des HTML, découpe les contenus en paragraphes, calcule des empreintes SHA-256 et
repère les paragraphes dupliqués. Elle produit sous
`.redaction-work/consolidation/demande-explications-autorites-competentes/` :

- `source-index.json` : provenance, langue, rôle, tailles et taux de doublons ;
- `sources/*.txt` : extraction locale par source ;
- `merged-draft.md` : draft consolidé local contenant les paragraphes uniques et leur provenance.

Ces sorties peuvent contenir les données privées originales : elles restent ignorées par Git
et ne doivent jamais être copiées directement dans `public/`.

Auditer ensuite le draft consolidé :

```bash
npm run privacy:audit-private -- \
  .redaction-work/consolidation/demande-explications-autorites-competentes/merged-draft.md
```

Le caviardage et la pseudonymisation se font sur une copie de ce draft. La version publique
FR/EN n'est créée qu'après disparition des findings protégés et revue du sens juridique.

## HTML

Avant publication :

1. travailler sur une copie ;
2. remplacer les identités par les pseudonymes approuvés ;
3. caviarder les adresses, téléphones, identifiants officiels et données médicales protégées ;
4. supprimer la valeur originale du DOM, attributs, commentaires, JSON-LD, metadata et scripts ;
5. ajouter le fichier final dans `config/publication-review.json`.

Le masque CSS n'est jamais une redaction : la valeur protégée doit être absente de la source.

## PDF

Un rectangle noir posé au-dessus du texte n'est pas suffisant. La redaction doit supprimer
le texte/objet sous-jacent ou rasteriser de manière irréversible la zone concernée.

Vérification locale minimale d'un PDF final :

```bash
pdftotext public/ca/<document>.pdf - > /tmp/document-public.txt
pdfinfo public/ca/<document>.pdf
pdfdetach -list public/ca/<document>.pdf
pdftoppm -png -r 160 public/ca/<document>.pdf /tmp/document-public
```

Ensuite :

- rechercher localement dans le texte extrait les valeurs qui ont été caviardées ;
- vérifier visuellement toutes les pages rendues ;
- vérifier qu'aucune pièce jointe n'est embarquée ;
- contrôler les metadata ;
- supprimer le fichier temporaire extrait.

Ne jamais coller une valeur privée dans un log CI ou dans le manifeste.

## Manifeste de revue

Chaque HTML/PDF sensible ajouté ou modifié doit avoir une entrée exacte :

```json
{
  "path": "public/ca/example.pdf",
  "reviewed": true,
  "sourceOutsideGit": true,
  "irreversibleRedactionVerified": true,
  "metadataReviewed": true
}
```

Les quatre indicateurs de base sont obligatoires. Deux validations optionnelles permettent
une décision explicite du propriétaire sans relâcher les réécritures obligatoires :

- `sensitiveDataApproved: true` — autorisation explicite d'un contenu médical/psychologique ou autre donnée de catégorie spéciale ;
- `officialIdentifiersReviewed: true` — identifiants officiels vérifiés comme nécessaires et publiables.

Le manifeste ne contient aucune donnée personnelle, aucun extrait du document et aucun secret.

## Gate

Exécuter avant commit puis avant publication :

```bash
npm run privacy:publication
npm run privacy:check
bash scripts/agent-p0-check.sh
```

Le gate de publication classe ses findings en `BLOCK`, `REWRITE` et `REVIEW` :

- `BLOCK` : donnée réellement sensible/sécurité, notamment finance du père ;
- `REWRITE` : identité/contact à normaliser avant publication, sans la traiter comme un secret ;
- `REVIEW` : décision humaine explicite nécessaire.

Le gate :

- inspecte uniquement les artefacts sensibles nouveaux/modifiés ;
- refuse les formats source bruts ;
- refuse les images du corpus tant qu'elles ne sont pas transformées en copie aplatie revue ;
- analyse HTML/texte avec le privacy gate existant ;
- extrait le texte/OCR accessible des PDF avec `pdftotext` ;
- analyse les metadata via `pdfinfo` ;
- refuse les pièces jointes PDF détectées par `pdfdetach` ;
- ne journalise jamais la valeur protégée détectée, seulement le fichier et la catégorie.

## Stratégie de PR

Publier par petits lots homogènes. Pour chaque lot :

1. copier uniquement les sorties caviardées depuis le worktree privé ;
2. compléter le manifeste ;
3. exécuter les gates locaux ;
4. vérifier le diff et les fichiers binaires ajoutés ;
5. pousser la branche en Draft ;
6. vérifier la Preview exacte avant de passer Ready.

Ne jamais ajouter tout le corpus récupéré avec `git add public/ca` sans revue fichier par fichier.
