# Security Rules

## Input Validation

- **Never trust user input** — validate on the server side, always
- Use allowlists over denylists for input validation
- Validate type, length, format, and range for all inputs
- Sanitize HTML output to prevent XSS (use library functions, not regex)
- Parameterize all database queries — never concatenate user input into SQL

## Authentication

- Hash passwords with bcrypt, argon2, or scrypt (never MD5/SHA1)
- Enforce minimum password complexity requirements
- Implement rate limiting on auth endpoints
- Use secure session management (HttpOnly, Secure, SameSite cookies)
- Support MFA where appropriate

## Authorization

- Apply principle of least privilege
- Check permissions on every request, not just the UI
- Use role-based (RBAC) or attribute-based (ABAC) access control
- Validate resource ownership — users should only access their own data
- Log authorization failures for monitoring

## Data Protection

- Encrypt sensitive data at rest and in transit (TLS 1.2+)
- Never log sensitive data (passwords, tokens, PII, credit cards)
- Use environment variables for secrets — never hardcode in source
- Rotate secrets and API keys regularly
- Implement proper data retention and deletion policies

## Dependency Security

- Keep dependencies updated — run `npm audit` / `pip audit` / `cargo audit` regularly
- Pin major dependency versions to avoid unexpected breaking changes
- Review new dependencies before adding (check maintainer, license, download count)
- Remove unused dependencies promptly
- Use lockfiles (package-lock.json, poetry.lock, Cargo.lock) in version control

## API Security

- Use HTTPS everywhere — redirect HTTP to HTTPS
- Implement proper CORS policies — don't use `*` in production
- Rate limit API endpoints to prevent abuse
- Validate Content-Type headers
- Return minimal error information in production (no stack traces)

## Security Scanning Patterns

The following patterns in source code indicate potential security issues:

```
# API keys and secrets
AKIA[0-9A-Z]{16}          — AWS access key
sk-[a-zA-Z0-9]{20,}       — OpenAI/Stripe secret key
ghp_[a-zA-Z0-9]{36}       — GitHub personal access token
-----BEGIN.*PRIVATE KEY    — Private key material

# Debug statements (should not be in production)
console.log               — JavaScript debug output
debugger                  — JavaScript breakpoint
print(                    — Python debug output (in non-CLI code)
```
