# TypeScript Tools Configuration

## ESLint

### Recommended config (flat config, ESLint 9+)
```javascript
// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  }
);
```

### Key rules to enforce
- `no-explicit-any` — prevent type erosion
- `consistent-type-imports` — use `import type` for type-only imports
- `no-floating-promises` — catch unhandled promise rejections
- `strict-boolean-expressions` — prevent truthy/falsy bugs

## Prettier

### Recommended config
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### Integration
- Run Prettier before ESLint (or use `eslint-config-prettier`)
- Configure as a pre-commit hook via `lint-staged`
- VS Code: set as default formatter with format-on-save

## TypeScript Compiler

### Recommended tsconfig.json strict settings
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true
  }
}
```

## Package Scripts

Recommended scripts in `package.json`:
```json
{
  "scripts": {
    "build": "tsc --noEmit && <bundler> build",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```
