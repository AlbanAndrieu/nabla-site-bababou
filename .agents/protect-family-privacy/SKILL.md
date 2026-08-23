---
name: protect-family-privacy
description: Audit, classify, redact, or rewrite personal and family data before public release while preserving the minimum information needed for a missing or abducted child to recognize and contact a parent. Use for websites, repositories, documents, PDFs, images, legal narratives, contact pages, metadata, logs, or publication reviews involving Alban Andrieu, the child, relatives, addresses, phone numbers, health information, psychological information, or family proceedings.
---

# Protect Family Privacy

Protect family data without defeating the site's legitimate reunification purpose. Apply data minimization, not blanket anonymization.

## Load the private rules

Read [references/private-rules.md](references/private-rules.md) before inspecting, drafting, or publishing relevant content. Treat that file as private configuration: use its values to detect and transform data, but never quote the original protected values in the response.

When working in a repository, also read `.cursor/mem/privacy-address-phone.md` if it exists. Treat it as the authoritative project-specific source, but never copy its unmasked protected values into reports, generated documentation, or the skill.

## Classify before changing

Assign each item to one category:

1. **Necessary for recognition or contact** — retain only when it materially helps the child recognize the parent, verify identity, or establish safe contact. Examples may include the parent's public name, a stable public contact method, a general geographic area, and carefully selected shared context.
2. **Private or excessive** — mask, generalize, or remove. This includes exact home addresses, private phone suffixes, credentials, official identifier numbers, live location, school, routines, and unnecessary third-party data.
3. **Medical or psychological** — always redact from public output with an opaque black mask, including diagnoses, treatment, medication, disability, assessments, symptoms, therapy, and medical or psychological records.
4. **Case narrative** — retain only facts necessary to explain the search or establish authenticity. Prefer neutral, dated, attributable wording. Remove gratuitous intimate details and unverified medical or psychological characterizations.

Do not infer that all identifying data must be removed merely because the subject is a child. Balance the stated reunification purpose against foreseeable risks of tracking, profiling, harassment, or identity theft.

## Apply the transformation

- Replace exact private locations with the approved general location from the private rules.
- Mask the protected part of a private phone number exactly as specified.
- For plain text or source files, replace health or psychological content with `[████████ — DONNÉE MÉDICALE/PSYCHOLOGIQUE CAVIARDÉE]`.
- For rendered documents or images, use a fully opaque black rectangle and an accessible label such as “Donnée médicale ou psychologique caviardée.”
- Remove official document numbers entirely unless a verified authority specifically requires them.
- Prefer a dedicated public email address or contact form over private coordinates.
- Preserve the exception listed in the private rules only within its stated directory scope. Do not copy that exception's protected values into other public files.

## Make redaction irreversible

Never rely only on CSS overlays, highlights, blur, pixelation, white text, annotations, or removable PDF shapes.

For PDFs and images:

1. Apply true redaction or rasterize the affected page after masking.
2. Remove hidden text, annotations, form values, layers, comments, revision history, and relevant metadata.
3. Re-extract text and inspect the rendered result.
4. Search the resulting artifact for every original protected value.

For HTML and applications:

1. Remove protected values from source, JSON, comments, attributes, structured data, alternate locales, generated files, bundles, source maps, tests, fixtures, and Git-tracked assets.
2. Do not merely hide them in the UI.
3. Search the build output when available.

## Report findings safely

List:

- file or page;
- data category;
- risk;
- action: retain, generalize, mask, redact, or remove;
- safe replacement.

Never reproduce a full protected value in an audit report. Show only the approved masked form. If the user asks only for analysis, do not edit files. If the user asks for changes, modify only the authorized scope and verify the result.

When intent or necessity is ambiguous, retain the least sensitive version that still supports recognition and safe contact.
