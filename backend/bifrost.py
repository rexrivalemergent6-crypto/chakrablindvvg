"""
Bifrost v1 — full mirror / passthrough proxy for Veil (veilit.xyz).

Routes (all under /api/bifrost/v1):
  /{target}/{path}     any HTTP method, target in TARGETS
  ws /{target}/{path}  websocket passthrough (Solana RPC subscriptions etc.)
  /_meta               upstream map + health

Every upstream absolute URL inside HTML / JS / CSS / JSON is rewritten to point
back at this proxy, so every button / fetch / RPC call of the original site is
routed through our backend -> Veil's real backends.
"""
import asyncio
import json
import logging
import re
import time
from collections import OrderedDict
from typing import Optional

import httpx
from bifrost_brand import head_inject, brand_asset
import websockets
from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, Response, StreamingResponse

logger = logging.getLogger("bifrost")

PREFIX = "/api/bifrost/v1"

TARGETS = {
    "site": "https://veilit.xyz",
    "app": "https://app.veilit.xyz",
    "indexer": "https://indexer.veilit.xyz",
    "relayer": "https://relayer.veilit.xyz",
    "rpc": "https://rpc.veilit.xyz",
}
# order matters: subdomains before apex
HOST_ORDER = ["app", "indexer", "relayer", "rpc", "site"]

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/129.0 Safari/537.36")

REWRITE_TYPES = ("text/html", "javascript", "text/css", "application/json",
                 "manifest+json", "text/plain", "image/svg+xml", "text/x-component")

DROP_RESP_HEADERS = {
    "content-encoding", "content-length", "transfer-encoding", "connection",
    "content-security-policy", "content-security-policy-report-only",
    "x-frame-options", "strict-transport-security", "alt-svc", "via",
    "access-control-allow-origin", "access-control-allow-credentials",
    "access-control-allow-methods", "access-control-allow-headers",
    "access-control-expose-headers", "keep-alive", "server",
    "cross-origin-opener-policy", "cross-origin-embedder-policy",
    "cross-origin-resource-policy", "permissions-policy", "report-to", "nel",
}
DROP_REQ_HEADERS = {
    "host", "content-length", "connection", "accept-encoding", "cookie",
    "origin", "referer", "x-forwarded-for", "x-forwarded-host",
    "x-forwarded-proto", "x-forwarded-port", "x-real-ip", "x-request-id",
    "x-scheme", "forwarded", "via", "cf-connecting-ip", "true-client-ip",
    "upgrade", "te", "keep-alive", "x-original-forwarded-for",
}

_client: Optional[httpx.AsyncClient] = None

# --------------------------------------------------------------------------
# tiny in-memory cache for immutable static assets (raw upstream bytes)
# --------------------------------------------------------------------------
_CACHE: "OrderedDict[str, tuple]" = OrderedDict()
_CACHE_BYTES = 0
_CACHE_MAX = 400 * 1024 * 1024
_CACHE_TTL = 6 * 3600


def _cacheable(target: str, path: str, method: str) -> bool:
    if method != "GET":
        return False
    p = "/" + path
    if target == "indexer" and p.startswith("/v1/logo/"):
        return True
    if target not in ("site", "app"):
        return False
    return (p.startswith("/_next/static/") or p.startswith("/circuits/")
            or p.startswith("/fonts/") or p.startswith("/vendor/")
            or bool(re.search(r"\.(webp|png|jpg|jpeg|svg|ico|woff2?|wasm|zkey|gif)$", p)))


def _cache_get(key):
    v = _CACHE.get(key)
    if not v:
        return None
    if time.time() - v[0] > _CACHE_TTL:
        _cache_del(key)
        return None
    _CACHE.move_to_end(key)
    return v


def _cache_del(key):
    global _CACHE_BYTES
    v = _CACHE.pop(key, None)
    if v:
        _CACHE_BYTES -= len(v[3])


