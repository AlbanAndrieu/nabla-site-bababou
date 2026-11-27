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
      "public/**",
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
    files: [
      "scripts/**/*.{cjs,mjs}",
      "lib/**/*.mjs",
      "*.config.{cjs,js,mjs}",
      "server.cjs",
    ],
    languageOptions: {
      globals: {
        AbortSignal: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        __dirname: "readonly",
        console: "readonly",
        fetch: "readonly",
        module: "readonly",
        process: "readonly",
        require: "readonly",
      },
    },
  },
  {
    // node:test contracts run on Node 24+, where these are built-in globals.
    files: ["unit-tests/**/*.mjs"],
    languageOptions: {
      globals: {
        Buffer: "readonly",
        URL: "readonly",
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        structuredClone: "readonly",
      },
    },
  },
];
