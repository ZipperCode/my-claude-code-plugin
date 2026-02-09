# TypeScript Patterns

## Type Safety

### Strict mode
- Always use `"strict": true` in tsconfig.json
- Enable `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`
- Avoid `any` — use `unknown` and narrow with type guards
- Prefer `interface` for object shapes, `type` for unions/intersections

### Type patterns
```typescript
// Prefer discriminated unions over optional fields
type Result<T> = { success: true; data: T } | { success: false; error: string };

// Use branded types for IDs
type UserId = string & { readonly __brand: 'UserId' };

// Utility types over manual repetition
type PartialUser = Pick<User, 'name' | 'email'>;
type ReadonlyConfig = Readonly<Config>;

// Const assertions for literal types
const ROLES = ['admin', 'user', 'guest'] as const;
type Role = typeof ROLES[number];
```

### Avoid
- `as` type assertions (use type guards instead)
- `!` non-null assertion (handle null explicitly)
- `@ts-ignore` / `@ts-expect-error` without explanation
- Enum — prefer `as const` objects or union types

## Async Patterns

### Error handling
```typescript
// Always handle promise rejections
try {
  const data = await fetchUser(id);
} catch (error) {
  if (error instanceof NotFoundError) { ... }
  throw error; // re-throw unexpected errors
}

// Never fire and forget — always handle or explicitly void
void backgroundTask(); // explicit intention
```

### Concurrency
- Use `Promise.all` for independent parallel operations
- Use `Promise.allSettled` when partial failure is acceptable
- Implement retry logic with exponential backoff for external calls
- Use `AbortController` for cancellable operations

## Import Organization

Order imports consistently:
1. Node.js built-ins (`node:fs`, `node:path`)
2. Third-party packages (`express`, `zod`)
3. Internal aliases (`@/utils`, `@/types`)
4. Relative imports (`./helpers`, `../models`)

Separate each group with a blank line.

## Project Patterns

- Use `zod` or `valibot` for runtime validation at boundaries
- Prefer functional patterns: pure functions, immutable data
- Use dependency injection for testability
- Colocate related code (component + test + styles + types)
