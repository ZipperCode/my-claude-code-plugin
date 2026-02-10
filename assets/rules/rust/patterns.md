# Rust Patterns

## Error Handling

### Use `thiserror` for library errors, `anyhow` for applications
```rust
// Library code — structured errors
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("User {id} not found")]
    UserNotFound { id: u64 },
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Invalid input: {0}")]
    Validation(String),
}

// Application code — flexible errors
use anyhow::{Context, Result};

fn load_config() -> Result<Config> {
    let content = std::fs::read_to_string("config.toml")
        .context("Failed to read config file")?;
    toml::from_str(&content)
        .context("Failed to parse config")
}
```

### Rules
- Never use `.unwrap()` in production code (use `.expect("reason")` or `?`)
- Use `?` operator for error propagation
- Provide context with `.context()` or `.with_context()`
- Match on specific error variants when recovery is possible

## Ownership and Borrowing

### Prefer borrowing over cloning
```rust
// Good — borrows the string
fn greet(name: &str) -> String {
    format!("Hello, {name}")
}

// Avoid — unnecessary clone
fn process(data: Vec<u8>) { ... }  // takes ownership when borrow would suffice
fn process(data: &[u8]) { ... }    // better — borrows a slice
```

### Guidelines
- Use `&str` over `&String`, `&[T]` over `&Vec<T>`
- Use `Cow<'_, str>` when a function may or may not allocate
- Prefer `Arc` over `Rc` in async contexts
- Use `Box<dyn Error>` or `anyhow::Error` for error type erasure

## Concurrency

### Async patterns
```rust
// Use tokio for async runtime
use tokio::join;

// Parallel execution
let (users, posts) = join!(fetch_users(), fetch_posts());

// Use channels for cross-task communication
let (tx, mut rx) = tokio::sync::mpsc::channel(100);

// Structured concurrency with JoinSet
let mut set = tokio::task::JoinSet::new();
for item in items {
    set.spawn(process_item(item));
}
while let Some(result) = set.join_next().await { ... }
```

### Thread safety
- Prefer message passing (channels) over shared state
- Use `Mutex` / `RwLock` sparingly — keep critical sections small
- Use `Arc<Mutex<T>>` for shared mutable state across tasks
- Consider `dashmap` for concurrent hash maps

## Code Organization

- One type per file for major types
- Use `mod.rs` or file-based modules (Rust 2021 style)
- Group related functionality in modules
- Expose clean public API with `pub use` re-exports
- Use `#[cfg(test)]` module at the bottom of each file for unit tests
