# Copilot Instructions for Python Tools and Scripts

This file provides specific guidance for working with Python-based tools and scripts in the project.

## Overview

Python 3.12 is used in this project for:
- Local development server (HTTP server)
- Linting and code quality tools (Ruff, Bandit, etc.)
- Pre-commit hooks
- Git commit linting (gitlint)
- Ansible linting (ansible-lint)

## Python Version Requirements

**CRITICAL:** This project requires Python 3.12

Check your version:
```bash
python --version  # Should be 3.12.x
```

## Python Environment Setup

### Using Pipenv (Recommended)

The project uses Pipenv for Python dependency management:

```bash
# Install Pipenv
pip install pipenv

# Install dependencies
pipenv install --dev

# Activate virtual environment
pipenv shell

# Or run commands without activating
pipenv run <command>
```

### Dependencies (from Pipfile)

```toml
[packages]
ansible-lint = "*"

[dev-packages]
gitlint = "*"
```

## Python Development Server

### Starting the Server

The Python HTTP server is used as an alternative to Cloudflare Wrangler for local development:

```bash
# From project root
npm run start-python

# Or directly
python -m http.server 8001
```

### Configuration

- **Port:** 8001 (default)
- **Directory:** Serves files from current directory (project root)
- **URL:** `http://localhost:8001`

### Custom Port

```bash
# Specify custom port
python -m http.server 9000

# Or with specific directory
python -m http.server 8001 --directory public
```

### HTTPS (for testing)

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Run HTTPS server
python -m http.server 8001 --bind 127.0.0.1 --protocol https
```

**Note:** Python HTTP server is for development only. Use Cloudflare Workers or Vercel for production.

## Linting Tools

### Ansible Lint

Lints Ansible playbooks and roles (if any exist in the project):

```bash
# Run ansible-lint
pipenv run ansible-lint

