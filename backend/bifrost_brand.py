"""
Bifrost v1 — browser shim + Cadabra re-branding layer for the Veil mirror.

Veil's own client code still runs unmodified in the browser (wallet creation,
ZK proofs, RPC, relayer, indexer). This module only:
  * injects a shim that routes every network call through /api/bifrost/v1/*
  * keeps the URL bar on pretty paths (/shield, /shield/about, /shield/docs …)
  * swaps visible brand text / logos / colours to Cadabra
"""
import base64
import functools
from pathlib import Path

BRAND_DIR = Path(__file__).parent / "brand"
BRAND_NAME = "Cadabra"


def _b64(name: str) -> str:
    try:
        return base64.b64encode((BRAND_DIR / name).read_bytes()).decode()
    except Exception:
        return ""


@functools.lru_cache(maxsize=4)
def lockup_svg(light: bool = False) -> str:
    mark = _b64("mark-256.png")
    word = "#0b0917" if light else "#ffffff"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 456 128" width="456" height="128">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#c4b5fd"/><stop offset=".45" stop-color="#a78bfa"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>
<image href="data:image/png;base64,{mark}" xlink:href="data:image/png;base64,{mark}" x="0" y="4" width="120" height="120"/>
<text x="134" y="88" font-family="Sora, Inter, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="66" font-weight="800" letter-spacing="-2"><tspan fill="{word}">Cada</tspan><tspan fill="url(#g)">bra</tspan></text>
</svg>"""


BRAND_CSS = """
/* project token removed: only swap tokens remain */
/* third-party / upstream brand surfaces removed (extension promo, audit badges, upstream socials) */
a.xc,.xc,a[href*="chromewebstore.google.com"],a[href*="x.com/veil"],a[href*="twitter.com/veil"],
a[href*="t.me/veil"],a[href*="github.com/veil"],a[href*="@veilit.xyz"],.foot-audit,.batch-tag[href*="contractwolf.io"],
img[src*="audit-contractwolf"],li:has(> a[href*="contractwolf.io"]),#extension,.ext-soon,.ext-get,
section#developers,a[href="#developers"],a[href$="docs#developers"],a[href="#extension"]{display:none!important}
a[href*="contractwolf.io"]{pointer-events:none!important;color:inherit!important;text-decoration:none!important}
.omark,.tk,.foot-ca,[data-copy="HgTGdc29D5bDMrDvsCLnorxz899VyDj7ZN7FPa6vpump"]{display:none!important}
html:root{
 --veil:#a78bfa;--veil-hi:#ddd6fe;--veil-deep:#7c3aed;--veil-wash:rgba(167,139,250,.1);
 --veil-rgb:167,139,250;--veil-hi-rgb:221,214,254;--veil-deep-rgb:124,58,237;
 --hero-a:#ffffff;--hero-b:#a78bfa;--hero-c:#22d3ee;
 --ink:#07060c;
}
h1,h2,h3,.hero h1,.display,.hb-amt,.big{font-family:'Sora','Inter',ui-sans-serif,system-ui,sans-serif!important;letter-spacing:-.02em}
::selection{background:rgba(139,92,246,.45)}
html:not(.bf-ready) body{opacity:0}
html.bf-ready body{opacity:1;transition:opacity .18s ease}
img[src*="_brand/lockup"]{object-fit:contain;height:26px!important;filter:none!important;width:auto!important;max-width:none!important}
"""

_SHIM = r"""
(function(){
var P='__P__',R='__R__',T='__T__',PRETTY=T==='site'?'/shield/about':'/shield',BRAND='__BRAND__';
var ORIGIN=location.origin,BU=R+'_brand/';
try{if(!localStorage.getItem('veil-theme'))localStorage.setItem('veil-theme','dark');}catch(e){}
function isLight(){var th=document.documentElement.getAttribute('data-theme');if(th==='light')return true;if(th==='dark')return false;
 try{var els=[document.body,document.documentElement];for(var i=0;i<els.length;i++){if(!els[i])continue;var c=getComputedStyle(els[i]).backgroundColor;var m=c&&c.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[, /]+([\d.]+))?/);
 if(m&&(m[4]===undefined||parseFloat(m[4])>0.05)){return (0.2126*m[1]+0.7152*m[2]+0.0722*m[3])/255>0.55;}}}catch(e){}return false;}
function LK(){return BU+(isLight()?'lockup-light.svg':'lockup.svg');}
function up(p){
  if(p.indexOf(R)===0)return p;
  if(p==='/about'||p.indexOf('/about/')===0)return R+'site'+(p.slice(6)||'/');
  if(p==='/app'||p.indexOf('/app/')===0)return R+'app'+(p.slice(4)||'/');
  if(p==='/shield/about'||p.indexOf('/shield/about/')===0)return R+'site'+(p.slice(13)||'/');
  if(p==='/shield'||p.indexOf('/shield/')===0)return R+'app'+(p.slice(7)||'/');
  return P+p;
}
function vbaseFrom(pathname){return ORIGIN+(pathname.indexOf(R)===0?pathname:up(pathname));}
var VBASE=vbaseFrom(location.pathname)+location.search;
self.TURBOPACK_CHUNK_BASE_PATH=P+'/_next/';
var SKIP=/^(data:|blob:|javascript:|mailto:|about:|tel:|#)/i;
function fx(u){
  if(typeof u!=='string'||!u||SKIP.test(u))return u;
  var x;try{x=new URL(u,VBASE);}catch(e){return u;}
  if(x.origin!==ORIGIN)return u;
  return up(x.pathname)+x.search+x.hash;
}
function pretty(u){
  var x;try{x=new URL(String(u),location.href);}catch(e){return u;}
  if(x.origin!==ORIGIN)return u;
  var p=x.pathname,q;
  if(p.indexOf(R+'app')===0)q='/app'+p.slice((R+'app').length);
  else if(p.indexOf(R+'site')===0)q='/about'+p.slice((R+'site').length);
  else if(p.indexOf('/shield/about')===0)q='/about'+p.slice(13);
  else if(p.indexOf('/shield')===0)q='/app'+p.slice(7);
  else if(p==='/app'||p.indexOf('/app/')===0||p==='/about'||p.indexOf('/about/')===0)q=p;
  else q=(T==='site'?'/about':'/app')+p;
  q=q.replace(/\/+$/,'')||'/';
  return q+x.search+x.hash;
}
try{if(T==='site'){location.replace('/');}
 else{var sub=(function(){var lp=location.pathname;if(lp.indexOf(P)===0)return lp.slice(P.length)||'/';if(lp.indexOf('/app')===0)return lp.slice(4)||'/';return lp;})();if(/^\/(docs|security|launch|compliance|privacy|terms)(\/|$)/.test(sub)){location.replace(/^\/security/.test(sub)?'/#zk':'/#tech');}}}catch(e){}
var DBG={};try{DBG=JSON.parse(localStorage.getItem('bf-debug')||'{}')}catch(e){}
var hr=history.replaceState,hp=history.pushState;
if(!DBG.nopretty)try{hr.call(history,history.state,'',pretty(location.href));}catch(e){}
function hpatch(f){return function(s,t,u){if(u!=null){var pu=pretty(String(u));try{VBASE=vbaseFrom(new URL(pu,location.href).pathname);}catch(e){}u=pu;}return f.call(this,s,t,u);};}
if(!DBG.nopretty){history.pushState=hpatch(hp);history.replaceState=hpatch(hr);}
var of=window.fetch;window.__bfFetch=of&&of.bind(window);if(of){window.fetch=function(i,o){try{
 if(typeof i==='string')i=fx(i);
 else if(i instanceof URL)i=fx(i.href);
 else if(i&&i.url){var n=fx(i.url);if(n!==i.url)i=new Request(n,i);}
}catch(e){}return of.call(this,i,o);};}
var xo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){
 arguments[1]=fx(typeof u==='string'?u:String(u));return xo.apply(this,arguments);};
var IMGMAP=[[/veil-lockup/i,BU+'lockup.svg'],[/veil-mark|ext-mark|\/icons\/icon-\d+|\/icons\/apple|veil-wallet|\/wallets\/veil/i,BU+'mark.png'],[/favicon|apple-touch-icon/i,BU+'favicon.png']];
function bimg(v){if(typeof v!=='string')return null;if(/veil-lockup|_brand\/lockup/i.test(v))return LK();for(var i=0;i<IMGMAP.length;i++){if(IMGMAP[i][0].test(v))return IMGMAP[i][1];}return null;}
var AT={src:1,href:1,srcset:1,action:1,poster:1,'xlink:href':1};
function fs(v){return String(v).split(',').map(function(p){var t=p.trim();var i=t.indexOf(' ');var u=i<0?t:t.slice(0,i);return (p.match(/^\s*/)[0])+fx(u)+(i<0?'':t.slice(i));}).join(',');}
function mapAttr(el,k,v){
 if(k==='src'&&el&&el.tagName==='IMG'){var b=bimg(v);if(b)return b;}
 return k==='srcset'?fs(v):fx(v);
}
var sa=Element.prototype.setAttribute;
Element.prototype.setAttribute=function(n,v){try{var k=String(n).toLowerCase();
 if(AT[k]&&typeof v==='string'){v=mapAttr(this,k,v);}}catch(e){}return sa.call(this,n,v);};
[[window.HTMLImageElement,'src'],[window.HTMLImageElement,'srcset'],[window.HTMLScriptElement,'src'],[window.HTMLLinkElement,'href'],
 [window.HTMLSourceElement,'src'],[window.HTMLSourceElement,'srcset'],[window.HTMLIFrameElement,'src'],[window.HTMLMediaElement,'src'],
 [window.HTMLFormElement,'action'],[window.HTMLAnchorElement,'href']].forEach(function(c){try{var pr=c[0].prototype;
 var d=Object.getOwnPropertyDescriptor(pr,c[1]);if(!d||!d.set)return;
 Object.defineProperty(pr,c[1],{configurable:true,enumerable:d.enumerable,get:d.get,
  set:function(v){d.set.call(this,mapAttr(this,c[1],String(v)));}});}catch(e){}});
try{var W=window.Worker;window.Worker=function(u,o){return new W(fx(typeof u==='string'?u:String(u)),o);};window.Worker.prototype=W.prototype;}catch(e){}
try{var SW=window.SharedWorker;if(SW){window.SharedWorker=function(u,o){return new SW(fx(typeof u==='string'?u:String(u)),o);};window.SharedWorker.prototype=SW.prototype;}}catch(e){}
try{if(navigator.serviceWorker){navigator.serviceWorker.register=function(){return new Promise(function(){});};}}catch(e){}
var es=window.EventSource;if(es){window.EventSource=function(u,o){return new es(fx(String(u)),o);};window.EventSource.prototype=es.prototype;}
var WS=window.WebSocket;window.WebSocket=function(u,p){try{var x=new URL(String(u),location.href);
 if(x.host===location.host&&x.pathname.indexOf(R)!==0){x.pathname=up(x.pathname);}u=x.href;}catch(e){}
 return p===undefined?new WS(u):new WS(u,p);};
window.WebSocket.prototype=WS.prototype;['CONNECTING','OPEN','CLOSING','CLOSED'].forEach(function(k){window.WebSocket[k]=WS[k];});
var wo=window.open;window.open=function(u){if(typeof u==='string')arguments[0]=fx(u);return wo.apply(this,arguments);};
document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');
 if(!a)return;var h=a.getAttribute('href');if(!h||SKIP.test(h))return;var n=fx(h);if(n!==h)a.setAttribute('href',n);},true);

