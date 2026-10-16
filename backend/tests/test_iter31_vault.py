# Iteration 31: NullCash Vault (omnizec mirror) + regression of bifrost targets
import os
import re
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
V = f"{BASE_URL}/api/bifrost/v1/vault"
MAINNET = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d"


@pytest.fixture(scope="module")
def vault_html():
    r = requests.get(f"{V}/?do=vault", timeout=30)
    assert r.status_code == 200
    assert "text/html" in r.headers.get("content-type", "")
    return r.text


# Vault entry HTML: branding + asset rewriting
class TestVaultHtml:
    def test_title_branded(self, vault_html):
        assert "<title>NullCash Vault · quantum-safe SOL</title>" in vault_html

    def test_skin_injected(self, vault_html):
        assert 'id="nc-vault-skin"' in vault_html

    def test_no_root_asset_urls(self, vault_html):
        bad = re.findall(r'(?:src|href)="/(?!api/bifrost/|/)[^"]*"', vault_html)
        assert bad == [], bad

    def test_favicon_branded(self, vault_html):
        assert "/api/bifrost/v1/_brand/favicon-32.png" in vault_html
        assert "omnizec.com/favicon" not in vault_html

    def test_all_js_assets_serve_js(self, vault_html):
        assets = set(re.findall(r'/api/bifrost/v1/vault/assets/[\w.-]+\.(?:js|css)', vault_html))
        assert len(assets) > 5
        for a in assets:
            r = requests.get(f"{BASE_URL}{a}", timeout=30)
            assert r.status_code == 200, a
            ct = r.headers.get("content-type", "")
            assert "text/html" not in ct, f"{a} -> {ct}"


# JS patches: preload base, rpc path, rpId domain lock removed
class TestVaultJsPatches:
    def test_preload_helper_base(self):
        r = requests.get(f"{V}/assets/preload-helper-BZ1Pz5am.js", timeout=30)
        assert r.status_code == 200
        assert "return`/api/bifrost/v1/vault/`+e" in r.text
        assert "return`/`+e" not in r.text

    def test_js_bundle_patches(self, vault_html):
        assets = set(re.findall(r'/api/bifrost/v1/vault/assets/[\w.-]+\.js', vault_html))
        joined = ""
        for a in assets:
            joined += requests.get(f"{BASE_URL}{a}", timeout=30).text
        assert "`omnizec.com`:void 0" not in joined  # rpId lock removed
        assert '"/api/rpc"' not in joined and "`/api/rpc`" not in joined
        assert "omni vault" not in joined
        assert "omni included" not in joined


# RPC still mainnet
class TestRpc:
    def test_genesis_mainnet(self):
        r = requests.post(f"{BASE_URL}/api/bifrost/v1/rpc",
                          json={"jsonrpc": "2.0", "id": 1, "method": "getGenesisHash"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["result"] == MAINNET


# Regression of other bifrost targets
class TestRegression:
    def test_live(self):
        r = requests.get(f"{BASE_URL}/api/bifrost/v1/_live", timeout=30)
        assert r.status_code == 200
        assert r.json().get("ok") is not None

    def test_indexer_stats(self):
        r = requests.get(f"{BASE_URL}/api/bifrost/v1/indexer/v1/stats", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), dict) and len(r.json()) > 0

    def test_app_mirror_loads(self):
        r = requests.get(f"{BASE_URL}/api/bifrost/v1/app/", timeout=30)
        assert r.status_code == 200
        assert "text/html" in r.headers.get("content-type", "")
        assert "NullCash" in r.text
