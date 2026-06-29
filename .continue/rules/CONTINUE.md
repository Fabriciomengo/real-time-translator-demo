# Continue Project Guide

> **Status:** This guide was generated from the repository context available to the assistant. Some details, especially deployment, exact framework, and service ownership, should be verified by the team and updated as the project evolves.

## 1. Project Overview

This project appears to be a TypeScript / Node.js codebase that includes a translation feature. The translation flow uses a model-backed API integration, with model selection/configuration handled in or near a `translate.ts` module.

Recent project context indicates that a translation issue was caused by using the wrong model in `translate.ts`; correcting the model and running lint/checks validated the fix.

### Key Technologies

- **TypeScript** for application logic
- **Node.js / npm** for dependency management and scripts
- **Model-backed API integration** for translation functionality
- **Git** for version control

### High-Level Architecture

At a high level, the codebase likely follows this shape:

- Translation-related source files contain the core integration logic.
- Configuration files define TypeScript, package scripts, linting, formatting, and build behavior.
- Runtime code calls a translation function/module, which sends input to a selected model and returns translated output.
- Tests and/or lint/build checks are used to validate code changes before deployment.

Areas needing verification:

- Exact application framework, if any
- Exact source directory layout
- Exact test runner
- Deployment target and runtime process manager
- API provider and supported model list

## 2. Getting Started

### Prerequisites

Install the following before working on the project:

- Node.js, preferably the version specified by the project if an `.nvmrc`, `.node-version`, or `engines.node` field exists
- npm, or the package manager used by the repository
- Git
- Access to any required API keys or environment variables for translation/model calls

### Installation

From the repository root:

```sh
npm install
```

If the repository uses a different package manager, use the appropriate command instead:

```sh
pnpm install
# or
yarn install
```

### Environment Setup

Check for one or more of these files:

- `.env.example`
- `.env.local.example`
- README setup instructions
- Deployment documentation

Create a local environment file as needed, for example:

```sh
cp .env.example .env
```

Then populate required secrets such as API keys, base URLs, model identifiers, or service credentials.

> Do not commit real secret values.

### Basic Usage

Common development commands are expected to be npm scripts:

```sh
npm run dev
npm start
```

Verify the actual commands in `package.json`.

### Running Checks and Tests

Recommended validation commands:

```sh
npm run lint
npm run build
npm test
```

If some scripts are not defined, inspect `package.json` for the available equivalents.

## 3. Project Structure

The exact structure should be verified in the repository, but developers should pay particular attention to these project areas.

### Main Source Files

- `translate.ts`
  - Contains or participates in translation logic.
  - Uses a model identifier/configuration for translation requests.
  - Recent known issue: an incorrect model caused translation errors.

Depending on the repository layout, this file may be located at the root or under a source directory such as:

- `src/translate.ts`
- `src/lib/translate.ts`
- `src/services/translate.ts`
- `app/api/.../translate.ts`

### Important Configuration Files

Common files to inspect:

- `package.json`
  - Defines dependencies and development scripts.
- `tsconfig.json`
  - Defines TypeScript compiler settings.
- ESLint configuration, such as:
  - `.eslintrc`
  - `.eslintrc.json`
  - `eslint.config.js`
  - `eslint.config.mjs`
- Formatting configuration, such as:
  - `.prettierrc`
  - `prettier.config.js`
- Environment examples:
  - `.env.example`
  - `.env.local.example`
- Test configuration, such as:
  - `vitest.config.ts`
  - `jest.config.js`
  - `playwright.config.ts`
- Framework/build configuration, if present:
  - `vite.config.ts`
  - `next.config.js`
  - `next.config.mjs`
  - `tsup.config.ts`
  - `rollup.config.js`

### Continue Rules

This file lives at:

```text
.continue/rules/CONTINUE.md
```

Continue will automatically load it into context when working in this repository.

You can add more localized rules files later, for example:

```text
src/services/rules.md
src/components/rules.md
tests/rules.md
```

Use those for component-specific conventions and domain knowledge.

## 4. Development Workflow

### Recommended Workflow

1. Pull the latest changes:
   ```sh
   git pull
   ```

2. Create a focused branch:
   ```sh
   git checkout -b fix/short-description
   ```

3. Install dependencies if needed:
   ```sh
   npm install
   ```

4. Make the change.

5. Run validation:
   ```sh
   npm run lint
   npm run build
   npm test
   ```

6. Manually verify affected behavior.

7. Review the diff:
   ```sh
   git diff
   git status
   ```

8. Commit and push:
   ```sh
   git add .
   git commit -m "Describe the change"
   git push
   ```

### Coding Standards

Use the repository's existing style as the source of truth.

General TypeScript guidance:

- Prefer explicit types for exported functions and public APIs.
- Keep translation/model-provider concerns isolated from unrelated business logic.
- Avoid hard-coded secrets.
- Prefer named constants or configuration for model identifiers.
- Keep error handling clear and actionable.
- Preserve existing lint and formatting conventions.

