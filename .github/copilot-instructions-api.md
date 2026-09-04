# Copilot instructions — API surface

Follow `/AGENTS.md` as the canonical repository policy.

- `api/**` contains optional root-project Vercel serverless handlers; it is not a separate application or package.
- Run development, type-check, tests and builds from the repository root.
- Use the root Next.js development server for local application work; do not restore `vercel dev`, `vercel deploy` or a local Vercel CLI dependency.
- Vercel Git Integration owns deployment. Ordinary PR branches use the validated `vercel-preview-pr-*` checkpoint path when a runtime Preview is required.
- Keep handlers minimal, validate method/input boundaries, return explicit HTTP status codes and avoid leaking internal errors.
- Read secrets from environment variables managed outside Git; never place credentials or realistic secret examples in source/docs.
- Prefer built-in platform/runtime APIs over adding a framework or SDK without a proven consumer.
- When an API handler changes runtime behavior, retain unit/build validation and exact Preview E2E where applicable.
