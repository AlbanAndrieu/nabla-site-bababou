---
name: protect-family-privacy
description: >-
  Canonical Bababou publication policy for family, legal, contact, identity,
  image, metadata, and generated content. Apply contextual pseudonymization and
  irreversible redaction while preserving owner-controlled homepage exceptions
  and information genuinely necessary to understand the case.
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

## Owner-approved dedicated RSS contact exception

The user explicitly approved a dedicated public RSS contact artifact in the current task so the child can find a neutral invitation to make contact.

This exception is limited to:

- `public/eleonore-feed.xml`;
- the exact accented given-name display `Éléonore` inside that feed;
- neutral recognition/contact wording that points to the site's already-public contact route.

The exception **does not** authorize publishing spelling variants, middle/family names, the complete legal identity, private address/phone data, legal allegations, case details, medical/psychological information, or copying the given name into unrelated Next routes, message catalogs, metadata, generated output, assets, or other feeds.

RSS discovery labels outside the dedicated XML artifact must remain generic and must not repeat the protected given name. The privacy gate must scan the dedicated feed itself and retain all non-identity protections there.

Any extension of this exception to another publication surface requires new explicit user approval.

## Legacy static 404 rendering exception

`public/404.html`, the public `/404` presentation, and the `app/global-not-found.tsx` integration that loads the static 404 body are an **intentional rendering exception to the Next.js migration**.

The current static 404 presentation is preferred over a fully native React/Next rewrite and must be preserved unless the user explicitly approves a migration in the current task.

Agents must therefore:

- keep `public/404.html` as the rendering source of truth for the custom 404 presentation;
- keep `app/global-not-found.tsx` loading the trusted static body via `loadPublicHtmlFragment("404.html", ...)` (or an equivalent static-fragment integration that preserves the same rendered result);
- preserve the current visual effect, layout, copy, animations, home CTA, analytics integration, widget integration, 404 HTTP status, and `noindex` behavior;
- **not replace the 404 with fully native Next/React markup or migrate its styling wholesale into a CSS module merely for architectural consistency**;
- not remove `public/404.html` as dead/legacy code while this exception is active;
- treat Playwright assertions covering the static cloak/style behavior as intentional regression contracts rather than obsolete implementation details.

Safety, compatibility, accessibility, or browser fixes may be made around the static integration when they preserve the established rendered behavior. Any architectural change that would stop loading `public/404.html` requires explicit user approval first.

## Mandatory pseudonyms outside recognition/contact exceptions

### Child

Outside the owner-controlled homepage/index exception and the dedicated RSS contact exception:

- **Do not publish the child's legal identity in ordinary legal/editorial pages or documents.**
- French legal/official wording: use **l'enfant**; first-person narrative may use **ma fille** when that wording is materially clearer.
- English legal/official wording: use **the child**; first-person narrative may use **my daughter**.
- **Do not use `Bababou` in legal, official, evidentiary or administrative documents/pages.** It is a personal nickname reserved for personal/homepage recognition contexts.
- Metadata, titles, Open Graph/Twitter tags, JSON-LD, alt text, attributes, comments, generated bundles, source maps, filenames, tests and fixtures follow the same rule unless they are inside an explicitly approved recognition surface.

### Father

The father's identity is **not classified as confidential personal data**, but it is normalized outside recognition/contact surfaces to reduce unnecessary exposure and institutional pressure.

- On family-case, legal, court, police, administrative, evidentiary or closely derived pages/documents, use **Mr A** as the canonical legal alias.
- In natural French prose after the alias has been established, **le père** is acceptable; in English prose, **the father** is acceptable.
- Do not expand the father's full legal identity in those documents merely because it is available in a source.
- On the homepage/index and the site's principal Contact/Email surfaces, the father's public identity may remain visible so the child can identify and contact him.
- Ordinary author/contact/editorial surfaces unrelated to the family case may use **Alban Andrieu** when intentionally required.

### Mother

The mother's identity is generally normalized on family-case/legal material even though names and ordinary contact coordinates are not treated as inherently secret.

- French legal/editorial alias: **Mme B**.
- English legal/editorial alias: **Ms B**.
- In natural prose after the alias has been established, **la mère** / **the mother** is acceptable.
- Use the real identity only when it is essential to identify a source, professional/public record, or other owner-approved evidentiary context.

### Alias normalization

Normalize older aliases when encountered in family/legal publication material:

