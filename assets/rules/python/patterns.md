# Python Patterns

## Type Hints

### Always annotate
```python
# Function signatures
def get_user(user_id: int) -> User | None:
    ...

# Variables when type isn't obvious
users: list[User] = []
config: dict[str, Any] = load_config()

# Use modern syntax (Python 3.10+)
def process(data: str | bytes) -> None:  # not Union[str, bytes]
    ...
```

### Type checking tools
- Use `mypy --strict` or `pyright` for static analysis
- Enable strict mode incrementally on new files
- Use `TypedDict` for dictionary shapes, `dataclass` for structured data
- Prefer `Protocol` (structural typing) over ABC when possible

## Error Handling

```python
# Use specific exception types
class UserNotFoundError(Exception):
    def __init__(self, user_id: int) -> None:
        super().__init__(f"User {user_id} not found")
        self.user_id = user_id

# Handle at the appropriate level
try:
    user = await get_user(user_id)
except UserNotFoundError:
    return JSONResponse(status_code=404, content={"error": "User not found"})
except DatabaseError:
    logger.exception("Database error fetching user")
    raise  # re-raise unexpected errors

# Context managers for cleanup
async with get_db_session() as session:
    ...
```

### Avoid
- Bare `except:` — always specify the exception type
- `except Exception as e: pass` — never silently swallow errors
- Using exceptions for control flow in performance-critical paths

## Code Style

### Structure
- One class per file (for major classes)
- Group related functions in modules
- Use `__all__` to define public API
- Prefer composition over inheritance

### Naming
| Element | Convention | Example |
|---------|-----------|---------|
| Functions / variables | snake_case | `get_user_by_id` |
| Classes | PascalCase | `UserService` |
| Constants | UPPER_SNAKE_CASE | `MAX_CONNECTIONS` |
| Private | leading underscore | `_internal_helper` |
| Modules | snake_case | `user_service.py` |

### Modern Python
- Use f-strings over `.format()` or `%`
- Use `pathlib.Path` over `os.path`
- Use `dataclasses` or `pydantic` for data structures
- Use `asyncio` for I/O-bound concurrency
- Use structural pattern matching (`match/case`) for complex dispatching
