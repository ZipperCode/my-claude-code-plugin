# Rust Tools Configuration

## Clippy (Linter)

### Recommended config (clippy.toml or .clippy.toml)
```toml
cognitive-complexity-threshold = 25
too-many-arguments-threshold = 6
type-complexity-threshold = 250
```

### Recommended lint levels in Cargo.toml or lib.rs
```rust
#![warn(clippy::all, clippy::pedantic)]
#![allow(
    clippy::module_name_repetitions,  // common in Rust API design
    clippy::must_use_candidate,        // too noisy for most projects
)]
```

### Key lint categories
| Category | Flag | Focus |
|----------|------|-------|
| Correctness | `clippy::all` | Likely bugs and errors |
| Style | `clippy::pedantic` | Idiomatic Rust style |
| Performance | `clippy::perf` | Performance pitfalls |
| Complexity | `clippy::complexity` | Overly complex code |

### Usage
```bash
cargo clippy                        # basic checks
cargo clippy -- -W clippy::pedantic # stricter checks
cargo clippy --fix                  # auto-fix where possible
```

## Cargo Configuration

### Recommended Cargo.toml sections
```toml
[profile.dev]
opt-level = 0
debug = true

[profile.release]
opt-level = 3
lto = "thin"
strip = true

[profile.dev.package."*"]
opt-level = 2  # optimize dependencies in dev for faster runtime
```

### Useful cargo commands
```bash
cargo build             # compile
cargo test              # run all tests
cargo test -- --nocapture  # show println! output
cargo bench             # run benchmarks
cargo doc --open        # generate and view docs
cargo audit             # check for known vulnerabilities
cargo outdated          # check for outdated dependencies
cargo tree              # visualize dependency tree
```

## Rustfmt (Formatter)

### Recommended config (rustfmt.toml)
```toml
edition = "2021"
max_width = 100
tab_spaces = 4
use_field_init_shorthand = true
use_try_shorthand = true
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
```

### Usage
```bash
cargo fmt              # format all files
cargo fmt -- --check   # check without modifying
```

## Testing

### Test organization
```
src/
  lib.rs        # #[cfg(test)] mod tests { ... }
  module.rs     # unit tests at bottom of each file
tests/
  integration/  # integration tests
  common/       # shared test utilities (mod.rs)
```

### Coverage
```bash
cargo install cargo-tarpaulin
cargo tarpaulin --out html --skip-clean
```

## CI Pipeline

Recommended checks:
```bash
cargo fmt -- --check        # formatting
cargo clippy -- -D warnings # lints (warnings as errors)
cargo test                  # tests
cargo audit                 # security vulnerabilities
```
