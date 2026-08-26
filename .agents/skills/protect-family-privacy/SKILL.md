---
name: protect-family-privacy
description: Canonical Bababou publication policy for family, legal, contact, identity, image, metadata, and generated content. Apply contextual pseudonymization and irreversible redaction while preserving owner-controlled homepage exceptions and information genuinely necessary to understand the case.
---

# Protect Family Privacy

Apply **contextual pseudonymization and irreversible redaction**, not blanket deletion. Preserve the site's legitimate recognition, contact, documentary, and legal purpose while protecting family identities and sensitive values outside explicitly controlled exceptions.

## Canonical source of truth

This file is the **single canonical privacy policy** for the repository.

Compatibility/adaptor files may point here, but they must not redefine or fork the rules:

- `.agents/protect-family-privacy/SKILL.md`;
- `.agents/skills/protect-family-privacy/references/private-rules.md`;
- `.cursor/rules/200_anonymization-legal.mdc`.

When older repository guidance conflicts with this file, **this file wins**.

The identity dictionary below is intentional detection/reference data. Its presence in this skill does not authorize publication on ordinary public surfaces.

## Protected identity detection dictionary — intentionally retained

### Child

Known legal-name tokens and spelling/accent variants to detect:

- given name: `Éléonore`, `Eléonore`, `Eleonore`, `Elenore`;
- middle name: `Céleste`, `Celeste`;
- family names: `ANDRIEU`, `BROOKE`;
- combined family form to detect: `ANDRIEU-BROOKE`, including spacing and punctuation variants;
- complete legal-name combinations containing protected child tokens.

The family names overlap with parent identities. Use context when detecting them.

### Father

Legal identity tokens to detect in anonymized family/legal-derived material:

- `Alban`, `Eric`, `Alexandre`, `ANDRIEU`;
- expanded legal-name combinations containing those tokens.

### Mother

Legal identity tokens to detect:

- `Rachael`, `Elaine`, `BROOKE`;
- expanded legal-name combinations containing those tokens.

## Owner-controlled homepage and index exception

`public/index.html`, the public `/` homepage that serves it, and metadata whose sole purpose is to describe that homepage are **owner-controlled exception surfaces**.

This exception covers the currently approved homepage presentation, including visible copy, HTML title, Open Graph, Twitter/X metadata, homepage JSON-LD, recognition/contact copy, and explicitly approved homepage evidence.

Agents **must not automatically pseudonymize, redact, generalize, remove, rename, or otherwise alter family identity, contact, or evidentiary information on these surfaces**.

Before changing any protected or identifying information on the homepage/index:

1. inspect and report what is currently exposed;
2. show the proposed replacement or redaction and its publication impact;
3. **ask the user for explicit approval before editing**;
4. change only the specifically approved values.

Auditing and reporting the homepage/index is allowed without approval; modifying it is not.

This is a **narrow exception**. It does not authorize copying homepage-only identity or evidence into other routes, documents, metadata, tests, generated content, or assets. Existing tests may reproduce the exact approved homepage strings only when necessary to lock the owner-approved disclosure and prevent silent automated changes.

## Mandatory pseudonyms outside the homepage/index exception

### Child

Outside the owner-controlled homepage/index exception:

- **Never publish:** protected given name, middle name, family name, combined family name, full legal identity, spelling variant, or partial real-name combination when it identifies the child.
- **Ordinary/editorial wording:** use **Bababou** or **my daughter** where first-person wording is natural.
- **Legal/official-style wording:** use **the child**.
- Metadata, HTML titles, Open Graph/Twitter tags, JSON-LD, alt text, attributes, comments, generated bundles, source maps, filenames, tests, and fixtures follow the same rule.

### Father

For anonymized family-case, legal, court, police, administrative, evidentiary, or closely derived material:

- **Never use:** individual first/middle/family-name tokens or the expanded legal identity when they identify the father.
- Use **the father** in ordinary anonymized prose.
- Prefer **Mr A** in legal-style documents, headings, party designations, chronology tables, pleadings, and quoted/reconstructed official material.

For ordinary public author/contact/editorial surfaces where the father's public identity is intentionally required, use exactly **Alban Andrieu**. Do not expand it with middle names.

### Mother

Outside the owner-controlled homepage/index exception:

