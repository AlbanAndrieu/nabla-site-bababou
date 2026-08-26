---
name: protect-family-privacy
description: Canonical Bababou publication policy for family, legal, contact, identity, image, metadata, and generated content. Protect the child's identity by context while preserving explicitly approved evidence, public contact information, institutions, professionals, and factual case history.
---

# Protect Family Privacy

Apply **contextual pseudonymization**, not blanket anonymization. The site's purpose is recognition, contact, documentation, and factual case history.

## Canonical source of truth

This file is the **single canonical privacy policy** for the repository.

Compatibility/adaptor files may point here, but they must not redefine or fork the rules:

- `.agents/protect-family-privacy/SKILL.md`;
- `.agents/skills/protect-family-privacy/references/private-rules.md`;
- `.cursor/rules/200_anonymization-legal.mdc`.

When older repository guidance conflicts with this file, **this file wins**.

The identity dictionary below is an intentional exception to the general rule against copying protected identity data into agent instructions. **Do not delete, hash, sanitize, or replace these values inside this skill.** Agents need the real spellings and variants to detect accidental publication elsewhere.

## Protected identity detection dictionary — intentionally retained

These values are detection/reference data. Their presence **inside this canonical skill is allowed** and does not by itself authorize publication elsewhere.

### Child

Known legal-name tokens and spelling/accent variants to recognize:

- given name: `Éléonore`, `Eléonore`, `Eleonore`, `Elenore`;
- middle name: `Céleste`, `Celeste`;
- family names: `ANDRIEU`, `BROOKE`;
- combined form to recognize: `Éléonore Céleste ANDRIEU BROOKE`, including equivalent accentless/spelling variants such as `Eleonore Celeste ANDRIEU BROOKE` and `Elenore Celeste ANDRIEU BROOKE`.

The family names overlap with the parents, so `ANDRIEU` or `BROOKE` alone must **not** be treated as proof that the child's identity is being published. Use context and the other child-name tokens.

### Father

Legal identity to recognize in official/legal-derived material:

- `Alban Eric Alexandre ANDRIEU`;
- tokens/variants to retain for detection: `Alban`, `Eric`, `Alexandre`, `ANDRIEU`.

### Mother

Legal identity to recognize in official/legal-derived material:

- `Rachael Elaine BROOKE`;
- tokens/variants to retain for detection: `Rachael`, `Elaine`, `BROOKE`.

These parent names are **not globally private**. Their treatment depends on context as defined below.

## Child publication policy

The child's legal identity is protected by default.

- In ordinary/public/editorial copy use **Bababou**.
- In text derived from official, administrative, court, police, school, or legal documents use **the child**, **the daughter**, `l’enfant`, or `ma fille` as appropriate.
- Do not publish the child's legal-name variants in metadata, JSON-LD, titles, descriptions, attributes, comments, generated bundles, source maps, newly created filenames, or audit output unless the homepage exception below explicitly allows it.

### Homepage display-name exception

`public/index.html` is the only public surface allowed to identify the child by the approved display identity **`Éléonore (Bababou)`**.

On that file only:

- `Éléonore (Bababou)` may be used in visible headings, recognition/contact copy, the passport card, the HTML title, Open Graph/Twitter metadata and index-specific JSON-LD;
- the recognition sentence may keep the given name alone in `Your real name is Éléonore` and its immediately associated explanatory sentence;
- prefer the combined display form `Éléonore (Bababou)` whenever the name is used as a label, heading, social preview identity or standalone reference;
- this does **not** authorize the middle name, family names, complete legal identity, accentless variants or alternative spellings on the index;
- every other public/editorial surface continues to use `Bababou` unless the user gives a newer explicit exception.

Do not remove this homepage identity or narrow the exception back to a single sentence without an explicit user instruction.

## Parents

The father's normal public identity and intentionally published contact information are allowed on editorial, contact, email, author, recognition, and comparable public-contact surfaces.

For content copied from or closely reproducing an official/legal document:

