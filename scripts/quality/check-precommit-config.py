#!/usr/bin/env python3
"""Validate the pre-commit manifest without fetching hooks or starting CI.

Adapted from nabla-compose/scripts/quality/check-precommit-config.py.
Only standard output statistics are emitted; no secret-bearing configuration values.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("pre-commit integrity requires PyYAML (included in pre-commit)", file=sys.stderr)
    raise SystemExit(2)

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / ".pre-commit-config.yaml"


class StrictLoader(yaml.SafeLoader):
    """Refuse duplicate YAML keys that could silently disable a hook."""


def _construct_mapping(loader: StrictLoader, node: yaml.MappingNode, deep: bool = False) -> dict:
    result: dict = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if not isinstance(key, (str, int, bool, float, tuple)):
            raise yaml.constructor.ConstructorError(None, None, "unsupported mapping key", key_node.start_mark)
        if key in result:
            raise yaml.constructor.ConstructorError(None, None, "duplicate YAML mapping key", key_node.start_mark)
        result[key] = loader.construct_object(value_node, deep=deep)
    return result


StrictLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _construct_mapping)

# Exact numbered release tags or commit SHAs; never use a moving branch name.
# A version tag can still be moved by its maintainer, so pre-commit's revision
# is a reproducible tag reference, not a cryptographic provenance guarantee.
RELEASE_TAG = re.compile(r"v?[0-9]+(?:\.[0-9]+){1,2}(?:-[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*)?\Z")
COMMIT_SHA = re.compile(r"[a-fA-F0-9]{7,40}\Z")


def is_reviewable_revision(rev: object) -> bool:
    return isinstance(rev, str) and bool(
        RELEASE_TAG.fullmatch(rev) or COMMIT_SHA.fullmatch(rev)
    )


def validate(config: object) -> list[str]:
    """Check structural integrity, duplicate hooks and unpinned external sources."""
    if not isinstance(config, dict) or not isinstance(config.get("repos"), list):
        return ["pre-commit config must contain a repos list"]
    errors: list[str] = []
    seen_ids: set[str] = set()
    seen_external: set[str] = set()
    for number, item in enumerate(config["repos"], 1):
        if not isinstance(item, dict):
            errors.append(f"repo #{number} is not a mapping")
            continue
        repo = item.get("repo")
        if not isinstance(repo, str) or not repo:
            errors.append(f"repo #{number} has no valid source")
            continue
        if repo != "local":
            rev = item.get("rev")
            if not isinstance(rev, str) or not rev.strip():
                errors.append(f"{repo}: missing revision pin")
            elif not is_reviewable_revision(rev):
                errors.append(f"{repo}: non-versioned or moving revision reference")
            if repo in seen_external:
                errors.append(f"duplicate external repository: {repo}")
            seen_external.add(repo)
        hooks = item.get("hooks")
        if not isinstance(hooks, list) or not hooks:
            errors.append(f"{repo}: hooks must be a nonempty list")
            continue
        for hook in hooks:
            hook_id = hook.get("id") if isinstance(hook, dict) else None
            if not isinstance(hook_id, str) or not hook_id:
                errors.append(f"{repo}: invalid hook id")
            elif hook_id in seen_ids:
                errors.append(f"duplicate hook id: {hook_id}")
            else:
                seen_ids.add(hook_id)
    return errors


def main() -> int:
    try:
        config = yaml.load(CONFIG.read_text(encoding="utf-8"), Loader=StrictLoader)
    except (OSError, yaml.YAMLError):
        print("pre-commit manifest invalid: YAML parse or duplicate-key error", file=sys.stderr)
        return 1
    errors = validate(config)
    for error in errors:
        print(f"pre-commit manifest invalid: {error}", file=sys.stderr)
    if errors:
        return 1
    print(f"pre-commit manifest OK: {len(config['repos'])} repository entries, "
          f"{sum(len(entry['hooks']) for entry in config['repos'])} distinct hooks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