- `Mr AA`, `M. AA`, `MR AA` or equivalent two-letter father aliases → **Mr A** (French display may use **M. A.** where typography requires it);
- `Ms RB`, `Mme RB`, `Mrs RB` or equivalent two-letter mother aliases → **Mme B** in French / **Ms B** in English.

Do not treat these identity rewrites as secret-data findings. They are **REWRITE** findings: publication is blocked until the public copy uses the canonical alias, but the original value does not need to be treated as a secret in local audit storage.

## Recognition and contact surfaces

The site has a legitimate recognition/contact purpose: the child must be able to identify the father and contact him.

The following surfaces may intentionally expose the father's public identity and approved contact mechanisms:

- owner-controlled homepage/index;
- principal Contact pages;
- principal Email pages;
- the dedicated RSS recognition/contact artifact.

On non-contact pages, prefer a link to the Contact page over duplicating the father's contact coordinates.

The father's phone number is **not considered highly sensitive**, but outside Contact/Email surfaces it should normally be rendered in masked form ending in **XX** or replaced by a Contact-page link. Full display on an intentional Contact/Email surface is allowed.

The child's legal identity or official identifier remains scoped: recognition information may be exposed only on an explicitly approved recognition/contact surface. Do not copy it into ordinary legal pages or documents merely because it is useful for recognition.

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

- owner-controlled homepage/index disclosures;
- principal Contact/Email recognition surfaces for the father's public identity/contact details;
- dedicated RSS contact exception for the child's approved recognition wording;
- official identifier `14CV32249` on its currently approved homepage scope;
- `public/assets/passport-fr-bababou-4.png` on its currently approved homepage scope.

The child's French passport identifier may be retained only on an explicitly approved recognition surface when its purpose is to help the child recognize/find the father. It is **not** a general publication exception for legal pages, downloads, metadata, logs or unrelated documents.

Official identifiers belonging to adults or institutions are not automatically confidential. They may be published when relevant and lawful, but the publication review must still consider fraud/impersonation risk and source reliability.

Judicial, administrative and case references are materially important to the site's accountability purpose and should normally remain public so third parties can locate and verify the underlying proceedings.

## Institutions, organizations, professionals, and historical locations

Institutions and people working for them may be named when relevant to documented case history, including institutions, professionals/staff/officials, professional identities and email addresses, and relevant historical location/map links.

Do not remove or generalize these solely because they relate to the case. Apply normal accuracy, relevance, confidentiality, security, and credential rules.

## Address, phone, email and ordinary contact data

Ordinary names, professional identities, professional emails, institutional contacts and addresses are generally publishable when relevant.

- **Child residential/current address:** BLOCK. Do not publish an exact current/private address of the child.
- Other historical/private addresses are not automatically confidential under this repository policy, but avoid gratuitous publication when they add no evidentiary value.
- Institutional/court/ministry/law-firm addresses are publishable.
- The father's phone is not highly sensitive; outside Contact/Email surfaces, prefer the masked form ending in **XX** or a link to Contact.
- Professional/institutional phone numbers and emails are publishable.
- Ordinary adult personal emails/phones are not automatically BLOCK findings; publication should still be relevant and proportionate.
- Never place protected contact values in CI logs or audit output merely to prove detection.

## Special-category, medical and psychological information

Treat GDPR-style special-category personal data as genuinely sensitive, including in particular:

- health, medical, psychological or psychiatric data;
- religious or philosophical beliefs;
- sexual orientation/sex-life information;
- political opinions or affiliation where disclosure is not already intentionally public and relevant;
- trade-union membership;
- genetic/biometric data used to identify a person.

Medical or psychological information must **not** be published merely because it appears in correspondence. If it comes from a verifiable source such as a physician, laboratory result, psychologist or equivalent professional record, publication still requires **explicit owner approval for that specific content**.

Unverified medical/psychological allegations, diagnoses or speculation should not be presented as fact. Preserve only the existence of the allegation/evidence when legally necessary, with a redaction marker or neutral attribution.

## Father's financial and anti-pressure protection

The father's financial details are **BLOCK** data for public family/legal material. Do not publish bank-account details, IBAN/BIC, card/payment identifiers, balances, salary/pay slips, tax returns, precise income, assets, debts, financial account screenshots or equivalent financial-capacity evidence.

A legal fact that a financial dispute/obligation exists may be described when necessary, but redact operational figures/account details unless the owner explicitly approves the exact disclosure.

