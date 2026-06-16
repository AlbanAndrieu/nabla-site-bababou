/** Leaflet (contact map) — same URL as `public/contact.html`. */
const LEAFLET_CSS =
	"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";

/**
 * Stylesheets each static marketing HTML shell links in `<head>`.
 * The App Router root layout only loads the global stack; `[locale]/[slug]` must
 * add these so injected `<main>` markup matches standalone `public/*.html`.
 */
const SLUG_STYLESHEETS: Record<string, readonly string[]> = {
	contact: ["/site-content-page.css", "/page-layouts.css", LEAFLET_CSS],
	test: ["/site-content-page.css", "/arf.css"],
	email: ["/site-content-page.css"],
};

export function marketingSlugStylesheets(slug: string): readonly string[] {
	return SLUG_STYLESHEETS[slug] ?? ["/site-content-page.css"];
}
