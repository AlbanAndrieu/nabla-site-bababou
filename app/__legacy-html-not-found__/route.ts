import { readFile } from "node:fs/promises";

const staticNotFoundUrl = new URL(
  "../../public/404.html",
  import.meta.url,
);

const LEGACY_NOT_FOUND_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "text/html; charset=utf-8",
  "X-Robots-Tag": "noindex, nofollow",
};

async function renderLegacyNotFoundHtml() {
  const source = await readFile(staticNotFoundUrl, "utf8");
  return source
    .replace(
      '<html lang="en">',
      '<html lang="en" data-nabla-app="next-global-not-found">',
    )
    .replace('href="favicon.ico"', 'href="/favicon.ico"')
    .replaceAll('src="site-', 'src="/site-');
}

function legacyNotFoundResponse(body: string | null) {
  return new Response(body, {
    status: 404,
    headers: LEGACY_NOT_FOUND_HEADERS,
  });
}

export async function GET() {
  return legacyNotFoundResponse(await renderLegacyNotFoundHtml());
}

export function HEAD() {
  return legacyNotFoundResponse(null);
}
