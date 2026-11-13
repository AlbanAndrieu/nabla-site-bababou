import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import { routing, type AppLocale } from "@/i18n/routing";
import { listPublicContacts, publicContactTree, type ContactNode } from "@/lib/peopleContactedPublic";
import { localizedPageMetadata } from "@/lib/siteSocialMetadata";
import styles from "./page.module.css";

export const dynamic = "force-static";

const COPY = {
  fr: {
    title: "Personnes et institutions contactées", description: "Démarches déclarées auprès de personnes et institutions en Europe.",
    intro: "Vue publique et descriptive des démarches de contact. Les noms et appréciations sont présentés comme des déclarations du propriétaire, et non comme des constats indépendants.",
    illustration: "Illustration symbolique du réseau de démarches en Europe, centrée sur la France, la Norvège et l’Allemagne.",
    caption: "Illustration symbolique : les points du dessin ne représentent pas des contacts individuellement vérifiés.",
    fullImage: "Voir l’illustration en grand", tree: "Arbre des interlocuteurs", cards: "Personnes et institutions citées",
    treeNote: "Ouvrir les catégories pour consulter les interlocuteurs. L’arbre est accessible au clavier.",
    recorded: "Entrées publiques du registre", reported: "Déclaration du propriétaire", source: "Site de l’institution",
    email: "Adresse de contact", special: "Remerciement adressé à la Maison royale de Norvège",
    specialText: "Le propriétaire indique avoir reçu une réponse courtoise à sa correspondance ; la Maison royale précisait ne pas pouvoir intervenir.",
    home: "Retour à l’accueil", sourcePage: "Consulter l’archive HTML historique", other: "Autres",
  },
  en: {
    title: "People and institutions contacted", description: "Reported outreach to people and institutions across Europe.",
    intro: "A public overview of reported outreach. Names and comments reflect the owner's account, not independently verified conclusions.",
    illustration: "Symbolic map of outreach across Europe, highlighting France, Norway and Germany.",
    caption: "Symbolic illustration; map points are not individually verified contacts.",
    fullImage: "View full-size illustration", tree: "Contact tree", cards: "People and institutions listed",
    treeNote: "Expand categories to explore the contact tree. Keyboard accessible.",
    recorded: "Public directory entries", reported: "Owner-reported", source: "Institution website",
    email: "Contact email", special: "Thanks to the Royal House of Norway",
    specialText: "The site owner reports receiving a courteous reply explaining that the Royal House could not intervene.",
    home: "Back to home", sourcePage: "View original historical HTML", other: "Other",
  },
  de: {
    title: "Kontaktierte Personen und Institutionen", description: "Berichtete Kontaktversuche mit Personen und Institutionen in Europa.",
    intro: "Öffentliche Übersicht der berichteten Kontaktversuche. Namen und Bewertungen stammen vom Seiteninhaber und sind keine unabhängig geprüften Feststellungen.",
    illustration: "Symbolische Karte der Kontakte in Europa mit Schwerpunkt Frankreich, Norwegen und Deutschland.",
    caption: "Symbolische Darstellung; die Punkte sind keine einzeln belegten Kontakte.",
    fullImage: "Illustration in voller Größe", tree: "Kontaktbaum", cards: "Genannte Personen und Institutionen",
    treeNote: "Kategorien aufklappen, um den Kontaktbaum zu erkunden. Tastaturbedienbar.",
    recorded: "Einträge des öffentlichen Verzeichnisses", reported: "Angaben des Seiteninhabers", source: "Website der Institution",
    email: "Kontakt-E-Mail", special: "Dank an das norwegische Königshaus",
    specialText: "Der Seiteninhaber berichtet von einer höflichen Antwort, die erklärte, dass das Königshaus nicht eingreifen könne.",
    home: "Zur Startseite", sourcePage: "Historisches HTML öffnen", other: "Sonstige",
  },
  no: {
    title: "Personer og institusjoner som er kontaktet", description: "Rapporterte kontaktforsøk med personer og institusjoner i Europa.",
    intro: "Offentlig oversikt over rapporterte kontaktforsøk. Navn og vurderinger gjenspeiler nettstedseierens opplysninger, ikke uavhengig verifiserte funn.",
    illustration: "Symbolsk kart over kontaktarbeid i Europa, med vekt på Frankrike, Norge og Tyskland.",
    caption: "Symbolsk illustrasjon; punktene er ikke enkeltvis dokumenterte kontakter.",
    fullImage: "Se illustrasjonen i full størrelse", tree: "Kontakttre", cards: "Oppførte personer og institusjoner",
    treeNote: "Åpne kategoriene for å utforske kontakttreet. Tastaturtilgjengelig.",
    recorded: "Oppføringer i offentlig katalog", reported: "Opplyst av nettstedseier", source: "Institusjonens nettsted",
    email: "Kontakt-e-post", special: "Takk til det norske kongehuset",
    specialText: "Nettstedseieren opplyser å ha mottatt et høflig svar om at kongehuset ikke kunne gripe inn.",
    home: "Tilbake til forsiden", sourcePage: "Se historisk HTML-arkiv", other: "Annet",
  },
} as const satisfies Record<AppLocale, Record<string, string>>;

