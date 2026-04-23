import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
	// Repo has lockfiles at root and under app/; pin Turbopack to this Next package.
	turbopack: { root: appDir },
	async rewrites() {
		return {
			beforeFiles: [{ source: "/", destination: "/index.html" }],
		};
	},
};

export default nextConfig;