def _cache_put(key, status, headers, body):
    global _CACHE_BYTES
    if len(body) > 120 * 1024 * 1024:
        return
    _cache_del(key)
    _CACHE[key] = (time.time(), status, headers, body)
    _CACHE_BYTES += len(body)
    while _CACHE_BYTES > _CACHE_MAX and _CACHE:
        k, _ = next(iter(_CACHE.items()))
        _cache_del(k)


IMG_HOSTS = ("api.houdiniswap.com", "cdn.jsdelivr.net", "raw.githubusercontent.com",
             "assets.coingecko.com", "coin-images.coingecko.com", "static.jup.ag", "arweave.net")


async def _image_proxy(u: str):
    """Same-origin image relay for swap token icons (upstream CDNs are blocked cross-origin by ORB)."""
    try:
        from urllib.parse import urlparse
        pu = urlparse(u)
    except Exception:
        return JSONResponse({"error": "bad url"}, status_code=400)
    host = (pu.hostname or "").lower()
    if pu.scheme != "https" or not any(host == h or host.endswith("." + h) for h in IMG_HOSTS):
        return JSONResponse({"error": "host not allowed"}, status_code=400)
    ckey = ("_img", u)
    hit = _cache_get(ckey)
    if hit:
        return Response(hit[3], media_type=hit[2].get("content-type", "image/png"),
                        headers={"cache-control": "public, max-age=86400"})
    try:
        r = await get_client().get(u, headers={"user-agent": UA, "accept": "image/avif,image/webp,image/png,image/*,*/*;q=0.8"})
    except Exception as e:
        return JSONResponse({"error": str(e)[:200]}, status_code=502)
    ctype = r.headers.get("content-type", "")
    if r.status_code != 200 or not (ctype.startswith("image/") or ctype == "application/octet-stream"):
        return Response(status_code=404)
    body = r.content
    if ctype == "application/octet-stream":
        ctype = "image/png"
    _cache_put(ckey, 200, {"content-type": ctype}, body)
    return Response(body, media_type=ctype, headers={"cache-control": "public, max-age=86400"})


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(60.0, connect=15.0),
            follow_redirects=False,
            http2=False,
            limits=httpx.Limits(max_keepalive_connections=40, max_connections=100,
                                keepalive_expiry=30),
        )
    return _client


async def close_client():
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()


# --------------------------------------------------------------------------
# URL rewriting
# --------------------------------------------------------------------------
def public_origin(request) -> str:
    h = request.headers
    host = h.get("x-forwarded-host") or h.get("host") or ""
    host = host.split(",")[0].strip()
    proto = (h.get("x-forwarded-proto") or request.url.scheme or "https").split(",")[0].strip()
    if not host.startswith(("localhost", "127.", "0.0.0.0")):
        proto = "https"
    return f"{proto}://{host}"


def _inject_script(target: str) -> str:
    return head_inject(target, PREFIX)


# Project token of the upstream (removed from the mirror; only swap tokens remain)
PROJECT_TOKEN_MINT = "HgTGdc29D5bDMrDvsCLnorxz899VyDj7ZN7FPa6vpump"
# valid base58 pubkey that is not a mint -> upstream code treats the project token as absent
PROJECT_TOKEN_STUB = "11111111111111111111111111111111"


def _strip_project_token(obj):
    """Recursively drop list entries that reference the project token mint."""
    def refs(o):
        if isinstance(o, str):
            return o == PROJECT_TOKEN_MINT
        if isinstance(o, dict):
            return any(refs(v) for v in o.values())
        if isinstance(o, list):
            return any(refs(v) for v in o)
        return False

    if isinstance(obj, list):
        return [_strip_project_token(v) for v in obj if not refs(v)]
    if isinstance(obj, dict):
        return {k: _strip_project_token(v) for k, v in obj.items() if k != PROJECT_TOKEN_MINT}
    return obj


def strip_project_token_json(text: str) -> str:
    if PROJECT_TOKEN_MINT not in text:
        return text
    try:
        return json.dumps(_strip_project_token(json.loads(text)), separators=(",", ":"))
    except Exception:
        return text