Apply heightened caution where disclosure could enable coercion, retaliation, asset pressure or procedural leverage by foreign authorities or institutions. When the legal fact is important but operational detail creates such a risk, keep the fact and use:

- French: `[████ — information sensible disponible sur demande]`;
- English: `[████ — sensitive information available on request]`.

## Legal and institutional accountability material

Legal allegations, court history, institutional correspondence and documented procedural failures are not automatically confidential. They may be published when they serve the site's accountability purpose, provided that:

- statements are attributed to their source and not silently converted from allegation to established fact;
- judicial/administrative references needed for external verification remain visible;
- sensitive special-category/financial data is handled under the stricter rules above;
- where publication of a specific operational detail could materially increase retaliation/coercion risk against the father, retain the legal meaning but move the risky detail behind an `available on request` redaction marker.

## Transformation rules

Outside recognition/contact exceptions:

- Child legal/official copy → **l'enfant / the child**.
- Child first-person narrative → **ma fille / my daughter** where natural.
- Do not use **Bababou** in legal/official/evidentiary pages or documents.
- Father family/legal copy → **Mr A**; subsequent prose may use **le père / the father**.
- Mother family/legal copy → **Mme B** (FR) / **Ms B** (EN); subsequent prose may use **la mère / the mother**.
- Father's full phone outside Contact/Email → masked form ending in **XX** or Contact-page link.
- Child current/private address → irreversible redaction.
- Father's financial details → irreversible redaction unless a later explicit owner decision authorizes a narrow disclosure.
- Verified medical/psychological or other special-category data → **REVIEW requiring explicit owner approval** before publication.
- Judicial/administrative references → preserve when relevant for verification.
- High retaliation/coercion-risk operational detail → preserve the fact/context and use an explicit `available on request` marker.

## Verification and privacy-gate behavior

For HTML/app output inspect source, public files, messages, metadata, JSON-LD, comments, attributes, generated bundles and source maps. For PDFs/images use true redaction/rasterization and verify hidden text/metadata are clean.

Privacy findings use three dispositions:

- **BLOCK** — genuinely sensitive or security-relevant data must not enter the public artifact.
- **REWRITE** — not secret, but the publication copy must be normalized/pseudonymized before release.
- **REVIEW** — publication needs explicit human/owner judgment, often because source validity, child imagery, special-category data or retaliation risk matters.

The privacy tooling should:

- report only file/line/category/disposition, never the matched protected value;
- treat child legal identity outside recognition surfaces as **REWRITE**, not as a generic secret;
- treat father/mother family-case identities as **REWRITE** to **Mr A** / **Mme B** (or **Ms B** in English);
- treat the father's full phone outside Contact/Email as **REWRITE**, normally to the masked form or a Contact link;
- not flag professional/institutional phones, emails or addresses merely because they are contact data;
- preserve judicial/administrative case references by default;
- treat health/special-category data as **REVIEW** requiring explicit approval;
- treat father's financial details and the child's current/private address as **BLOCK**;
- treat child photos/images as **REVIEW** unless already covered by an explicit scoped exception; an unblurred child photo must not be published without explicit approval;
- preserve the existing homepage/RSS exceptions only in their exact scopes;
- never turn an existing narrow passport/identifier exception into a general document-publication permission.

Tests should use synthetic values whenever possible. Exact protected spellings may remain in the canonical detection dictionary and narrowly scoped contracts.

## Agent editing rule

Before modifying family/legal/publication content, read this entire skill.

- Never alter owner-controlled homepage/index recognition disclosures without explicit approval for that specific change.
- Never replace the `public/404.html`-backed 404 with a fully native Next/React implementation without explicit approval.
- On family/legal content, normalize identities to **Mr A**, **Mme B/Ms B**, and **l'enfant/the child** as defined above.
- Keep the father's real identity/contact discoverable on the principal recognition/contact surfaces.
- Do not use **Bababou** as the child's name in official/legal/evidentiary material.
- Treat health/special-category data as requiring explicit owner approval even when sourced.
- Protect father's financial/operational data and details that could facilitate institutional coercion or retaliation.
- Preserve case references and verifiable institutional facts when publication serves accountability.
- For child imagery, default to no publication; a blurred/rasterized version is only acceptable within a scoped approval, and if uncertain ask the owner explicitly.
- When protected information is essential, caviard rather than silently delete or invent a substitute, and state that the information is available on request when appropriate.
- Never claim a surface compliant until source and generated output have both been checked.
