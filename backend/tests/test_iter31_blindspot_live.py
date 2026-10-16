# Iteration 31: BlindSpot liveness + brand audit (bifrost relay/indexer, /api/ds swap proxy, brand assets, mirrored HTML)
import os
import re
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
BF = f"{BASE}/api/bifrost/v1"
BANNED = ["NullCash", "Vaulz", "Veil", "Omni", "Umbra", "HoudiniSwap", "DarkSwap"]


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ---- relay / indexer liveness ----
def test_live_relay_on(s):
    r = s.get(f"{BF}/_live", timeout=30)
    assert r.status_code == 200
    j = r.json()
    assert j["relay"] == "on"
    assert j["errors"] == 0 or j["ok"] >= j["errors"]


def test_indexer_stats(s):
    j = s.get(f"{BF}/indexer/v1/stats", timeout=30).json()
    assert isinstance(j["leaves"], int) and j["leaves"] > 0
    assert isinstance(j["nullifiers"], int)


def test_indexer_assets(s):
    j = s.get(f"{BF}/indexer/v1/assets", timeout=30).json()
    assert isinstance(j["assets"], list) and len(j["assets"]) > 0
    assert any(a.get("symbol") == "SOL" for a in j["assets"])


# ---- /api/ds swap proxy ----
@pytest.fixture(scope="module")
def toks(s):
    src = s.get(f"{BASE}/api/ds/tokens", params={"side": "source"}, timeout=30)
    dst = s.get(f"{BASE}/api/ds/tokens", params={"side": "destination", "term": "USDC"}, timeout=30)
    assert src.status_code == 200 and dst.status_code == 200
    return src.json()["tokens"], dst.json()["tokens"]


def test_ds_source_sol(toks):
    sol = [t for t in toks[0] if (t.get("symbol") or "").upper() == "SOL"]
    assert sol and sol[0].get("id")


def test_ds_dest_usdc(toks):
    assert any("USDC" in (t.get("symbol") or "").upper() for t in toks[1])


def test_ds_quotes(s, toks):
    sol = next(t for t in toks[0] if (t.get("symbol") or "").upper() == "SOL")
    usdc = next(t for t in toks[1] if (t.get("symbol") or "").upper() == "USDC")
    # upstream intermittently returns 404 "Not found" on first request for an amount -> retry (reported to main agent)
    for _ in range(4):
        r = s.get(f"{BASE}/api/ds/quotes", params={"amount": 0.5, "from": sol["id"], "to": usdc["id"]}, timeout=90)
        if r.status_code == 200:
            break
    assert r.status_code == 200, r.text[:300]
    j = r.json()
    q = j.get("quotes") if isinstance(j, dict) else j
    print("quotes count:", len(q) if q else 0)
    assert q and len(q) > 0


# ---- brand assets ----
@pytest.mark.parametrize("name", ["lockup.svg", "mist.webp", "favicon-192.png", "manifest.webmanifest", "dk-swap.js"])
def test_brand_asset_200(s, name):
    r = s.get(f"{BF}/_brand/{name}", timeout=30)
    assert r.status_code == 200 and len(r.content) > 0


def test_manifest_blindspot(s):
    j = s.get(f"{BF}/_brand/manifest.webmanifest", timeout=30).json()
    assert "BlindSpot" in j["name"]


# ---- mirrored HTML brand audit ----
def _visible(html):
    html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.I)
    titles = " ".join(re.findall(r'(?:alt|aria-label|title|content)="([^"]*)"', html))
    return re.sub(r"<[^>]+>", " ", html) + " " + titles


@pytest.mark.parametrize("path", ["/app/", "/vault/?do=vault"])
def test_mirror_html_no_old_brand(s, path):
    r = s.get(f"{BF}{path}", timeout=60)
    assert r.status_code == 200
    vis = _visible(r.text)
    hits = [b for b in BANNED if re.search(rf"\b{b}\b", vis, re.I)]
    assert not hits, f"{path} visible banned brands: {hits}"
