import type { HtmlExtractMode } from "./htmlFromPublic";

export type MarketingPageSpec = {
	file: string;
	mode: HtmlExtractMode;
	bodyClass?: string;
	analyticsMode?: "vercel" | "full" | "marketing" | "home";
	ahrefsKey?: string;
};

/** Root-level HTML pages (slug → source under public/). Excludes index and 404. */
export const MARKETING_PAGES: Record<string, MarketingPageSpec> = {
	index: {
		file: "index.html",
		mode: "navHeaderMain",
		bodyClass:
			"site-content-page page-home page-dark page-nabla-best-practices",
	},
	contact: {
		file: "contact.html",
		mode: "navHeaderMain",
		bodyClass: "site-content-page page-dark page-nabla-best-practices",
	},
	test: {
		file: "test.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
		analyticsMode: "home",
		ahrefsKey: "tg3zLMS/bebJFl0LxctiCw",
	},
	email: {
		file: "email.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
	},
};
