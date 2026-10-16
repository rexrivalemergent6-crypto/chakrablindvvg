# Iteration 33: Umbra-style /app regression — DS tokens/quotes, brand assets, served html/js brand audit
import os
import re
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ---- health JSON ----
def test_health_json(s):
    r = s.get(f"{BASE}/api/bifrost/v1/_health", timeout=30)
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


# ---- tokens + quotes ----
@pytest.fixture(scope="module")
def tokens(s):
    src = s.get(f"{BASE}/api/ds/tokens", params={"side": "source"}, timeout=30).json()
    dst = s.get(f"{BASE}/api/ds/tokens", params={"side": "destination", "term": "USDC"}, timeout=30).json()
    return src, dst


def test_source_tokens_has_sol(tokens):
    src, _ = tokens
    assert "tokens" in src and isinstance(src["tokens"], list)
    assert any((t.get("symbol") or "").upper() == "SOL" for t in src["tokens"])


def test_quote_sol_to_usdc(s, tokens):
    src, dst = tokens
    sol = next(t for t in src["tokens"] if (t.get("symbol") or "").upper() == "SOL")
    usdc = next(t for t in dst["tokens"] if "USDC" in (t.get("symbol") or "").upper())
    r = s.get(f"{BASE}/api/ds/quotes", params={"amount": 0.5, "from": sol["id"], "to": usdc["id"]}, timeout=60)
    assert r.status_code == 200, r.text[:300]
    j = r.json()
    print("quote keys:", list(j.keys()) if isinstance(j, dict) else type(j))
    assert j


# ---- brand assets ----
@pytest.mark.parametrize("name", ["lockup.svg", "mist.webp", "favicon-192.png", "manifest.webmanifest"])
def test_brand_asset(s, name):
    r = s.get(f"{BASE}/api/bifrost/v1/_brand/{name}", timeout=30)
    assert r.status_code == 200


def test_manifest_vaulz(s):
    assert "Vaulz zk" in s.get(f"{BASE}/api/bifrost/v1/_brand/manifest.webmanifest", timeout=30).json()["name"]


# ---- brand audit on served CSS / frontend pages ----
@pytest.mark.parametrize("path", ["/api/bifrost/v1/_brand/nc-theme.css", "/docs", "/vault", "/app"])
def test_no_nullcash(s, path):
    r = s.get(BASE + path, timeout=30)
    assert r.status_code == 200
    assert "NullCash" not in r.text
    assert not re.search(r'https?://(x|twitter)\.com/', r.text)