/* ---------- Cadabra branding ---------- */
var TXT=/veilit\.xyz|Veil|ContractWolf|Jupiter|veil-core|(^|[^$A-Za-z0-9_\/.:@-])veil(?![A-Za-z0-9_-])/;
function rt(s){
 return s.replace(/app\.veilit\.xyz/g,location.host+'/shield')
  .replace(/(?:www\.)?veilit\.xyz/g,location.host)
  .replace(/Audited by ContractWolf/g,'Independently audited')
  .replace(/External audit · ContractWolf/g,'External audit')
  .replace(/its audit by ContractWolf/g,'its independent audit')
  .replace(/ContractWolf · /g,'Independent audit · ')
  .replace(/ContractWolf/g,'an independent auditor')
  .replace(/veil-core/g,BRAND.toLowerCase()+'-core')
  .replace(/Jupiter Lend Earn/g,'Lending vault').replace(/Jupiter/g,'Aggregator')
  .replace(/(^|[^$A-Za-z])Veil/g,'$1'+BRAND)
  .replace(/(^|[^$A-Za-z0-9_\/.:@-])veil(?![A-Za-z0-9_-])/g,'$1'+BRAND.toLowerCase());
}
var SKIPTAG={SCRIPT:1,STYLE:1,NOSCRIPT:1,TEXTAREA:1,INPUT:1,TEMPLATE:1};
var BATTR=['title','aria-label','placeholder','alt','data-tip','data-title'];
function brandEl(el){
 if(DBG.noel)return;
 if(el.tagName==='META'||el.tagName==='LINK'||el.tagName==='TITLE'||el.tagName==='HEAD')return;
 for(var i=0;i<BATTR.length;i++){var v=el.getAttribute&&el.getAttribute(BATTR[i]);if(v&&TXT.test(v)){var nv=rt(v);if(nv!==v)sa.call(el,BATTR[i],nv);}}
 if(el.tagName==='IMG'){
  var s=el.getAttribute('src')||'';var b=bimg(s);
  if(!b&&el.closest&&el.closest('a.brand,.brand'))b=LK();
  if(!b&&/^(veil|darkinator|cadabra)$/i.test(el.getAttribute('alt')||''))b=LK();
  if(b&&s!==b&&s.indexOf(b)<0){sa.call(el,'src',b);el.removeAttribute('srcset');}
 }
}
var PARA=__PARA__;
function brandText(n){if(DBG.notext)return;if(n.parentNode&&(SKIPTAG[n.parentNode.nodeName]||n.parentNode.nodeName==='TITLE'))return;var v=n.nodeValue;if(!v)return;var r=TXT.test(v)?rt(v):v;var tr=r.trim();if(tr&&PARA.hasOwnProperty(tr)){r=r.replace(tr,PARA[tr]);}if(r!==v)n.nodeValue=r;}
function walk(root){
 if(!root)return;
 if(root.nodeType===3){brandText(root);return;}
 if(root.nodeType!==1&&root.nodeType!==9)return;
 if(root.nodeType===1){if(SKIPTAG[root.nodeName])return;brandEl(root);}
 var w=document.createTreeWalker(root,5,null),n;
 while((n=w.nextNode())){if(n.nodeType===3)brandText(n);else if(!SKIPTAG[n.nodeName])brandEl(n);}
}
var started=false;
function start(){
 if(started)return;started=true;
 if(DBG.nobrand){document.documentElement.classList.add('bf-ready');return;}
 walk(document.documentElement);
 try{var fl=document.createElement('link');sa.call(fl,'rel','icon');sa.call(fl,'href',BU+'favicon.png');sa.call(fl,'id','bf-icon');document.head.appendChild(fl);}catch(e){}
 var syncTitle=function(){var t=document.title;if(t&&TXT.test(t)){var nt=rt(t);if(nt!==t)document.title=nt;}};
 syncTitle();setInterval(syncTitle,800);
 var CNT=0;window.__bft={};
 var mo=new MutationObserver(function(ms){if(DBG.trace){CNT+=ms.length;for(var z=0;z<Math.min(ms.length,20);z++){var mz=ms[z];var kk=mz.type+'|'+(mz.attributeName||'')+'|'+(mz.target.nodeName||'')+'|'+String(mz.target.nodeValue||(mz.target.getAttribute&&mz.target.getAttribute(mz.attributeName||'class'))||'').slice(0,50);window.__bft[kk]=(window.__bft[kk]||0)+1;}if(CNT>20000){mo.disconnect();localStorage.setItem('bf-trace',JSON.stringify(Object.entries(window.__bft).sort(function(a,b){return b[1]-a[1]}).slice(0,15)));return;}}
 QQ.push.apply(QQ,ms);if(!QS){QS=1;(window.requestAnimationFrame||setTimeout)(flushQ);}});
 var QQ=[],QS=0;function flushQ(){QS=0;var ms=QQ;QQ=[];
 for(var i=0;i<ms.length;i++){var m=ms[i];
  if(m.type==='characterData')brandText(m.target);
  else if(m.type==='attributes'){if(m.attributeName==='data-theme'){var im=document.images;for(var k=0;k<im.length;k++)brandEl(im[k]);}else brandEl(m.target);}
  else for(var j=0;j<m.addedNodes.length;j++)walk(m.addedNodes[j]);}}
 mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['src','href','title','aria-label','placeholder','alt','content','data-theme']});
 document.documentElement.classList.add('bf-ready');
}
if(T==='site'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
}else{
 var go=function(){setTimeout(start,60);};
 if(document.readyState==='complete')go();else window.addEventListener('load',go);
}
setTimeout(start,7000);
})();
"""


NAV_LABELS = {
    "Home": "Overview", "Shield": "Vanish", "Trade": "Swap", "CadabraSwap": "Bridge out",
    "Send": "Pay", "Receive": "Request", "Withdraw": "Cash out", "Earn": "Yield",
    "Invite": "Referrals", "Addresses": "Burner addresses", "Activity": "History", "Keys": "Vault & keys",
    "More": "More",
}


@functools.lru_cache(maxsize=1)
def _para_json() -> str:
    import json as _j
    try:
        d = _j.loads((BRAND_DIR / "paraphrase.json").read_text())
    except Exception:
        d = {}
    d.update(NAV_LABELS)
    return _j.dumps(d, ensure_ascii=False).replace("</", "<\\/")


def head_inject(target: str, prefix: str) -> str:
    js = (_SHIM.replace("__P__", f"{prefix}/{target}")
          .replace("__R__", f"{prefix}/")
          .replace("__T__", target)
          .replace("__BRAND__", BRAND_NAME)
          .replace("__PARA__", _para_json()))
    return (
        f"<script>{js}</script>"
        '<link rel="preconnect" href="https://fonts.googleapis.com">'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&display=swap">'
        f"<style id=\"bifrost-brand\">{BRAND_CSS}</style>"
        + (f'<script src="{prefix}/_brand/dk-swap.js" defer></script>' if target == "app" else "")
    )


def brand_asset(name: str):
    """Return (bytes, content_type) or None."""
    if name == "lockup.svg":
        return lockup_svg().encode(), "image/svg+xml"
    if name == "lockup-light.svg":
        return lockup_svg(True).encode(), "image/svg+xml"
    if name == "dk-swap.js":
        try:
            return (BRAND_DIR / "dk-swap.js").read_bytes(), "application/javascript; charset=utf-8"
        except Exception:
            return None
    if name == "mark.png":
        p = BRAND_DIR / "mark-256.png"
    elif name == "favicon.png":
        p = BRAND_DIR / "favicon-192.png"
    else:
        return None
    try:
        return p.read_bytes(), "image/png"
    except Exception:
        return None