def rewrite_text(text: str, target: str, origin: str, ctype: str) -> str:
    base = f"{origin}{PREFIX}"
    if target in ("indexer", "relayer") and "json" in ctype:
        text = strip_project_token_json(text)
    if target == "app" and "javascript" in ctype:
        text = text.replace(f'"{PROJECT_TOKEN_MINT}"', f'"{PROJECT_TOKEN_STUB}"')
    for t in HOST_ORDER:
        up = TARGETS[t]
        host = up.split("://", 1)[1]
        text = text.replace(up, f"{base}/{t}")
        text = text.replace("wss://" + host, base.replace("https://", "wss://", 1) + f"/{t}")
        # JSON-escaped variants (Next flight data)
        text = text.replace(up.replace("/", "\\/"), f"{base}/{t}".replace("/", "\\/"))
    p = f"{PREFIX}/{target}"
    if target in ("site", "app"):
        if "text/html" in ctype or "text/x-component" in ctype:
            # root-relative attribute urls
            text = re.sub(r'((?:href|src|action|poster|data-src|content)=["\'])/(?!/|api/bifrost/)',
                          rf"\1{p}/", text)
            text = re.sub(r'(srcset=["\'])/(?!/|api/bifrost/)', rf"\1{p}/", text)
            text = re.sub(r'(,\s*)/(?=_next/)', rf"\1{p}/", text)
            text = re.sub(r'url\((["\']?)/(?!/|api/bifrost/)', rf"url(\1{p}/", text)
            if "text/html" in ctype:
                # document-relative urls (page URL is shown as /shield/... so resolve them here)
                text = re.sub(r'((?:\s)(?:src|poster|srcset)=["\'])(?![/#?"\']|[a-zA-Z][a-zA-Z0-9+.-]*:)',
                              rf"\1{p}/", text)
                text = re.sub(r'(<link\b[^>]*?\shref=["\'])(?![/#?"\']|[a-zA-Z][a-zA-Z0-9+.-]*:)',
                              rf"\1{p}/", text)
            # next flight / json payload references
            text = re.sub(r'(?<![A-Za-z0-9_/.])/_next/', f"{p}/_next/", text)
            if "text/html" in ctype:
                inj = _inject_script(target)
                if "<head>" in text:
                    text = text.replace("<head>", "<head>" + inj, 1)
                elif re.search(r"<head[^>]*>", text):
                    text = re.sub(r"(<head[^>]*>)", lambda m: m.group(1) + inj, text, count=1)
                else:
                    text = inj + text
        elif "css" in ctype:
            text = re.sub(r'url\((["\']?)/(?!/|api/bifrost/)', rf"url(\1{p}/", text)
        elif "javascript" in ctype:
            text = text.replace('"/circuits"', f'"{p}/circuits"')
            text = text.replace("'/circuits'", f"'{p}/circuits'")
            text = text.replace('TURBOPACK_CHUNK_BASE_PATH:"/_next/"', f'TURBOPACK_CHUNK_BASE_PATH:"{p}/_next/"')
        elif "json" in ctype:
            text = re.sub(r'("(?:src|start_url|scope|url|href)"\s*:\s*")/(?!/|api/bifrost/)',
                          rf"\1{p}/", text)
    return text


def _rewrite_location(loc: str, target: str, origin: str) -> str:
    for t in HOST_ORDER:
        if loc.startswith(TARGETS[t]):
            return f"{origin}{PREFIX}/{t}" + loc[len(TARGETS[t]):]
    if loc.startswith("/") and not loc.startswith("//"):
        return f"{PREFIX}/{target}{loc}"
    return loc


def _resp_headers(up_headers, target: str, origin: str) -> dict:
    out = {}
    for k, v in up_headers.multi_items() if hasattr(up_headers, "multi_items") else up_headers.items():
        lk = k.lower()
        if lk in DROP_RESP_HEADERS:
            continue
        if lk == "location":
            v = _rewrite_location(v, target, origin)
        if lk == "set-cookie":
            v = re.sub(r";\s*domain=[^;]+", "", v, flags=re.I)
            continue  # cookies are not needed by the upstream SPA; drop for safety
        out[k] = v
    return out


