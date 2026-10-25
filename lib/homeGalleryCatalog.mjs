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
    description: "A direct way to contact me, without a third-party service.",
    image: null,
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
    description: "Find the public explanations and the document processing notice.",
    image: null,
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
    description: "Explore the public resource page about this process.",
    image: null,
    href: "#preview-people",
    link: "See the resources",
  },
  {
    title: "Always here",
    description: "A personal message that remains available to read.",
    image: null,
    href: "#preview-found-website",
    link: "Read the note",
  },
]);
