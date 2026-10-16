# Iteration 32: Vaulz zk rebrand regression (brand assets, no NullCash/X/CA, swap proxy smoke)
import os
import re
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
CA = "31GYUb"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ---- brand assets ----
@pytest.mark.parametrize("name,ctype", [("lockup.svg", "svg"), ("mist.webp", "webp"),
                                        ("favicon-192.png", "png"), ("manifest.webmanifest", "json"),
                                        ("dk-swap.js", "javascript")])
def test_brand_assets(s, name, ctype):
    r = s.get(f"{BASE}/api/bifrost/v1/_brand/{name}", timeout=30)
    assert r.status_code == 200, r.status_code
    assert ctype in r.headers.get("content-type", ""), r.headers.get("content-type")
    assert len(r.content) > 100


def test_brand_manifest_name(s):
    j = s.get(f"{BASE}/api/bifrost/v1/_brand/manifest.webmanifest", timeout=30).json()
    assert j["name"] == "Vaulz zk · Private money on Solana"


# ---- health ----
@pytest.mark.parametrize("p", ["_health", "_live", "indexer/v1/stats"])
def test_bifrost_health(s, p):
    r = s.get(f"{BASE}/api/bifrost/v1/{p}", timeout=30)
    assert r.status_code == 200, r.text[:200]


# ---- no old brand / X / CA in served html+js ----
@pytest.mark.parametrize("path", ["/", "/api/bifrost/v1/app/", "/api/bifrost/v1/_brand/dk-swap.js",
                                  "/api/bifrost/v1/vault/?do=vault"])
def test_no_nullcash_x_ca(s, path):
    t = s.get(BASE + path, timeout=30).text
    assert "NullCash" not in t, f"NullCash x{t.count('NullCash')}"
    assert CA not in t, "CA address present"
    assert "usenullcash" not in t.lower()
    assert not re.search(r'href="https?://(x|twitter)\.com', t), "X link present"


def test_app_title(s):
    t = s.get(f"{BASE}/api/bifrost/v1/app/", timeout=30).text
    m = re.search(r"<title>([^<]+)</title>", t)
    assert m and "Vaulz zk" in m.group(1)


def test_dk_swap_has_stage_and_do(s):
    t = s.get(f"{BASE}/api/bifrost/v1/_brand/dk-swap.js", timeout=30).text
    for k in ("vz-head", "vz-tabs", "VZ_TOOLS"):
        assert k in t, k


# ---- swap proxy smoke ----
def test_tokens_source(s):
    r = s.get(f"{BASE}/api/ds/tokens", params={"side": "source"}, timeout=30)
    assert r.status_code == 200
    assert len(r.text) > 100


def test_tokens_dest_usdc(s):
    r = s.get(f"{BASE}/api/ds/tokens", params={"side": "destination", "term": "USDC"}, timeout=30)
    assert r.status_code == 200
    assert "USDC" in r.text
