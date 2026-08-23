// NOTE: This 404 page only renders static HTML under our full control.
// No user input reaches dangerouslySetInnerHTML. CodeQL warning about incomplete sanitization is not relevant: this code is safe in our deployment context. See README for details.
import type { Metadata } from "next";

import "./globals.css";

import { loadPublicHtmlFragment } from "@/lib/htmlFromPublic";

export const metadata: Metadata = {
  title: "404 - Page not found | Bababou",
  description:
    "The page you are looking for could not be found. Return to the homepage.",
  icons: { icon: "/favicon.ico" },
};

export default async function GlobalNotFound() {
  const staticBody = await loadPublicHtmlFragment("404.html", "body", "en");
  // This is a trusted, versioned asset. Its classes, inline styles and
  // accessibility attributes are part of the custom 404 design. Scripts are
  // provided explicitly below so analytics and widgets are loaded only once.
  const staticMarkup = staticBody.replace(
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    "",
  );

  return (
    <html
      lang="en"
      data-nabla-app="next-global-not-found"
      suppressHydrationWarning
    >
      <body className="page-dark">
        <div
          style={{ display: "contents" }}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: staticMarkup }}
        />
        <script src="/site-analytics.js" data-analytics-mode="vercel" defer />
        <script src="/site-widgets.js" data-minimal-chrome="" defer />
      </body>
    </html>
  );
}
