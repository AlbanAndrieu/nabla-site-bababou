import { HOME_GALLERY_CARDS } from "@/lib/homeGalleryCatalog.mjs";
import { canonicalPagePath } from "@/lib/sitePageCatalog";

import GalleryCardMedia from "./GalleryCardMedia";
import LegacyAssociationsSection from "./LegacyAssociationsSection";
import openingStyles from "./LegacyOpeningSection.module.css";
import factsStyles from "./LegacyFamilyFactsSection.module.css";
import contactStyles from "./LegacyContactSection.module.css";
import messageStyles from "./LegacyMessageSection.module.css";
import foundStyles from "./LegacyFoundWebsiteSection.module.css";
import aboutStyles from "./LegacySiteAboutSection.module.css";
import journeyStyles from "./LegacyJourneySection.module.css";
import legalStyles from "./LegacyLegalResourcesSection.module.css";
import galleryStyles from "./LegacyStoryGallerySection.module.css";
import peopleStyles from "./LegacyPeopleSection.module.css";
import disclosureStyles from "./LegacyDisclosureSection.module.css";

/**
 * Native French translation of the non-sensitive, already public React review.
 * The original English text remains unchanged in the Legacy* components.
 * Publication still requires the owner's editorial sign-off.
 */
const frenchCards = [
  {
    title: "Un message pour ma fille",
    description: "Un message personnel écrit avec amour et espoir.",
    link: "Lire le message",
  },
  {
    title: "Comment me contacter",
    description: "Utilise l’adresse électronique publique de cette page. Aucun compte n’est nécessaire.",
    link: "Me contacter",
  },
  {
    title: "La famille et les liens",
    description: "Les liens avec la famille en France restent importants pour moi.",
    link: "Lire ma lettre",
  },
  {
    title: "Une longue recherche",
    description: "Je cherche à renouer le contact avec ma fille depuis de nombreuses années.",
    link: "Voir le parcours",
  },
  {
    title: "Documents et contexte",
    description: "Découvre comment les documents sont relus, anonymisés et traduits avant leur publication.",
    link: "Lire l’avertissement",
  },
  {
    title: "Recherche de traduction en norvégien",
    description: "Une aide pour traduire en norvégien ou en suédois serait bienvenue.",
    link: "Me contacter",
  },
  {
    title: "Patience et espoir",
    description: "Un message d’affection et d’encouragement qui demeure.",
    link: "Lire le message",
  },
  {
    title: "Recherche de traduction en allemand",
    description: "Une aide pour traduire en allemand serait bienvenue.",
    link: "Me contacter",
  },
  {
    title: "Personnes et institutions contactées",
    description: "Consulte la page publique des personnes contactées et les ressources relatives aux autorités centrales.",
    link: "Voir les ressources",
  },
  {
    title: "Toujours présent",
    description: "Lis le dernier message et retrouve le lien de contact direct.",
    link: "Lire le message",
  },
] as const;

/** The images, fragments and card order stay owned by the reviewed catalog. */
const cards = HOME_GALLERY_CARDS.map((card, index) => ({
  ...card,
  ...frenchCards[index],
}));

