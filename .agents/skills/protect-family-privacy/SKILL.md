---
name: protect-family-privacy
description: Canonical Bababou publication policy for family, legal, contact, identity, image, metadata, and generated content. Apply strict contextual pseudonymization and irreversible redaction while preserving information that is genuinely necessary to understand the case.
---

# Protect Family Privacy

Apply **contextual pseudonymization and irreversible redaction**, not blanket deletion. Preserve the site's legitimate recognition, contact, documentary, and legal purpose without publishing protected family identities or sensitive values.

## Canonical source of truth

This file is the **single canonical privacy policy** for the repository.

Compatibility/adaptor files may point here, but they must not redefine or fork the rules:

- `.agents/protect-family-privacy/SKILL.md`;
- `.agents/skills/protect-family-privacy/references/private-rules.md`;
- `.cursor/rules/200_anonymization-legal.mdc`.

When older repository guidance conflicts with this file, **this file wins**.

The identity dictionary below is an intentional detection/reference exception. Its values are retained so agents can recognize accidental publication. Their presence **inside this canonical skill does not authorize publication on the site, in generated output, metadata, legal copies, audit reports, or new filenames**.

## Protected identity detection dictionary — intentionally retained

### Child

Known legal-name tokens and spelling/accent variants to detect:

- given name: `Éléonore`, `Eléonore`, `Eleonore`, `Elenore`;
- middle name: `Céleste`, `Celeste`;
- family names: `ANDRIEU`, `BROOKE`;
- combined family form to detect: `ANDRIEU-BROOKE`, including spacing and punctuation variants;
- complete legal-name combinations containing any of the protected child tokens above.

The family names overlap with parent identities. Use context when detecting them, but never publish a child's full or partial real identity merely because a token is ambiguous in isolation.

### Father

Legal identity tokens to detect in anonymized family/legal-derived material:

- `Alban`, `Eric`, `Alexandre`, `ANDRIEU`;
- expanded legal-name combinations containing those tokens.

### Mother

Legal identity tokens to detect:

- `Rachael`, `Elaine`, `BROOKE`;
- expanded legal-name combinations containing those tokens.

## Mandatory pseudonyms

### Child

The child's real identity is protected on **all public surfaces**, including the homepage.

- **Never publish:** any protected given name, middle name, family name, combined family name, full legal identity, accentless/spelling variant, or partial real-name combination.
- **Ordinary/editorial wording:** use **Bababou** or **my daughter** where first-person wording is natural.
- **Legal/official-style wording:** use **the child**.
- Metadata, HTML titles, Open Graph/Twitter tags, JSON-LD, alt text, attributes, comments, generated bundles, source maps, filenames, tests, and fixtures must follow the same rule.

The previous `public/index.html` real-name/display-name exception is **revoked**. Do not recreate or preserve a homepage exception without a newer explicit user instruction.

### Father

For anonymized family-case, legal, court, police, administrative, evidentiary, or closely derived material:

- **Never use:** individual first/middle/family-name tokens or the expanded legal identity.
- Use **the father** in ordinary anonymized prose.
- Prefer **Mr A** in legal-style documents, headings, party designations, chronology tables, pleadings, and quoted/reconstructed official material.

For ordinary public author/contact/editorial surfaces where the father's public identity is intentionally required, use exactly **Alban Andrieu**. Do not expand it with middle names and do not use partial legal-name variants as a substitute.

### Mother

- **Never publish:** the protected first or family names, alone or in combinations.
- Use **the mother** in ordinary prose.
- Prefer **Ms B** in legal-style documents, headings, party designations, chronology tables, pleadings, and quoted/reconstructed official material.

### Deprecated aliases

The following older aliases are prohibited and must be normalized when encountered:

- `Mr AA`, `MR AA`, or equivalent two-letter father aliases → **Mr A**;
- `Ms RB`, `Mme RB`, `Mrs RB`, or equivalent two-letter mother aliases → **Ms B**.

Do not invent new initials-based aliases when `Mr A`, `Ms B`, `the father`, `the mother`, or `the child` is sufficient.

## Preserve essential information through redaction

Do **not** silently replace, generalize, or remove information when doing so would materially damage the evidentiary, legal, chronological, recognition, or explanatory meaning of the document.

Classify first:

1. **Not essential and protected/excessive** — replace with the approved pseudonym/generalization or remove it.
2. **Essential but protected** — preserve the surrounding fact, role, date, document type, relationship, or legal meaning, but remove the sensitive value itself and insert an explicit irreversible redaction marker.
3. **Essential and expressly approved for publication** — retain only within the exact approved scope.

For essential protected information, use a visible marker such as:

- English: `[████ — essential information redacted; available on request]`;
- French: `[████ — information essentielle caviardée ; révélation sur demande]`.

The marker must tell the reader that the information can be revealed on request to the site owner/user. Do not fabricate replacement data merely to keep a sentence readable.

### HTML/application redaction

A black or grey visual treatment is acceptable **only after the original protected value has been removed from the source data**.

Never keep the protected value in:

- the DOM text hidden by CSS;
- `data-*` attributes;
- `title`, `aria-label`, `alt`, comments, JSON-LD, metadata, or hydration payloads;
- JavaScript objects, message catalogs, source maps, generated bundles, tests, fixtures, or logs.

A grey/black placeholder is a presentation of the redaction marker, not a way to conceal live sensitive text.

### PDF/image/document redaction

When the source is a PDF, scan, screenshot, image, or rendered legal document:

1. apply true redaction or rasterize the affected area after masking;
2. use an opaque black or grey redaction area and, where useful, an adjacent note such as `Information essentielle caviardée — révélation sur demande`;
3. remove hidden text, OCR layers, annotations, form values, comments, revision history, and relevant metadata;
4. re-extract/search the result to verify that the protected value is irrecoverable.

## Explicitly approved identity/document exceptions

Existing explicitly approved exceptions remain valid only within their stated scope unless the user revokes them:

- official identifier `14CV32249`;
- `public/assets/passport-fr-bababou-4.png`.

These exceptions **do not** authorize publication of the child's real name and do not create a general exception for other identifiers or documents. If an approved artifact contains additional protected data beyond its approved purpose, redact those additional values while preserving the artifact's evidentiary context.

## Institutions, organizations, professionals, and historical locations

Institutions and people working for them may be named when relevant to documented case history. This includes:

- institutions and organizations;
- professionals, staff, officials, and other relevant people;
- professional identities and professional email addresses;
- relevant historical location/map links.

Do not remove or generalize these solely because they relate to the case. Apply normal accuracy, relevance, confidentiality, security, and credential rules.

## Address and phone/contact data

For exact private address/phone matching, read `.cursor/mem/privacy-address-phone.md`. Those private values may remain in private configuration and must not be echoed into logs or audit findings.

- Never disclose an exact private residential address outside an existing explicitly scoped exception.
- Replace private residence data with the approved generalized location when the exact value is not essential.
- If an exact location is legally/evidentially essential, caviard the protected value and preserve only the contextual fact necessary to understand the event.
- Distinguish private phone data from deliberately published site contact data.
- Contact/email surfaces may expose the father's approved public contact information.

Existing files under `public/assets/nabla/signature/` retain their current scoped address/phone exception. That directory exception does not override child-identity, parent-pseudonym, medical/psychological, or irreversible-redaction protections.

## Medical and psychological information

Medical or psychological diagnoses, records, treatment, medication, assessments, therapy, disability information, symptoms, or equivalent sensitive health information are protected unless the user expressly authorizes a specific publication.

If such information is essential to the legal/evidentiary narrative, do not delete the existence of the evidence. Keep the neutral context and caviard the sensitive content using the essential-information rule above.

## Transformation rules

- Child ordinary/editorial copy → **Bababou** or **my daughter**.
- Child legal/official-derived copy → **the child**.
- Father anonymized/legal copy → **the father** or preferably **Mr A** in legal-style documents.
- Mother anonymized/legal copy → **the mother** or preferably **Ms B** in legal-style documents.
- Ordinary public father author/contact identity, when intentionally required → **Alban Andrieu** only.
- `Mr AA` / `MR AA` → **Mr A**.
- `Ms RB` / `Mme RB` / `Mrs RB` → **Ms B**.
- Non-essential private residence/contact data → approved generalization/masking.
- Essential protected data → preserve context and use irreversible caviardage with an explicit `available on request` / `révélation sur demande` notice.
- Keep relevant institutions, professionals, professional emails, and historical location links unless another concrete reason requires removal.

## Verification and privacy-gate behavior

For HTML/app output inspect source, public files, messages, metadata, JSON-LD, comments, attributes, generated bundles and source maps. For PDFs/images use true redaction/rasterization when redaction is required and verify hidden text/metadata are clean.

The privacy gate should ultimately:

- report only `file + line + category`, never the matched protected value;
- reject protected child legal-name variants on **every** public surface, including `public/index.html`;
- reject deprecated `Mr AA` / `MR AA` / `Ms RB` / `Mme RB` / `Mrs RB` aliases and accept `Mr A` / `Ms B`;
- distinguish the intentionally public `Alban Andrieu` author/contact form from expanded or partial father legal-name variants;
- reject protected mother identity tokens on public/anonymized surfaces;
- allow explicitly approved identifier/document exceptions only within scope;
- distinguish intentionally public father contact data from private address/phone data;
- not treat institutions, professionals, professional emails, or historical map/location links as privacy findings by default.

Tests should use synthetic identities/contact values whenever possible. Exact protected spellings may be retained only in this canonical detection dictionary or in narrowly scoped detection regression tests when necessary to prove that a leak is blocked.

## Agent editing rule

Before modifying family/legal/publication content, read this entire skill.

- The strict child pseudonymization rule and `Mr A` / `Ms B` aliases override older guidance.
- Do not recreate the revoked homepage real-name exception.
- Do not "clean up" the detection dictionary merely because it contains protected spellings; it exists to identify leaks.
- When information appears essential, **caviard rather than silently delete or invent a substitute**, and add a visible note that the protected information can be revealed on request.
- Never claim a surface is compliant until the source and generated output have both been checked.
