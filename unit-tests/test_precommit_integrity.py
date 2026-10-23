"""Dependency-free unittest harness; the production parser needs installed PyYAML."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/quality/check-precommit-config.py"
SPEC = importlib.util.spec_from_file_location("precommit_integrity", SOURCE)
assert SPEC is not None and SPEC.loader is not None
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class PrecommitIntegrityTest(unittest.TestCase):
    def test_real_manifest(self) -> None:
        config = module.yaml.load(module.CONFIG.read_text(encoding="utf-8"), Loader=module.StrictLoader)
        self.assertEqual(module.validate(config), [])
        ids = [hook["id"] for repo in config["repos"] for hook in repo["hooks"]]
        self.assertEqual(len(ids), len(set(ids)))
        for hook in ("betterleaks", "actionlint", "zizmor", "precommit-integrity"):
            self.assertIn(hook, ids)

    def test_duplicate_external_repo_at_different_revision(self) -> None:
        items = [
            {"repo": "https://example.invalid/hooks", "rev": "v1", "hooks": [{"id": "one"}]},
            {"repo": "https://example.invalid/hooks", "rev": "v2", "hooks": [{"id": "two"}]},
        ]
        self.assertIn("duplicate external repository: https://example.invalid/hooks",
                      module.validate({"repos": items}))

    def test_duplicate_local_hook(self) -> None:
        entries = [{"repo": "local", "hooks": [{"id": "secret"}]}] * 2
        self.assertEqual(module.validate({"repos": entries}), ["duplicate hook id: secret"])

    def test_missing_revision(self) -> None:
        config = {"repos": [{"repo": "https://example.invalid/hooks", "hooks": [{"id": "x"}]}]}
        self.assertTrue(any("missing revision pin" in error for error in module.validate(config)))

    def test_moving_revisions_are_rejected(self) -> None:
        for revision in ("main", "master", "HEAD", "latest", "stable",
                         "refs/heads/main", "origin/main", "release/1.x", "v1",
                         "v1.2.x", "", "  ", 42, None):
            item = {"repo": "https://example.invalid/hooks",
                    "rev": revision, "hooks": [{"id": "test"}]}
            errors = module.validate({"repos": [item]})
            self.assertTrue(errors, f"invalid revision accepted: {revision!r}")

    def test_version_tags_and_commit_shas_are_accepted(self) -> None:
        for revision in ("v6.0.0", "v3.13.1-1", "2.1.1", "0.37.4",
                         "b3680b6ebf9f7cf29b19307f246adef66756feef",
                         "9a39d56"):
            item = {"repo": "https://example.invalid/hooks",
                    "rev": revision, "hooks": [{"id": "test"}]}
            self.assertEqual(module.validate({"repos": [item]}), [],
                             f"valid version refused: {revision}")

    def test_invalid_shapes(self) -> None:
        for config in ({}, {"repos": "bad"}, None):
            self.assertEqual(module.validate(config), ["pre-commit config must contain a repos list"])
        self.assertTrue(module.validate({"repos": [{"repo": "local", "hooks": ["bad"]}]}))
        self.assertTrue(module.validate({"repos": [42]}))

    def test_duplicate_yaml_key_is_rejected(self) -> None:
        with self.assertRaises(module.yaml.YAMLError):
            module.yaml.load("repos: []\nrepos: []\n", Loader=module.StrictLoader)

    def test_multiple_unique_local_repos_are_valid(self) -> None:
        configs = {"repos": [
            {"repo": "local", "hooks": [{"id": "first"}]},
            {"repo": "local", "hooks": [{"id": "second"}]},
        ]}
        self.assertEqual(module.validate(configs), [])


if __name__ == "__main__":
    unittest.main()
