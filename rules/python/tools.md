# Python Tools Configuration

## Ruff (Linter + Formatter)

### Recommended config (pyproject.toml)
```toml
[tool.ruff]
target-version = "py312"
line-length = 100

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort
    "N",    # pep8-naming
    "UP",   # pyupgrade
    "B",    # flake8-bugbear
    "A",    # flake8-builtins
    "SIM",  # flake8-simplify
    "TCH",  # flake8-type-checking
    "RUF",  # ruff-specific rules
]
ignore = ["E501"]  # line length handled by formatter

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
docstring-code-format = true
```

### Usage
```bash
ruff check .          # lint
ruff check . --fix    # auto-fix
ruff format .         # format
```

## Mypy (Type Checker)

### Recommended config
```toml
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

### Incremental adoption
- Start with `--strict` on new modules
- Use `# type: ignore[<code>]` sparingly with explanation
- Configure per-module overrides for legacy code

## Pytest

### Recommended config
```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_functions = "test_*"
addopts = "-v --tb=short --strict-markers"
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
    "integration: marks integration tests",
]
```

### Plugins
- `pytest-asyncio` — async test support
- `pytest-cov` — coverage reporting
- `pytest-xdist` — parallel test execution
- `pytest-mock` — simplified mocking with `mocker` fixture

### Coverage
```bash
pytest --cov=src --cov-report=term-missing --cov-fail-under=70
```

## Project Scripts

Recommended Makefile or task runner commands:
```makefile
lint:
	ruff check .
format:
	ruff format .
typecheck:
	mypy src/
test:
	pytest
test-cov:
	pytest --cov=src --cov-report=html
check: lint typecheck test
```