const FLAG: Record<string, string> = {
  Norway: "🇳🇴", France: "🇫🇷", Germany: "🇩🇪", International: "🌐", Others: "🤝",
};

function safeHref(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const target = new URL(value);
    return ["https:", "http:"].includes(target.protocol) && !target.username && !target.password ? target.href : null;
  } catch { return null; }
}

function ContactBranch({ node, depth = 0 }: { node: ContactNode; depth?: number }) {
  const children = node.children ?? [];
  const href = safeHref(node.url);
  if (children.length === 0) {
    return <li className={styles.leaf}>{href
      ? <a href={href} target="_blank" rel="noopener noreferrer">{node.name}</a>
      : <span>{node.name}</span>}</li>;
  }
  return (
    <li>
      <details open={depth === 0} className={styles.branch}>
        <summary>{depth === 0 ? <span aria-hidden="true">{FLAG[node.name] ?? "🏛️"} </span> : null}{node.name}</summary>
        <ul>
          {children.map((child, index) =>
            <ContactBranch key={`${node.name}-${index}-${child.name}`} node={child} depth={depth + 1} />)}
        </ul>
      </details>
    </li>
  );
}

export async function generateMetadata({ params }: PageProps<"/[locale]/people-contacted">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = COPY[locale];
  return localizedPageMetadata("people-contacted", locale, c.title, c.description);
}

export default async function PeopleContactedPage({ params }: PageProps<"/[locale]/people-contacted">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const c = COPY[locale];
  const nodes = publicContactTree().children ?? [];
  const contacts = listPublicContacts();
  const groups = new Map<string, typeof contacts>();
  for (const item of contacts) {
    const key = `${item.country}::${item.institution}`;
    const entries = groups.get(key) ?? [];
    entries.push(item);
    groups.set(key, entries);
  }
  return (
    <>
      <TopAnchor />
      <main id="main-content" className={styles.page}>
        <Container>
          <header className={styles.header}>
            <p><Link href="/">{c.home}</Link></p>
            <h1>{c.title}</h1>
            <p>{c.intro}</p>
            <figure className={styles.figure}>
              <Image src="/assets/people-contacted-europe.avif" alt={c.illustration}
                width={1672} height={941} sizes="(max-width: 70rem) 100vw, 70rem" unoptimized />
              <figcaption>{c.caption} <a href="/assets/people-contacted-europe.avif">{c.fullImage}</a></figcaption>
            </figure>
          </header>

          <section className={styles.note} aria-labelledby="people-special-thanks">
            <h2 id="people-special-thanks">{c.special}</h2>
            <p>{c.specialText}</p>
          </section>

          <section aria-labelledby="people-tree-heading" className={styles.section}>
            <h2 id="people-tree-heading">{c.tree}</h2>
            <p>{c.treeNote}</p>
            <ul className={styles.tree} data-testid="people-react-tree">
              {nodes.map((node, i) => <ContactBranch key={`${i}-${node.name}`} node={node} />)}
            </ul>
          </section>

          <section aria-labelledby="people-cards-heading" className={styles.section}>
            <h2 id="people-cards-heading">{c.cards}</h2>
            <p>{c.recorded} : {contacts.length}. {c.reported}.</p>
            {[...groups.entries()].map(([key, entries]) => {
              const [country, institution] = key.split("::");
              return (
                <section key={key} className={styles.country} aria-label={`${country} — ${institution}`}>
                  <h3><span aria-hidden="true">{FLAG[country] ?? "🏛️"} </span>{country} · {institution}</h3>
                  <ul className={styles.cards}>
                    {entries.map((item, i) => (
                      <li className={styles.card} key={`${item.name}-${i}`}>
                        <h4>{item.url
                          ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a>
                          : item.name}</h4>
                        {item.comment ? <p>{c.reported} : {item.comment}</p> : null}
                        {item.email ? <a href={`mailto:${item.email}`}>{c.email}</a> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </section>
          <p className={styles.archive}><a href="/people-contacted.html">{c.sourcePage}</a></p>
        </Container>
      </main>
    </>
  );
}