export default function FrenchHomeSections() {
  return (
    <>
      <section id="preview-opening" className={openingStyles.section} lang="fr" aria-labelledby="preview-opening-heading">
        <h2 id="preview-opening-heading">
          Éléonore (Bababou) — Si tu lis ceci, ton papa te cherche
        </h2>
        <h3>Ma chère fille,</h3>
        <p>
          <strong>Je suis ton père, Alban Andrieu.</strong> Chaque jour depuis
          le 6 juin 2015, je te cherche. Je n’ai jamais cessé de penser à toi
          et je ne cesserai jamais de te chercher.
        </p>
        <p>
          <strong>TU N’ES PAS SEULE.</strong> Je suis là. Je t’attends. Je suis
          ton papa et je t’aime plus que tout au monde.
        </p>
      </section>

      <section id="preview-important-information" className={factsStyles.section} lang="fr" aria-labelledby="preview-important-information-heading">
        <h2 id="preview-important-information-heading">Quelques informations importantes</h2>
        <ul className={factsStyles.list}>
          <li>Ta famille en France t’aime et tu lui manques.</li>
          <li>Ton papa te cherche depuis 2015.</li>
          <li>Je suis là si tu souhaites me contacter.</li>
          <li>Tu peux découvrir plus bas les ressources et les personnes contactées.</li>
        </ul>
        <p className={factsStyles.contact}>
          <a href="#preview-contact">Comment me contacter</a>
        </p>
      </section>

      <section id="preview-contact" className={contactStyles.section} lang="fr" aria-labelledby="preview-contact-heading">
        <h2 id="preview-contact-heading">Comment me contacter</h2>
        <p>
          Écris-moi à l’adresse :{" "}
          <a href="mailto:aa@bababou.com">aa@bababou.com</a>
        </p>
        <p>
          Tu peux me contacter à tout moment, de jour comme de nuit. Je te promets
          de te répondre immédiatement. Tu peux m’écrire en toute confiance.
        </p>
      </section>

      <section id="preview-letter" className={messageStyles.section} lang="fr" aria-labelledby="preview-letter-heading">
        <h2 id="preview-letter-heading">Un message de ton papa :</h2>
        <blockquote className={messageStyles.quote}>
          <p>
            « Éléonore (Bababou), où que tu sois, quoi qu’on t’ait dit,
            sache ceci :{" "}
            <strong>
              Je n’ai jamais cessé de t’aimer. Je n’ai jamais cessé de me
              battre pour toi. Je serai toujours là pour toi.
            </strong>
          </p>
          <p>
            Tu as peut-être des questions, tu es peut-être perdue ou tu ne te
            souviens peut-être pas bien de moi. Ce n’est pas grave. Je comprends.
            Sache simplement que ton papa t’aime sans condition et qu’il sera
            là pour te soutenir lorsque tu seras prête.
          </p>
          <p>
            <strong>Je t’aime plus qu’hier et moins que demain. Pour toujours. »</strong>
          </p>
        </blockquote>
      </section>

      <section id="preview-found-website" className={foundStyles.section} lang="fr" aria-labelledby="preview-found-website-heading">
        <h2 id="preview-found-website-heading">
          Si tu es Éléonore (Bababou) et que tu as trouvé ce site :
        </h2>
        <p>
          Sache que tu as le droit de me contacter. Personne ne peut t’empêcher
          de connaître ton père. Je t’attends ici, les bras ouverts. 💙
        </p>
        <p className={foundStyles.tagline}>
          Ce site a été créé par ton père pour t’aider à le retrouver.
          Il te cherche depuis 2015.
        </p>
      </section>

      <section id="preview-about" className={aboutStyles.section} lang="fr">
        <details>
          <summary>À propos de ce site</summary>
          <div className={aboutStyles.content}>
            <p>Bababou — messages et ressources publiques.</p>
            <p>
              Ce site rassemble des messages, des coordonnées et des liens
              vers des ressources publiques.
            </p>
            <ul>
              <li>
                <a href="https://calendly.com/alban-andrieu" target="_blank" rel="noopener noreferrer">
                  Prendre rendez-vous pour échanger
                </a>
              </li>
              <li>
                <a href="https://ko-fi.com/albandrieu" target="_blank" rel="noopener noreferrer">
                  Soutenir ce site (Ko-fi)
                </a>
              </li>
            </ul>
          </div>
        </details>
      </section>

      <section id="preview-journey" className={journeyStyles.section} lang="fr" aria-labelledby="preview-journey-heading">
        <p className={journeyStyles.eyebrow}>Une histoire au-delà des frontières</p>
        <h2 id="preview-journey-heading">France, Norvège et Allemagne</h2>
        <p>
          Ma recherche pour renouer le contact avec ma fille m’a conduit
          à travers différents pays et systèmes juridiques. Il s’agit d’un
          aperçu historique, et non d’une indication de la position actuelle
          de qui que ce soit.
        </p>
        <ol className={journeyStyles.journey} aria-label="Pays mentionnés dans cette histoire">
          {[
            { flag: "🇫🇷", name: "France" },
            { flag: "🇳🇴", name: "Norvège" },
            { flag: "🇩🇪", name: "Allemagne" },
          ].map(({ flag, name }) => (
            <li key={name} className={journeyStyles.step}>
              <span className={journeyStyles.flag} aria-hidden="true">{flag}</span>
              <span className={journeyStyles.name}>{name}</span>
            </li>
          ))}
        </ol>
        <p>
          <a href="/for-fathers.html">
            En savoir plus sur le cadre juridique international et les ressources disponibles
          </a>
          {" "}<span lang="en">(document disponible en anglais)</span>
        </p>
      </section>

      <section id="preview-legal-resources" className={legalStyles.section} lang="fr" aria-labelledby="preview-legal-resources-heading">
        <h2 id="preview-legal-resources-heading">Cadre juridique et ressources</h2>
        <p>
          Informations pour les parents en difficulté : cadre juridique européen
          (France, Norvège, Allemagne), conventions internationales, aliénation
          parentale, demandes de garde partagée et application des droits de
          visite — ainsi qu’un appel à une action internationale.
        </p>
        <ul className={legalStyles.resources}>
          <li>
            <a href="/for-fathers.html">Informations pour les pères</a>
            <p>Cadre juridique européen et ressources publiques existantes (en anglais).</p>
          </li>
          <li>
            <a href={canonicalPagePath("nre", "fr")}>NRE — France</a>
            <p>Consulter la page publique sur la non-représentation d’enfant en France.</p>
          </li>
          <li>
            <a href={canonicalPagePath("central-authorities", "fr")}>Autorités centrales</a>
            <p>Consulter les ressources publiques sur les autorités centrales.</p>
          </li>
        </ul>
      </section>

      <section id="preview-story-gallery" className={galleryStyles.section} lang="fr" aria-labelledby="preview-story-gallery-heading">
        <div className={galleryStyles.heading}>
          <p className={galleryStyles.eyebrow}>À partir de la page d’origine</p>
          <h2 id="preview-story-gallery-heading">Messages et ressources</h2>
          <p>
            Une galerie de dix cartes reprenant la présentation illustrée du
            site initial. Les documents sensibles et les affirmations non
            vérifiées ne sont pas reproduits.
          </p>
        </div>
        <ul className={galleryStyles.grid}>
          {cards.map((card) => (
            <li key={card.href + card.title} className={galleryStyles.card}>
              <GalleryCardMedia image={card.image} />
              <div className={galleryStyles.body}>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <a href={card.href}>{card.link}</a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="preview-people" className={peopleStyles.section} lang="fr" aria-labelledby="preview-people-heading">
        <h2 id="preview-people-heading">Personnes que j’ai contactées</h2>
        <p>
          Les archives publiques présentent des démarches auprès de personnes
          et d’institutions. Les pages existantes donnent plus de détails ;
          les dossiers individuels ne sont pas copiés dans cette Preview.
        </p>
        <ul className={peopleStyles.resources}>
          <li>
            <a href="/people-contacted.html">Personnes contactées</a>
            <p>Consulter la présentation publique existante et sa visualisation interactive (en anglais).</p>
          </li>
          <li>
            <a href="/central-authorities.html">Autorités centrales</a>
            <p>Consulter la page publique existante consacrée aux autorités centrales.</p>
          </li>
        </ul>
      </section>

      <LegacyAssociationsSection locale="fr" />

      <section id="preview-document-disclosure" className={disclosureStyles.section} lang="fr" aria-label="Documents publiés sur ce site">
        <details className={disclosureStyles.details}>
          <summary className={disclosureStyles.summary}>
            Documents publiés sur ce site — note sur leur traitement
          </summary>
          <div className={disclosureStyles.content}>
            <p>
              Les documents disponibles sur ce site ont fait l’objet des
              traitements suivants : corrections orthographiques et grammaticales,
              anonymisation pour protéger l’enfant et traduction si nécessaire.
              Pour le reste, ils sont conservés aussi proches que possible
              de leurs originaux.
            </p>
            <p>
              Certains documents ne sont pas publiés parce qu’ils doivent
              encore être validés.
            </p>
          </div>
        </details>
      </section>
    </>
  );
}
