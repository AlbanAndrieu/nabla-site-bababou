# nabla-site-bababou Next.js Application

This is the Next.js component of the nabla-site-bababou project, a modern web application built with Next.js 16, React 19, and TypeScript.

## Technology Stack

- **Next.js** 16.0.10 (App Router)
- **React** 19.2.0
- **TypeScript** 5.x
- **Tailwind CSS** 4.x
- **Vercel Analytics & Speed Insights**

## Prerequisites

This application requires:
- **Node.js** >= 24.11.0
- **npm** >= 11.6.2
- **pnpm** ^10.22.0

## Installation

From the repository root:

```bash
cd my-app
npm install
# or
pnpm install
```

## Development

Run the development server:

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Building

Create an optimized production build:

```bash
npm run build
```

After building, start the production server:

```bash
npm run start
```

## Linting

Run ESLint to check code quality:

```bash
npm run lint
```

## Project Structure

```
my-app/
├── app/                 # Next.js App Router directory
│   ├── page.tsx        # Main page component
│   ├── layout.tsx      # Root layout
│   └── globals.css     # Global styles
├── public/             # Static assets
├── eslint.config.mjs   # ESLint configuration
├── next.config.ts      # Next.js configuration
├── postcss.config.mjs  # PostCSS configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Features

- **App Router**: Uses Next.js 13+ App Router for improved routing and layouts
- **TypeScript**: Fully typed with TypeScript for better developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Analytics**: Integrated with Vercel Analytics and Speed Insights
- **Font Optimization**: Uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Geist font

## Deployment

### Vercel Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

```bash
# From the my-app directory
vercel deploy

# Production deployment
vercel --prod
```

### Manual Deployment

Build the application and deploy the `.next` directory:

```bash
npm run build
# Deploy the contents of .next/ and public/ to your hosting provider
```

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - TypeScript handbook

## Related Documentation

- See the [main repository README](../README.md) for overall project documentation
- Check [Copilot instructions](../.github/copilot-instructions.md) for development guidelines

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](../LICENSE) file for details.