# --------------------------------------------------------------------------
# router
# --------------------------------------------------------------------------
router = APIRouter(prefix="/api/bifrost/v1")


@router.get("/_meta")
async def meta():
    return {"proxy": "bifrost", "version": "v1", "targets": TARGETS,
            "cache_items": len(_CACHE), "cache_bytes": _CACHE_BYTES}


@router.get("/_health")
async def health():
    out = {}
    c = get_client()

    async def ping(name, url, method="GET", **kw):
        t0 = time.time()
        try:
            r = await c.request(method, url, headers={"user-agent": UA}, **kw)
            out[name] = {"status": r.status_code, "ms": int((time.time() - t0) * 1000)}
        except Exception as e:  # noqa
            out[name] = {"status": 0, "error": str(e)[:120]}

    await asyncio.gather(
        ping("site", TARGETS["site"] + "/"),
        ping("app", TARGETS["app"] + "/"),
        ping("indexer", TARGETS["indexer"] + "/"),
        ping("relayer", TARGETS["relayer"] + "/"),
        ping("rpc", TARGETS["rpc"], method="POST",
             json={"jsonrpc": "2.0", "id": 1, "method": "getHealth"}),
    )
    return out


@router.api_route("/{target}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy_root(target: str, request: Request):
    if target in ("site", "app") and request.method == "GET":
        q = ("?" + request.url.query) if request.url.query else ""
        return Response(status_code=307, headers={"location": f"{PREFIX}/{target}/{q}"})
    return await proxy(target, "", request)


@router.api_route("/{target}/{path:path}",
                  methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy(target: str, path: str, request: Request):
    if target == "_img":
        return await _image_proxy(request.query_params.get("u", ""))
    if target == "_brand":
        asset = brand_asset(path)
        if not asset:
            return JSONResponse({"error": "not found"}, status_code=404)
        return Response(asset[0], media_type=asset[1],
                        headers={"cache-control": "no-cache" if path.endswith(".js") else "public, max-age=3600"})
    upstream = TARGETS.get(target)
    if not upstream:
        return JSONResponse({"error": "unknown bifrost target", "targets": list(TARGETS)},
                            status_code=404)
    method = request.method
    origin = public_origin(request)
    if path.startswith("cdn-cgi/"):
        return Response(status_code=204)

    if method == "OPTIONS" and target not in ("site", "app"):
        return Response(status_code=204, headers={
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
            "access-control-allow-headers": "*",
            "access-control-max-age": "86400",
        })

    url = f"{upstream}/{path}"
    if request.url.query:
        url += "?" + request.url.query

    fwd = {k: v for k, v in request.headers.items() if k.lower() not in DROP_REQ_HEADERS}
    fwd["user-agent"] = request.headers.get("user-agent") or UA
    page_origin = TARGETS["app"] if target != "site" else TARGETS["site"]
    fwd["origin"] = page_origin
    ref = request.headers.get("referer")
    if ref and PREFIX in ref:
        tail = ref.split(PREFIX, 1)[1]
        seg = tail.strip("/").split("/", 1)
        if seg and seg[0] in TARGETS:
            fwd["referer"] = TARGETS[seg[0]] + "/" + (seg[1] if len(seg) > 1 else "")
    else:
        fwd["referer"] = page_origin + "/"
    fwd["accept-encoding"] = "gzip, deflate"

    body = await request.body() if method not in ("GET", "HEAD") else None

    ckey = url
    use_cache = _cacheable(target, path, method)
    if use_cache:
        hit = _cache_get(ckey)
        if hit:
            _, status, headers, raw = hit
            return _build_response(status, headers, raw, target, origin, cached=True)

    client = get_client()
    attempts = 3 if method in ("GET", "HEAD") else 2
    last_err = None
    for i in range(attempts):
        try:
            req = client.build_request(method, url, headers=fwd, content=body)
            r = await client.send(req, stream=True)
            ctype = r.headers.get("content-type", "")
            big_binary = (not any(t in ctype for t in REWRITE_TYPES)) and not use_cache
            if big_binary:
                headers = _resp_headers(r.headers, target, origin)
                if target not in ("site", "app"):
                    headers["access-control-allow-origin"] = "*"

                async def gen(resp=r):
                    try:
                        async for chunk in resp.aiter_raw():
                            yield chunk
                    finally:
                        await resp.aclose()
                # aiter_raw yields encoded bytes; keep upstream encoding header then
                ce = r.headers.get("content-encoding")
                if ce:
                    headers["content-encoding"] = ce
                return StreamingResponse(gen(), status_code=r.status_code, headers=headers)
            raw = await r.aread()
            await r.aclose()
            if r.status_code in (502, 503, 504, 429) and i < attempts - 1:
                await asyncio.sleep(0.4 * (2 ** i))
                continue
            if use_cache and r.status_code == 200:
                _cache_put(ckey, r.status_code, dict(r.headers), raw)
            return _build_response(r.status_code, r.headers, raw, target, origin)
        except (httpx.TransportError, httpx.TimeoutException) as e:
            last_err = e
            await asyncio.sleep(0.4 * (2 ** i))
    logger.error(f"bifrost {method} {url} failed: {last_err}")
    return JSONResponse({"error": "bifrost upstream unreachable", "detail": str(last_err)[:200]},
                        status_code=502)


def _build_response(status, up_headers, raw: bytes, target, origin, cached=False):
    if isinstance(up_headers, dict):
        hdrs = httpx.Headers(up_headers)
    else:
        hdrs = up_headers
    ctype = hdrs.get("content-type", "")
    headers = _resp_headers(hdrs, target, origin)
    if any(t in ctype for t in REWRITE_TYPES):
        try:
            text = raw.decode("utf-8")
            text = rewrite_text(text, target, origin, ctype)
            raw = text.encode("utf-8")
        except UnicodeDecodeError:
            pass
    if "text/html" in ctype:
        headers["cache-control"] = "no-store"
    if target not in ("site", "app"):
        headers["access-control-allow-origin"] = "*"
    headers["x-bifrost"] = "v1" + ("-hit" if cached else "")
    return Response(content=raw, status_code=status, headers=headers)


# --------------------------------------------------------------------------
# websocket passthrough
# --------------------------------------------------------------------------
@router.websocket("/{target}")
async def ws_proxy_root(ws: WebSocket, target: str):
    await ws_proxy(ws, target, "")


@router.websocket("/{target}/{path:path}")
async def ws_proxy(ws: WebSocket, target: str, path: str):
    upstream = TARGETS.get(target)
    if not upstream:
        await ws.close(code=4404)
        return
    await ws.accept()
    up_url = upstream.replace("https://", "wss://", 1) + "/" + path
    if ws.url.query:
        up_url += "?" + ws.url.query
    try:
        async with websockets.connect(up_url, origin=TARGETS["app"], user_agent_header=UA,
                                      max_size=None, open_timeout=15) as up:
            async def c2u():
                try:
                    while True:
                        msg = await ws.receive()
                        if msg["type"] == "websocket.disconnect":
                            break
                        if msg.get("text") is not None:
                            await up.send(msg["text"])
                        elif msg.get("bytes") is not None:
                            await up.send(msg["bytes"])
                except WebSocketDisconnect:
                    pass
                finally:
                    await up.close()

            async def u2c():
                async for m in up:
                    if isinstance(m, (bytes, bytearray)):
                        await ws.send_bytes(m)
                    else:
                        await ws.send_text(m)

            await asyncio.gather(c2u(), u2c(), return_exceptions=True)
    except Exception as e:  # noqa
        logger.warning(f"bifrost ws {up_url} error: {e}")
    finally:
        try:
            await ws.close()
        except Exception:
            pass