### Testing Approach

Expected test categories:

- Unit tests for pure utility logic
- Integration tests for translation/service wrappers, preferably with mocked API calls
- Manual or end-to-end verification for real translation requests when safe

When changing translation behavior, test:

- A normal successful translation
- Empty or invalid input handling
- Provider/API failure handling
- Wrong/unsupported model handling
- Environment variable/configuration errors

### Build and Deployment

Before deployment:

```sh
npm run lint
npm run build
npm test
```

If the app runs as a persistent service, restart it after deploying changes. Then inspect logs for translation/model/API errors.

Deployment details needing verification:

- Hosting provider
- Build command
- Runtime command
- Required environment variables
- Rollback procedure

## 5. Key Concepts

### Translation Module

The translation module is responsible for accepting source text and producing translated output, likely by calling a model-backed API.

Important responsibilities may include:

- Choosing the correct model
- Constructing the provider request
- Handling provider responses
- Returning normalized translation output
- Handling provider/model errors

### Model Identifier

A model identifier is a string or configuration value that tells the provider which model to use. It must match a valid supported model for the provider and endpoint.

A recent known bug was caused by using the wrong model in `translate.ts`.

Recommendations:

- Keep model names centralized where practical.
- Prefer environment/config-driven model selection if different environments use different models.
- Validate model names during startup or in tests when possible.
- Add comments only when they clarify provider-specific constraints.

### Configuration and Secrets

The project likely depends on environment variables for API credentials and possibly model configuration.

Rules of thumb:

- Do not commit secrets.
- Keep example environment files current.
- Document required variables and acceptable model values.
- Fail fast with useful errors when required configuration is missing.

## 6. Common Tasks

### Fix or Change the Translation Model

1. Locate the translation module:
   ```sh
   find . -name '*translate*'
   ```

2. Find model references:
   ```sh
   grep -R "model" .
   ```

3. Update the model identifier or configuration.

4. Run checks:
   ```sh
   npm run lint
   npm run build
   npm test
   ```

5. Manually run the failed translation case again.

6. Confirm logs show the expected model and no model-related errors.

7. Commit:
   ```sh
   git add .
   git commit -m "Fix model used for translation"
   ```

### Add a New Translation Test

1. Identify the test framework from `package.json`.
2. Add a test near existing translation tests.
3. Mock external provider/API calls unless the project has a dedicated integration-test setup.
4. Cover success and failure cases.
5. Run:
   ```sh
   npm test
   ```

### Add a New Environment Variable

1. Add the variable to local environment files.
2. Add it to `.env.example` without a real secret.
3. Update README or this guide with its purpose.
4. Update deployment environment configuration.
5. Add startup validation if the variable is required.

### Investigate a Translation Failure

1. Reproduce the exact failing input/request.
2. Check application logs.
3. Confirm required environment variables are set.
4. Confirm the configured model is valid for the provider and endpoint.
5. Check provider response codes and error messages.
6. Run lint/build/tests to exclude local code issues:
   ```sh
   npm run lint
   npm run build
   npm test
   ```

## 7. Troubleshooting

### Lint or TypeScript Check Fails

- Read the first error carefully; later errors may be cascading.
- Confirm dependencies are installed.
- Confirm the correct Node.js version is active.
- Run the formatter if one is configured.
- Avoid suppressing TypeScript errors unless there is a documented reason.

### Build Fails

- Check whether required environment variables are needed at build time.
- Confirm imports and path aliases match `tsconfig.json`.
- Make sure generated files, if any, are present.
- Run a clean install if dependency state looks inconsistent:
  ```sh
  rm -rf node_modules
  npm install
  ```

### Translation API Returns a Model Error

Likely causes:

- Incorrect model identifier
- Model not available to the account/project
- Model does not support the requested endpoint
- Provider API version mismatch
- Environment variable points to an old or unsupported model

Suggested fix:

1. Verify the model name in the provider documentation.
2. Confirm the value used by `translate.ts`.
3. Run lint/build/tests.
4. Re-test the original translation case.
5. Check logs after deployment or restart.

### Translation Works Locally but Fails in Deployment

Check:

- Deployment environment variables
- Secret names and values
- Build-time vs runtime environment differences
- Region/provider availability
- Service restart/redeploy status
- Logs from the running service, not only build logs

## 8. References

Update these references with project-specific links:

- Project README: `README.md`
- Package scripts and dependencies: `package.json`
- TypeScript configuration: `tsconfig.json`
- Environment example: `.env.example`
- Translation provider model documentation: needs verification
- Deployment dashboard or runbook: needs verification
- Issue tracker / project board: needs verification

## Maintenance Notes

Keep this guide updated when:

- The translation provider or model changes
- New environment variables are added
- Build/test/deployment commands change
- Source directories are reorganized
- New architectural conventions are introduced

For more specific guidance, add `rules.md` files inside relevant subdirectories. Continue can use those files to provide more focused context for that part of the codebase.