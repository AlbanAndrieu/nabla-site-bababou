import type { AppLocale } from "@/i18n/routing";
import {
  getServiceTermsCopy,
  SERVICE_TERMS_EMAIL,
  SERVICE_TERMS_LAST_UPDATED,
} from "@/lib/serviceTerms";

function InlineContact({ text }: { text: string }) {
  const [before, after] = text.split("{email}");

  if (after === undefined) {
    return text;
  }

  return (
    <>
      {before}
      <a href={`mailto:${SERVICE_TERMS_EMAIL}`}>{SERVICE_TERMS_EMAIL}</a>
      {after}
    </>
  );
}

export default function ServiceTermsContent({ locale }: { locale: AppLocale }) {
  const copy = getServiceTermsCopy(locale);

  return (
    <>
      <h1>{copy.title}</h1>
      <p>
        <strong>{copy.lastUpdatedLabel}:</strong> {SERVICE_TERMS_LAST_UPDATED}
      </p>

      {copy.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph}>
              <InlineContact text={paragraph} />
            </p>
          ))}
          {section.bullets ? (
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </>
  );
}
