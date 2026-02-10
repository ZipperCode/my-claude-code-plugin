# Git Workflow Rules

## Commit Messages

Follow Conventional Commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types
| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `chore` | Build process, dependencies, tooling |
| `ci` | CI/CD configuration changes |

### Rules
- Subject line: max 72 characters, imperative mood ("add", not "added")
- Body: wrap at 80 characters, explain "why" not "what"
- Reference issues: `Closes #123`, `Fixes #456`
- Breaking changes: add `BREAKING CHANGE:` footer or `!` after type

## Branch Strategy

### Branch naming
```
<type>/<ticket>-<short-description>
```
Examples: `feat/123-user-auth`, `fix/456-login-redirect`, `chore/deps-update`

### Branch workflow
1. Create feature branch from `main` (or `develop` if using gitflow)
2. Keep branches short-lived (< 1 week ideally)
3. Rebase onto target branch before opening PR
4. Delete branch after merge

## Pull Request Process

### PR checklist
- [ ] Title follows conventional commit format
- [ ] Description explains the "why" and links related issues
- [ ] Tests pass locally
- [ ] No debug statements or console.log left
- [ ] Self-reviewed the diff before requesting review
- [ ] Breaking changes documented

### PR size guidelines
- Ideal: < 300 lines changed
- Acceptable: < 500 lines changed
- Large: > 500 lines — consider splitting into smaller PRs

## Tags and Releases

- Use semantic versioning: `vMAJOR.MINOR.PATCH`
- Tag releases on the main branch
- Maintain a CHANGELOG.md with notable changes per version
