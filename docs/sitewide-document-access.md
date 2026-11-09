# Demande de copie documentaire — comportement commun du site Bababou

**Portée au 9 novembre 2026 : parcours public de demande préparé, sans activation d'un portail documentaire privé.**

## Objectif

Étendre à l'ensemble des documents **liés depuis le site** le parcours déjà préparé pour les références NRE, sans détruire les liens d'archives volontairement publiés et sans faire croire que Cloudflare Access protège des fichiers hébergés dans `public/`.

- Lorsqu'une page du site contient un lien vers un **PDF, DOC/DOCX, ODT/RTF, tableur XLS/XLSX/ODS, présentation PPT/PPTX/ODP**, ou vers un document connu sur Google Docs/Drive, Dropbox ou OneDrive à URL reconnaissable, une **seconde action** apparaît : « Demander une copie » (FR/EN/DE/NO).
- Les documents HTML de l'archive **`/ca/`**, et d'autres HTML explicitement marqués `data-document-entry`, reçoivent aussi l'action.
- Un lien vers une page web ordinaire, un site institutionnel, une loi ou le portail OpenRAG **ne devient pas automatiquement une preuve à demander**. Les références juridiques ordinaires restent des liens directs ; seules les URLs répondant aux critères ci-dessus sont augmentées.
- Le lien public **d'origine reste intact**. On ne supprime pas et on ne prétend pas protéger une ressource publique par un simple changement d'interface.

## Route et référence publique

Un clic sur « Demander une copie » mène vers :

```text
/français : /evidence-access?doc=SITE-DOC-<16hex>#request-documents
/anglais  : /en/evidence-access?doc=SITE-DOC-<16hex>#request-documents
/allemand : /de/evidence-access?doc=SITE-DOC-<16hex>#request-documents
/norvégien: /no/evidence-access?doc=SITE-DOC-<16hex>#request-documents
```

Le site affiche un **identifiant de localisation public**, puis invite à transmettre via Contact cet identifiant, le contexte et la finalité de la demande. Aucune URL d'origine, query string, jeton, nom de fichier ou extrait documentaire n'est copié dans les paramètres. Si la requête ne contient pas d'identifiant valide, les instructions génériques restent disponibles.

Un `SITE-DOC-*` n'est **ni un identifiant officiel de procédure, ni une pièce validée, ni une garantie d'accès, ni une preuve cryptographique**. Le code calcule une empreinte locale déterministe **FNV-1a 64 bits**, non adaptée aux usages de sécurité. Le calcul ne sert qu'à retrouver une URL publiquement liée dans le code ; aucune autorisation n'en dépend. Les paramètres généraux de l'URL (notamment jetons, signatures, traçage) sont exclus ; seuls certains identifiants de documents des fournisseurs publics peuvent être intégrés **au calcul local du hash**, jamais à la requête de consultation.

### Retrouver un document, côté propriétaire

Sur un **checkout local autorisé** :

```bash
node scripts/resolve-site-document-ref.mjs SITE-DOC-0123456789abcdef
```

Le script parcourt les liens statiques HTML/TSX, les archives HTML `/ca/` et les chemins de fichiers PDF/Office déjà publics, sans réseau, sans lire les originaux binaires ni interroger OpenRAG. Il ne produit un résultat que pour une référence existante dans les sources parcourues. Les URLs générées dynamiquement peuvent nécessiter de rechercher localement la page mentionnée par le demandeur ; ne pas répondre en inventant une correspondance.

Les références `NRE-CLAIM-*` et `NRE-PROOF-*` du registre probatoire sont **différentes** des références `SITE-DOC-*`. Seules les `NRE-PROOF-*` contrôlées peuvent, après revue humaine, pointer dans la future passerelle privée vers une **copie caviardée**. Aucun automatisme ne lie un document public à une pièce privée OpenRAG.

## Migration de la totalité des surfaces

| Surface | Mécanisme | Portée |
| --- | --- | --- |
| Pages React / Next.js | `app/[locale]/layout.tsx` charge le module public une fois après hydratation, avec observation de la navigation SPA | NRE, autorités centrales, liste documentaire, autres pages Next |
| HTML historique avec `/site-widgets.js` | Loader partagé dans `public/site-widgets.js` | 15 pages historiques observées au moment de l'inventaire |
| HTML historique sans widgets | Script module explicite dans Contact, Legal, Privacy et Service Terms | Extension préventive aux 4 pages restantes ; **404 non modifiée** conformément à l'exception de confidentialité/migration |
| Médias non documentaires / pages externes ordinaires | Aucun ajout de lien | Pas d'éléments inutiles, pas de fausse demande |

Les liens sont augmentés **côté client** sans changer leur destination. `MutationObserver` observe les nouveaux liens lors d'une navigation côté client. Le module vérifie les protocoles HTTP(S), ignore mailto/data/javascript et n'envoie aucune requête à OpenRAG. Le script est auto-idempotent et le CSS site utilise un focus clavier visible, des cibles tactiles d'au moins 44 px et masque l'action complémentaire à l'impression.

## Limites légales et de sécurité

**Critique P0 : les documents déjà présents dans le dossier public sont encore directement téléchargeables.** L'inventaire Git contient des fichiers PDF et Word avec des intitulés judiciaires et administratifs, notamment dans `public/ca/`. La nouvelle action de demande de copie ne modifie ni leurs permissions HTTP, ni les caches/CDN, ni les moteurs d'indexation.

Avant d'affirmer qu'une pièce est protégée, l'examiner avec `.agents/skills/protect-family-privacy/SKILL.md` et décider de sa publication :
1. document officiel public / lien tiers librement consultable → conserver le lien, et offrir la demande de copie facultative ;
2. pièce familiale déjà publique, diffusion non approuvée ou contenant des données à protéger → examen juridico-éditorial, caviardage irréversible, retrait de l'asset public **si décidé par le propriétaire**, invalidation des caches et vérification des anciennes URLs ;
3. pièce strictement privée → pas d'URL dans le site ; enregistrement interne hors GitHub, indexation Docling/OpenRAG isolée, contrôle d'identité/MFA Cloudflare Access avec approbation, puis ACL **par pièce** et copie caviardée uniquement.

Aucune donnée de mineur n'est extraite d'un original ni importée dans le nouveau registre par cette migration. Le site ne recueille **pas** d'informations confidentielles via un formulaire ouvert : la demande initiale est un contact contenant uniquement une référence publique et l'objectif d'accès.

## Contrôles

- Tests unitaires `unit-tests/sitewideDocumentAccess.test.mjs` : classification, rejet des URL non documentaires/malveillantes, stabilité des identifiants, absence de query secrets, navigation FR/EN/DE/NO, présence sur Next et HTML historiques.
- Test navigateur ajouté à `tests/nre.spec.ts` : le PDF NRE historique conserve son URL et reçoit une seconde action menant au guide avec référence `SITE-DOC` ; même principe sur une archive HTML.
- **Non testé dans cette session** : rendu Playwright / axe, Node 24/npm12, CSS visuel, CGI/SSR, empreintes réelles du CDN, déploiement Vercel, accès TrueNAS/OpenRAG/Cloudflare, sécurité de l'origine. Les contrôles statiques ne prouvent pas l'exécution.
- **GO** de la seule page de demande après tests exact-SHA et revue éditoriale ; **NO-GO** de tout accès aux pièces privées tant que Cloudflare Access, Tunnel, passerelle documentaire, autorisation, révocation et caviardage ne sont pas effectifs.

Voir aussi `docs/nre-evidence-openrag-access.md` et `infra/cloudflare/README.md`.