- **Never publish:** protected first or family names, alone or in identifying combinations.
- Use **the mother** in ordinary prose.
- Prefer **Ms B** in legal-style documents, headings, party designations, chronology tables, pleadings, and quoted/reconstructed official material.

### Deprecated aliases

Normalize older aliases when encountered outside the owner-controlled homepage/index exception:

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

- DOM text hidden by CSS;
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

- the owner-controlled homepage/index disclosures described above;
- official identifier `14CV32249` on its currently approved homepage scope;
- `public/assets/passport-fr-bababou-4.png` on its currently approved scope.

These exceptions do not create a general permission to reproduce the same information elsewhere.

## Institutions, organizations, professionals, and historical locations

Institutions and people working for them may be named when relevant to documented case history, including institutions, professionals/staff/officials, professional identities and email addresses, and relevant historical location/map links.

Do not remove or generalize these solely because they relate to the case. Apply normal accuracy, relevance, confidentiality, security, and credential rules.

## Address and phone/contact data

For exact private address/phone matching, read `.cursor/mem/privacy-address-phone.md`. Those private values may remain in private configuration and must not be echoed into logs or audit findings.

Outside an explicitly approved exception:

- never disclose an exact private residential address;
- replace private residence data with the approved generalized location when the exact value is not essential;
- if an exact location is legally/evidentially essential, caviard the protected value and preserve the contextual fact;
- distinguish private phone data from deliberately published site contact data;
- contact/email surfaces may expose approved public contact information.

Existing files under `public/assets/nabla/signature/` retain their current scoped address/phone exception. That exception does not override child-identity, parent-pseudonym, medical/psychological, or irreversible-redaction protections elsewhere.

## Medical and psychological information

Medical or psychological diagnoses, records, treatment, medication, assessments, therapy, disability information, symptoms, or equivalent sensitive health information are protected unless the user expressly authorizes a specific publication.

If such information is essential to the legal/evidentiary narrative, do not delete the existence of the evidence. Keep neutral context and caviard the sensitive content using the essential-information rule above.

## Transformation rules

Outside the owner-controlled homepage/index exception:

- Child ordinary/editorial copy → **Bababou** or **my daughter**.
- Child legal/official-derived copy → **the child**.
- Father anonymized/legal copy → **the father** or preferably **Mr A** in legal-style documents.
- Mother anonymized/legal copy → **the mother** or preferably **Ms B** in legal-style documents.
- Ordinary public father author/contact identity, when intentionally required → **Alban Andrieu** only.
- `Mr AA` / `MR AA` → **Mr A**.
- `Ms RB` / `Mme RB` / `Mrs RB` → **Ms B**.
- Non-essential private residence/contact data → approved generalization/masking.
- Essential protected data → preserve context and use irreversible caviardage with an explicit `available on request` / `révélation sur demande` notice.

## Verification and privacy-gate behavior

For HTML/app output inspect source, public files, messages, metadata, JSON-LD, comments, attributes, generated bundles and source maps. For PDFs/images use true redaction/rasterization and verify hidden text/metadata are clean.

The privacy gate should:

- report only `file + line + category`, never the matched protected value;
- preserve the narrow, explicitly approved homepage/index exception rather than automatically rewriting or failing it;
- reject homepage-only identity when it leaks to unrelated public surfaces;
- reject deprecated aliases outside the exception and accept `Mr A` / `Ms B`;
- distinguish intentionally public contact data from private address/phone data;
- allow explicitly approved identifier/document exceptions only within scope;
- not treat institutions, professionals, professional emails, or historical map/location links as privacy findings by default.

Tests should use synthetic identities/contact values whenever possible. Exact protected spellings may be retained in the canonical detection dictionary and in narrowly scoped regression tests that lock an expressly approved homepage disclosure or prove a leak is blocked.

## Agent editing rule

Before modifying family/legal/publication content, read this entire skill.

- **Never alter `public/index.html`, `/`, or their homepage Open Graph/Twitter/JSON-LD identity disclosures for privacy/pseudonymization reasons without explicit user approval in the current task.**
- Audit those surfaces first and show the disclosure impact before asking for approval.
- Outside that exception, apply `Bababou` / `the child`, `Mr A`, and `Ms B` as defined above.
- Do not clean up the detection dictionary merely because it contains protected spellings.
- When information appears essential, **caviard rather than silently delete or invent a substitute**, and add a visible note that the protected information can be revealed on request.
- Never claim a surface is compliant until the source and generated output have both been checked.
