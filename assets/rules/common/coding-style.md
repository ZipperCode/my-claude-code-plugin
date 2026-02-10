# Coding Style Rules

## Principles

### KISS — Keep It Simple
- Choose the simplest solution that meets the requirement
- Avoid premature abstraction — wait until a pattern repeats 3+ times
- Prefer flat over nested: reduce indentation levels (max 3)
- One function, one purpose — if you need "and" to describe it, split it

### YAGNI — You Aren't Gonna Need It
- Only implement what is explicitly required now
- Delete unused code, commented-out code, and dead imports
- Avoid feature flags for features that don't exist yet
- No "just in case" parameters or configuration options

### DRY — Don't Repeat Yourself
- Extract shared logic into well-named functions
- Use constants for magic numbers and repeated strings
- Centralize validation rules, error messages, and configuration
- When two code blocks are >80% similar, refactor to share implementation

### SOLID
- **Single Responsibility**: Each module/class has one reason to change
- **Open-Closed**: Extend behavior through composition, not modification
- **Liskov Substitution**: Subtypes must be substitutable for their base types
- **Interface Segregation**: Prefer many small interfaces over one large interface
- **Dependency Inversion**: Depend on abstractions, not concrete implementations

## Naming Conventions

| Element | Style | Example |
|---------|-------|---------|
| Variables / functions | camelCase (JS/TS) or snake_case (Python/Rust/Go) | `getUserById`, `get_user_by_id` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Classes / Types | PascalCase | `UserService`, `HttpClient` |
| Files (components) | PascalCase | `UserProfile.tsx` |
| Files (utilities) | kebab-case or snake_case | `date-utils.ts`, `date_utils.py` |
| Booleans | is/has/should/can prefix | `isActive`, `hasPermission` |
| Event handlers | on/handle prefix | `onClick`, `handleSubmit` |

## Code Organization

### File structure
- Imports at the top, grouped: stdlib → third-party → local
- Constants and types after imports
- Main logic in the middle
- Exports at the bottom (where applicable)

### Function guidelines
- Max 30 lines per function (excluding comments)
- Max 4 parameters — use an options object for more
- Early return for guard clauses — avoid deep nesting
- Pure functions preferred — minimize side effects

### Error handling
- Handle errors at the appropriate level — don't swallow silently
- Use typed errors when the language supports them
- Provide actionable error messages with context
- Log errors with enough information to diagnose without reproducing
