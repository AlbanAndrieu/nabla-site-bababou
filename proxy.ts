import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);
const defaultLocaleRewriteTargets = new Set([`/${routing.defaultLocale}`]);

export default function proxy(request: NextRequest) {
	if (request.method === "OPTIONS") {
		return new NextResponse(null, { status: 204 });
	}

	if (request.nextUrl.pathname === "/") {
		return NextResponse.rewrite(new URL("/index.html", request.url));
	}

	if (defaultLocaleRewriteTargets.has(request.nextUrl.pathname)) {
		return NextResponse.next();
	}

	return intlMiddleware(request);
}

export const config = {
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
