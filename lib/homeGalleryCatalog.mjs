/**
 * Public, reviewed card data shared by React and dependency-free audit tests.
 * Avoid reintroducing precise locations, identity records or allegations.
 * The legacy site remains accessible separately until owner approval.
 * @typedef {{title:string,description:string,image:string|null,href:string,link:string}} HomeGalleryCard
 */
/** @type {ReadonlyArray<HomeGalleryCard>} */
export const HOME_GALLERY_CARDS = Object.freeze([
  {
    title: "A message for my daughter",
    description: "A place for a personal message, written with love and hope.",
    image: "/assets/alone-1.jpg",
    href: "#preview-opening",
    link: "Read the message",
  },
  {
    title: "How to get in touch",
    description: "Use the public email contact on this page. No account or message form is required.",
    image: "/assets/home-card-contact.svg",
    href: "#preview-contact",
    link: "Contact me",
  },
  {
    title: "Family and belonging",
    description: "The ties to family in France remain important to me.",
    image: "/assets/miss-and-love-you-quote.jpeg",
    href: "#preview-letter",
    link: "Read my letter",
  },
  {
    title: "A long search",
    description: "The search for family contact has continued over many years.",
    image: "/assets/hide-and-sick-quote.jpg",
    href: "#preview-journey",
    link: "See the journey",
  },
  {
    title: "Documents and context",
    description: "Read how public documents are reviewed, anonymized and translated before publication.",
    image: "/assets/home-card-documents.svg",
    href: "#preview-document-disclosure",
    link: "Read the notice",
  },
  {
    title: "Looking for Norwegian Translator",
    description: "Norwegian or Swedish language support would be welcome.",
    image: "/assets/flag-french-norway-simple.svg",
    href: "#preview-contact",
    link: "Get in touch",
  },
  {
    title: "Patience and hope",
    description: "A message of continued care and encouragement.",
    image: "/assets/patience-vertue-quote.jpg",
    href: "#preview-found-website",
    link: "Read the message",
  },
  {
    title: "Looking for German Translator",
    description: "German language support would be welcome.",
    image: "/assets/flag-french-germany.svg",
    href: "#preview-contact",
    link: "Get in touch",
  },
  {
    title: "People and institutions contacted",
    description: "Browse the public people-contacted page and the central-authority resources.",
    image: "/assets/home-card-people.svg",
    href: "#preview-people",
    link: "See the resources",
  },
  {
    title: "Always here",
    description: "Read the closing note and find the direct contact link if you wish to get in touch.",
    image: "/assets/home-card-message.svg",
    href: "#preview-found-website",
    link: "Read the note",
  },
]);
