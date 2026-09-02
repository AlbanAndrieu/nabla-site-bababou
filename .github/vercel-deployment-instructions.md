# Vercel Deployment Instructions

This document provides comprehensive guidelines for deploying the Nabla site to Vercel, including both manual deployments and automated SDLC workflows.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Deployment Strategies](#deployment-strategies)
5. [Environment Configuration](#environment-configuration)
6. [Monorepo Deployments](#monorepo-deployments)
7. [SDLC Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Overview

The Bababou site is deployed to Vercel with the following architecture:
- **Primary Vercel project**: Next.js 16 under `app/`, with `app/public` pointing at the repository `public/` tree (static HTML, assets, and PDFs). Vercel runs `next build` / `next start` with `vercel.json` `rootDirectory` set to `app`.
- **Optional / legacy**: `vue-client` or other folders may exist as separate Vercel projects or deploy targets.

## Prerequisites

### Required Tools
```bash
# Install Node.js (v20 or later recommended)
node --version

# Install Vercel CLI globally
npm install -g vercel@latest

# Verify installation
vercel --version
```

### Required Accounts
- Vercel account (https://vercel.com)
- GitHub repository access
- Appropriate permissions to create Vercel tokens

## Initial Setup

### 1. Link Your Project

First time setup requires linking your local project to Vercel:

```bash
# Navigate to project root
cd /path/to/nabla-site-bababou

# Link to Vercel project
vercel link
```

Follow the prompts:
- Set up and deploy: **Yes**
- Which scope: Select your team/personal account
- Link to existing project: **Yes** (if project exists) or **No** (to create new)
- What's your project's name: `nabla-site-bababou`
- In which directory is your code located: `./`

This creates a `.vercel` directory with:
```json
{
  "orgId": "team_xxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxx"
}
```

⚠️ **Important**: The `.vercel` directory is in `.gitignore` and should never be committed.

### 2. Configure Vercel Project Settings

Access your project settings at: `https://vercel.com/[your-account]/[project-name]/settings`

#### General Settings (main site)

With `vercel.json` at the repository root containing `"rootDirectory": "app"`:

- **Root Directory**: `app` (Vercel reads this from `vercel.json` when present)
- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: default `next build` (or leave default)
- **Output**: Next default (`.next`); static files are served from `public/` via the Next `public` folder symlinked to the repo `public/` directory
- **Install Command**: default `npm install` in `app/`

For **other** deployables in the monorepo, set Root Directory and build commands per project in each Vercel project’s settings.

### 3. Obtain Required Credentials

For GitHub Actions integration, you need three values:

#### VERCEL_TOKEN
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: `GitHub Actions - Nabla Site`
4. Scope: Select your team/account
5. Expiration: Set appropriate duration (or no expiration for persistent SDLC)
6. Copy the token immediately (shown only once)

#### VERCEL_ORG_ID and VERCEL_PROJECT_ID
```bash
# After running 'vercel link', get the IDs:
cat .vercel/project.json
```

Save these values - you'll need them for GitHub Actions secrets.

## Deployment Strategies

### Preview Deployments (Development)

Preview deployments are created for every push and pull request:

```bash
# Deploy to preview environment
vercel

# The CLI will output a preview URL like:
# https://nabla-site-bababou-abc123.vercel.app
```

**Characteristics**:
- Unique URL for each deployment
- Perfect for testing changes
- Automatically created by SDLC on PRs
- No production traffic impact
- Accessible to team members

### Production Deployments

Production deployments update your main site:

```bash
# Deploy to production
vercel --prod

# Your site will be available at configured domains:
# https://nabla.albandrieu.com
```

**Characteristics**:
- Updates production domains
- Requires explicit `--prod` flag
- Should only deploy from main/master branch
- Automatic rollback capability
- Zero-downtime deployments

### Deployment Workflow Comparison

| Aspect | Preview | Production |
|--------|---------|------------|
| Command | `vercel` | `vercel --prod` |
| Trigger | Any branch/PR | main/master branch |
| URL | Unique preview URL | Production domain |
| Purpose | Testing, review | Live site |
| Rollback | N/A (new deployment) | Previous deployment |

## Environment Configuration

### Environment Variables

Vercel supports three environment types:
- **Production**: Used for `--prod` deployments
- **Preview**: Used for preview deployments
- **Development**: Used for local development (`vercel dev`)

#### Setting Environment Variables via CLI

```bash
# Add environment variable
vercel env add [name]

# Example: Add API key for production
vercel env add API_KEY production
# Then paste the value when prompted

# List all environment variables
vercel env ls

# Remove environment variable
vercel env rm [name] [environment]
```

#### Setting Environment Variables via Dashboard

1. Go to project settings: `https://vercel.com/[account]/[project]/settings/environment-variables`
2. Click "Add"
3. Enter name and value
4. Select environments (Production, Preview, Development)
5. Click "Save"

#### Environment variables in this project

The root `vercel.json` mainly sets `"rootDirectory": "app"`. Add production or preview secrets (API keys, feature flags, and so on) in the Vercel project settings or with `vercel env add`; do not commit real secrets into the repository.

### Secrets Management

**Best Practices**:
- Never commit secrets to version control
- Use Vercel's encrypted environment variables
- Rotate secrets regularly
- Use different secrets for preview vs production
- Limit access to production secrets

## Monorepo Deployments

This repository contains multiple deployable projects. Each should be deployed separately.

### Main site (this repository)

```bash
# From repository root (recommended)
vercel link
vercel --prod
```

**Configuration**: Root `vercel.json` sets `"rootDirectory": "app"`. Vercel installs dependencies and runs `next build` inside `app/`; static assets come from the repository `public/` directory via the app’s `public` symlink.

You can also create a **separate** Vercel project with root directory `app/` and link from `cd app` if you prefer that layout.

### Monorepo best practices

1. **Separate Projects**: Create separate Vercel projects for each deployable app
2. **Clear Naming**: Use descriptive project names (e.g., `nabla-site`, `nabla-app`, `nabla-vue`)
3. **Independent Versioning**: Each project can have its own deployment cadence
4. **Shared Dependencies**: Use npm workspaces if needed
5. **Root Directory**: Set the correct root directory in each project's settings

## SDLC integration

### GitHub and Vercel

Deployments are expected to come from **Vercel’s GitHub integration** (build on Vercel for pushes and pull requests to the linked branch).

GitHub Actions in `.github/workflows/` handle tests and tooling (for example Playwright, linters, optional `app` build verification). They do not replace Vercel’s build unless you add a custom deploy workflow.

#### Optional secrets (CLI-only deploys)

If you add a workflow that runs the Vercel CLI, configure **VERCEL_TOKEN**, **VERCEL_ORG_ID**, and **VERCEL_PROJECT_ID**. See [docs/GITHUB_ACTIONS_SETUP.md](../docs/GITHUB_ACTIONS_SETUP.md).

### Triggering deployments

#### Automatic Triggers
- **Push to any branch**: Creates preview deployment
- **Pull request**: Creates preview deployment with comment
- **Push to main/master**: Creates production deployment

#### Manual Triggers

### Deployment Status

Monitor deployments:
1. **GitHub Actions**: Check workflow runs in Actions tab
2. **Vercel Dashboard**: View deployment status at https://vercel.com/dashboard
3. **Vercel CLI**: `vercel ls` shows recent deployments

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Failed to deploy: Invalid token"

**Cause**: VERCEL_TOKEN is incorrect or expired

**Solution**:
1. Generate new token at https://vercel.com/account/tokens
2. Update GitHub secret: Settings → Secrets → VERCEL_TOKEN
3. Re-run workflow

#### Issue: "Project not found"

**Cause**: VERCEL_PROJECT_ID or VERCEL_ORG_ID is incorrect

**Solution**:
1. Run `vercel link` locally
2. Check `.vercel/project.json` for correct IDs
3. Update GitHub secrets with correct values

#### Issue: "Build failed" on Vercel or in GitHub Actions

**Cause**: Node or Next.js build errors, missing dependencies, or broken `app/public` symlink to `../public`

**Solution**:
1. From the repo root: `cd app && npm ci && npm run build`
2. Confirm `app/public` is a symlink to `../public` and that static files exist (for example `public/index.html`)
3. Review build logs on Vercel or in the failing Actions job

#### Issue: "404 Not Found" after deployment

**Cause**: Wrong root directory, failed Next build, or missing static files under `public/`

**Solution**:
1. Confirm root `vercel.json` includes `"rootDirectory": "app"`
2. Confirm `next.config.ts` in `app/` still rewrites `/` to `/index.html` if you rely on that entry
3. Verify assets and HTML are present under the repository `public/` directory

#### Issue: "Function execution timed out"

**Cause**: A Vercel Serverless or Edge function exceeded its time limit

**Solution**:
1. Review function logs in the Vercel dashboard
2. Optimize the handler (fewer round trips, smaller payloads, caching)
3. On paid plans, consider higher limits where available

#### Issue: Preview deployments not created for PRs

**Cause**: Vercel GitHub integration not connected

**Solution**:
1. Go to Vercel Dashboard → Project Settings → Git
2. Ensure GitHub integration is connected
3. Check GitHub permissions for Vercel app
4. Verify webhook is active in GitHub repository settings

### Debug Mode

Enable debug output for troubleshooting:

```bash
# Local debugging
DEBUG=* vercel

# GitHub Actions debugging
# Add to workflow env:
env:
  VERCEL_DEBUG: "1"
```

### Viewing Logs

#### Vercel Dashboard Logs
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click on a deployment
4. View "Build Logs" and "Function Logs" tabs

#### GitHub Actions Logs
1. Go to repository Actions tab
2. Select workflow run
3. Expand job steps to view detailed logs

#### CLI Logs
```bash
# View recent deployments
vercel ls

# Get deployment URL logs
vercel logs [deployment-url]
```

## Best Practices

### Security

1. **Never commit credentials**:
   - Add `.vercel` to `.gitignore` ✅ (already configured)
   - Use GitHub secrets for SDLC credentials
   - Rotate tokens regularly

2. **Use principle of least privilege**:
   - Create separate tokens for SDLC vs manual deployments
   - Limit token scope to specific teams/projects
   - Set token expiration dates

3. **Protect sensitive routes**:
   - Use Vercel's password protection for preview deployments
   - Implement authentication for admin routes
   - Use environment variables for API keys

### Performance

1. **Optimize build times**:
   - Cache `npm` dependencies in GitHub Actions when running jobs under `app/`
   - Keep the Next.js app minimal so `next build` stays fast

2. **Optimize assets**:
   - Compress images before committing large assets to `public/`
   - Enable Vercel’s image optimization where applicable
   - Configure appropriate cache headers for static assets

3. **Monitor performance**:
   - Use Vercel Analytics
   - Set up Vercel Speed Insights
   - Monitor Core Web Vitals

### Deployment Workflow

1. **Branch protection**:
   - Require PR reviews before merging to main
   - Require passing CI checks
   - Enable status checks for Vercel deployments

2. **Testing strategy**:
   - Review preview deployments before merging
   - Test on actual preview URLs (not just localhost)
   - Verify mobile responsiveness on preview deployments

3. **Rollback strategy**:
   - Keep previous deployments available in Vercel
   - Document rollback procedure
   - Use Vercel's instant rollback feature when needed

4. **Deployment hygiene**:
   - Clean up old preview deployments regularly
   - Monitor deployment frequency
   - Use descriptive commit messages (aids in deployment tracking)

### Documentation

1. **Keep documentation updated**:
   - Update this file when deployment process changes
   - Document environment variables in README
   - Maintain changelog for deployment-related changes

2. **Team communication**:
   - Notify team of deployment changes
   - Share preview URLs for review
   - Document production deployment schedule

## Additional resources

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel CLI Reference**: https://vercel.com/docs/cli
- **Next.js Documentation**: https://nextjs.org/docs
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Project-specific docs**:
  - [GITHUB_ACTIONS_SETUP.md](../docs/GITHUB_ACTIONS_SETUP.md)
  - [README.md](../README.md)

## Support

For issues specific to this project:
- **GitHub Issues**: Open an issue in this repository
- **Email**: aa@bababou.com

For Vercel platform issues:
- **Vercel Support**: https://vercel.com/support
- **Vercel Community**: https://github.com/vercel/vercel/discussions
