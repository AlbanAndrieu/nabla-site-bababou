import type { AppLocale } from "@/i18n/routing";

export const SERVICE_TERMS_EMAIL = "aa@bababou.com";
export const SERVICE_TERMS_LAST_UPDATED = "2026-09-02";

type ServiceTermsSection = Readonly<{
  heading: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
}>;

export type ServiceTermsCopy = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  title: string;
  lastUpdatedLabel: string;
  sections: readonly ServiceTermsSection[];
}>;

const SERVICE_TERMS_COPY = {
  fr: {
    metadataTitle: "Conditions d’utilisation | Bababou",
    metadataDescription:
      "Conditions d’utilisation de bababou.com, régies par le droit français et les règles impératives applicables de l’Union européenne.",
    title: "Conditions d’utilisation",
    lastUpdatedLabel: "Dernière mise à jour",
    sections: [
      {
        heading: "1. Mentions légales",
        paragraphs: [
          "Les présentes Conditions d’utilisation régissent l’accès au site bababou.com et son utilisation. Le site est exploité sous le nom Nabla, situé à La Défense, France. Contact : {email}.",
        ],
      },
      {
        heading: "2. Champ d’application",
        paragraphs: [
          "Les présentes Conditions s’appliquent à tout accès au site, à son contenu, à ses outils et aux fonctionnalités associées. L’utilisation du site implique l’acceptation de ces Conditions dans la mesure autorisée par la loi applicable.",
        ],
      },
      {
        heading: "3. Capacité juridique",
        paragraphs: [
          "L’utilisation du site est réservée aux personnes disposant de la capacité juridique requise. Toute personne agissant pour le compte d’une organisation doit être autorisée à l’engager.",
        ],
      },
      {
        heading: "4. Services",
        paragraphs: [
          "Le site donne accès à des contenus, documents, liens, outils ou autres fonctionnalités décrits sur ses pages. Ces éléments peuvent être modifiés, suspendus ou retirés lorsque cela est nécessaire.",
        ],
      },
      {
        heading: "5. Obligations des utilisateurs",
        paragraphs: ["Les utilisateurs s’engagent à :"],
        bullets: [
          "fournir uniquement des informations exactes et licites ;",
          "respecter les lois et règlements applicables ;",
          "ne pas tenter d’obtenir un accès non autorisé ni de perturber le service ;",
          "respecter les droits de propriété intellectuelle et les droits des tiers.",
        ],
      },
      {
        heading: "6. Utilisations interdites",
        paragraphs: [
          "Toute utilisation illicite, frauduleuse, abusive ou portant atteinte à l’intégrité ou à la sécurité du site est interdite.",
        ],
        bullets: [
          "contournement des mesures de sécurité ;",
          "accès automatisé non autorisé ;",
          "transmission de code malveillant.",
        ],
      },
      {
        heading: "7. Propriété intellectuelle",
        paragraphs: [
          "Les contenus, logiciels, marques et documents sont protégés par les règles de propriété intellectuelle applicables. Aucun droit n’est transféré en dehors du droit limité d’utiliser le site conformément aux présentes Conditions.",
        ],
      },
      {
        heading: "8. Disponibilité",
        paragraphs: [
          "Le site est fourni en l’état et selon sa disponibilité. Aucune disponibilité continue ou absence totale d’erreur ne peut être garantie.",
        ],
      },
      {
        heading: "9. Responsabilité",
        paragraphs: [
          "La responsabilité est limitée dans la mesure autorisée par le droit applicable. Aucune disposition des présentes Conditions n’exclut ou ne limite une responsabilité qui ne peut légalement l’être, notamment les droits impératifs des consommateurs.",
        ],
      },
      {
        heading: "10. Services tiers",
        paragraphs: [
          "Le site peut contenir des liens ou intégrations vers des services tiers. Ces services restent sous la responsabilité de leurs fournisseurs respectifs.",
        ],
      },
      {
        heading: "11. Protection des données",
        paragraphs: [
          "Les données personnelles sont traitées conformément à la Politique de confidentialité, au RGPD et aux règles françaises et européennes applicables en matière de protection des données.",
        ],
      },
      {
        heading: "12. Suspension ou fin d’accès",
        paragraphs: [
          "L’accès peut être suspendu ou interrompu en cas de violation des présentes Conditions, d’obligation légale ou de nécessité de sécurité, sans préjudice des droits prévus par la loi.",
        ],
      },
      {
        heading: "13. Droit applicable",
        paragraphs: [
          "Les présentes Conditions sont régies par le droit français. Les dispositions impératives du droit de l’Union européenne et du droit de la consommation restent applicables lorsqu’elles ne peuvent légalement être écartées.",
        ],
      },
      {
        heading: "14. Juridiction",
        paragraphs: [
          "Tout litige relève des juridictions françaises compétentes déterminées conformément aux règles de procédure et de protection des consommateurs applicables. Aucune disposition des présentes Conditions ne prive un consommateur d’un droit impératif de saisir une autre juridiction compétente.",
        ],
      },
      {
        heading: "15. Modifications",
        paragraphs: [
          "Les présentes Conditions peuvent être mises à jour. La version publiée sur cette page est la version applicable à compter de sa date de mise à jour, sous réserve des règles impératives applicables.",
        ],
      },
      {
        heading: "16. Contact",
        paragraphs: [
          "Pour toute question relative aux présentes Conditions, contactez {email}.",
        ],
      },
    ],
  },
  en: {
    metadataTitle: "Terms of Service | Bababou",
    metadataDescription:
      "Terms of Service for bababou.com, governed by French law and applicable mandatory European Union rules.",
    title: "Terms of Service",
    lastUpdatedLabel: "Last updated",
    sections: [
      {
        heading: "1. Legal notice",
        paragraphs: [
          "These Terms of Service govern access to and use of bababou.com. The site is operated under the name Nabla, located in La Défense, France. Contact: {email}.",
        ],
      },
      {
        heading: "2. Scope",
        paragraphs: [
          "These Terms apply to access to the website, its content, tools and associated functionality. Use of the website constitutes acceptance of these Terms to the extent permitted by applicable law.",
        ],
      },
      {
        heading: "3. Eligibility",
        paragraphs: [
          "Use of the website is limited to persons with the legal capacity required by applicable law. Anyone acting for an organization must be authorized to bind it.",
        ],
      },
      {
        heading: "4. Services",
        paragraphs: [
          "The website provides access to content, documents, links, tools or other functionality described on its pages. These elements may be modified, suspended or withdrawn when necessary.",
        ],
      },
      {
        heading: "5. User obligations",
        paragraphs: ["Users agree to:"],
        bullets: [
          "provide only accurate and lawful information;",
          "comply with applicable laws and regulations;",
          "refrain from unauthorized access or interference with the service;",
          "respect intellectual property and third-party rights.",
        ],
      },
      {
        heading: "6. Prohibited use",
        paragraphs: [
          "Any unlawful, fraudulent, abusive or security-compromising use of the website is prohibited.",
        ],
        bullets: [
          "circumvention of security measures;",
          "unauthorized automated access;",
          "transmission of malicious code.",
        ],
      },
      {
        heading: "7. Intellectual property",
        paragraphs: [
          "Content, software, trademarks and documents are protected by applicable intellectual-property law. No rights are transferred other than the limited right to use the website in accordance with these Terms.",
        ],
      },
      {
        heading: "8. Availability",
        paragraphs: [
          "The website is provided on an as-is and as-available basis. Continuous availability or complete freedom from errors cannot be guaranteed.",
        ],
      },
      {
        heading: "9. Liability",
        paragraphs: [
          "Liability is limited to the extent permitted by applicable law. Nothing in these Terms excludes or limits liability or consumer rights that cannot lawfully be excluded or limited.",
        ],
      },
      {
        heading: "10. Third-party services",
        paragraphs: [
          "The website may contain links or integrations to third-party services. Those services remain the responsibility of their respective providers.",
        ],
      },
      {
        heading: "11. Data protection",
        paragraphs: [
          "Personal data is processed in accordance with the Privacy Policy, the GDPR and applicable French and European data-protection rules.",
        ],
      },
      {
        heading: "12. Suspension or termination",
        paragraphs: [
          "Access may be suspended or terminated in case of breach of these Terms, legal obligation or security necessity, without prejudice to rights provided by law.",
        ],
      },
      {
        heading: "13. Governing law",
        paragraphs: [
          "These Terms are governed by French law. Mandatory provisions of European Union law and consumer-protection law remain applicable where they cannot lawfully be excluded.",
        ],
      },
      {
        heading: "14. Jurisdiction",
        paragraphs: [
          "Any dispute is subject to the jurisdiction of the competent French courts as determined by applicable procedural and consumer-protection rules. Nothing in these Terms deprives a consumer of any mandatory right to bring proceedings before another competent court.",
        ],
      },
      {
        heading: "15. Amendments",
        paragraphs: [
          "These Terms may be updated. The version published on this page applies from its stated update date, subject to mandatory applicable rules.",
        ],
      },
      {
        heading: "16. Contact",
        paragraphs: ["For questions regarding these Terms, contact {email}."],
      },
    ],
  },
  de: {
    metadataTitle: "Nutzungsbedingungen | Bababou",
    metadataDescription:
      "Nutzungsbedingungen für bababou.com nach französischem Recht und den zwingenden Vorschriften der Europäischen Union.",
    title: "Nutzungsbedingungen",
    lastUpdatedLabel: "Zuletzt aktualisiert",
    sections: [
      {
        heading: "1. Rechtliche Hinweise",
        paragraphs: [
          "Diese Nutzungsbedingungen regeln den Zugriff auf bababou.com und dessen Nutzung. Die Website wird unter dem Namen Nabla mit Standort La Défense, Frankreich, betrieben. Kontakt: {email}.",
        ],
      },
      {
        heading: "2. Geltungsbereich",
        paragraphs: [
          "Diese Bedingungen gelten für den Zugriff auf die Website, ihre Inhalte, Werkzeuge und zugehörigen Funktionen. Mit der Nutzung der Website werden diese Bedingungen anerkannt, soweit dies nach dem anwendbaren Recht zulässig ist.",
        ],
      },
      {
        heading: "3. Rechtsfähigkeit",
        paragraphs: [
          "Die Nutzung ist Personen vorbehalten, die nach dem anwendbaren Recht über die erforderliche Rechtsfähigkeit verfügen. Wer für eine Organisation handelt, muss zu deren Vertretung befugt sein.",
        ],
      },
      {
        heading: "4. Leistungen",
        paragraphs: [
          "Die Website stellt Inhalte, Dokumente, Links, Werkzeuge und weitere auf den Seiten beschriebene Funktionen bereit. Diese können bei Bedarf geändert, ausgesetzt oder eingestellt werden.",
        ],
      },
      {
        heading: "5. Pflichten der Nutzer",
        paragraphs: ["Nutzer verpflichten sich:"],
        bullets: [
          "nur richtige und rechtmäßige Informationen bereitzustellen;",
          "geltende Gesetze und Vorschriften einzuhalten;",
          "keinen unbefugten Zugriff oder Eingriff in den Dienst vorzunehmen;",
          "Rechte des geistigen Eigentums und Rechte Dritter zu achten.",
        ],
      },
      {
        heading: "6. Unzulässige Nutzung",
        paragraphs: [
          "Rechtswidrige, betrügerische, missbräuchliche oder die Sicherheit der Website beeinträchtigende Nutzung ist untersagt.",
        ],
        bullets: [
          "Umgehung von Sicherheitsmaßnahmen;",
          "nicht autorisierter automatisierter Zugriff;",
          "Übertragung schädlichen Codes.",
        ],
      },
      {
        heading: "7. Geistiges Eigentum",
        paragraphs: [
          "Inhalte, Software, Marken und Dokumente sind durch das anwendbare Recht des geistigen Eigentums geschützt. Außer dem begrenzten Recht zur Nutzung der Website nach diesen Bedingungen werden keine Rechte übertragen.",
        ],
      },
      {
        heading: "8. Verfügbarkeit",
        paragraphs: [
          "Die Website wird im vorhandenen und verfügbaren Zustand bereitgestellt. Eine ununterbrochene oder vollständig fehlerfreie Verfügbarkeit kann nicht garantiert werden.",
        ],
      },
      {
        heading: "9. Haftung",
        paragraphs: [
          "Die Haftung ist nur insoweit beschränkt, wie dies nach dem anwendbaren Recht zulässig ist. Zwingende Haftungsregeln und unverzichtbare Verbraucherrechte bleiben unberührt.",
        ],
      },
      {
        heading: "10. Dienste Dritter",
        paragraphs: [
          "Die Website kann Links oder Integrationen zu Diensten Dritter enthalten. Für diese Dienste bleiben die jeweiligen Anbieter verantwortlich.",
        ],
      },
      {
        heading: "11. Datenschutz",
        paragraphs: [
          "Personenbezogene Daten werden gemäß der Datenschutzerklärung, der DSGVO sowie den anwendbaren französischen und europäischen Datenschutzvorschriften verarbeitet.",
        ],
      },
      {
        heading: "12. Aussetzung oder Beendigung",
        paragraphs: [
          "Der Zugriff kann bei Verstößen gegen diese Bedingungen, aufgrund gesetzlicher Pflichten oder aus Sicherheitsgründen ausgesetzt oder beendet werden; gesetzliche Rechte bleiben unberührt.",
        ],
      },
      {
        heading: "13. Anwendbares Recht",
        paragraphs: [
          "Diese Bedingungen unterliegen französischem Recht. Zwingende Vorschriften des Rechts der Europäischen Union und des Verbraucherschutzrechts bleiben anwendbar, soweit sie nicht wirksam ausgeschlossen werden können.",
        ],
      },
      {
        heading: "14. Gerichtsstand",
        paragraphs: [
          "Für Streitigkeiten sind die nach den anwendbaren Verfahrens- und Verbraucherschutzvorschriften zuständigen französischen Gerichte zuständig. Zwingende Rechte von Verbrauchern, ein anderes zuständiges Gericht anzurufen, bleiben unberührt.",
        ],
      },
      {
        heading: "15. Änderungen",
        paragraphs: [
          "Diese Bedingungen können aktualisiert werden. Maßgeblich ist die auf dieser Seite veröffentlichte Fassung ab dem angegebenen Aktualisierungsdatum, vorbehaltlich zwingender Vorschriften.",
        ],
      },
      {
        heading: "16. Kontakt",
        paragraphs: ["Bei Fragen zu diesen Bedingungen: {email}."],
      },
    ],
  },
  no: {
    metadataTitle: "Vilkår for bruk | Bababou",
    metadataDescription:
      "Vilkår for bruk av bababou.com, regulert av fransk rett og ufravikelige regler i Den europeiske union.",
    title: "Vilkår for bruk",
    lastUpdatedLabel: "Sist oppdatert",
    sections: [
      {
        heading: "1. Juridisk informasjon",
        paragraphs: [
          "Disse vilkårene regulerer tilgang til og bruk av bababou.com. Nettstedet drives under navnet Nabla med tilhold i La Défense, Frankrike. Kontakt: {email}.",
        ],
      },
      {
        heading: "2. Virkeområde",
        paragraphs: [
          "Vilkårene gjelder tilgang til nettstedet, innholdet, verktøyene og tilknyttede funksjoner. Bruk av nettstedet innebærer aksept av vilkårene i den utstrekning gjeldende rett tillater det.",
        ],
      },
      {
        heading: "3. Rettslig handleevne",
        paragraphs: [
          "Nettstedet kan brukes av personer som har nødvendig rettslig handleevne etter gjeldende rett. Den som handler på vegne av en organisasjon, må ha fullmakt til å binde den.",
        ],
      },
      {
        heading: "4. Tjenester",
        paragraphs: [
          "Nettstedet gir tilgang til innhold, dokumenter, lenker, verktøy og andre funksjoner som er beskrevet på sidene. Disse kan endres, suspenderes eller fjernes når det er nødvendig.",
        ],
      },
      {
        heading: "5. Brukerens plikter",
        paragraphs: ["Brukere forplikter seg til å:"],
        bullets: [
          "bare oppgi korrekte og lovlige opplysninger;",
          "følge gjeldende lover og regler;",
          "ikke forsøke uautorisert tilgang eller forstyrre tjenesten;",
          "respektere immaterielle rettigheter og tredjeparts rettigheter.",
        ],
      },
      {
        heading: "6. Forbudt bruk",
        paragraphs: [
          "Ulovlig, bedragersk, misbrukende eller sikkerhetsskadelig bruk av nettstedet er forbudt.",
        ],
        bullets: [
          "omgåelse av sikkerhetstiltak;",
          "uautorisert automatisert tilgang;",
          "overføring av skadelig kode.",
        ],
      },
      {
        heading: "7. Immaterielle rettigheter",
        paragraphs: [
          "Innhold, programvare, varemerker og dokumenter er beskyttet av gjeldende regler om immaterielle rettigheter. Ingen rettigheter overføres utover den begrensede retten til å bruke nettstedet i samsvar med disse vilkårene.",
        ],
      },
      {
        heading: "8. Tilgjengelighet",
        paragraphs: [
          "Nettstedet tilbys som det er og når det er tilgjengelig. Kontinuerlig eller fullstendig feilfri tilgjengelighet kan ikke garanteres.",
        ],
      },
      {
        heading: "9. Ansvar",
        paragraphs: [
          "Ansvar begrenses bare i den grad gjeldende rett tillater det. Ingenting i vilkårene begrenser ansvar eller forbrukerrettigheter som ikke lovlig kan fravikes.",
        ],
      },
      {
        heading: "10. Tredjepartstjenester",
        paragraphs: [
          "Nettstedet kan inneholde lenker eller integrasjoner til tredjepartstjenester. De respektive leverandørene er ansvarlige for disse tjenestene.",
        ],
      },
      {
        heading: "11. Personvern",
        paragraphs: [
          "Personopplysninger behandles i samsvar med personvernerklæringen, GDPR og gjeldende franske og europeiske personvernregler.",
        ],
      },
      {
        heading: "12. Suspensjon eller avslutning",
        paragraphs: [
          "Tilgang kan suspenderes eller avsluttes ved brudd på vilkårene, som følge av rettslige plikter eller av sikkerhetshensyn, uten at lovbestemte rettigheter berøres.",
        ],
      },
      {
        heading: "13. Lovvalg",
        paragraphs: [
          "Disse vilkårene er underlagt fransk rett. Ufravikelige bestemmelser i EU-retten og forbrukervernregler gjelder fortsatt der de ikke lovlig kan fravikes.",
        ],
      },
      {
        heading: "14. Verneting",
        paragraphs: [
          "Tvister behandles av kompetente franske domstoler i samsvar med gjeldende prosess- og forbrukervernregler. Vilkårene fratar ikke en forbruker en ufravikelig rett til å bringe saken inn for en annen kompetent domstol.",
        ],
      },
      {
        heading: "15. Endringer",
        paragraphs: [
          "Vilkårene kan oppdateres. Versjonen som er publisert på denne siden gjelder fra den angitte oppdateringsdatoen, med forbehold for ufravikelige regler.",
        ],
      },
      {
        heading: "16. Kontakt",
        paragraphs: ["Spørsmål om disse vilkårene kan sendes til {email}."],
      },
    ],
  },
} as const satisfies Record<AppLocale, ServiceTermsCopy>;

export function getServiceTermsCopy(locale: AppLocale): ServiceTermsCopy {
  return SERVICE_TERMS_COPY[locale];
}