# Lint specific files
pipenv run ansible-lint playbooks/*.yml
```

Configuration in `.ansible-lint`.

### Gitlint

Lints commit messages for conventional commit format:

```bash
# Lint last commit
pipenv run gitlint

# Lint specific commit
pipenv run gitlint --commit <commit-hash>

# Lint commit message from file
pipenv run gitlint < commit-msg.txt
```

### Ruff (Python Linter)

Ruff is configured in pre-commit hooks for Python code linting:

```bash
# Run ruff via pre-commit
pre-commit run ruff --all-files

# Or install and run directly
pip install ruff
ruff check .
```

### Bandit (Security Linter)

Checks Python code for security issues:

```bash
# Run bandit via pre-commit
pre-commit run bandit --all-files

# Or install and run directly
pip install bandit
bandit -r . -f json -o bandit-report.json
```

## Pre-commit Hooks

The project uses extensive pre-commit hooks (`.pre-commit-config.yaml`). Many are Python-based:

### Installing Pre-commit Hooks

```bash
# Install pre-commit
pip install pre-commit

# Or using pipenv
pipenv install --dev pre-commit

# Install git hooks
pre-commit install
```

### Python-based Hooks

From `.pre-commit-config.yaml`:

1. **Ruff** - Python linter and formatter
2. **pyupgrade** - Upgrades Python syntax for newer versions
3. **Bandit** - Security linter
4. **ansible-lint** - Ansible playbook linter (disabled due to performance)

### Running Hooks Manually

```bash
# Run all hooks on all files
pre-commit run --all-files

# Run specific hook
pre-commit run ruff --all-files
pre-commit run bandit --all-files

# Run on staged files only (default)
pre-commit run
```

### Updating Hooks

```bash
# Update hook versions
pre-commit autoupdate

# Verify updated hooks work
pre-commit run --all-files
```

## Python Scripts Best Practices

### Shebang and Encoding

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Module docstring describing the script's purpose.
"""
```

### Virtual Environment

Always use virtual environments:

```bash
# Using venv
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Using pipenv (recommended)
pipenv shell
```

### Type Hints

Use type hints for better code clarity:

```python
def process_data(data: list[dict], count: int = 10) -> list[str]:
    """
    Process data and return results.
    
    Args:
        data: List of dictionaries to process
        count: Maximum number of results
    
    Returns:
        List of processed strings
    """
    results: list[str] = []
    for item in data[:count]:
        results.append(str(item))
    return results
```

### Error Handling

```python
import sys
from typing import Optional

def safe_operation(filename: str) -> Optional[str]:
    """Safely read file with error handling."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found", file=sys.stderr)
        return None
    except PermissionError:
        print(f"Error: Permission denied for '{filename}'", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return None
```

### Logging

```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('script.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def process():
    logger.info("Starting process")
    try:
        # Process logic
        logger.debug("Debug information")
    except Exception as e:
        logger.error(f"Error occurred: {e}", exc_info=True)
```

### Argument Parsing

```python
import argparse

def main():
    parser = argparse.ArgumentParser(
        description='Script description',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        'input_file',
        help='Input file path'
    )
    
    parser.add_argument(
        '-o', '--output',
        default='output.txt',
        help='Output file path (default: output.txt)'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose output'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Use args.input_file, args.output, etc.

if __name__ == '__main__':
    main()
```

## Testing Python Code

### Using pytest

```bash
# Install pytest
pip install pytest

# Run tests
pytest

# Run with coverage
pip install pytest-cov
pytest --cov=. --cov-report=html
```

### Test Example

```python
# test_example.py
import pytest

def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b

def test_add_positive():
    assert add(2, 3) == 5

def test_add_negative():
    assert add(-1, -1) == -2

def test_add_zero():
    assert add(0, 5) == 5

@pytest.mark.parametrize("a,b,expected", [
    (1, 1, 2),
    (2, 3, 5),
    (-1, 1, 0),
])
def test_add_parametrized(a, b, expected):
    assert add(a, b) == expected
```

## Code Quality

### Formatting with Ruff

```bash
# Format code
ruff format .

# Check formatting
ruff format --check .
```

### Linting with Ruff

```bash
# Lint code
ruff check .

# Auto-fix issues
ruff check --fix .

# Ignore specific rules
ruff check --ignore E501 .
```

### Type Checking with mypy

```bash
# Install mypy
pip install mypy

# Type check
mypy script.py

# With configuration
mypy --strict script.py
```

## Common Python Patterns

### File I/O

```python
from pathlib import Path
import json

# Reading files
def read_file(filepath: str) -> str:
    """Read file content."""
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    return path.read_text(encoding='utf-8')

# Writing files
def write_file(filepath: str, content: str) -> None:
    """Write content to file."""
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')

# JSON operations
def read_json(filepath: str) -> dict:
    """Read JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def write_json(filepath: str, data: dict) -> None:
    """Write JSON file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
```

### Working with subprocess

```bash
import subprocess
import sys

def run_command(cmd: list[str]) -> tuple[int, str, str]:
    """
    Run shell command and capture output.
    
    Args:
        cmd: Command and arguments as list
    
    Returns:
        Tuple of (return_code, stdout, stderr)
    """
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False
        )
        return result.returncode, result.stdout, result.stderr
    except FileNotFoundError:
        print(f"Command not found: {cmd[0]}", file=sys.stderr)
        return 1, "", f"Command not found: {cmd[0]}"

# Usage
code, out, err = run_command(['npm', 'run', 'lint'])
if code != 0:
    print(f"Error: {err}")
```

### Environment Variables

```python
import os
from typing import Optional

def get_env(key: str, default: Optional[str] = None) -> str:
    """Get environment variable with optional default."""
    value = os.getenv(key, default)
    if value is None:
        raise ValueError(f"Environment variable {key} not set")
    return value

# Usage
api_key = get_env('API_KEY')
debug_mode = get_env('DEBUG', 'false').lower() == 'true'
```

## Debugging

### Using pdb

```python
import pdb

def buggy_function():
    x = 10
    y = 0
    pdb.set_trace()  # Debugger stops here
    result = x / y  # Will cause error
    return result
```

**pdb commands:**
- `n` (next) - Execute next line
- `s` (step) - Step into function
- `c` (continue) - Continue execution
- `l` (list) - Show source code
- `p <var>` - Print variable
- `q` (quit) - Exit debugger

### Using logging for debugging

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def function():
    logger.debug("Debug info")
    logger.info("Info message")
    logger.warning("Warning")
    logger.error("Error occurred")
```

## Performance Optimization

### Profiling

```python
import cProfile
import pstats

def profile_function():
    # Function to profile
    pass

# Profile and save results
cProfile.run('profile_function()', 'profile_stats')

# Analyze results
stats = pstats.Stats('profile_stats')
stats.sort_stats('cumulative')
stats.print_stats(10)  # Top 10 functions
```

### Timeit

```python
import timeit

# Time a specific operation
time = timeit.timeit(
    'sum(range(1000))',
    number=10000
)
print(f"Execution time: {time:.6f} seconds")
```

## Common Issues

### 1. Python Version Mismatch

```bash
# Check Python version
python --version

# Use specific version
python3.12 script.py

# Create venv with specific version
python3.12 -m venv venv
```

### 2. Module Not Found

```bash
# Install missing module
pip install <module>

# Or using pipenv
pipenv install <module>
```

### 3. Permission Issues

```bash
# Make script executable
chmod +x script.py

# Run with sudo if needed (avoid if possible)
sudo python script.py
```

## Resources

- [Python 3.12 Documentation](https://docs.python.org/3.12/)
- [Pipenv Documentation](https://pipenv.pypa.io/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [Pre-commit Documentation](https://pre-commit.com/)
- [pytest Documentation](https://docs.pytest.org/)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)
