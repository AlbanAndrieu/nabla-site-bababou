import type { AppLocale } from "@/i18n/routing";

export const LEGAL_POLICY_EMAIL = "aa@bababou.com";
export const LEGAL_NOTICE_LAST_UPDATED = "2026-09-02";
export const IMPRESSUM_LAST_UPDATED = "2026-09-03";

export type LegalPolicySlug = "legal" | "impressum";

export type LegalPolicyLinkLabels = Readonly<{
  privacy: string;
  terms: string;
  home: string;
}>;

export type LegalPolicyDisclosure = Readonly<{
  summary: string;
  paragraphs: readonly string[];
}>;

export type LegalPolicySection = Readonly<{
  heading: string;
  paragraphs?: readonly string[];
  disclosure?: LegalPolicyDisclosure;
}>;

export type LegalPolicyCopy = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  title: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  intro: readonly string[];
  links: LegalPolicyLinkLabels;
  sections: readonly LegalPolicySection[];
}>;

const LEGAL_POLICY_COPY = {
  legal: {
    fr: {
      metadataTitle: "Mentions légales | Alban Andrieu",
      metadataDescription:
        "Mentions légales de bababou.com : éditeur, hébergement, résumé relatif à la vie privée et marques.",
      title: "Mentions légales",
      lastUpdatedLabel: "Dernière mise à jour",
      lastUpdated: LEGAL_NOTICE_LAST_UPDATED,
      intro: [
        "Cette page identifie les parties responsables du site bababou.com et résume la manière dont les données personnelles et la propriété intellectuelle sont traitées. Elle vise à répondre aux attentes courantes de transparence envers les visiteurs, notamment aux exigences telles que celles prévues, lorsqu’elles sont applicables, par la loi française n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique.",
      ],
      links: {
        privacy: "Politique de confidentialité",
        terms: "Conditions d’utilisation",
        home: "page d’accueil",
      },
      sections: [
        {
          heading: "Éditeur du site",
          paragraphs: [
            "Le site bababou.com est publié dans le cadre d’activités professionnelles exercées sous le nom Nabla, à La Défense, France.",
          ],
        },
        {
          heading: "Directeur de la publication",
          paragraphs: ["Alban Andrieu"],
        },
        {
          heading: "Contact",
          paragraphs: ["E-mail : {email}"],
        },
        {
          heading: "Hébergement",
          paragraphs: [
            "Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis. Informations juridiques et coordonnées complémentaires : {vercel}.",
          ],
        },
        {
          heading: "Vie privée et données personnelles (résumé)",
          paragraphs: [
            "Si vous envoyez un message ou utilisez un formulaire sur ce site, les coordonnées que vous fournissez peuvent être utilisées uniquement pour répondre à votre demande ou pour un suivi directement lié à celle-ci, sauf si une autre base juridique s’applique.",
            "En vertu du RGPD et de règles similaires, vous pouvez disposer de droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité concernant les données personnelles vous concernant. Les demandes peuvent être adressées à l’adresse électronique indiquée ci-dessus. Vous pouvez également introduire une réclamation auprès d’une autorité de contrôle, par exemple la {cnil} en France.",
            "Des cookies et technologies similaires peuvent être utilisés lorsque cela est applicable ; lorsque le consentement est requis, il est recueilli conformément aux outils de gestion des cookies du site ou aux paramètres du navigateur.",
            "Pour plus de détails, consultez la {privacy}.",
          ],
        },
        {
          heading: "Utilisation du site et responsabilité",
          paragraphs: [
            "Le contenu est fourni à titre d’information générale. Le site peut contenir des liens vers des services tiers ; ces fournisseurs sont seuls responsables de leurs propres services. Aucune garantie n’est donnée quant à l’absence d’interruption ou d’erreur du site.",
            "Pour les conditions contractuelles complètes régissant l’utilisation, consultez les {terms}.",
          ],
        },
        {
          heading: "Propriété intellectuelle et marques",
          paragraphs: [
            "Le site et son contenu (textes, éléments graphiques, logos, structure) ne peuvent être reproduits ou réutilisés sans l’accord écrit préalable du directeur de la publication, sauf dans les cas autorisés par la loi, par exemple une courte citation avec attribution.",
            "Les noms, logos et marques mentionnés sur le site appartiennent à leurs propriétaires respectifs et sont utilisés uniquement à des fins d’identification.",
          ],
        },
      ],
    },
    en: {
      metadataTitle: "Legal notices | Alban Andrieu",
      metadataDescription:
        "Legal notices for bababou.com: publisher, hosting, privacy summary, and trademarks.",
      title: "Legal notices",
      lastUpdatedLabel: "Last updated",
      lastUpdated: LEGAL_NOTICE_LAST_UPDATED,
      intro: [
        "This page identifies the parties responsible for the website bababou.com and summarises how personal data and intellectual property are treated. It is intended to meet common transparency expectations for visitors, including requirements such as those under French law no. 2004-575 of 21 June 2004 on confidence in the digital economy, where applicable.",
      ],
      links: {
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        home: "homepage",
      },
      sections: [
        {
          heading: "Site publisher",
          paragraphs: [
            "The site bababou.com is published in connection with professional activities operated under the name Nabla, in La Défense, France.",
          ],
        },
        {
          heading: "Publication director",
          paragraphs: ["Alban Andrieu"],
        },
        {
          heading: "Contact",
          paragraphs: ["Email: {email}"],
        },
        {
          heading: "Hosting",
          paragraphs: [
            "The site is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, United States. Further legal and contact information: {vercel}.",
          ],
        },
        {
          heading: "Privacy & personal data (summary)",
          paragraphs: [
            "If you send a message or use a form on this site, the contact details you provide may be used only to respond to your request or for follow-up that is directly related to it, unless a separate legal basis applies.",
            "Under the GDPR and similar rules you may have rights of access, rectification, erasure, restriction, objection, and portability regarding personal data concerning you. Requests can be sent to the email address above. You may also lodge a complaint with a supervisory authority, for example the {cnil} in France.",
            "Cookies and similar technologies may be used where applicable; where consent is required, it is collected in line with the site’s cookie tools or browser settings.",
            "For full detail, see the {privacy}.",
          ],
        },
        {
          heading: "Use of the site & liability",
          paragraphs: [
            "Content is provided for general information. The site may contain links to third-party services; those providers are solely responsible for their own services. No guarantee is given that the site will be uninterrupted or error-free.",
            "For the complete contractual terms governing use, see the {terms}.",
          ],
        },
        {
          heading: "Intellectual property & trademarks",
          paragraphs: [
            "The site and its content (text, graphics, logos, structure) may not be reproduced or reused without prior written agreement from the publication director, except as allowed by law, for example a short quotation with attribution.",
            "Names, logos, and trademarks mentioned on the site belong to their respective owners and are used only for identification.",
          ],
        },
      ],
    },
    de: {
      metadataTitle: "Rechtliche Hinweise | Alban Andrieu",
      metadataDescription:
        "Rechtliche Hinweise für bababou.com: Herausgeber, Hosting, Kurzfassung zum Datenschutz und Marken.",
      title: "Rechtliche Hinweise",
      lastUpdatedLabel: "Zuletzt aktualisiert",
      lastUpdated: LEGAL_NOTICE_LAST_UPDATED,
      intro: [
        "Diese Seite nennt die für die Website bababou.com verantwortlichen Parteien und fasst zusammen, wie personenbezogene Daten und geistiges Eigentum behandelt werden. Sie soll den üblichen Transparenzanforderungen gegenüber Besuchern entsprechen, einschließlich gegebenenfalls solcher Anforderungen, die sich aus dem französischen Gesetz Nr. 2004-575 vom 21. Juni 2004 über das Vertrauen in die digitale Wirtschaft ergeben.",
      ],
      links: {
        privacy: "Datenschutzerklärung",
        terms: "Nutzungsbedingungen",
        home: "Startseite",
      },
      sections: [
        {
          heading: "Herausgeber der Website",
          paragraphs: [
            "Die Website bababou.com wird im Zusammenhang mit beruflichen Tätigkeiten veröffentlicht, die unter dem Namen Nabla in La Défense, Frankreich, ausgeübt werden.",
          ],
        },
        {
          heading: "Verantwortlicher für die Veröffentlichung",
          paragraphs: ["Alban Andrieu"],
        },
        {
          heading: "Kontakt",
          paragraphs: ["E-Mail: {email}"],
        },
        {
          heading: "Hosting",
          paragraphs: [
            "Die Website wird von Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, Vereinigte Staaten, gehostet. Weitere rechtliche Informationen und Kontaktdaten: {vercel}.",
          ],
        },
        {
          heading: "Datenschutz und personenbezogene Daten (Kurzfassung)",
          paragraphs: [
            "Wenn Sie eine Nachricht senden oder ein Formular auf dieser Website verwenden, dürfen die von Ihnen angegebenen Kontaktdaten nur zur Beantwortung Ihrer Anfrage oder für eine unmittelbar damit zusammenhängende Nachverfolgung verwendet werden, sofern keine andere Rechtsgrundlage besteht.",
            "Nach der DSGVO und vergleichbaren Vorschriften können Ihnen hinsichtlich Ihrer personenbezogenen Daten Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Datenübertragbarkeit zustehen. Anfragen können an die oben angegebene E-Mail-Adresse gerichtet werden. Sie können außerdem bei einer Aufsichtsbehörde Beschwerde einlegen, beispielsweise bei der {cnil} in Frankreich.",
            "Cookies und ähnliche Technologien können eingesetzt werden, soweit dies relevant ist; sofern eine Einwilligung erforderlich ist, wird sie über die Cookie-Werkzeuge der Website oder die Browsereinstellungen eingeholt.",
            "Ausführliche Informationen finden Sie in der {privacy}.",
          ],
        },
        {
          heading: "Nutzung der Website und Haftung",
          paragraphs: [
            "Die Inhalte dienen der allgemeinen Information. Die Website kann Links zu Diensten Dritter enthalten; diese Anbieter sind ausschließlich für ihre eigenen Dienste verantwortlich. Es wird nicht garantiert, dass die Website unterbrechungs- oder fehlerfrei verfügbar ist.",
            "Die vollständigen vertraglichen Bedingungen für die Nutzung finden Sie in den {terms}.",
          ],
        },
        {
          heading: "Geistiges Eigentum und Marken",
          paragraphs: [
            "Die Website und ihre Inhalte (Texte, Grafiken, Logos, Struktur) dürfen ohne vorherige schriftliche Zustimmung des Verantwortlichen für die Veröffentlichung nicht vervielfältigt oder wiederverwendet werden, außer soweit dies gesetzlich zulässig ist, beispielsweise für ein kurzes Zitat mit Quellenangabe.",
            "Die auf der Website genannten Namen, Logos und Marken gehören ihren jeweiligen Eigentümern und werden ausschließlich zur Identifikation verwendet.",
          ],
        },
      ],
    },
    no: {
      metadataTitle: "Juridisk informasjon | Alban Andrieu",
      metadataDescription:
        "Juridisk informasjon for bababou.com: utgiver, hosting, sammendrag om personvern og varemerker.",
      title: "Juridisk informasjon",
      lastUpdatedLabel: "Sist oppdatert",
      lastUpdated: LEGAL_NOTICE_LAST_UPDATED,
      intro: [
        "Denne siden identifiserer partene som er ansvarlige for nettstedet bababou.com og oppsummerer hvordan personopplysninger og immaterielle rettigheter behandles. Den er ment å oppfylle vanlige krav til åpenhet overfor besøkende, herunder krav som følger av fransk lov nr. 2004-575 av 21. juni 2004 om tillit til den digitale økonomien, der dette er relevant.",
      ],
      links: {
        privacy: "Personvernerklæring",
        terms: "Vilkår for bruk",
        home: "forsiden",
      },
      sections: [
        {
          heading: "Utgiver av nettstedet",
          paragraphs: [
            "Nettstedet bababou.com publiseres i forbindelse med profesjonell virksomhet som drives under navnet Nabla i La Défense, Frankrike.",
          ],
        },
        {
          heading: "Publiseringsansvarlig",
          paragraphs: ["Alban Andrieu"],
        },
        {
          heading: "Kontakt",
          paragraphs: ["E-post: {email}"],
        },
        {
          heading: "Hosting",
          paragraphs: [
            "Nettstedet driftes av Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA. Ytterligere juridisk informasjon og kontaktopplysninger: {vercel}.",
          ],
        },
        {
          heading: "Personvern og personopplysninger (sammendrag)",
          paragraphs: [
            "Hvis du sender en melding eller bruker et skjema på dette nettstedet, kan kontaktopplysningene du oppgir bare brukes til å svare på forespørselen din eller til oppfølging som er direkte knyttet til den, med mindre et annet rettslig grunnlag gjelder.",
            "Etter GDPR og lignende regler kan du ha rett til innsyn, retting, sletting, begrensning, innsigelse og dataportabilitet for personopplysninger som gjelder deg. Forespørsler kan sendes til e-postadressen ovenfor. Du kan også klage til en tilsynsmyndighet, for eksempel {cnil} i Frankrike.",
            "Informasjonskapsler og lignende teknologier kan brukes der det er relevant; der samtykke kreves, innhentes det i samsvar med nettstedets verktøy for informasjonskapsler eller nettleserinnstillingene.",
            "For fullstendig informasjon, se {privacy}.",
          ],
        },
        {
          heading: "Bruk av nettstedet og ansvar",
          paragraphs: [
            "Innholdet gis som generell informasjon. Nettstedet kan inneholde lenker til tredjepartstjenester; disse leverandørene er alene ansvarlige for sine egne tjenester. Det gis ingen garanti for at nettstedet vil være uten avbrudd eller feil.",
            "For de fullstendige avtalevilkårene som regulerer bruken, se {terms}.",
          ],
        },
        {
          heading: "Immaterielle rettigheter og varemerker",
          paragraphs: [
            "Nettstedet og innholdet (tekst, grafikk, logoer, struktur) kan ikke reproduseres eller gjenbrukes uten skriftlig forhåndssamtykke fra publiseringsansvarlig, bortsett fra det som er tillatt etter loven, for eksempel et kort sitat med kildeangivelse.",
            "Navn, logoer og varemerker som er nevnt på nettstedet tilhører sine respektive eiere og brukes bare for identifikasjon.",
          ],
        },
      ],
    },
  },
  impressum: {
    fr: {
      metadataTitle: "Impressum (mentions légales) | Bababou",
      metadataDescription:
        "Impressum de bababou.com : informations relatives à l’éditeur et coordonnées du site.",
      title: "Impressum (mentions légales)",
      lastUpdatedLabel: "Dernière mise à jour",
      lastUpdated: IMPRESSUM_LAST_UPDATED,
      intro: [
        "Le terme « Impressum » désigne couramment une notice d’identification de l’éditeur dans les contextes germanophones. En Allemagne, les obligations générales d’information applicables à certains services numériques sont notamment prévues par le {ddg}, lorsqu’elles entrent dans son champ d’application. En France, l’équivalent est constitué par les mentions légales. Cette page fournit les informations relatives à l’éditeur et au contact de ce site.",
      ],
      links: {
        privacy: "Politique de confidentialité",
        terms: "Conditions d’utilisation",
        home: "page d’accueil",
      },
      sections: [
        {
          heading: "1. Éditeur et responsable du contenu",
          paragraphs: [
            "Nabla — situé dans la région parisienne, France.",
            "Contact : via la section de contact et les liens de la {home} (e-mail, Calendly ou autres moyens indiqués).",
          ],
        },
        {
          heading: "2. Objet du site",
          paragraphs: [
            "Ce site fournit des informations sur les recherches et les démarches de contact liées à l’enfant (Bababou). Il est non commercial et poursuit une finalité d’information.",
          ],
        },
        {
          heading: "3. Responsabilité",
          disclosure: {
            summary: "Documents sur ce site — note relative au traitement",
            paragraphs: [
              "Les documents fournis sur ce site ont été traités de la manière suivante : corrections orthographiques et grammaticales, anonymisation afin de protéger l’enfant, et traduction lorsque nécessaire. Pour le reste, ils demeurent aussi proches que possible de l’original.",
              "Certains documents sont absents car ils nécessitent une validation avant publication.",
            ],
          },
          paragraphs: [
            "Le contenu est fourni au mieux de nos connaissances. Nous ne garantissons ni son exhaustivité ni son exactitude. Nous ne sommes pas responsables des liens externes ni des contenus de tiers. Pour la protection des données, consultez notre {privacy} ; pour les conditions d’utilisation, consultez nos {terms}.",
          ],
        },
        {
          heading: "4. Droit d’auteur et propriété intellectuelle",
          paragraphs: [
            "Les textes, la mise en page et les contenus originaux de ce site sont protégés par le droit d’auteur. Toute reproduction ou utilisation allant au-delà d’une consultation personnelle peut nécessiter une autorisation. Consultez les {terms} pour plus de détails.",
          ],
        },
      ],
    },
    en: {
      metadataTitle: "Impressum (Legal Notice) | Bababou",
      metadataDescription:
        "Impressum (legal notice) for bababou.com. Publisher information and contact details for the website.",
      title: "Impressum (Legal Notice)",
      lastUpdatedLabel: "Last updated",
      lastUpdated: IMPRESSUM_LAST_UPDATED,
      intro: [
        "The term Impressum is commonly used for publisher-identification notices in German-speaking contexts. In Germany, general information duties applying to certain digital services are set out in the {ddg}, where its scope applies. In France the equivalent is mentions légales. This page provides the publisher and contact information for this website.",
      ],
      links: {
        privacy: "Privacy Policy",
        terms: "Terms of Use",
        home: "homepage",
      },
      sections: [
        {
          heading: "1. Publisher and responsible for content",
          paragraphs: [
            "Nabla — located in the Paris area, France.",
            "Contact: via the contact section and links on the {home} (email, Calendly, or other means indicated there).",
          ],
        },
        {
          heading: "2. Purpose of the website",
          paragraphs: [
            "This site provides information about the research and contact efforts related to the child (Bababou). It is non-commercial and for informational purposes.",
          ],
        },
        {
          heading: "3. Liability",
          disclosure: {
            summary: "Documents on this website — processing notice",
            paragraphs: [
              "Documents provided on this website have been processed as follows: spelling and grammar fixes, anonymization to protect the child, and translation when required. Otherwise they remain as close as possible to the original.",
              "Some documents are missing because they require validation before being published.",
            ],
          },
          paragraphs: [
            "Content is provided to the best of our knowledge. We do not guarantee completeness or accuracy. We are not liable for external links or third-party content. For data protection, see our {privacy}; for terms of use, see our {terms}.",
          ],
        },
        {
          heading: "4. Copyright and intellectual property",
          paragraphs: [
            "Texts, layout and original materials on this site are subject to copyright. Reproduction or use beyond personal consultation may require permission. See the {terms} for details.",
          ],
        },
      ],
    },
    de: {
      metadataTitle: "Impressum | Bababou",
      metadataDescription:
        "Impressum für bababou.com mit Angaben zum Herausgeber und Kontaktdaten der Website.",
      title: "Impressum",
      lastUpdatedLabel: "Zuletzt aktualisiert",
      lastUpdated: IMPRESSUM_LAST_UPDATED,
      intro: [
        "Der Begriff Impressum wird im deutschsprachigen Raum üblicherweise für Anbieter- oder Herausgeberangaben verwendet. In Deutschland ergeben sich allgemeine Informationspflichten für bestimmte digitale Dienste insbesondere aus dem {ddg}, soweit dessen Anwendungsbereich eröffnet ist. In Frankreich entspricht dem die mentions légales. Diese Seite enthält die Angaben zum Herausgeber und die Kontaktdaten dieser Website.",
      ],
      links: {
        privacy: "Datenschutzerklärung",
        terms: "Nutzungsbedingungen",
        home: "Startseite",
      },
      sections: [
        {
          heading: "1. Herausgeber und Verantwortlicher für den Inhalt",
          paragraphs: [
            "Nabla — ansässig im Großraum Paris, Frankreich.",
            "Kontakt: über den Kontaktbereich und die Links auf der {home} (E-Mail, Calendly oder andere dort angegebene Möglichkeiten).",
          ],
        },
        {
          heading: "2. Zweck der Website",
          paragraphs: [
            "Diese Website enthält Informationen zu Recherchen und Kontaktbemühungen im Zusammenhang mit dem Kind (Bababou). Sie ist nicht kommerziell und dient Informationszwecken.",
          ],
        },
        {
          heading: "3. Haftung",
          disclosure: {
            summary: "Dokumente auf dieser Website — Hinweis zur Verarbeitung",
            paragraphs: [
              "Die auf dieser Website bereitgestellten Dokumente wurden wie folgt bearbeitet: Rechtschreib- und Grammatikkorrekturen, Anonymisierung zum Schutz des Kindes und Übersetzung, soweit erforderlich. Im Übrigen bleiben sie so nah wie möglich am Original.",
              "Einige Dokumente fehlen, weil sie vor der Veröffentlichung validiert werden müssen.",
            ],
          },
          paragraphs: [
            "Die Inhalte werden nach bestem Wissen bereitgestellt. Für Vollständigkeit oder Richtigkeit wird keine Gewähr übernommen. Für externe Links oder Inhalte Dritter wird keine Haftung übernommen. Zum Datenschutz siehe unsere {privacy}; zu den Nutzungsbedingungen siehe unsere {terms}.",
          ],
        },
        {
          heading: "4. Urheberrecht und geistiges Eigentum",
          paragraphs: [
            "Texte, Layout und eigene Materialien auf dieser Website unterliegen dem Urheberrecht. Eine Vervielfältigung oder Nutzung über die persönliche Einsichtnahme hinaus kann eine Genehmigung erfordern. Einzelheiten finden Sie in den {terms}.",
          ],
        },
      ],
    },
    no: {
      metadataTitle: "Impressum (juridisk informasjon) | Bababou",
      metadataDescription:
        "Impressum for bababou.com med informasjon om utgiver og kontaktopplysninger for nettstedet.",
      title: "Impressum (juridisk informasjon)",
      lastUpdatedLabel: "Sist oppdatert",
      lastUpdated: IMPRESSUM_LAST_UPDATED,
      intro: [
        "Begrepet Impressum brukes vanligvis om opplysninger om utgiver eller tilbyder i tyskspråklige sammenhenger. I Tyskland følger generelle informasjonsplikter for enkelte digitale tjenester blant annet av {ddg}, når lovens virkeområde gjelder. I Frankrike er det tilsvarende mentions légales. Denne siden gir informasjon om utgiver og kontaktopplysninger for dette nettstedet.",
      ],
      links: {
        privacy: "Personvernerklæring",
        terms: "Vilkår for bruk",
        home: "forsiden",
      },
      sections: [
        {
          heading: "1. Utgiver og ansvarlig for innhold",
          paragraphs: [
            "Nabla — lokalisert i Paris-området, Frankrike.",
            "Kontakt: via kontaktseksjonen og lenkene på {home} (e-post, Calendly eller andre angitte kontaktmåter).",
          ],
        },
        {
          heading: "2. Formålet med nettstedet",
          paragraphs: [
            "Dette nettstedet gir informasjon om research og kontaktforsøk knyttet til barnet (Bababou). Det er ikke-kommersielt og har informasjonsformål.",
          ],
        },
        {
          heading: "3. Ansvar",
          disclosure: {
            summary: "Dokumenter på dette nettstedet — merknad om behandling",
            paragraphs: [
              "Dokumenter som publiseres på dette nettstedet er behandlet på følgende måte: retting av staving og grammatikk, anonymisering for å beskytte barnet og oversettelse når det er nødvendig. Ellers holdes de så nær originalen som mulig.",
              "Noen dokumenter mangler fordi de må valideres før de publiseres.",
            ],
          },
          paragraphs: [
            "Innholdet gis etter beste kunnskap. Vi garanterer ikke fullstendighet eller nøyaktighet. Vi er ikke ansvarlige for eksterne lenker eller tredjepartsinnhold. For personvern, se vår {privacy}; for vilkår for bruk, se våre {terms}.",
          ],
        },
        {
          heading: "4. Opphavsrett og immaterielle rettigheter",
          paragraphs: [
            "Tekster, layout og originalt materiale på dette nettstedet er opphavsrettslig beskyttet. Reproduksjon eller bruk utover personlig gjennomgang kan kreve tillatelse. Se {terms} for detaljer.",
          ],
        },
      ],
    },
  },
} as const satisfies Record<
  LegalPolicySlug,
  Record<AppLocale, LegalPolicyCopy>
>;

export function getLegalPolicyCopy(
  policy: LegalPolicySlug,
  locale: AppLocale,
): LegalPolicyCopy {
  return LEGAL_POLICY_COPY[policy][locale];
}
