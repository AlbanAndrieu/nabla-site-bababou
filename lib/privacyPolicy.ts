import type { AppLocale } from "@/i18n/routing";

export const PRIVACY_POLICY_EMAIL = "aa@bababou.com";
export const PRIVACY_POLICY_LAST_UPDATED = "2026-09-02";

export type PrivacyPolicySection = Readonly<{
  heading: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
}>;

export type PrivacyPolicyCopy = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  title: string;
  lastUpdatedLabel: string;
  sections: readonly PrivacyPolicySection[];
}>;

const PRIVACY_POLICY_COPY = {
  fr: {
    metadataTitle: "Politique de confidentialité | Bababou",
    metadataDescription:
      "Politique de confidentialité de bababou.com : collecte, utilisation et protection des données personnelles conformément au RGPD et au droit français applicable.",
    title: "Politique de confidentialité",
    lastUpdatedLabel: "Dernière mise à jour",
    sections: [
      {
        heading: "1. Responsable du traitement",
        paragraphs: [
          "Le responsable du traitement est Nabla, situé à La Défense, France. Contact : {email}.",
        ],
      },
      {
        heading: "2. Champ d’application",
        paragraphs: [
          "La présente Politique de confidentialité explique comment les données personnelles sont collectées, utilisées et protégées lors de l’utilisation de ce site ou des services associés, conformément au règlement (UE) 2016/679 (RGPD) et au droit français applicable en matière de protection des données.",
        ],
      },
      {
        heading: "3. Données personnelles collectées",
        paragraphs: [
          "Selon l’utilisation du site, les catégories suivantes de données personnelles peuvent être traitées :",
        ],
        bullets: [
          "données d’identification (nom, adresse électronique) ;",
          "données techniques (adresse IP, navigateur, appareil, journaux) ;",
          "données d’utilisation (pages consultées, interactions).",
        ],
      },
      {
        heading: "4. Base juridique du traitement",
        paragraphs: [
          "Le traitement repose sur un ou plusieurs des fondements juridiques suivants prévus à l’article 6 du RGPD :",
        ],
        bullets: [
          "consentement ;",
          "exécution d’un contrat ;",
          "obligation légale ;",
          "intérêt légitime.",
        ],
      },
      {
        heading: "5. Finalités du traitement",
        bullets: [
          "fourniture et fonctionnement des services ;",
          "sécurité et prévention de la fraude ;",
          "amélioration du service et analyse de l’utilisation ;",
          "respect des obligations légales et réglementaires.",
        ],
      },
      {
        heading: "6. Conservation des données",
        paragraphs: [
          "Les données personnelles sont conservées uniquement pendant la durée nécessaire à la réalisation des finalités indiquées ou au respect des obligations légales.",
        ],
      },
      {
        heading: "7. Destinataires des données",
        paragraphs: ["Les données peuvent être communiquées à :"],
        bullets: [
          "des personnes autorisées ;",
          "des sous-traitants agissant dans le cadre d’obligations contractuelles ;",
          "des autorités publiques lorsque la loi l’exige.",
        ],
      },
      {
        heading: "8. Transferts internationaux",
        paragraphs: [
          "Lorsque des données sont transférées hors de l’Espace économique européen, les garanties appropriées requises sont mises en place, telles que les clauses contractuelles types ou un autre mécanisme de transfert reconnu par le droit applicable.",
        ],
      },
      {
        heading: "9. Droits des personnes concernées",
        paragraphs: [
          "En vertu du RGPD, les personnes concernées disposent notamment des droits suivants :",
          "Les demandes relatives à l’exercice de ces droits peuvent être adressées à {email}.",
        ],
        bullets: [
          "accès, rectification et effacement ;",
          "limitation du traitement et opposition ;",
          "portabilité des données ;",
          "retrait du consentement à tout moment.",
        ],
      },
      {
        heading: "10. Cookies",
        paragraphs: [
          "Le site peut utiliser des cookies ou des technologies similaires. Lorsque le consentement est légalement requis, les cookies non essentiels ne sont utilisés qu’après consentement. Les détails figurent dans la Politique relative aux cookies.",
        ],
      },
      {
        heading: "11. Sécurité",
        paragraphs: [
          "Des mesures techniques et organisationnelles appropriées sont mises en œuvre afin de protéger les données personnelles contre l’accès non autorisé, la perte ou l’altération.",
        ],
      },
      {
        heading: "12. Réclamations",
        paragraphs: [
          "En France, une réclamation peut être introduite auprès de l’autorité de contrôle compétente, la {cnil}.",
        ],
      },
      {
        heading: "13. Modifications",
        paragraphs: [
          "La présente Politique de confidentialité peut être mise à jour périodiquement. La dernière version est toujours disponible sur cette page.",
        ],
      },
    ],
  },
  en: {
    metadataTitle: "Privacy Policy | Bababou",
    metadataDescription:
      "Privacy Policy for bababou.com. Learn how personal data is collected, used and protected under the GDPR and applicable French data-protection law.",
    title: "Privacy Policy",
    lastUpdatedLabel: "Last updated",
    sections: [
      {
        heading: "1. Controller",
        paragraphs: [
          "The data controller is Nabla, located in La Défense, France. Contact: {email}.",
        ],
      },
      {
        heading: "2. Scope",
        paragraphs: [
          "This Privacy Policy explains how personal data is collected, used and protected when using this website or related services, in accordance with Regulation (EU) 2016/679 (GDPR) and applicable French data-protection law.",
        ],
      },
      {
        heading: "3. Personal data collected",
        paragraphs: [
          "Depending on usage, the following categories of personal data may be processed:",
        ],
        bullets: [
          "identification data (name, email address);",
          "technical data (IP address, browser, device, logs);",
          "usage data (pages visited, interactions).",
        ],
      },
      {
        heading: "4. Legal basis for processing",
        paragraphs: [
          "Processing is based on one or more of the following legal grounds under Article 6 GDPR:",
        ],
        bullets: [
          "consent;",
          "performance of a contract;",
          "legal obligation;",
          "legitimate interest.",
        ],
      },
      {
        heading: "5. Purpose of processing",
        bullets: [
          "provision and operation of services;",
          "security and fraud prevention;",
          "service improvement and usage analytics;",
          "legal and regulatory compliance.",
        ],
      },
      {
        heading: "6. Data retention",
        paragraphs: [
          "Personal data is retained only for as long as necessary to fulfil the stated purposes or to comply with legal obligations.",
        ],
      },
      {
        heading: "7. Data recipients",
        paragraphs: ["Data may be shared with:"],
        bullets: [
          "authorised personnel;",
          "processors acting under contractual obligations;",
          "public authorities when legally required.",
        ],
      },
      {
        heading: "8. International transfers",
        paragraphs: [
          "Where data is transferred outside the European Economic Area, appropriate safeguards are applied where required, such as Standard Contractual Clauses or another transfer mechanism recognised by applicable law.",
        ],
      },
      {
        heading: "9. Data subject rights",
        paragraphs: [
          "Under GDPR, data subjects have the right to:",
          "Requests may be sent to {email}.",
        ],
        bullets: [
          "access, rectification and erasure;",
          "restriction and objection to processing;",
          "data portability;",
          "withdraw consent at any time.",
        ],
      },
      {
        heading: "10. Cookies",
        paragraphs: [
          "This website may use cookies or similar technologies. Where consent is legally required, non-essential cookies are used only after consent. Details are available in the Cookie Policy.",
        ],
      },
      {
        heading: "11. Security",
        paragraphs: [
          "Appropriate technical and organisational measures are implemented to protect personal data against unauthorised access, loss or alteration.",
        ],
      },
      {
        heading: "12. Complaints",
        paragraphs: [
          "In France, a complaint may be lodged with the competent supervisory authority, the {cnil}.",
        ],
      },
      {
        heading: "13. Changes",
        paragraphs: [
          "This Privacy Policy may be updated periodically. The latest version is always available on this page.",
        ],
      },
    ],
  },
  de: {
    metadataTitle: "Datenschutzerklärung | Bababou",
    metadataDescription:
      "Datenschutzerklärung für bababou.com über die Erhebung, Nutzung und den Schutz personenbezogener Daten nach DSGVO und anwendbarem französischem Datenschutzrecht.",
    title: "Datenschutzerklärung",
    lastUpdatedLabel: "Zuletzt aktualisiert",
    sections: [
      {
        heading: "1. Verantwortlicher",
        paragraphs: [
          "Verantwortlicher für die Datenverarbeitung ist Nabla mit Standort La Défense, Frankreich. Kontakt: {email}.",
        ],
      },
      {
        heading: "2. Geltungsbereich",
        paragraphs: [
          "Diese Datenschutzerklärung erläutert, wie personenbezogene Daten bei der Nutzung dieser Website oder zugehöriger Dienste gemäß der Verordnung (EU) 2016/679 (DSGVO) und dem anwendbaren französischen Datenschutzrecht erhoben, verwendet und geschützt werden.",
        ],
      },
      {
        heading: "3. Verarbeitete personenbezogene Daten",
        paragraphs: [
          "Je nach Nutzung können folgende Kategorien personenbezogener Daten verarbeitet werden:",
        ],
        bullets: [
          "Identifikationsdaten (Name, E-Mail-Adresse);",
          "technische Daten (IP-Adresse, Browser, Gerät, Protokolle);",
          "Nutzungsdaten (besuchte Seiten, Interaktionen).",
        ],
      },
      {
        heading: "4. Rechtsgrundlagen der Verarbeitung",
        paragraphs: [
          "Die Verarbeitung beruht auf einer oder mehreren der folgenden Rechtsgrundlagen nach Artikel 6 DSGVO:",
        ],
        bullets: [
          "Einwilligung;",
          "Vertragserfüllung;",
          "rechtliche Verpflichtung;",
          "berechtigtes Interesse.",
        ],
      },
      {
        heading: "5. Zwecke der Verarbeitung",
        bullets: [
          "Bereitstellung und Betrieb der Dienste;",
          "Sicherheit und Betrugsprävention;",
          "Verbesserung der Dienste und Nutzungsanalyse;",
          "Einhaltung rechtlicher und regulatorischer Pflichten.",
        ],
      },
      {
        heading: "6. Speicherdauer",
        paragraphs: [
          "Personenbezogene Daten werden nur so lange gespeichert, wie dies zur Erfüllung der genannten Zwecke oder gesetzlicher Pflichten erforderlich ist.",
        ],
      },
      {
        heading: "7. Empfänger der Daten",
        paragraphs: ["Daten können weitergegeben werden an:"],
        bullets: [
          "befugte Personen;",
          "Auftragsverarbeiter, die vertraglichen Verpflichtungen unterliegen;",
          "Behörden, wenn dies gesetzlich vorgeschrieben ist.",
        ],
      },
      {
        heading: "8. Internationale Übermittlungen",
        paragraphs: [
          "Werden Daten außerhalb des Europäischen Wirtschaftsraums übermittelt, werden erforderlichenfalls geeignete Garantien eingesetzt, etwa Standardvertragsklauseln oder ein anderer nach dem anwendbaren Recht anerkannter Übermittlungsmechanismus.",
        ],
      },
      {
        heading: "9. Rechte betroffener Personen",
        paragraphs: [
          "Nach der DSGVO bestehen insbesondere folgende Rechte:",
          "Anfragen können an {email} gerichtet werden.",
        ],
        bullets: [
          "Auskunft, Berichtigung und Löschung;",
          "Einschränkung der Verarbeitung und Widerspruch;",
          "Datenübertragbarkeit;",
          "Widerruf einer Einwilligung jederzeit.",
        ],
      },
      {
        heading: "10. Cookies",
        paragraphs: [
          "Diese Website kann Cookies oder ähnliche Technologien verwenden. Soweit eine Einwilligung gesetzlich erforderlich ist, werden nicht notwendige Cookies erst nach erteilter Einwilligung eingesetzt. Einzelheiten enthält die Cookie-Richtlinie.",
        ],
      },
      {
        heading: "11. Sicherheit",
        paragraphs: [
          "Geeignete technische und organisatorische Maßnahmen schützen personenbezogene Daten vor unbefugtem Zugriff, Verlust oder Veränderung.",
        ],
      },
      {
        heading: "12. Beschwerden",
        paragraphs: [
          "In Frankreich kann eine Beschwerde bei der zuständigen Aufsichtsbehörde, der {cnil}, eingereicht werden.",
        ],
      },
      {
        heading: "13. Änderungen",
        paragraphs: [
          "Diese Datenschutzerklärung kann regelmäßig aktualisiert werden. Die jeweils aktuelle Fassung ist auf dieser Seite verfügbar.",
        ],
      },
    ],
  },
  no: {
    metadataTitle: "Personvernerklæring | Bababou",
    metadataDescription:
      "Personvernerklæring for bababou.com om innsamling, bruk og beskyttelse av personopplysninger etter GDPR og gjeldende fransk personvernrett.",
    title: "Personvernerklæring",
    lastUpdatedLabel: "Sist oppdatert",
    sections: [
      {
        heading: "1. Behandlingsansvarlig",
        paragraphs: [
          "Behandlingsansvarlig er Nabla, med tilhold i La Défense, Frankrike. Kontakt: {email}.",
        ],
      },
      {
        heading: "2. Omfang",
        paragraphs: [
          "Denne personvernerklæringen forklarer hvordan personopplysninger samles inn, brukes og beskyttes ved bruk av dette nettstedet eller tilknyttede tjenester, i samsvar med forordning (EU) 2016/679 (GDPR) og gjeldende fransk personvernrett.",
        ],
      },
      {
        heading: "3. Personopplysninger som behandles",
        paragraphs: [
          "Avhengig av bruken kan følgende kategorier personopplysninger behandles:",
        ],
        bullets: [
          "identifikasjonsopplysninger (navn, e-postadresse);",
          "tekniske opplysninger (IP-adresse, nettleser, enhet, logger);",
          "bruksopplysninger (besøkte sider, interaksjoner).",
        ],
      },
      {
        heading: "4. Rettslig grunnlag for behandlingen",
        paragraphs: [
          "Behandlingen bygger på ett eller flere av følgende rettslige grunnlag etter artikkel 6 GDPR:",
        ],
        bullets: [
          "samtykke;",
          "oppfyllelse av en avtale;",
          "rettslig forpliktelse;",
          "berettiget interesse.",
        ],
      },
      {
        heading: "5. Formål med behandlingen",
        bullets: [
          "levering og drift av tjenester;",
          "sikkerhet og forebygging av svindel;",
          "forbedring av tjenesten og bruksanalyse;",
          "etterlevelse av rettslige og regulatoriske krav.",
        ],
      },
      {
        heading: "6. Lagringstid",
        paragraphs: [
          "Personopplysninger lagres bare så lenge det er nødvendig for å oppfylle de angitte formålene eller rettslige forpliktelser.",
        ],
      },
      {
        heading: "7. Mottakere av opplysningene",
        paragraphs: ["Opplysninger kan deles med:"],
        bullets: [
          "autoriserte personer;",
          "databehandlere som er underlagt kontraktsforpliktelser;",
          "offentlige myndigheter når dette er lovpålagt.",
        ],
      },
      {
        heading: "8. Internasjonale overføringer",
        paragraphs: [
          "Når opplysninger overføres utenfor Det europeiske økonomiske samarbeidsområdet, benyttes nødvendige egnede garantier, for eksempel standard personvernbestemmelser eller en annen overføringsmekanisme som er anerkjent etter gjeldende rett.",
        ],
      },
      {
        heading: "9. Den registrertes rettigheter",
        paragraphs: [
          "Etter GDPR har den registrerte blant annet rett til:",
          "Forespørsler kan sendes til {email}.",
        ],
        bullets: [
          "innsyn, retting og sletting;",
          "begrensning av og innsigelse mot behandling;",
          "dataportabilitet;",
          "å trekke tilbake samtykke når som helst.",
        ],
      },
      {
        heading: "10. Informasjonskapsler",
        paragraphs: [
          "Nettstedet kan bruke informasjonskapsler eller lignende teknologi. Når samtykke er lovpålagt, brukes ikke-nødvendige informasjonskapsler først etter samtykke. Nærmere opplysninger finnes i retningslinjene for informasjonskapsler.",
        ],
      },
      {
        heading: "11. Sikkerhet",
        paragraphs: [
          "Egnede tekniske og organisatoriske tiltak benyttes for å beskytte personopplysninger mot uautorisert tilgang, tap eller endring.",
        ],
      },
      {
        heading: "12. Klager",
        paragraphs: [
          "I Frankrike kan en klage sendes til den kompetente tilsynsmyndigheten, {cnil}.",
        ],
      },
      {
        heading: "13. Endringer",
        paragraphs: [
          "Denne personvernerklæringen kan oppdateres med jevne mellomrom. Den nyeste versjonen er alltid tilgjengelig på denne siden.",
        ],
      },
    ],
  },
} as const satisfies Record<AppLocale, PrivacyPolicyCopy>;

export function getPrivacyPolicyCopy(locale: AppLocale): PrivacyPolicyCopy {
  return PRIVACY_POLICY_COPY[locale];
}
