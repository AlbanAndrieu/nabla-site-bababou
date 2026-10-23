import type { ReactNode } from "react";

/**
 * Independent root layout for the legacy homepage placeholder.
 *
 * Next 16.4 requires the app's top-level / route to have a root layout.
 * Localized routes keep their own root layout at app/[locale]/layout.tsx.
 * proxy.ts continues rewriting / to the reviewed public/index.html.
 */
export default function LegacyHomeRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
