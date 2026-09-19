import { readFile } from "node:fs/promises";

const staticNotFoundUrl = new URL(
  "../../public/404.html",
  import.meta.url,
);

export async function GET() {
  const source = await readFile(staticNotFoundUrl, "utf8");
  const html = source
    .replace(
      '<html lang="en">',
      '<html lang="en" data-nabla-app="next-global-not-found">',
    )
    .replace('href="favicon.ico"', 'href="/favicon.ico"')
    .replaceAll('src="site-', 'src="/site-');

  return new Response(html, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
