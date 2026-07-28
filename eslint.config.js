import js from "@eslint/js";

export default [
	{
		ignores: [
			"node_modules/**",
			".venv/**",
			".next/**",
			"out/**",
			"build/**",
			"dist/**",
			"coverage/**",
			"playwright-report/**",
			"test-results/**",
			"*.tsbuildinfo",
			".turbo/**",
			"app/node_modules/**",
			"app/.next/**",
			".vercel/**",
			".cache/**",
			".pnpm/**",
			"public/**/*.min.js",
			"public/d3.v3.min.js",
			"public/index.js",
			"public/arf.js",
			"public/theme-toggle.js",
			"api/**",
			"index/**",
			"vendor/**",
		],
	},
	js.configs.recommended,
	{
		files: ["scripts/**/*.{cjs,mjs}", "*.config.{cjs,js,mjs}", "server.cjs"],
		languageOptions: {
			globals: {
				__dirname: "readonly",
				console: "readonly",
				fetch: "readonly",
				module: "readonly",
				process: "readonly",
				require: "readonly",
			},
		},
	},
];
