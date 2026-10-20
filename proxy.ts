import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";
import { isTrustedHomelabIpv4 } from "@/lib/homelabTrustedCidrs.mjs";

const intlMiddleware = createMiddleware(routing);
const defaultLocalePrefix = `/${routing.defaultLocale}`;
const localeRootRedirects = new Set(
  routing.locales
    .filter((locale) => locale !== routing.defaultLocale)
    .map((locale) => `/${locale}`),
);

/**
 * Next.js 16+ uses the `proxy` convention (formerly `middleware`).
 * CORS preflight `OPTIONS` is not handled by next-intl routing; forwarding it avoids 400s in dev.
 *
 * During the incremental Next.js migration, keep the legacy static homepage as
 * the public root. This rewrite runs before next-intl so `/` deterministically
 * serves `public/index.html` while already-migrated Next routes continue to use
 * the App Router.
 */
export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    pathname === "/private" ||
    pathname.startsWith("/private/") ||
    pathname === "/api/private" ||
    pathname.startsWith("/api/private/")
  ) {
    // Vercel sets x-real-ip at ingress. Do not trust arbitrary forwarding IPs.
    const clientIp = request.headers.get("x-real-ip");
    if (
      process.env.VERCEL !== "1" ||
      !isTrustedHomelabIpv4(clientIp, process.env.HOMELAB_TRUSTED_CIDRS)
    ) {
      return new NextResponse(null, {
        status: 404,
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    return NextResponse.next({
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204 });
  }

  if (request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/index.html", request.url));
  }

  /*
   * There is no localized native homepage yet. Keep locale roots converging on
   * the approved legacy root, but emit the redirect directly instead of asking
   * next-intl to render a full response body before redirecting it.
   */
  if (localeRootRedirects.has(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", request.url), 307);
  }

  /*
   * Next.js 16.3 preview can run the proxy again for next-intl's internal
   * rewrites to default-locale routes. Let the affected internal targets reach
   * the App Router instead of normalizing them again, which would create 307
   * redirect loops. Metadata continues to declare unprefixed canonical URLs.
   */
  if (
    request.nextUrl.pathname === defaultLocalePrefix ||
    request.nextUrl.pathname.startsWith(`${defaultLocalePrefix}/`)
  ) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/private/:path*",
    "/api/private/:path*",
  ],
};