- father → **the father / le père / MR AA**;
- mother → **the mother / la mère / Mme RB**.

Do not apply official-document parent anonymization to ordinary site copy, authorship, public contact pages, or intentionally public email/contact methods.

## Explicitly approved identity/document exceptions

The following are intentional public exceptions and **must not be removed merely because they relate to identity evidence**:

- homepage display identity `Éléonore (Bababou)` as scoped above;
- official identifier `14CV32249`;
- `public/assets/passport-fr-bababou-4.png`.

These exceptions do not authorize publication of the child's complete legal identity outside the detection dictionary in this skill.

## Institutions, organizations, professionals, and historical locations

Institutions and people working for them may be named when relevant to the documented case history. This includes:

- institutions and organizations;
- professionals, staff, officials, and other relevant people;
- professional identities and professional email addresses;
- relevant historical location/map links.

Do not remove or generalize these solely because they relate to the case. Apply normal accuracy, relevance, security, and credential rules.

## Address and phone/contact data

For exact private address/phone matching, read `.cursor/mem/privacy-address-phone.md`. Those private values may remain in that private configuration and must not be echoed into logs or audit findings.

- Never disclose the exact private residential address outside an existing explicitly scoped exception.
- Replace private residence data with the approved generalized location from the private configuration when required.
- Distinguish private phone data from deliberately published site contact data.
- Contact/email surfaces may expose the father's approved public contact information.
- Do not make Bababou contact/email pages unnecessarily diverge from the public contact model used by `nabla-site-alban` solely because a contact field resembles private data.

Existing files under `public/assets/nabla/signature/` retain their current scoped address/phone exception. That directory exception does not override child-identity or medical/psychological protections.

## Data that remains protected

- the child's full legal identity, middle name and family-name combinations on public surfaces;
- the child's given-name variants outside the approved `public/index.html` forms;
- exact private residential address outside the scoped exception;
- genuinely private phone/contact data outside explicitly public contact surfaces;
- credentials, secrets, authentication data, or live/private tracking data;
- medical or psychological diagnoses, records, treatment, medication, assessments, therapy, or equivalent sensitive health information unless the user later authorizes a specific publication.

## Transformation rules

- On `public/index.html`, preserve the approved display identity `Éléonore (Bababou)` and the recognition sentence described above.
- On other ordinary public/editorial surfaces replace child legal-name variants with `Bababou`.
- In official/legal-derived content replace the child's legal identity with role wording and parent legal identities with the approved roles or initials.
- Keep approved public contact information intact on contact/email surfaces.
- Keep approved identifier `14CV32249` and the approved passport asset intact.
- Keep relevant institutions, professionals, professional emails, and historical location links unless another concrete reason requires removal.
- Replace protected private residence data with the approved generalized location.
- Redact protected medical/psychological data irreversibly in documents/images; do not merely hide it visually.

## Verification and privacy-gate behavior

For HTML/app output inspect source, messages, metadata, JSON-LD, comments, attributes, generated bundles and source maps. For PDFs/images use true redaction/rasterization when redaction is required and verify hidden text/metadata are clean.

The privacy gate should:

- report only `file + line + category`, never the matched protected value;
- allow exact `Éléonore (Bababou)` occurrences on `public/index.html` plus the approved recognition sentence, while rejecting child legal-name variants elsewhere;
- allow the approved identifier and passport asset;
- distinguish intentionally public father contact data from private address/phone data;
- not treat institutions, professionals, professional emails, or historical map/location links as privacy findings by default.

Tests should use synthetic identities/contact values whenever possible. Regression tests may use the exact approved homepage display identity/recognition forms when necessary to ensure these exceptions are neither accidentally removed nor broadened.

## Agent editing rule

When modifying privacy controls, first read this entire skill. Preserve the detection dictionary and explicit exceptions unless the user gives a newer instruction. Do not "clean up" the real names from this file: keeping them here is deliberate so future agents can recognize them elsewhere.
