import type { NextConfig } from "next";
import { readdirSync } from "node:fs";
import { join, posix } from "node:path";

function getStaticHtmlPages() {
	const publicDir = join(process.cwd(), "public");

	const walk = (directory: string): string[] => {
		const entries = readdirSync(directory, { withFileTypes: true });
		return entries.flatMap((entry) => {
			const absolutePath = join(directory, entry.name);
			if (entry.isDirectory()) {
				return walk(absolutePath);
			}
			if (entry.isFile() && entry.name.endsWith(".html")) {
				return [absolutePath];
			}
			return [];
		});
	};

	return walk(publicDir)
		.map((absolutePath) => {
			const relativePath = absolutePath.slice(publicDir.length).replace(/\\/g, "/");
			return relativePath.replace(/\.html$/i, "");
		})
		.map((pathname) => (pathname.startsWith("/") ? pathname : `/${pathname}`))
		.sort((a, b) => b.length - a.length);
}

const htmlPages = getStaticHtmlPages();

const nextConfig: NextConfig = {
	async rewrites() {
		const seen = new Set<string>();
		const addRewrite = (source: string, destination: string) => {
			const key = `${source}->${destination}`;
			if (seen.has(key)) return null;
			seen.add(key);
			return { source, destination };
		};

		const extensionlessRewrites = htmlPages.flatMap((pathname) => {
			const destination = `${pathname}.html`;
			const rewrites = [];

			if (pathname === "/index") {
				const rootRewrite = addRewrite("/", "/index.html");
				if (rootRewrite) rewrites.push(rootRewrite);
				const indexRewrite = addRewrite("/index", "/index.html");
				if (indexRewrite) rewrites.push(indexRewrite);
				return rewrites;
			}

			const directRewrite = addRewrite(pathname, destination);
			if (directRewrite) rewrites.push(directRewrite);

			if (pathname.endsWith("/index")) {
				const parentPath =
					pathname.slice(0, -"/index".length) || posix.sep;
				const folderRewrite = addRewrite(parentPath, destination);
				if (folderRewrite) rewrites.push(folderRewrite);
			}

			return rewrites;
		});

		return extensionlessRewrites;
	},
};

export default nextConfig;
