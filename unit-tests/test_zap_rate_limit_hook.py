"""Fast offline behavior tests for ZAP's host-bounded rate limiter hook."""
import importlib.util
import pathlib
import unittest

PATH = pathlib.Path(__file__).resolve().parents[1] / "scripts/security/zap-rate-limit-hook.py"
SPEC = importlib.util.spec_from_file_location("zap_rate_limit_hook", PATH)
HOOK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(HOOK)


class FakeNetwork:
    def __init__(self, response="OK"):
        self.response = response
        self.calls = []

    def add_rate_limit_rule(self, **kwargs):
        self.calls.append(kwargs)
        return self.response


class FakeZap:
    def __init__(self, response="OK"):
        self.network = FakeNetwork(response)


class RateLimitHookTest(unittest.TestCase):
    def test_production_redirects_share_one_request_per_second(self):
        zap = FakeZap()
        returned = HOOK.zap_started(zap, "https://www.bababou.com/")
        self.assertEqual(returned[0], zap)
        options = zap.network.calls[0]
        self.assertEqual(options["requestspersecond"], "1")
        self.assertEqual(options["groupby"], "rule")
        self.assertEqual(options["matchregex"], "true")
        self.assertEqual(options["matchstring"], r"^(?:www\.)?bababou\.com$")

    def test_preview_uses_exact_hostname(self):
        zap = FakeZap()
        HOOK.zap_started(zap, "https://bababou-preview-123.vercel.app/en/nre")
        options = zap.network.calls[0]
        self.assertEqual(options["matchregex"], "false")
        self.assertEqual(options["matchstring"], "bababou-preview-123.vercel.app")

    def test_out_of_scope_and_insecure_targets_are_refused(self):
        for url in ("http://www.bababou.com/", "https://evil.example/",
                    "https://vercel.app/", "https://www.bababou.com.evil.example/"):
            with self.subTest(url=url):
                zap = FakeZap()
                with self.assertRaises(RuntimeError):
                    HOOK.zap_started(zap, url)
                self.assertFalse(zap.network.calls)

    def test_missing_rate_limit_addon_fails_closed(self):
        with self.assertRaisesRegex(RuntimeError, "ZAP_THROTTLE_NOT_ENABLED"):
            HOOK.zap_started(FakeZap("UNSUPPORTED"), "https://www.bababou.com/")


if __name__ == "__main__":
    unittest.main()
