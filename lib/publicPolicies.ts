import type { AppLocale } from "@/i18n/routing";

export const PUBLIC_POLICY_LAST_UPDATED = "2026-09-03";

export type PublicPolicySlug = "accessibility_statement" | "cookie_policy";

export type PublicPolicyLinkLabels = Readonly<{
  privacy: string;
  home: string;
  wcag: string;
  defender: string;
}>;

export type PublicPolicyListItem = Readonly<{
  label?: string;
  text: string;
}>;

export type PublicPolicySection = Readonly<{
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly PublicPolicyListItem[];
}>;

export type PublicPolicyCopy = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  title: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  intro: readonly string[];
  links: PublicPolicyLinkLabels;
  sections: readonly PublicPolicySection[];
  closing?: readonly string[];
}>;

const PUBLIC_POLICY_COPY = {
  cookie_policy: {
    fr: {
      metadataTitle: "Politique relative aux cookies | Bababou",
      metadataDescription:
        "Politique relative aux cookies de bababou.com : technologies utilisées, préférences, consentement et gestion du stockage navigateur.",
      title: "Politique relative aux cookies",
      lastUpdatedLabel: "Dernière mise à jour",
      lastUpdated: PUBLIC_POLICY_LAST_UPDATED,
      intro: [
        "Cette politique explique comment les cookies et technologies similaires peuvent être utilisés sur bababou.com, conformément aux règles applicables en matière de vie privée et de communications électroniques. Pour le traitement général des données personnelles, consultez la {privacy}.",
      ],
      links: {
        privacy: "Politique de confidentialité",
        home: "page d’accueil",
        wcag: "WCAG 2.1",
        defender: "Défenseur des droits",
      },
      sections: [
        {
          heading: "1. Que sont les cookies ?",
          paragraphs: [
            "Les cookies sont de petits fichiers texte ou mécanismes de stockage utilisés par un site ou un service tiers dans le navigateur ou sur l’appareil. Ils peuvent être strictement nécessaires, fonctionnels ou liés à la mesure d’audience et à d’autres services tiers.",
          ],
        },
        {
          heading: "2. Technologies utilisées sur le site",
          paragraphs: [
            "Le site utilise ou peut utiliser des mécanismes techniques uniquement lorsqu’ils sont nécessaires au fonctionnement ou lorsqu’une configuration explicite active une fonctionnalité supplémentaire.",
          ],
          items: [
            {
              label: "Strictement nécessaires",
              text: "le stockage technique requis pour la sécurité, le routage, la session ou la mémorisation de certaines préférences peut être utilisé lorsque la loi applicable le permet sans consentement.",
            },
            {
              label: "Fonctionnels",
              text: "certaines préférences, par exemple la langue ou le thème, peuvent être conservées par le navigateur ou par les fonctions du site. Un consentement est demandé lorsque cela est requis.",
            },
            {
              label: "Mesure d’audience et services tiers",
              text: "le runtime Next.js charge par défaut Vercel Web Analytics et Speed Insights. D’autres intégrations d’analyse peuvent être activées par configuration, et certaines pages legacy peuvent également charger Google Translate ou d’autres scripts tiers. Les technologies non essentielles doivent être activées uniquement lorsqu’un consentement ou une autre base juridique appropriée est disponible.",
            },
          ],
        },
        {
          heading: "3. Consentement et modification des choix",
          paragraphs: [
            "Lorsqu’un bandeau ou un contrôle de consentement est affiché, il peut être utilisé pour accepter, refuser ou modifier les catégories proposées. Tous les écrans du site n’exposent pas nécessairement un gestionnaire de cookies. Vous pouvez également utiliser les réglages de votre navigateur pour bloquer ou supprimer les cookies et autres données de site.",
            "Le blocage de tout stockage peut affecter certaines fonctions, par exemple la mémorisation de préférences.",
          ],
        },
        {
          heading: "4. Conservation",
          paragraphs: [
            "La durée de conservation dépend de la technologie et du service concernés. Les données de session sont généralement supprimées à la fin de la session, tandis que le stockage persistant reste disponible jusqu’à son expiration, sa suppression par l’utilisateur ou la durée définie par le service concerné. Lorsqu’un outil de consentement est présent, il peut indiquer les durées applicables aux catégories qu’il gère.",
          ],
        },
        {
          heading: "5. Mises à jour",
          paragraphs: [
            "Cette politique peut être mise à jour lorsque les technologies utilisées, leur configuration ou les règles applicables changent. La date affichée en haut de la page indique la dernière révision.",
          ],
        },
      ],
      closing: [
        "Pour toute question ou pour exercer des droits relatifs aux données personnelles traitées au moyen de ces technologies, consultez la {privacy} et les coordonnées qui y figurent.",
      ],
    },
    en: {
      metadataTitle: "Cookie Policy | Bababou",
      metadataDescription:
        "Cookie policy for bababou.com: technologies used, preferences, consent, and browser storage controls.",
      title: "Cookie Policy",
      lastUpdatedLabel: "Last updated",
      lastUpdated: PUBLIC_POLICY_LAST_UPDATED,
      intro: [
        "This policy explains how cookies and similar technologies may be used on bababou.com in line with applicable privacy and electronic-communications rules. For general personal-data processing, see the {privacy}.",
      ],
      links: {
        privacy: "Privacy Policy",
        home: "homepage",
        wcag: "WCAG 2.1",
        defender: "Défenseur des droits",
      },
      sections: [
        {
          heading: "1. What are cookies?",
          paragraphs: [
            "Cookies are small text files or similar storage mechanisms used by a website or third-party service in the browser or on the device. They may be strictly necessary, functional, or related to audience measurement and other third-party services.",
          ],
        },
        {
          heading: "2. Technologies used on the site",
          paragraphs: [
            "The site uses or may use technical storage only where it is needed for operation or where an explicit configuration enables an additional feature.",
          ],
          items: [
            {
              label: "Strictly necessary",
              text: "technical storage needed for security, routing, sessions, or remembered preferences may be used where applicable law permits it without consent.",
            },
            {
              label: "Functional",
              text: "preferences such as language or theme may be retained by the browser or site features. Consent is requested where required.",
            },
            {
              label: "Audience measurement and third parties",
              text: "the Next.js runtime loads Vercel Web Analytics and Speed Insights by default. Other analytics integrations can be enabled by configuration, and some legacy pages may also load Google Translate or other third-party scripts. Non-essential technologies should be enabled only when the required consent or another appropriate legal basis is available.",
            },
          ],
        },
        {
          heading: "3. Consent and changing your choices",
          paragraphs: [
            "When a consent banner or control is displayed, you can use it to accept, reject, or change the categories offered. Not every site surface necessarily exposes a cookie manager. You can also use your browser settings to block or delete cookies and other site data.",
            "Blocking all storage may affect some functionality, for example remembered preferences.",
          ],
        },
        {
          heading: "4. Retention",
          paragraphs: [
            "Retention depends on the technology and service concerned. Session data is generally removed when the session ends, while persistent storage remains until it expires, is deleted by the user, or reaches the duration set by the relevant service. Where a consent tool is present, it may state the retention periods for the categories it manages.",
          ],
        },
        {
          heading: "5. Updates",
          paragraphs: [
            "This policy may be updated when the technologies used, their configuration, or the applicable rules change. The date at the top of the page indicates the latest revision.",
          ],
        },
      ],
      closing: [
        "For questions or to exercise rights concerning personal data processed through these technologies, see the {privacy} and the contact details provided there.",
      ],
    },
    de: {
      metadataTitle: "Cookie-Richtlinie | Bababou",
      metadataDescription:
        "Cookie-Richtlinie für bababou.com: eingesetzte Technologien, Präferenzen, Einwilligung und Browser-Speichersteuerung.",
      title: "Cookie-Richtlinie",
      lastUpdatedLabel: "Zuletzt aktualisiert",
      lastUpdated: PUBLIC_POLICY_LAST_UPDATED,
      intro: [
        "Diese Richtlinie erläutert, wie Cookies und ähnliche Technologien auf bababou.com im Einklang mit den anwendbaren Datenschutz- und Telekommunikationsregeln eingesetzt werden können. Zur allgemeinen Verarbeitung personenbezogener Daten siehe die {privacy}.",
      ],
      links: {
        privacy: "Datenschutzerklärung",
        home: "Startseite",
        wcag: "WCAG 2.1",
        defender: "Défenseur des droits",
      },
      sections: [
        {
          heading: "1. Was sind Cookies?",
          paragraphs: [
            "Cookies sind kleine Textdateien oder vergleichbare Speichermechanismen, die von einer Website oder einem Drittanbieter im Browser oder auf dem Gerät verwendet werden. Sie können technisch erforderlich, funktional oder mit Reichweitenmessung und anderen Diensten Dritter verbunden sein.",
          ],
        },
        {
          heading: "2. Auf der Website verwendete Technologien",
          paragraphs: [
            "Die Website verwendet oder kann technische Speichermechanismen verwenden, wenn sie für den Betrieb erforderlich sind oder wenn eine ausdrückliche Konfiguration eine zusätzliche Funktion aktiviert.",
          ],
          items: [
            {
              label: "Technisch erforderlich",
              text: "technischer Speicher für Sicherheit, Routing, Sitzungen oder gespeicherte Präferenzen kann eingesetzt werden, soweit das anwendbare Recht dies ohne Einwilligung erlaubt.",
            },
            {
              label: "Funktional",
              text: "Präferenzen wie Sprache oder Theme können durch den Browser oder Funktionen der Website gespeichert werden. Eine Einwilligung wird eingeholt, soweit sie erforderlich ist.",
            },
            {
              label: "Reichweitenmessung und Drittanbieter",
              text: "der Next.js-Runtime lädt standardmäßig Vercel Web Analytics und Speed Insights. Weitere Analyseintegrationen können per Konfiguration aktiviert werden; einige Legacy-Seiten können außerdem Google Translate oder andere Skripte Dritter laden. Nicht erforderliche Technologien sollten nur aktiviert werden, wenn die erforderliche Einwilligung oder eine andere geeignete Rechtsgrundlage vorliegt.",
            },
          ],
        },
        {
          heading: "3. Einwilligung und Änderung Ihrer Auswahl",
          paragraphs: [
            "Wenn ein Einwilligungsbanner oder eine entsprechende Steuerung angezeigt wird, können Sie darüber die angebotenen Kategorien annehmen, ablehnen oder ändern. Nicht jede Oberfläche der Website stellt zwingend einen Cookie-Manager bereit. Zusätzlich können Sie Cookies und andere Websitedaten über die Einstellungen Ihres Browsers blockieren oder löschen.",
            "Das Blockieren sämtlicher Speicherung kann einzelne Funktionen beeinträchtigen, zum Beispiel gespeicherte Präferenzen.",
          ],
        },
        {
          heading: "4. Speicherdauer",
          paragraphs: [
            "Die Speicherdauer hängt von der jeweiligen Technologie und dem Dienst ab. Sitzungsdaten werden in der Regel am Ende der Sitzung entfernt; persistente Speicherung bleibt bis zum Ablauf, zur Löschung durch den Nutzer oder bis zur vom jeweiligen Dienst festgelegten Dauer bestehen. Wenn ein Einwilligungswerkzeug vorhanden ist, kann es die Speicherdauern der von ihm verwalteten Kategorien ausweisen.",
          ],
        },
        {
          heading: "5. Aktualisierungen",
          paragraphs: [
            "Diese Richtlinie kann aktualisiert werden, wenn sich die eingesetzten Technologien, ihre Konfiguration oder die anwendbaren Regeln ändern. Das Datum am Seitenanfang zeigt die letzte Überarbeitung an.",
          ],
        },
      ],
      closing: [
        "Bei Fragen oder zur Ausübung von Rechten in Bezug auf personenbezogene Daten, die über diese Technologien verarbeitet werden, siehe die {privacy} und die dort angegebenen Kontaktdaten.",
      ],
    },
    no: {
      metadataTitle: "Retningslinjer for informasjonskapsler | Bababou",
      metadataDescription:
        "Retningslinjer for informasjonskapsler på bababou.com: teknologier, preferanser, samtykke og kontroll av nettleserlagring.",
      title: "Retningslinjer for informasjonskapsler",
      lastUpdatedLabel: "Sist oppdatert",
      lastUpdated: PUBLIC_POLICY_LAST_UPDATED,
      intro: [
        "Disse retningslinjene forklarer hvordan informasjonskapsler og lignende teknologier kan brukes på bababou.com i samsvar med gjeldende regler om personvern og elektronisk kommunikasjon. For generell behandling av personopplysninger, se {privacy}.",
      ],
      links: {
        privacy: "Personvernerklæringen",
        home: "forsiden",
        wcag: "WCAG 2.1",
        defender: "Défenseur des droits",
      },
      sections: [
        {
          heading: "1. Hva er informasjonskapsler?",
          paragraphs: [
            "Informasjonskapsler er små tekstfiler eller lignende lagringsmekanismer som brukes av et nettsted eller en tredjepartstjeneste i nettleseren eller på enheten. De kan være strengt nødvendige, funksjonelle eller knyttet til publikumsanalyse og andre tredjepartstjenester.",
          ],
        },
        {
          heading: "2. Teknologier som brukes på nettstedet",
          paragraphs: [
            "Nettstedet bruker eller kan bruke teknisk lagring når dette er nødvendig for drift, eller når en uttrykkelig konfigurasjon aktiverer en tilleggsfunksjon.",
          ],
          items: [
            {
              label: "Strengt nødvendige",
              text: "teknisk lagring som trengs for sikkerhet, ruting, økter eller huskede preferanser, kan brukes når gjeldende lov tillater dette uten samtykke.",
            },
            {
              label: "Funksjonelle",
              text: "preferanser som språk eller tema kan beholdes av nettleseren eller nettstedets funksjoner. Samtykke innhentes når det er påkrevd.",
            },
            {
              label: "Publikumsanalyse og tredjeparter",
              text: "Next.js-kjøretiden laster Vercel Web Analytics og Speed Insights som standard. Andre analyseintegrasjoner kan aktiveres gjennom konfigurasjon, og enkelte legacy-sider kan også laste Google Translate eller andre tredjepartsskript. Ikke-essensielle teknologier bør bare aktiveres når nødvendig samtykke eller et annet passende rettslig grunnlag foreligger.",
            },
          ],
        },
        {
          heading: "3. Samtykke og endring av valg",
          paragraphs: [
            "Når et samtykkebanner eller en samtykkekontroll vises, kan du bruke den til å godta, avvise eller endre kategoriene som tilbys. Ikke alle deler av nettstedet viser nødvendigvis en egen kontroll for informasjonskapsler. Du kan også bruke innstillingene i nettleseren til å blokkere eller slette informasjonskapsler og andre nettstedsdata.",
            "Blokkering av all lagring kan påvirke enkelte funksjoner, for eksempel huskede preferanser.",
          ],
        },
        {
          heading: "4. Lagringstid",
          paragraphs: [
            "Lagringstiden avhenger av teknologien og tjenesten det gjelder. Øktdata fjernes vanligvis når økten avsluttes, mens vedvarende lagring beholdes til den utløper, slettes av brukeren eller når varigheten som den aktuelle tjenesten har angitt. Når et samtykkeverktøy er tilgjengelig, kan det oppgi lagringstiden for kategoriene det administrerer.",
          ],
        },
        {
          heading: "5. Oppdateringer",
          paragraphs: [
            "Disse retningslinjene kan oppdateres når teknologiene som brukes, konfigurasjonen deres eller gjeldende regler endres. Datoen øverst på siden viser siste revisjon.",
          ],
        },
      ],
      closing: [
        "For spørsmål eller for å utøve rettigheter knyttet til personopplysninger som behandles gjennom disse teknologiene, se {privacy} og kontaktopplysningene som er oppgitt der.",
      ],
    },
  },
  accessibility_statement: {
    fr: {
      metadataTitle: "Déclaration d’accessibilité | Bababou",
      metadataDescription:
        "Déclaration d’accessibilité de bababou.com : engagement, mesures, limites connues, contact et voies de recours.",
      title: "Déclaration d’accessibilité",
      lastUpdatedLabel: "Dernière mise à jour",
      lastUpdated: PUBLIC_POLICY_LAST_UPDATED,
      intro: [
        "Nous nous engageons à rendre ce site accessible au plus grand nombre, y compris aux personnes en situation de handicap. Cette déclaration décrit notre approche et les moyens d’obtenir de l’aide.",
      ],
      links: {
        privacy: "Politique de confidentialité",
        home: "page d’accueil",
        wcag: "Règles pour l’accessibilité des contenus Web (WCAG) 2.1",
        defender: "Défenseur des droits",
      },
      sections: [
        {
          heading: "1. Référentiel et engagement",
          paragraphs: [
            "Nous visons, lorsque cela est praticable, un niveau de conformité AA aux {wcag}. Cela comprend notamment :",
          ],
          items: [
            { text: "un contraste suffisant entre le texte et l’arrière-plan ;" },
            { text: "du texte redimensionnable et des mises en page adaptées aux petits écrans ;" },
            { text: "une navigation au clavier et un focus visible ;" },
            { text: "des textes alternatifs utiles pour les images et des libellés pour les contrôles de formulaire ;" },
            { text: "des titres et landmarks clairs, notamment pour le contenu principal, la navigation et le pied de page ;" },
            { text: "la prise en charge des thèmes clair et sombre." },
          ],
        },
        {
          heading: "2. Mesures mises en œuvre",
          paragraphs: [
            "Nous utilisons du HTML sémantique, ARIA lorsque cela est nécessaire et des styles qui respectent les préférences utilisateur, notamment la réduction des animations et le thème. Le site est testé pour l’utilisation au clavier et, lorsque cela est possible, avec des lecteurs d’écran.",
            "Les locales de premier rang sont proposées nativement par l’application. Certaines pages legacy peuvent également proposer Google Translate ; le contenu traduit automatiquement peut ne pas être parfaitement accessible et nous cherchons à l’améliorer lorsque cela est possible.",
          ],
        },
        {
          heading: "3. Limites connues",
          paragraphs: [
            "Certains contenus tiers, par exemple des widgets intégrés ou des liens externes, ne sont pas entièrement sous notre contrôle. Nous les sélectionnons et les configurons en tenant compte de l’accessibilité, sans pouvoir garantir leur conformité.",
            "Certains PDF ou autres documents liés depuis le site peuvent ne pas être pleinement accessibles ; nous cherchons à les remplacer ou à les compléter lorsque cela est possible.",
          ],
        },
        {
          heading: "4. Retour et contact",
          paragraphs: [
            "Si vous rencontrez un obstacle d’accessibilité ou souhaitez faire une suggestion, contactez-nous via la {home}, dans la section de contact ou au moyen des liens qui y sont proposés. Nous ferons notre possible pour répondre et, lorsque cela est approprié, corriger le problème ou proposer une solution alternative.",
          ],
        },
        {
          heading: "5. Recours et réclamations",
          paragraphs: [
            "Si notre réponse ne vous satisfait pas, vous pouvez saisir l’autorité ou l’organisme compétent dans votre pays. En France, vous pouvez notamment consulter le {defender}.",
          ],
        },
      ],
      closing: [
        "Cette déclaration peut être mise à jour. La date affichée en haut de la page indique la dernière révision.",
      ],
    },
    en: {
      metadataTitle: "Accessibility Statement | Bababou",
      metadataDescription:
        "Accessibility statement for bababou.com: commitment, measures taken, known limitations, contact, and complaints.",
      title: "Accessibility Statement",
      lastUpdatedLabel: "Last updated",
      lastUpdated: PUBLIC_POLICY_LAST_UPDATED,
      intro: [
        "We are committed to making this website accessible to as many people as possible, including people with disabilities. This statement describes our approach and how to get help.",
      ],
      links: {
        privacy: "Privacy Policy",
        home: "homepage",
        wcag: "Web Content Accessibility Guidelines (WCAG) 2.1",
        defender: "Défenseur des droits",
      },
      sections: [
        {
          heading: "1. Standards and commitment",
          paragraphs: [
            "We aim to conform to the {wcag} at Level AA where practicable. This includes:",
          ],
          items: [
            { text: "sufficient colour contrast between text and background;" },
            { text: "text that can be resized and layouts that work on small screens;" },
            { text: "keyboard navigation and visible focus;" },
            { text: "meaningful alt text for images and labels for form controls;" },
            { text: "clear headings and landmarks, including main content, navigation, and footer;" },
            { text: "support for light and dark themes." },
          ],
        },
        {
          heading: "2. Measures taken",
          paragraphs: [
            "We use semantic HTML, ARIA where needed, and styles that respect user preferences such as reduced motion and theme. The site is tested for keyboard use and with screen readers where possible.",
            "First-class locales are provided natively by the application. Some legacy pages may also offer Google Translate; automatically translated content may not always be perfectly accessible, and we improve it where we can.",
          ],
        },
        {
          heading: "3. Known limitations",
          paragraphs: [
            "Some third-party content, such as embedded widgets or external links, may not be fully under our control. We select and configure such content with accessibility in mind but cannot guarantee its compliance.",
            "PDF or other documents linked from this site may not all be fully accessible; we work to replace or supplement them where possible.",
          ],
        },
        {
          heading: "4. Feedback and contact",
          paragraphs: [
            "If you encounter an accessibility barrier or have a suggestion, please contact us via the {home}, using the contact section or links provided there. We will do our best to respond and, where appropriate, fix the issue or explain alternatives.",
          ],
        },
        {
          heading: "5. Enforcement and complaints",
          paragraphs: [
            "If you are not satisfied with our response, you may contact the relevant authority or body in your country. In France, you can in particular consult the {defender}.",
          ],
        },
      ],
      closing: [
        "This statement may be updated. The date at the top indicates the latest revision.",
      ],
    },
    de: {
      metadataTitle: "Erklärung zur Barrierefreiheit | Bababou",
      metadataDescription:
        "Erklärung zur Barrierefreiheit von bababou.com: Zielsetzung, Maßnahmen, bekannte Einschränkungen, Kontakt und Beschwerden.",
      title: "Erklärung zur Barrierefreiheit",
      lastUpdatedLabel: "Zuletzt aktualisiert",
      lastUpdated: PUBLIC_POLICY_LAST_UPDATED,
      intro: [
        "Wir möchten diese Website für möglichst viele Menschen zugänglich machen, einschließlich Menschen mit Behinderungen. Diese Erklärung beschreibt unseren Ansatz und wie Sie Unterstützung erhalten können.",
      ],
      links: {
        privacy: "Datenschutzerklärung",
        home: "Startseite",
        wcag: "Web Content Accessibility Guidelines (WCAG) 2.1",
        defender: "Défenseur des droits",
      },
      sections: [
        {
          heading: "1. Standards und Zielsetzung",
          paragraphs: [
            "Wir streben, soweit praktikabel, eine Konformität mit den {wcag} auf Stufe AA an. Dazu gehören insbesondere:",
          ],
          items: [
            { text: "ausreichender Farbkontrast zwischen Text und Hintergrund;" },
            { text: "skalierbarer Text und Layouts, die auch auf kleinen Bildschirmen funktionieren;" },
            { text: "Tastaturnavigation und sichtbarer Fokus;" },
            { text: "aussagekräftige Alternativtexte für Bilder und Beschriftungen für Formularelemente;" },
            { text: "klare Überschriften und Landmarks, einschließlich Hauptinhalt, Navigation und Footer;" },
            { text: "Unterstützung für helle und dunkle Themes." },
          ],
        },
        {
          heading: "2. Umgesetzte Maßnahmen",
          paragraphs: [
            "Wir verwenden semantisches HTML, ARIA wo erforderlich und Styles, die Nutzerpräferenzen wie reduzierte Bewegung und Theme berücksichtigen. Die Website wird, soweit möglich, für Tastaturbedienung und mit Screenreadern getestet.",
            "Die primären Sprachversionen werden von der Anwendung nativ bereitgestellt. Einige Legacy-Seiten können zusätzlich Google Translate anbieten; automatisch übersetzte Inhalte sind möglicherweise nicht vollständig barrierefrei, und wir verbessern sie soweit möglich.",
          ],
        },
        {
          heading: "3. Bekannte Einschränkungen",
          paragraphs: [
            "Einige Inhalte Dritter, etwa eingebettete Widgets oder externe Links, liegen nicht vollständig unter unserer Kontrolle. Wir wählen und konfigurieren solche Inhalte mit Blick auf Barrierefreiheit, können ihre Konformität jedoch nicht garantieren.",
            "PDF-Dateien oder andere von dieser Website verlinkte Dokumente sind möglicherweise nicht vollständig barrierefrei; wir bemühen uns, sie nach Möglichkeit zu ersetzen oder zu ergänzen.",
          ],
        },
        {
          heading: "4. Feedback und Kontakt",
          paragraphs: [
            "Wenn Sie auf eine Barriere stoßen oder einen Verbesserungsvorschlag haben, kontaktieren Sie uns bitte über die {home}, über den dortigen Kontaktbereich oder die dort angegebenen Links. Wir bemühen uns um eine Antwort und werden das Problem gegebenenfalls beheben oder Alternativen erläutern.",
          ],
        },
        {
          heading: "5. Beschwerden",
          paragraphs: [
            "Wenn Sie mit unserer Antwort nicht zufrieden sind, können Sie sich an die zuständige Behörde oder Stelle in Ihrem Land wenden. In Frankreich können Sie insbesondere den {defender} konsultieren.",
          ],
        },
      ],
      closing: [
        "Diese Erklärung kann aktualisiert werden. Das Datum am Seitenanfang zeigt die letzte Überarbeitung an.",
      ],
    },
    no: {
      metadataTitle: "Tilgjengelighetserklæring | Bababou",
      metadataDescription:
        "Tilgjengelighetserklæring for bababou.com: mål, tiltak, kjente begrensninger, kontakt og klager.",
      title: "Tilgjengelighetserklæring",
      lastUpdatedLabel: "Sist oppdatert",
      lastUpdated: PUBLIC_POLICY_LAST_UPDATED,
      intro: [
        "Vi arbeider for at dette nettstedet skal være tilgjengelig for så mange som mulig, inkludert personer med funksjonsnedsettelser. Denne erklæringen beskriver tilnærmingen vår og hvordan du kan få hjelp.",
      ],
      links: {
        privacy: "Personvernerklæring",
        home: "forsiden",
        wcag: "Web Content Accessibility Guidelines (WCAG) 2.1",
        defender: "Défenseur des droits",
      },
      sections: [
        {
          heading: "1. Standarder og mål",
          paragraphs: [
            "Vi tar sikte på å følge {wcag} på nivå AA der dette er praktisk mulig. Dette omfatter blant annet:",
          ],
          items: [
            { text: "tilstrekkelig fargekontrast mellom tekst og bakgrunn;" },
            { text: "tekst som kan skaleres og oppsett som fungerer på små skjermer;" },
            { text: "tastaturnavigasjon og synlig fokus;" },
            { text: "meningsfulle alternative tekster for bilder og etiketter for skjemakontroller;" },
            { text: "tydelige overskrifter og landemerker, inkludert hovedinnhold, navigasjon og bunntekst;" },
            { text: "støtte for lyst og mørkt tema." },
          ],
        },
        {
          heading: "2. Tiltak som er gjennomført",
          paragraphs: [
            "Vi bruker semantisk HTML, ARIA der det er nødvendig, og stiler som respekterer brukerpreferanser som redusert bevegelse og tema. Nettstedet testes for tastaturbruk og med skjermlesere der det er mulig.",
            "De primære språkversjonene leveres direkte av applikasjonen. Enkelte legacy-sider kan også tilby Google Translate; automatisk oversatt innhold er ikke alltid fullt tilgjengelig, og vi forbedrer det der vi kan.",
          ],
        },
        {
          heading: "3. Kjente begrensninger",
          paragraphs: [
            "Noe tredjepartsinnhold, som innebygde widgeter eller eksterne lenker, er ikke fullt ut under vår kontroll. Vi velger og konfigurerer slikt innhold med tilgjengelighet i tankene, men kan ikke garantere at det oppfyller alle krav.",
            "PDF-filer eller andre dokumenter som lenkes fra nettstedet, er kanskje ikke fullt tilgjengelige. Vi arbeider med å erstatte eller supplere dem der det er mulig.",
          ],
        },
        {
          heading: "4. Tilbakemelding og kontakt",
          paragraphs: [
            "Hvis du opplever en tilgjengelighetsbarriere eller har et forslag, kan du kontakte oss via {home}, ved å bruke kontaktseksjonen eller lenkene som finnes der. Vi vil gjøre vårt beste for å svare og, når det er relevant, rette problemet eller forklare alternativer.",
          ],
        },
        {
          heading: "5. Klager",
          paragraphs: [
            "Hvis du ikke er fornøyd med svaret vårt, kan du kontakte relevant myndighet eller organ i landet ditt. I Frankrike kan du blant annet se informasjon fra {defender}.",
          ],
        },
      ],
      closing: [
        "Denne erklæringen kan bli oppdatert. Datoen øverst på siden viser siste revisjon.",
      ],
    },
  },
} as const satisfies Record<
  PublicPolicySlug,
  Record<AppLocale, PublicPolicyCopy>
>;

export function getPublicPolicyCopy(
  policy: PublicPolicySlug,
  locale: AppLocale,
): PublicPolicyCopy {
  return PUBLIC_POLICY_COPY[policy][locale];
}
