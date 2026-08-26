---
name: protect-family-privacy
description: Apply the Bababou publication policy to family, legal, contact, identity, image, metadata, and generated content. Protect the child's legal identity and private family data while preserving explicitly approved identity evidence, public contact information, institutions, professionals, and factual case history.
---

# Protect Family Privacy

Apply **contextual pseudonymization**, not blanket anonymization. The site's purpose is recognition, contact, documentation, and factual case history.

## Sources of truth

Read `references/private-rules.md` first. When present, also read `.cursor/mem/privacy-address-phone.md` for exact private address/phone matching. Never copy protected values from private configuration into reports, tests, skills, or logs.

## Child identity

The child's legal name is protected.

- In ordinary/public/editorial copy use **Bababou**.
- In text derived from official, administrative, court, police, school, or legal documents use **the child**, **the daughter**, `l’enfant`, or `ma fille` as appropriate.
- Do not publish full or partial legal-name variants in HTML, messages, metadata, JSON-LD, attributes, comments, source maps, generated bundles, filenames newly created from the identity, or audit output.

## Parents

The father's normal public identity and intentionally published contact information are allowed on editorial, contact, email, author, and recognition surfaces.

For content copied from or closely reproducing an official/legal document:

- father → **the father / le père / MR AA**;
- mother → **the mother / la mère / Mme RB**.

Do not apply this official-document anonymization rule to ordinary site copy, authorship, public contact pages, or public email/contact methods.

## Explicitly approved exceptions

The following are intentional public exceptions and MUST NOT be removed merely because they relate to identity evidence:

- official identifier **14CV32249**;
- `public/assets/passport-fr-bababou-4.png`;
- factual references to institutions, organizations, public/professional contacts, staff identities, professional email addresses, and location/map links when relevant to the case history.

An exception is narrow: it does not authorize publishing the child's legal name or unrelated private family data.

## Data that remains protected

- exact private residential address, except an existing explicitly scoped signature exception;
- private phone data except where the repository policy explicitly designates that contact information as intentionally public;
- credentials, secrets, authentication data, or live/private tracking data;
- medical or psychological diagnoses, records, treatment, medication, assessments, therapy, or equivalent sensitive health information unless the user explicitly authorizes a specific publication later.

## Transformation rules

- Replace the child's legal identity according to the context rules above.
- In official/legal-derived content replace parent legal identities with the approved role or initials.
- Keep approved public contact information intact on contact/email surfaces.
- Keep approved identifier `14CV32249` and the approved passport asset intact.
- Do not generalize or remove institutions, professionals, professional emails, or historical location links solely for privacy reasons.
- Replace protected private residence data with the approved generalized location from private configuration.
- Redact medical/psychological data irreversibly in documents/images; do not merely hide it visually.

## Verification

For HTML/app output inspect source, messages, metadata, JSON-LD, comments, attributes, generated bundles and source maps. For PDFs/images use true redaction/rasterization when redaction is required and verify hidden text/metadata are clean.

Privacy tooling must report only `file + line + category`; never echo the protected match. Tests must use synthetic identities and contact values, except the explicitly approved identifier may appear in a regression test.

When rules conflict, this skill and `references/private-rules.md` are authoritative for this repository.