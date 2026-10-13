/* Darkinator swaps inside the app shell: Private route (DarkSwap/Houdini) + Privacy swap (NEAR Intents) + Track.
   Mayan-style swap UI. Live data via /api/ds (our backend proxy). */
(function () {
  if (window.__dkSwap) return;
  window.__dkSwap = 1;

  var F = window.__bfFetch || window.fetch.bind(window);
  var API = '/api/ds';
  var LS_KEY = 'darkswap_orders_v2';
  var REFRESH_SECS = 60;
  var SOL_ICON = 'https://api.houdiniswap.com/assets/tokens/sol-solana.png';

  /* ---------------- helpers ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(n) {
    var x = Number(n);
    if (!isFinite(x) || x === 0) return '0';
    if (x >= 1000) return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (x >= 1) return x.toLocaleString(undefined, { maximumFractionDigits: 4 });
    return x.toLocaleString(undefined, { maximumFractionDigits: 8 });
  }
  function usd(n) {
    var x = Number(n);
    if (!isFinite(x) || x <= 0) return '';
    return '$' + x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function qp(o) {
    return Object.keys(o).filter(function (k) { return o[k] !== undefined && o[k] !== null && o[k] !== ''; })
      .map(function (k) { return k + '=' + encodeURIComponent(o[k]); }).join('&');
  }
  function req(path, opts) {
    return F(API + path, opts).then(function (r) {
      return r.text().then(function (t) {
        var d = {};
        try { d = t ? JSON.parse(t) : {}; } catch (e) { d = { error: t || 'Unexpected response' }; }
        if (!r.ok) throw new Error((d && (d.error || d.message)) || ('Request failed (' + r.status + ')'));
        return d;
      });
    });
  }
  function post(path, body) {
    return req(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  }
  function nearIcon(t) {
    if (t.icon) return t.icon;
    if (t.chain === 'sol') {
      if (t.native || t.symbol === 'SOL') return SOL_ICON;
      if (t.contractAddress) return '/api/bifrost/v1/indexer/v1/logo/' + encodeURIComponent(t.contractAddress);
    }
    var s = (t.symbol || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return s ? 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@master/128/color/' + s + '.png' : '';
  }
  var api = {
    tokens: function (side, term) { return req('/tokens?' + qp({ side: side, term: term })).then(function (d) { return d.tokens || []; }); },
    quotes: function (o) { return req('/quotes?' + qp(o)).then(function (d) { return d.quotes || []; }); },
    order: function (b) { return post('/orders', b); },
    getOrder: function (id) { return req('/orders/' + encodeURIComponent(id)); },
    nTokens: function (side, term) {
      return req('/near/tokens?' + qp({ side: side, term: term })).then(function (d) {
        return (d.tokens || []).map(function (t) { var o = Object.assign({}, t); o.name = t.name || t.symbol; o.icon = nearIcon(t); return o; });
      });
    },
    nQuote: function (b) { return post('/near/quote', b); },
    nOrder: function (b) { return post('/near/orders', b); },
    nGetOrder: function (id) { return req('/near/orders/' + encodeURIComponent(id)); }
  };
  function localOrders() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; } }
  function saveOrder(o) {
    var all = localOrders(), i = all.findIndex(function (x) { return x.id === o.id; });
    if (i >= 0) all[i] = o; else all.unshift(o);
    localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0, 30)));
  }
  function localOrder(id) {
    id = (id || '').trim().toLowerCase();
    return localOrders().find(function (o) { return (o.id || '').toLowerCase() === id; });
  }

  /* ---------------- icons ---------------- */
  var SV = function (d, w) { return '<svg viewBox="0 0 24 24" width="' + (w || 18) + '" height="' + (w || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var IC = {
    route: '<circle cx="6" cy="19" r="2"></circle><circle cx="18" cy="5" r="2"></circle><path d="M8 19h5.5a3.5 3.5 0 0 0 0-7h-3a3.5 3.5 0 0 1 0-7H16"></path>',
    shield: '<path d="M12 3l7 3v6c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6l7-3z"></path><path d="M9 12.5l2 2 4-4"></path>',
    track: '<circle cx="11" cy="11" r="6.5"></circle><path d="M20 20l-4.2-4.2"></path>',
    flip: '<path d="M7 4v16"></path><path d="M3 8l4-4 4 4"></path><path d="M17 20V4"></path><path d="M21 16l-4 4-4-4"></path>',
    close: '<path d="M6 6l12 12M18 6L6 18"></path>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="1.5"></rect><path d="M5 15V5a1 1 0 0 1 1-1h10"></path>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"></path>',
    chev: '<path d="M6 9l6 6 6-6"></path>',
    search: '<circle cx="11" cy="11" r="6.5"></circle><path d="M20 20l-4.2-4.2"></path>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"></path>'
  };
  function IMGP(u) {
    if (!u || typeof u !== 'string') return u;
    if (/^https:\/\//i.test(u) && u.indexOf(location.origin) !== 0) return '/api/bifrost/v1/_img?u=' + encodeURIComponent(u);
    return u;
  }
  function coin(src, sym, size, badge) {
    size = size || 30;
    src = IMGP(src); badge = IMGP(badge);
    var letter = esc((sym || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 1).toUpperCase() || '?');
    var img = src
      ? '<img class="m" src="' + esc(src) + '" alt="" style="width:' + size + 'px;height:' + size + 'px" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
        '<span class="lt" style="display:none;width:' + size + 'px;height:' + size + 'px">' + letter + '</span>'
      : '<span class="lt" style="width:' + size + 'px;height:' + size + 'px">' + letter + '</span>';
    var b = badge ? '<img class="b" src="' + esc(badge) + '" alt="" onerror="this.remove()">' : '';
    return '<span class="dk-ico" style="width:' + size + 'px;height:' + size + 'px">' + img + b + '</span>';
  }

  /* ---------------- CSS ---------------- */
  var CSS = [
    "#dk-view,#dk-modal{--dk-bg:#1c1c21;--dk-box:#25252b;--dk-line:#404040;--dk-mut:#8c8c8c;--dk-fg:#fff;--dk-grad:linear-gradient(0deg,rgba(255,255,255,.45),rgba(255,255,255,.45)),linear-gradient(91.31deg,#fff -11.98%,#83f4ff 21.23%,#cfb1f8 50.19%,#faedff 100%)}",
    "html:not(.dk-on) #dk-view{display:none!important}",
    "html.dk-on main.main>:not(#dk-view){display:none!important}",
    "html.dk-on .nav-i.on:not(.dk-nav){background:transparent!important;color:var(--fg-2)!important}",
    "#dk-view{display:block;padding:34px 16px 70px;font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;color:var(--dk-fg)}",
    "#dk-view *,#dk-modal *{box-sizing:border-box}",
    ".dk-wrap{width:min(460px,100%);margin:0 auto}",
    ".dk-seg{display:flex;justify-content:center;margin:0 0 22px}",
    ".dk-seg button{all:unset;cursor:pointer;padding:7px 14px;border:1px solid var(--dk-line);color:var(--dk-mut);font-size:15px;display:inline-flex;gap:7px;align-items:center;transition:background .15s,color .15s}",
    ".dk-seg button+button{border-left:0}",
    ".dk-seg button:hover{color:#fff}",
    ".dk-seg button.on{background:#3a3a41;color:#fff}",
    ".dk-card{background:var(--dk-bg);border:1px solid var(--dk-line);padding:20px 20px 28px}",
    ".dk-lbl{color:var(--dk-mut);font-size:16px;margin:10px 10px 10px 10px;display:flex;justify-content:space-between;align-items:baseline;gap:8px}",
    ".dk-lbl small{font-size:12px;color:#6d6d74;font-family:'Space Mono',monospace}",
    ".dk-row{display:flex;gap:6px}",
    ".dk-tok{all:unset;box-sizing:border-box;cursor:pointer;width:140px;height:74px;flex:none;background:var(--dk-box);border:1px solid var(--dk-line);padding:14px 12px;display:flex;align-items:center;gap:10px;transition:border-color .15s}",
    ".dk-tok:hover{border-color:#6a6a72}",
    ".dk-tok .t{min-width:0;display:flex;flex-direction:column}",
    ".dk-sym{font-weight:500;font-size:16px;line-height:21px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:78px}",
    ".dk-ch{font-size:12px;color:var(--dk-mut);line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:78px}",
    ".dk-sel{font-size:15px;color:#cfcfd4}",
    ".dk-ico{position:relative;display:inline-flex;flex:none}",
    ".dk-ico img.m{border-radius:50%;object-fit:cover;display:block}",
    ".dk-ico .lt{border-radius:50%;background:#3a3a41;color:#e6e6ea;align-items:center;justify-content:center;font-size:12px;font-weight:600;display:flex}",
    ".dk-ico img.b{position:absolute;right:-3px;bottom:-3px;width:13px;height:13px;border-radius:50%;border:1.5px solid var(--dk-box);background:var(--dk-box)}",
    ".dk-amt{flex:1;min-width:0;height:74px;background:var(--dk-box);border:1px solid var(--dk-line);padding:10px 16px;display:flex;flex-direction:column;justify-content:center;gap:2px;cursor:text}",
    ".dk-amt:focus-within{border-color:#6a6a72}",
    ".dk-amt input{all:unset;font-family:'Space Mono',monospace;font-size:20px;width:100%;color:#fff}",
    ".dk-amt input::placeholder{color:#5c5c63}",
    ".dk-amt .u{font-family:'Space Mono',monospace;font-size:12px;color:var(--dk-mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".dk-out{font-family:'Space Mono',monospace;font-size:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".dk-out.z{color:#5c5c63}",
    ".dk-flip{all:unset;width:30px;height:30px;margin:14px auto 2px;border:1px solid var(--dk-line);background:var(--dk-box);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#cfcfd4}",
    ".dk-flip:hover{border-color:#6a6a72;color:#fff}",
    ".dk-field{margin-top:6px}",
    ".dk-in{display:flex;align-items:center;gap:8px;background:var(--dk-box);border:1px solid var(--dk-line);padding:13px 14px}",
    ".dk-in:focus-within{border-color:#6a6a72}",
    ".dk-in input{all:unset;flex:1;min-width:0;font-family:'Space Mono',monospace;font-size:13px;color:#fff}",
    ".dk-in input::placeholder{color:#5c5c63}",
    ".dk-paste{all:unset;cursor:pointer;font-size:12px;color:#cfcfd4;border:1px solid var(--dk-line);padding:4px 9px}",
    ".dk-paste:hover{color:#fff;border-color:#6a6a72}",
    ".dk-hint{color:#6d6d74;font-size:12px;margin:8px 10px 0}",
    ".dk-rates{margin-top:18px}",
    ".dk-r{all:unset;box-sizing:border-box;width:100%;cursor:pointer;border:1px solid var(--dk-line);background:var(--dk-box);padding:11px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px}",
    ".dk-r.on{border-color:#cfb1f8;box-shadow:inset 0 0 0 1px rgba(207,177,248,.35)}",
    ".dk-r .k{font-size:12px;color:var(--dk-mut)}",
    ".dk-r .v{font-family:'Space Mono',monospace;font-size:14px}",
    ".dk-r .best{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#0d0d0d;background:var(--dk-grad);padding:2px 7px;border-radius:999px;margin-left:8px}",
    ".dk-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px}",
    ".dk-meta div{border:1px solid var(--dk-line);background:var(--dk-box);padding:9px 11px}",
    ".dk-meta b{display:block;font-weight:400;font-size:11px;color:var(--dk-mut)}",
    ".dk-meta span{font-family:'Space Mono',monospace;font-size:12px}",
    ".dk-lim{font-size:12px;color:#6d6d74;margin:8px 10px 0;font-family:'Space Mono',monospace}",
    ".dk-cta{all:unset;box-sizing:border-box;width:100%;margin-top:22px;height:49px;border-radius:25px;font-size:18px;color:#0d0d0d;cursor:pointer;background:var(--dk-grad);display:flex;align-items:center;justify-content:center;gap:10px;transition:filter .15s,opacity .15s}",
    ".dk-cta:hover{filter:brightness(1.05)}",
    ".dk-cta[disabled]{opacity:.42;cursor:not-allowed;filter:none}",
    ".dk-err{margin-top:14px;border:1px solid #5b2a2f;background:#2a1b1f;color:#ff9fa6;padding:10px 12px;font-size:13px}",
    ".dk-note{text-align:center;color:#6d6d74;font-size:12px;margin-top:14px}",
    ".dk-live{display:inline-flex;align-items:center;gap:6px;color:#cfcfd4;font-size:12px}",
    ".dk-live i{width:6px;height:6px;border-radius:50%;background:#83f4ff;box-shadow:0 0 8px #83f4ff;animation:dkp 1.4s infinite}",
    "@keyframes dkp{50%{opacity:.35}}",
    ".dk-spin{width:16px;height:16px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:dks .8s linear infinite;display:inline-block}",
    "@keyframes dks{to{transform:rotate(360deg)}}",
    "#dk-modal{position:fixed;inset:0;z-index:90;background:rgba(10,10,12,.62);display:grid;place-items:center;font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;color:#fff;animation:dkf .15s ease}",
    "@keyframes dkf{from{opacity:0}}",
    ".dk-mb{width:min(440px,calc(100% - 24px));max-height:calc(100vh - 52px);background:#1a1a1f;border:1px solid var(--dk-line);padding:20px;display:flex;flex-direction:column}",
    ".dk-mh{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}",
    ".dk-mh h3{margin:0;font-size:18px;font-weight:500}",
    ".dk-x{all:unset;cursor:pointer;color:#e6e6ea;display:flex}",
    ".dk-x:hover{color:#fff}",
    ".dk-chains{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}",
    ".dk-chain{all:unset;box-sizing:border-box;cursor:pointer;height:45px;border:1px solid var(--dk-line);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:12px;color:#e6e6ea;text-align:center;padding:0 4px;overflow:hidden}",
    ".dk-chain span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}",
    ".dk-chain:hover{background:#25252b}",
    ".dk-chain.on{background:#3a3a41;border-color:#8c8c8c}",
    ".dk-chain img{width:16px;height:16px;border-radius:50%}",
    ".dk-srch{display:flex;align-items:center;gap:10px;border:1px solid var(--dk-line);background:#25252b;padding:8px 12px;color:#8c8c8c}",
    ".dk-srch input{all:unset;flex:1;font-size:15px;color:#fff}",
    ".dk-srch input::placeholder{color:#8c8c8c}",
    ".dk-chips{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 6px}",
    ".dk-chip{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;background:#25252b;padding:4px 8px;border-radius:999px;font-family:'Space Mono',monospace;font-size:12px;font-weight:700}",
    ".dk-chip:hover{background:#303037}",
    ".dk-list{overflow-y:auto;margin:4px -8px 0;padding:0 8px;min-height:120px}",
    ".dk-it{all:unset;box-sizing:border-box;width:100%;cursor:pointer;display:flex;align-items:center;gap:13px;padding:9px 6px}",
    ".dk-it:hover{background:#232329}",
    ".dk-it .n{font-size:16px;line-height:21px}",
    ".dk-it .s{font-size:12px;color:var(--dk-mut);font-family:'Space Mono',monospace}",
    ".dk-it .p{margin-left:auto;text-align:right;font-size:12px;color:var(--dk-mut);font-family:'Space Mono',monospace;flex:none}",
    ".dk-empty{padding:36px 0;text-align:center;color:var(--dk-mut);font-size:14px;display:flex;gap:8px;align-items:center;justify-content:center}",
    ".dk-sec{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6d6d74;padding:10px 6px 2px;font-family:'Space Mono',monospace}",
    ".dk-pair{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--dk-line);background:#25252b;padding:12px 14px;gap:8px}",
    ".dk-pair .a{display:flex;align-items:center;gap:10px;min-width:0}",
    ".dk-pair .a div{font-size:14px} .dk-pair .a small{display:block;font-size:11px;color:var(--dk-mut)}",
    ".dk-cf{margin-top:12px}",
    ".dk-cf .k{font-size:12px;color:var(--dk-mut);margin:0 0 6px 2px}",
    ".dk-cf .v{display:flex;align-items:center;gap:8px;border:1px solid var(--dk-line);background:#25252b;padding:10px 12px}",
    ".dk-cf code{font-family:'Space Mono',monospace;font-size:12.5px;word-break:break-all;color:#fff;flex:1}",
    ".dk-cp{all:unset;cursor:pointer;color:#cfcfd4;display:flex}",
    ".dk-cp:hover{color:#fff}",
    ".dk-timer{margin-top:12px;border:1px solid var(--dk-line);padding:9px 12px;font-size:13px;color:#cfcfd4}",
    ".dk-timer b{font-family:'Space Mono',monospace;color:#fff}",
    ".dk-steps{margin-top:18px;display:grid;gap:10px}",
    ".dk-step{display:flex;align-items:center;gap:12px;font-size:14px;color:#6d6d74}",
    ".dk-step i{width:24px;height:24px;border:1px solid var(--dk-line);display:flex;align-items:center;justify-content:center;font-style:normal;font-size:11px;font-family:'Space Mono',monospace}",
    ".dk-step.done{color:#fff} .dk-step.done i{background:#3a3a41;border-color:#8c8c8c}",
    ".dk-step.act{color:#fff} .dk-step.act i{border-color:#cfb1f8;box-shadow:0 0 10px rgba(207,177,248,.45)}",
    ".dk-badge{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--dk-line);padding:3px 9px;font-size:12px;font-family:'Space Mono',monospace;color:#cfcfd4;margin-top:10px}",
    ".dk-recent{all:unset;box-sizing:border-box;width:100%;cursor:pointer;display:flex;align-items:center;gap:10px;border:1px solid var(--dk-line);background:#25252b;padding:11px 12px;margin-top:6px;font-size:13px}",
    ".dk-recent:hover{border-color:#6a6a72}",
    ".dk-recent code{margin-left:auto;font-family:'Space Mono',monospace;font-size:11px;color:var(--dk-mut);max-width:38%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "@media (max-width:520px){.dk-tok{width:122px}#dk-view{padding:20px 10px 90px}.dk-card{padding:16px 14px 22px}}"
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('dk-swap-css')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap';
    document.head.appendChild(l);
    var s = document.createElement('style');
    s.id = 'dk-swap-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------------- state ---------------- */
  var S = {
    view: null, method: 'private',
    send: null, recv: null, amount: '', dest: '', refund: '',
    routes: [], ri: 0, quoting: false, qerr: '', validUntil: 0,
    submitting: false, serr: '', reqId: 0,
    track: { q: '', local: null, live: null, loading: false, err: '', searched: false, poll: null }
  };
  var qTimer = null;

  function isNear() { return S.method === 'privacy'; }
  function selected() { return S.routes[S.ri] || null; }

  function resetPair() {
    S.send = null; S.recv = null; S.routes = []; S.ri = 0; S.qerr = ''; S.serr = ''; S.validUntil = 0;
  }

  function scheduleQuote() {
    clearTimeout(qTimer);
    qTimer = setTimeout(fetchQuote, 550);
  }

  function fetchQuote() {
    var amt = parseFloat(S.amount);
    var near = isNear();
    var ready = S.send && S.recv && amt > 0 && (!near || (S.dest.trim().length >= 20 && S.refund.trim().length >= 20));
    if (!ready) { S.routes = []; S.quoting = false; S.qerr = ''; render(); return; }
    var id = ++S.reqId;
    S.quoting = true; S.qerr = ''; render();
    var p = near
      ? api.nQuote({ from: S.send.id, to: S.recv.id, amount: S.amount, recipient: S.dest.trim(), refundTo: S.refund.trim() }).then(function (q) {
          var out = parseFloat(q.amountOut);
          S.routes = [{ quoteId: q.quoteId, out: out, usdIn: amt * (S.send.price || 0), usdOut: out * (S.recv.price || 0),
            etaMin: q.estimatedSeconds ? Math.max(1, Math.round(q.estimatedSeconds / 60)) : null, min: q.min, max: q.max }];
          S.ri = 0;
          S.validUntil = q.validUntil ? new Date(q.validUntil).getTime() : Date.now() + REFRESH_SECS * 1000;
        })
      : api.quotes({ amount: S.amount, from: S.send.id, to: S.recv.id }).then(function (qs) {
          if (!qs || !qs.length) { S.routes = []; S.qerr = 'No route available for this pair. Try a different asset or amount.'; return; }
          S.routes = qs.slice().sort(function (a, b) { return b.amountOut - a.amountOut; }).slice(0, 3).map(function (q) {
            return { quoteId: q.quoteId, out: q.amountOut, usdIn: q.amountInUsd, usdOut: q.amountOutUsd,
              etaMin: q.duration ? Math.max(1, Math.round(q.duration)) : null, min: q.min, max: q.max };
          });
          S.ri = 0;
          S.validUntil = Date.now() + REFRESH_SECS * 1000;
        });
    p.catch(function (e) { if (id === S.reqId) { S.routes = []; S.qerr = e.message; } })
      .then(function () { if (id === S.reqId) { S.quoting = false; render(); } });
  }

  function cta() {
    var amt = parseFloat(S.amount), near = isNear();
    var validDest = S.dest.trim().length >= 20, validRefund = S.refund.trim().length >= 20;
    var sel = selected();
    var ok = S.send && S.recv && sel && validDest && (!near || validRefund) && !S.quoting && !S.submitting;
    var t = 'Review swap';
    if (!S.send) t = 'Choose the asset you send';
    else if (!amt || amt <= 0) t = 'Enter an amount';
    else if (!S.recv) t = 'Pick an asset to receive';
    else if (near && !validRefund) t = 'Enter your Solana refund address';
    else if (!validDest) t = 'Enter a destination address';
    else if (S.qerr) t = 'No quote · adjust and retry';
    else if (S.quoting || !sel) t = 'Fetching quote…';
    if (S.submitting) t = 'Creating order…';
    return { ok: !!ok, text: t };
  }

  function submit() {
    var c = cta();
    if (!c.ok) return;
    var sel = selected(), near = isNear();
    S.submitting = true; S.serr = ''; render();
    var p;
    if (near) {
      var rid = (window.crypto && crypto.randomUUID && crypto.randomUUID()) || ('req-' + Math.random().toString(16).slice(2));
      p = api.nOrder({ quoteId: sel.quoteId, requestId: rid }).then(function (o) {
        return { id: o.requestId, method: 'privacy', depositAddress: o.depositAddress, depositMemo: o.depositMemo || null,
          addressTo: o.recipient, amount: o.amountIn, sendSymbol: (o.from && o.from.symbol) || S.send.symbol,
          outAmount: o.amountOut, recvSymbol: (o.to && o.to.symbol) || S.recv.symbol,
          networkName: (o.to && o.to.chainName) || S.recv.chainName, sendIcon: S.send.icon, recvIcon: S.recv.icon,
          expires: o.deadline, eta: o.estimatedSeconds, createdAt: Date.now() };
      });
    } else {
      p = api.order({ quoteId: sel.quoteId, addressTo: S.dest.trim() }).then(function (o) {
        return { id: o.houdiniId, method: 'private', depositAddress: o.depositAddress, depositMemo: null,
          addressTo: o.receiverAddress || S.dest.trim(), amount: o.inAmount, sendSymbol: o.inSymbol || S.send.symbol,
          outAmount: o.outAmount, recvSymbol: S.recv.symbol, networkName: S.recv.chainName,
          sendIcon: S.send.icon, recvIcon: S.recv.icon, expires: o.expires, eta: o.eta, createdAt: Date.now() };
      });
    }
    p.then(function (rec) { saveOrder(rec); openOrder(rec); })
      .catch(function (e) { S.serr = e.message; })
      .then(function () { S.submitting = false; render(); });
  }

  /* ---------------- render: swap ---------------- */
  function tokBtn(side) {
    var t = side === 'source' ? S.send : S.recv;
    var badge = side === 'source' ? SOL_ICON : (t && chainIcon(t.chainName));
    if (!t) {
      return '<button class="dk-tok" data-act="pick" data-side="' + side + '" data-testid="dk-pick-' + side + '">' +
        '<span class="dk-ico" style="width:30px;height:30px"><span class="lt" style="width:30px;height:30px">' + SV(IC.chev, 14) + '</span></span>' +
        '<span class="t"><span class="dk-sel">Select</span><span class="dk-ch">' + (side === 'source' ? 'Solana' : 'Any chain') + '</span></span></button>';
    }
    return '<button class="dk-tok" data-act="pick" data-side="' + side + '" data-testid="dk-pick-' + side + '">' + coin(t.icon, t.symbol, 30, badge) +
      '<span class="t"><span class="dk-sym">' + esc(t.symbol) + '</span><span class="dk-ch">' + esc(t.chainName || '') + '</span></span></button>';
  }

  function swapHTML() {
    var near = isNear(), sel = selected(), amt = parseFloat(S.amount), c = cta();
    var secs = S.validUntil ? Math.max(0, Math.round((S.validUntil - Date.now()) / 1000)) : 0;
    var usdIn = sel ? usd(sel.usdIn) : (S.send && amt > 0 ? usd(amt * (S.send.price || 0)) : '');
    var h = '';
    h += '<div class="dk-card" data-testid="dk-swap-card">';
    h += '<div class="dk-lbl"><span>From</span><small>Solana · Min $3</small></div>';
    h += '<div class="dk-row">' + tokBtn('source') +
      '<label class="dk-amt"><input id="dk-amount" data-testid="dk-amount" inputmode="decimal" autocomplete="off" placeholder="0" value="' + esc(S.amount) + '">' +
      '<span class="u">' + (usdIn ? '≈ ' + usdIn : (S.send ? esc(S.send.name || S.send.symbol) : '&nbsp;')) + '</span></label></div>';
    h += '<button class="dk-flip" data-act="refresh" title="Refresh quote" data-testid="dk-refresh">' + SV(IC.flip, 15) + '</button>';
    h += '<div class="dk-lbl"><span>To</span><small>' + (S.recv ? esc(S.recv.chainName) : 'Any supported network') + '</small></div>';
    var outTxt = S.quoting && !sel ? '<span class="dk-spin"></span>' : (sel ? esc(fmt(sel.out)) : '0');
    h += '<div class="dk-row">' + tokBtn('destination') +
      '<div class="dk-amt"><div class="dk-out' + (sel ? '' : ' z') + '" data-testid="dk-out">' + outTxt + '</div>' +
      '<span class="u">' + (sel && sel.usdOut ? '≈ ' + usd(sel.usdOut) : (sel && S.send && S.recv && amt > 0 ? '1 ' + esc(S.send.symbol) + ' ≈ ' + esc(fmt(sel.out / amt)) + ' ' + esc(S.recv.symbol) : '&nbsp;')) + '</span></div></div>';

    if (sel) {
      h += '<div class="dk-rates">';
      h += '<div class="dk-lbl" style="margin-top:4px"><span>' + (S.routes.length > 1 ? 'Routes' : 'Route') + '</span><span class="dk-live"><i></i>' + (S.quoting ? 'refreshing…' : 'Live · new in ' + secs + 's') + '</span></div>';
      S.routes.forEach(function (r, i) {
        h += '<button class="dk-r' + (i === S.ri ? ' on' : '') + '" data-act="route" data-i="' + i + '" data-testid="dk-route-' + i + '">' +
          '<span><span class="k">' + (near ? 'Privacy swap · shielded' : 'Route ' + (i + 1)) + '</span>' + (i === 0 ? '<span class="best">Best</span>' : '') + '</span>' +
          '<span class="v">' + esc(fmt(r.out)) + ' ' + esc(S.recv.symbol) + '</span></button>';
      });
      h += '<div class="dk-meta"><div><b>Route fee</b><span>In quote</span></div><div><b>Expected time</b><span>' + (sel.etaMin ? '~' + sel.etaMin + ' min' : '—') + '</span></div>' +
        '<div><b>Rate</b><span>' + (amt > 0 ? esc(fmt(sel.out / amt)) : '—') + '</span></div></div>';
      if (sel.min != null && sel.max != null && Number(sel.max) < 1e9) h += '<div class="dk-lim">Limits ' + esc(fmt(sel.min)) + '–' + esc(fmt(sel.max)) + ' ' + esc(S.send.symbol) + '</div>';
      h += '</div>';
    }

    h += '<div class="dk-lbl" style="margin-top:18px"><span>Destination address</span><small>' + (S.recv ? esc(S.recv.symbol + ' on ' + S.recv.chainName) : 'Destination chain') + '</small></div>';
    h += '<div class="dk-field"><div class="dk-in"><input id="dk-dest" data-testid="dk-dest" autocomplete="off" spellcheck="false" placeholder="' + (S.recv ? 'Your ' + esc(S.recv.chainName) + ' receiving address' : 'Your receiving address') + '" value="' + esc(S.dest) + '">' +
      '<button class="dk-paste" data-act="paste" data-f="dest">Paste</button></div></div>';
    if (near) {
      h += '<div class="dk-lbl" style="margin-top:14px"><span>Refund address</span><small>Solana</small></div>';
      h += '<div class="dk-field"><div class="dk-in"><input id="dk-refund" data-testid="dk-refund" autocomplete="off" spellcheck="false" placeholder="Your Solana refund address" value="' + esc(S.refund) + '">' +
        '<button class="dk-paste" data-act="paste" data-f="refund">Paste</button></div></div>';
      h += '<div class="dk-hint">Funds return here if the swap cannot complete.</div>';
    } else {
      h += '<div class="dk-hint">Check the chain and address. Transfers cannot be reversed.</div>';
    }
    if (S.qerr || S.serr) h += '<div class="dk-err" data-testid="dk-error">' + esc(S.serr || S.qerr) + '</div>';
    h += '<button class="dk-cta" data-act="submit" data-testid="dk-submit"' + (c.ok ? '' : ' disabled') + '>' + (S.submitting ? '<span class="dk-spin"></span>' : '') + esc(c.text) + '</button>';
    h += '<div class="dk-note">Creating an order moves no funds · live on-chain quotes</div>';
    h += '</div>';
    return h;
  }

  /* ---------------- render: track ---------------- */
  var STEPS = ['Awaiting deposit', 'Confirming', 'Exchanging', 'Sending', 'Completed'];
  function statusIndex(s) {
    var u = (s || '').toUpperCase();
    if (/EXPIRE|REFUND|FAIL|CANCEL|ERROR/.test(u)) return -1;
    if (/FINISH|COMPLETE|SUCCESS|DONE|SETTLED/.test(u)) return 4;
    if (/SEND|WITHDRAW/.test(u)) return 3;
    if (/EXCHANG|SWAP|PROCESS/.test(u)) return 2;
    if (/CONFIRM|DETECT|RECEIVED/.test(u)) return 1;
    return 0;
  }
  function trackHTML() {
    var T = S.track, h = '<div class="dk-card" data-testid="dk-track-card">';
    h += '<div class="dk-lbl"><span>Track your order</span><small>live status</small></div>';
    h += '<div class="dk-in"><input id="dk-track-q" data-testid="dk-track-input" placeholder="Paste your order ID" autocomplete="off" spellcheck="false" value="' + esc(T.q) + '">' +
      '<button class="dk-paste" data-act="track" data-testid="dk-track-btn">' + (T.loading ? '<span class="dk-spin" style="width:12px;height:12px"></span>' : 'Track') + '</button></div>';
    var has = T.local || T.live;
    if (has) {
      var l = T.local || {}, v = T.live || {};
      var st = v.displayStatus || v.status || 'AWAITING_DEPOSIT';
      var idx = statusIndex(st);
      var sendSym = l.sendSymbol || v.inSymbol || (v.from && v.from.symbol) || '?';
      var recvSym = l.recvSymbol || v.outSymbol || (v.to && v.to.symbol) || '?';
      var net = l.networkName || (v.to && v.to.chainName) || '';
      var amount = l.amount != null ? l.amount : (v.inAmount != null ? v.inAmount : v.amountIn);
      var out = l.outAmount != null ? l.outAmount : (v.outAmount != null ? v.outAmount : v.amountOut);
      var dep = l.depositAddress || v.depositAddress;
      h += '<div style="margin-top:18px;display:flex;justify-content:space-between;gap:8px;align-items:center"><span style="font-size:13px;color:#cfcfd4">' +
        (l.method === 'privacy' ? 'Privacy swap · shielded' : 'Private route · best rate') + '</span><code style="font-family:Space Mono,monospace;font-size:11px;color:#8c8c8c;max-width:50%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(l.id || v.houdiniId || v.requestId || '') + '</code></div>';
      h += '<div class="dk-badge" data-testid="dk-track-status"><span class="dk-live"><i></i></span>' + esc(String(st).replace(/_/g, ' ')) + '</div>';
      h += '<div class="dk-pair" style="margin-top:12px"><div class="a">' + coin(l.sendIcon, sendSym, 26) + '<div>' + esc(fmt(amount)) + ' ' + esc(sendSym) + '<small>Solana</small></div></div>' +
        SV(IC.arrow, 16) + '<div class="a" style="text-align:right"><div>≈ ' + esc(fmt(out)) + ' ' + esc(recvSym) + '<small>' + esc(net) + '</small></div>' + coin(l.recvIcon, recvSym, 26) + '</div></div>';
      if (dep) h += copyField('Solana deposit address', dep);
      if (idx === -1) h += '<div class="dk-err">Order expired, refunded or failed.</div>';
      else {
        h += '<div class="dk-steps">';
        STEPS.forEach(function (s, i) {
          h += '<div class="dk-step' + (i < idx ? ' done' : i === idx ? ' act' : '') + '"><i>' + (i < idx ? SV(IC.check, 13) : (i + 1)) + '</i>' + s + '</div>';
        });
        h += '</div>';
      }
      h += '<div class="dk-note">Live status · refreshes automatically</div>';
    } else if (T.err) {
      h += '<div class="dk-err" data-testid="dk-track-error">Couldn\u2019t find that order. ' + esc(T.err) + '</div>';
    } else if (!T.searched) {
      var rec = localOrders().slice(0, 6);
      if (rec.length) {
        h += '<div class="dk-lbl" style="margin-top:18px"><span>Recent orders</span><small>this browser</small></div>';
        rec.forEach(function (o) {
          h += '<button class="dk-recent" data-act="recent" data-id="' + esc(o.id) + '">' + coin(o.sendIcon, o.sendSymbol, 22) + SV(IC.arrow, 13) + coin(o.recvIcon, o.recvSymbol, 22) +
            '<span>' + esc(fmt(o.amount)) + ' ' + esc(o.sendSymbol) + ' → ' + esc(o.recvSymbol) + '</span><code>' + esc(o.id) + '</code></button>';
        });
      } else {
        h += '<div class="dk-empty" style="flex-direction:column">No orders yet.<span style="font-size:12px;color:#6d6d74">Create a swap to get an order ID.</span></div>';
      }
    }
    h += '</div>';
    return h;
  }

  function doTrack(id) {
    var T = S.track;
    id = (id || '').trim();
    if (!id) return;
    T.q = id; T.searched = true; T.loading = true; T.live = null; T.err = '';
    T.local = localOrder(id) || null;
    render();
    if (T.poll) clearInterval(T.poll);
    var once = function () {
      var lo = T.local;
      var p = lo && lo.method === 'privacy' ? api.nGetOrder(id) : api.getOrder(id).catch(function () { return api.nGetOrder(id); });
      return p.then(function (d) { T.live = d; T.err = ''; }).catch(function (e) { T.err = e.message; })
        .then(function () { T.loading = false; if (S.view === 'track') render(); });
    };
    once();
    T.poll = setInterval(function () { if (S.view === 'track' && T.q === id) once(); else { clearInterval(T.poll); T.poll = null; } }, 8000);
  }

  function copyField(label, value) {
    return '<div class="dk-cf"><div class="k">' + esc(label) + '</div><div class="v"><code>' + esc(value) + '</code><button class="dk-cp" data-act="copy" data-v="' + esc(value) + '" title="Copy">' + SV(IC.copy, 16) + '</button></div></div>';
  }

  /* ---------------- main render ---------------- */
  function viewEl() { return document.getElementById('dk-view'); }
  function render() {
    var el = viewEl();
    if (!el || !S.view) return;
    var ae = document.activeElement, fid = ae && ae.id && el.contains(ae) ? ae.id : null;
    var ss = fid && ae.selectionStart, se = fid && ae.selectionEnd;
    var seg = '<div class="dk-seg">' +
      '<button data-act="go" data-v="private-route" class="' + (S.view === 'swap' && S.method === 'private' ? 'on' : '') + '" data-testid="dk-seg-private">Private route ' + SV(IC.route, 14) + '</button>' +
      '<button data-act="go" data-v="privacy-swap" class="' + (S.view === 'swap' && S.method === 'privacy' ? 'on' : '') + '" data-testid="dk-seg-privacy">Privacy swap ' + SV(IC.shield, 14) + '</button>' +
      '<button data-act="go" data-v="track" class="' + (S.view === 'track' ? 'on' : '') + '" data-testid="dk-seg-track">Track ' + SV(IC.track, 14) + '</button></div>';
    el.innerHTML = '<div class="dk-wrap">' + seg + (S.view === 'track' ? trackHTML() : swapHTML()) + '</div>';
    if (fid) {
      var n = document.getElementById(fid);
      if (n) { n.focus(); try { n.setSelectionRange(ss, se); } catch (e) {} }
    }
  }

  // countdown tick without full re-render
  setInterval(function () {
    if (S.view !== 'swap' || !S.routes.length) return;
    var secs = S.validUntil ? Math.max(0, Math.round((S.validUntil - Date.now()) / 1000)) : 0;
    if (secs <= 0 && !S.quoting) { fetchQuote(); return; }
    var lv = document.querySelector('#dk-view .dk-rates .dk-live');
    if (lv && !S.quoting) lv.innerHTML = '<i></i>Live · new in ' + secs + 's';
  }, 1000);

  /* ---------------- token modal ---------------- */
  var CHAIN_ICONS = {};
  var NATIVE = { 'Ethereum Mainnet': 'ETH', Ethereum: 'ETH', Arbitrum: 'ETH', Base: 'ETH', Optimism: 'ETH', 'Binance Smart Chain': 'BNB', 'BNB Chain': 'BNB', Polygon: 'POL', 'Avalanche C-Chain': 'AVAX', Solana: 'SOL', NEAR: 'wNEAR', Zcash: 'ZEC', Cronos: 'CRO', Gnosis: 'XDAI', Sei: 'SEI', Rootstock: 'RBTC', HyperEVM: 'HYPE', PLS: 'PLS', Gravity: 'G', 'Manta Pacific Mainnet': 'ETH' };
  function learnChains(list) {
    list.forEach(function (t) {
      var c = t.chainName; if (!c || !t.icon) return;
      if (!CHAIN_ICONS[c] || (NATIVE[c] && t.symbol === NATIVE[c])) CHAIN_ICONS[c] = t.icon;
    });
    CHAIN_ICONS.Solana = SOL_ICON;
  }
  function chainIcon(c) { return CHAIN_ICONS[c] || ''; }

  var M = null; // modal state
  function closeModal() {
    var m = document.getElementById('dk-modal');
    if (m) m.remove();
    M = null;
  }
  function openPicker(side) {
    closeModal();
    M = { kind: 'pick', side: side, term: '', chain: 'All', tokens: [], loading: true, req: 0, allChains: [] };
    var m = document.createElement('div');
    m.id = 'dk-modal';
    m.setAttribute('data-testid', 'dk-token-modal');
    document.body.appendChild(m);
    m.addEventListener('mousedown', function (e) { if (e.target === m) closeModal(); });
    renderPicker(true);
    loadTokens('');
  }
  function loadTokens(term) {
    if (!M) return;
    var id = ++M.req, near = isNear(), side = M.side;
    M.loading = true; renderPickerList();
    (near ? api.nTokens(side, term) : api.tokens(side, term)).then(function (list) {
      if (!M || id !== M.req) return;
      M.tokens = Array.isArray(list) ? list : [];
      learnChains(M.tokens);
      if (!term) {
        var seen = {}, cs = [];
        M.tokens.forEach(function (t) { var c = t.chainName || 'Other'; if (!seen[c]) { seen[c] = 1; cs.push(c); } });
        M.allChains = cs;
      }
    }).catch(function () { if (M && id === M.req) M.tokens = []; })
      .then(function () { if (M && id === M.req) { M.loading = false; renderPicker(false); } });
  }
  function renderPicker(first) {
    var m = document.getElementById('dk-modal');
    if (!m || !M) return;
    if (first || !m.querySelector('.dk-mb')) {
      m.innerHTML = '<div class="dk-mb"><div class="dk-mh"><h3>' + (M.side === 'source' ? 'Sell' : 'Buy') + '</h3><button class="dk-x" data-act="close" data-testid="dk-modal-close">' + SV(IC.close, 20) + '</button></div>' +
        '<div class="dk-chains" id="dk-chains"></div>' +
        '<div class="dk-srch">' + SV(IC.search, 18) + '<input id="dk-term" data-testid="dk-token-search" placeholder="Search name or symbol" autocomplete="off"></div>' +
        '<div class="dk-chips" id="dk-chips"></div><div class="dk-list" id="dk-list"></div></div>';
      var inp = m.querySelector('#dk-term');
      var t = null;
      inp.addEventListener('input', function () { M.term = inp.value; clearTimeout(t); t = setTimeout(function () { loadTokens(M.term.trim()); }, 300); });
      setTimeout(function () { inp.focus(); }, 30);
    }
    // chain grid (destination or multi-chain lists)
    var cg = m.querySelector('#dk-chains');
    var chains = M.allChains || [];
    if (M.side === 'destination' && chains.length > 1) {
      var tiles = ['All'].concat(chains).slice(0, 9);
      if (M.chain !== 'All' && tiles.indexOf(M.chain) < 0) tiles[8] = M.chain;
      cg.style.display = '';
      cg.innerHTML = tiles.map(function (c) {
        var ic = c === 'All' ? '<span style="font-size:15px;line-height:16px">✦</span>' : (chainIcon(c) ? '<img src="' + esc(IMGP(chainIcon(c))) + '" alt="" onerror="this.remove()">' : '');
        return '<button class="dk-chain' + (M.chain === c ? ' on' : '') + '" data-act="chain" data-c="' + esc(c) + '">' + ic + '<span>' + esc(c === 'All' ? 'All chains' : c.replace(' Mainnet', '')) + '</span></button>';
      }).join('');
    } else {
      cg.style.display = 'none';
      cg.innerHTML = '';
    }
    // quick chips: first 4 tokens of the current chain
    var chips = m.querySelector('#dk-chips');
    var pool = filtered().slice(0, 4);
    chips.innerHTML = M.loading ? '' : pool.map(function (t, i) {
      return '<button class="dk-chip" data-act="choose" data-i="' + M.tokens.indexOf(t) + '">' + coin(t.icon, t.symbol, 16) + esc(t.symbol) + '</button>';
    }).join('');
    renderPickerList();
  }
  function filtered() {
    if (!M) return [];
    return M.chain === 'All' ? M.tokens : M.tokens.filter(function (t) { return (t.chainName || 'Other') === M.chain; });
  }
  function renderPickerList() {
    var m = document.getElementById('dk-modal');
    if (!m || !M) return;
    var l = m.querySelector('#dk-list');
    if (!l) return;
    if (M.loading) { l.innerHTML = '<div class="dk-empty"><span class="dk-spin"></span>Loading tokens…</div>'; return; }
    var list = filtered();
    if (!list.length) { l.innerHTML = '<div class="dk-empty">No tokens found.</div>'; return; }
    var h = '', last = null, grouped = M.side === 'destination' && M.chain === 'All';
    list.forEach(function (t) {
      var c = t.chainName || 'Other';
      if (grouped && c !== last) { h += '<div class="dk-sec">' + esc(c) + '</div>'; last = c; }
      var price = t.price ? '$' + (Number(t.price) >= 1 ? Number(t.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : Number(t.price).toPrecision(2)) : '';
      h += '<button class="dk-it" data-act="choose" data-i="' + M.tokens.indexOf(t) + '" data-testid="dk-token-' + esc(t.symbol) + '">' +
        coin(t.icon, t.symbol, 30, M.side === 'destination' ? chainIcon(c) : SOL_ICON) +
        '<span><div class="n">' + esc(t.name || t.symbol) + '</div><div class="s">' + esc(t.symbol) + '</div></span>' +
        '<span class="p">' + esc(price) + '<br>' + esc(c) + '</span></button>';
    });
    l.innerHTML = h;
  }

  /* ---------------- order modal ---------------- */
  var orderTimer = null;
  function openOrder(o) {
    closeModal();
    M = { kind: 'order', o: o };
    var m = document.createElement('div');
    m.id = 'dk-modal';
    m.setAttribute('data-testid', 'dk-order-modal');
    document.body.appendChild(m);
    m.addEventListener('mousedown', function (e) { if (e.target === m) closeModal(); });
    var h = '<div class="dk-mb" style="overflow-y:auto"><div class="dk-mh"><h3>Order created</h3><button class="dk-x" data-act="close">' + SV(IC.close, 20) + '</button></div>';
    h += '<div style="display:flex;justify-content:space-between;gap:8px;font-size:13px;color:#cfcfd4;margin:-4px 0 12px"><span>' + (o.method === 'privacy' ? 'Privacy swap · shielded' : 'Private route · best rate') + '</span><code style="font-family:Space Mono,monospace;font-size:11px;color:#8c8c8c;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" data-testid="dk-order-id">' + esc(o.id) + '</code></div>';
    h += '<div class="dk-pair"><div class="a">' + coin(o.sendIcon, o.sendSymbol, 26) + '<div>' + esc(fmt(o.amount)) + ' ' + esc(o.sendSymbol) + '<small>Solana</small></div></div>' + SV(IC.arrow, 16) +
      '<div class="a" style="text-align:right"><div>≈ ' + esc(fmt(o.outAmount)) + ' ' + esc(o.recvSymbol) + '<small>' + esc(o.networkName || '') + '</small></div>' + coin(o.recvIcon, o.recvSymbol, 26) + '</div></div>';
    if (o.expires) h += '<div class="dk-timer">Deposit within <b id="dk-cd">--:--</b> · send on Solana only.</div>';
    h += copyField('Send exactly', fmt(o.amount) + ' ' + o.sendSymbol);
    h += copyField('To this Solana deposit address', o.depositAddress || '');
    if (o.depositMemo) h += copyField('Deposit memo / tag (required)', o.depositMemo);
    h += '<div class="dk-cf"><div class="k">Receiving address</div><div class="v"><code>' + esc(o.addressTo || '') + '</code></div></div>';
    h += '<button class="dk-cta" data-act="trackorder" data-id="' + esc(o.id) + '" data-testid="dk-order-track">Track this order</button>';
    h += '<div class="dk-note">Live order via Darkinator. Only deposit from your own Solana wallet.</div></div>';
    m.innerHTML = h;
    clearInterval(orderTimer);
    if (o.expires) {
      var target = new Date(o.expires).getTime();
      var tick = function () {
        var cd = document.getElementById('dk-cd');
        if (!cd) { clearInterval(orderTimer); return; }
        var left = Math.max(0, target - Date.now());
        cd.textContent = Math.floor(left / 60000) + ':' + String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
      };
      tick();
      orderTimer = setInterval(tick, 1000);
    }
  }

  /* ---------------- events ---------------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-act]');
    if (!a || !(a.closest('#dk-view') || a.closest('#dk-modal'))) return;
    var act = a.getAttribute('data-act');
    e.preventDefault();
    if (act === 'go') { go(a.getAttribute('data-v')); }
    else if (act === 'pick') openPicker(a.getAttribute('data-side'));
    else if (act === 'refresh') { if (S.send && S.recv) fetchQuote(); }
    else if (act === 'route') { S.ri = +a.getAttribute('data-i'); render(); }
    else if (act === 'paste') {
      var f = a.getAttribute('data-f');
      if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) {
        if (t) { S[f] = t.trim(); render(); scheduleQuote(); }
      }).catch(function () {});
    }
    else if (act === 'submit') submit();
    else if (act === 'track') { var q = document.getElementById('dk-track-q'); doTrack(q ? q.value : S.track.q); }
    else if (act === 'recent') doTrack(a.getAttribute('data-id'));
    else if (act === 'close') closeModal();
    else if (act === 'chain') { M.chain = a.getAttribute('data-c'); renderPicker(false); }
    else if (act === 'choose') {
      var t = M && M.tokens[+a.getAttribute('data-i')];
      if (t) {
        if (M.side === 'source') S.send = t; else S.recv = t;
        S.routes = []; S.qerr = '';
        closeModal(); render(); scheduleQuote();
      }
    }
    else if (act === 'copy') {
      var v = a.getAttribute('data-v');
      if (navigator.clipboard) navigator.clipboard.writeText(v).catch(function () {});
      a.innerHTML = SV(IC.check, 16);
      setTimeout(function () { a.innerHTML = SV(IC.copy, 16); }, 1400);
    }
    else if (act === 'trackorder') { var id = a.getAttribute('data-id'); closeModal(); go('track/' + id); }
  }, true);

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || !t.id || !t.closest || !t.closest('#dk-view')) return;
    if (t.id === 'dk-amount') {
      var v = t.value.replace(/[^0-9.]/g, '');
      if (v !== t.value) t.value = v;
      S.amount = v; S.routes = S.routes.length ? S.routes : []; scheduleQuote();
      partial();
    } else if (t.id === 'dk-dest') { S.dest = t.value; scheduleQuote(); partial(); }
    else if (t.id === 'dk-refund') { S.refund = t.value; scheduleQuote(); partial(); }
    else if (t.id === 'dk-track-q') { S.track.q = t.value; }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('dk-modal')) closeModal();
    if (e.key === 'Enter' && e.target && e.target.id === 'dk-track-q') doTrack(e.target.value);
  }, true);

  // light refresh of the CTA while typing (keeps the caret in place)
  function partial() {
    var b = document.querySelector('#dk-view .dk-cta');
    if (!b) return;
    var c = cta();
    b.disabled = !c.ok;
    b.textContent = c.text;
  }

  /* ---------------- routing + shell integration ---------------- */
  function parse() {
    var h = location.hash || '';
    if (h === '#private-route') return { view: 'swap', method: 'private' };
    if (h === '#privacy-swap') return { view: 'swap', method: 'privacy' };
    if (h.indexOf('#track') === 0) return { view: 'track', id: decodeURIComponent(h.slice(7) || '') };
    return null;
  }
  function go(v) {
    if (('#' + v) !== location.hash) history.pushState(history.state, '', location.pathname + location.search + '#' + v);
    sync();
  }
  var lastKey = null;
  function sync() {
    var r = parse();
    var root = document.documentElement;
    var key = r ? r.view + ':' + (r.method || '') + ':' + (r.id || '') : null;
    if (!r) {
      if (root.classList.contains('dk-on')) root.classList.remove('dk-on');
      S.view = null; lastKey = null;
      markNav(null);
      return;
    }
    root.classList.add('dk-on');
    ensure();
    if (key === lastKey && viewEl() && viewEl().firstChild) return;
    lastKey = key;
    if (r.view === 'swap') {
      if (S.method !== r.method) { S.method = r.method; resetPair(); }
      S.view = 'swap';
      render();
      if (S.send && S.recv) scheduleQuote();
      if (!S.send) {
        var m0 = S.method;
        (m0 === 'privacy' ? api.nTokens('source', '') : api.tokens('source', '')).then(function (l) {
          if (S.method !== m0 || S.send) return;
          var sol = (l || []).find(function (t) { return t.symbol === 'SOL'; }) || (l || [])[0];
          if (sol) { S.send = sol; render(); }
        }).catch(function () {});
      }
    } else {
      S.view = 'track';
      render();
      if (r.id && r.id !== S.track.q) doTrack(r.id);
      else if (r.id && !S.track.searched) doTrack(r.id);
    }
    markNav(r.view === 'track' ? 'track' : r.method);
    try { var mn = document.querySelector('main.main'); if (mn) mn.scrollTop = 0; window.scrollTo(0, 0); } catch (e) {}
  }
  function markNav(which) {
    document.querySelectorAll('.dk-nav').forEach(function (b) {
      var k = b.getAttribute('data-dk');
      var on = k === which || (k === 'any' && !!which);
      b.classList.toggle('on', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }
  var NAV_ITEMS = [
    { k: 'private', label: 'Private route', hash: 'private-route', icon: IC.route },
    { k: 'privacy', label: 'Privacy swap', hash: 'privacy-swap', icon: IC.shield },
    { k: 'track', label: 'Track order', hash: 'track', icon: IC.track }
  ];
  function ensure() {
    injectCSS();
    var main = document.querySelector('main.main');
    if (main && !document.getElementById('dk-view')) {
      var v = document.createElement('div');
      v.id = 'dk-view';
      v.className = 'view';
      main.appendChild(v);
      if (S.view) render();
    }
    document.querySelectorAll('nav.side, nav.tabbar').forEach(function (nav) {
      if (nav.querySelector('.dk-nav')) return;
      var compact = nav.classList.contains('tabbar');
      var btns = Array.prototype.slice.call(nav.querySelectorAll('.nav-i'));
      if (!btns.length) return;
      var anchor = btns.find(function (b) { return /(Veil|Darkinator)Swap/.test(b.textContent); }) ||
                   btns.find(function (b) { return /Trade/.test(b.textContent); }) || btns[btns.length - 1];
      var frag = document.createDocumentFragment();
      (compact ? [{ k: 'any', label: 'Swaps', hash: 'private-route', icon: IC.route }] : NAV_ITEMS).forEach(function (it) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'nav-i dk-nav';
        b.setAttribute('data-dk', it.k);
        b.setAttribute('data-testid', (compact ? 'dk-tab-' : 'dk-nav-') + it.k);
        b.innerHTML = '<i data-ico="dk">' + SV(it.icon, 24) + '</i><span>' + it.label + '</span>';
        b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); go(it.hash); });
        frag.appendChild(b);
      });
      anchor.parentNode.insertBefore(frag, anchor.nextSibling);
      var r = parse();
      markNav(r ? (r.view === 'track' ? 'track' : r.method) : null);
    });
  }

  // leaving our views when any native nav item / in-app link is used
  document.addEventListener('click', function (e) {
    var n = e.target.closest && e.target.closest('.nav-i');
    if (n && !n.classList.contains('dk-nav') && document.documentElement.classList.contains('dk-on')) {
      if (parse()) history.replaceState(history.state, '', location.pathname + location.search);
      sync();
    }
  }, true);
  window.addEventListener('hashchange', sync);
  window.addEventListener('popstate', function () { setTimeout(sync, 0); });
  var lastHash = location.hash;
  setInterval(function () {
    if (location.hash !== lastHash) { lastHash = location.hash; sync(); }
    if (document.querySelector('main.main') && (!document.getElementById('dk-view') || !document.querySelector('nav.side .dk-nav'))) { ensure(); if (parse()) { lastKey = null; sync(); } }
  }, 400);

  function boot() { ensure(); sync(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
