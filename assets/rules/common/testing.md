# Testing Rules

## Coverage Targets

| Level | Minimum | Ideal |
|-------|---------|-------|
| Unit tests | 70% | 85%+ |
| Integration tests | Key flows covered | All critical paths |
| E2E tests | Smoke tests | Happy path + critical error paths |

## Test Structure

### Naming convention
```
describe('<Module/Function>')
  it('should <expected behavior> when <condition>')
```

### AAA Pattern
Every test follows Arrange → Act → Assert:

```
// Arrange — set up test data and dependencies
// Act — execute the function under test
// Assert — verify the expected outcome
```

### File organization
- Test files colocated with source: `foo.ts` → `foo.test.ts`
- Or in a `__tests__/` directory adjacent to the source
- Integration tests in `tests/integration/`
- E2E tests in `tests/e2e/`

## Test Types

### Unit tests
- Test individual functions/methods in isolation
- Mock external dependencies (DB, HTTP, filesystem)
- Fast execution (< 100ms per test)
- Deterministic — no flaky tests

### Integration tests
- Test module interactions with real dependencies where possible
- Use test databases or containers
- Cover API endpoints end-to-end
- Verify error handling and edge cases

### E2E tests
- Test user-facing flows through the application
- Use headless browser for web applications
- Keep the number small — focus on critical paths
- Tolerate longer execution times but set reasonable timeouts

## Best Practices

- Each test should be independent — no shared mutable state
- Use factories or fixtures for test data, not hardcoded values
- Test behavior, not implementation details
- Write the failing test first (TDD when practical)
- Keep assertions focused — one logical assertion per test
- Clean up after tests (database records, temp files, etc.)
