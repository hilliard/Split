# Linting Configuration Guide

## Setup Summary

Your project now has a complete linting and formatting setup with the following tools:

### Installed Packages

- **ESLint 10.2.1** - Code linting and quality checks
- **TypeScript ESLint** - TypeScript support for ESLint
- **Prettier** - Code formatter
- **eslint-plugin-prettier** - Integration between ESLint and Prettier

## Configuration Files

### 1. `eslint.config.mjs`

Modern ESLint flat config using:

- JavaScript recommended rules
- TypeScript strict rules
- Prettier integration for code formatting
- Auto-ignore common directories (dist, node_modules, .astro, etc.)

### 2. `.prettierrc.json`

Prettier formatting configuration:

- 2-space indentation
- Single quotes
- 100 character line width
- Trailing commas (ES5 compatible)
- Unix line endings (LF)

### 3. `.prettierignore`

Files excluded from Prettier formatting (dist, node_modules, package-lock.json, etc.)

## Available Commands

Add these to your npm scripts:

```bash
# Check for linting issues
npm run lint

# Auto-fix linting and formatting issues
npm run lint:fix

# Check formatting without making changes
npm run format:check

# Apply formatting to all files
npm run format
```

## Typical Workflow

1. **During Development**: ESLint warnings will help catch code quality issues
2. **Before Committing**: Run `npm run lint:fix` to auto-fix issues
3. **Pre-commit Hook** (optional): You can set up a pre-commit hook to automatically run linting

## ESLint Rules

The configuration includes:

- Unused variable detection (allows `_` prefixed variables)
- TypeScript best practices
- Prettier code style enforcement (as warnings)
- CommonJS detection for non-TS files

## Fixing Existing Issues

To fix all linting and formatting issues in your project:

```bash
npm run lint:fix
npm run format
```

## IDE Integration

### VS Code

ESLint will automatically work with the ESLint extension if installed. Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Next Steps

1. Run `npm run lint:fix` to fix all current issues
2. Run `npm run format` to apply code formatting
3. Consider setting up a pre-commit hook to enforce linting on commits
