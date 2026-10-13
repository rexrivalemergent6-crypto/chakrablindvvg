"""
Bifrost v1 — browser shim + Darkinator re-branding layer for the Veil mirror.

Veil's own client code still runs unmodified in the browser (wallet creation,
ZK proofs, RPC, relayer, indexer). This module only:
  * injects a shim that routes every network call through /api/bifrost/v1/*
  * keeps the URL bar on pretty paths (/shield, /shield/about, /shield/docs …)
  * swaps visible brand text / logos / colours to Darkinator
"""
import base64
from pathlib import Path

BRAND_DIR = Path(__file__).parent / "brand"
BRAND_NAME = "Darkinator"


def _b64(name: str) -> str:
    try:
        return base64.b64encode((BRAND_DIR / name).read_bytes()).decode()
    except Exception:
        return ""


def lockup_svg(light: bool = False) -> str:
    mark = _b64("mark-256.png")
    word = "#0b0917" if light else "#ffffff"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 560 128" width="560" height="128">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#c4b5fd"/><stop offset=".3" stop-color="#a78bfa"/>
<stop offset=".55" stop-color="#818cf8"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>
<linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6" stop-opacity=".55"/>
<stop offset="1" stop-color="#22d3ee" stop-opacity=".35"/></linearGradient></defs>
<rect x="6" y="6" width="116" height="116" rx="34" fill="url(#t)" opacity=".55"/>
<rect x="10" y="10" width="108" height="108" rx="32" fill="#07060c" stroke="#ffffff22" stroke-width="2"/>
<image href="data:image/png;base64,{mark}" xlink:href="data:image/png;base64,{mark}" x="22" y="22" width="84" height="84"/>
<text x="142" y="89" font-family="Sora, Inter, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="66" font-weight="800" letter-spacing="-2.5"><tspan fill="{word}">Dark</tspan><tspan fill="url(#g)">inator</tspan></text>
</svg>"""


BRAND_CSS = """
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
img[src*="_brand/lockup"]{object-fit:contain;filter:none!important;width:auto!important;max-width:none!important}
"""

_SHIM = r"""
(function(){
var P='__P__',R='__R__',T='__T__',PRETTY=T==='site'?'/shield/about':'/shield',BRAND='__BRAND__';
var ORIGIN=location.origin,BU=R+'_brand/';
try{if(!localStorage.getItem('veil-theme'))localStorage.setItem('veil-theme','dark');}catch(e){}
function LK(){return BU+(document.documentElement.getAttribute('data-theme')==='light'?'lockup-light.svg':'lockup.svg');}
function up(p){
  if(p.indexOf(R)===0)return p;
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
  if(p.indexOf(R+'app')===0)q='/shield'+p.slice((R+'app').length);
  else if(p.indexOf(R+'site')===0)q='/shield/about'+p.slice((R+'site').length);
  else if(p.indexOf('/shield')===0)q=p;
  else q=PRETTY+p;
  q=q.replace(/\/+$/,'')||'/';
  return q+x.search+x.hash;
}
var DBG={};try{DBG=JSON.parse(localStorage.getItem('bf-debug')||'{}')}catch(e){}
var hr=history.replaceState,hp=history.pushState;
if(!DBG.nopretty)try{hr.call(history,history.state,'',pretty(location.href));}catch(e){}
function hpatch(f){return function(s,t,u){if(u!=null){var pu=pretty(String(u));try{VBASE=vbaseFrom(new URL(pu,location.href).pathname);}catch(e){}u=pu;}return f.call(this,s,t,u);};}
if(!DBG.nopretty){history.pushState=hpatch(hp);history.replaceState=hpatch(hr);}
var of=window.fetch;if(of){window.fetch=function(i,o){try{
 if(typeof i==='string')i=fx(i);
 else if(i instanceof URL)i=fx(i.href);
 else if(i&&i.url){var n=fx(i.url);if(n!==i.url)i=new Request(n,i);}
}catch(e){}return of.call(this,i,o);};}
var xo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){
 arguments[1]=fx(typeof u==='string'?u:String(u));return xo.apply(this,arguments);};
var IMGMAP=[[/veil-lockup/i,BU+'lockup.svg'],[/veil-mark|ext-mark/i,BU+'mark.png'],[/favicon|apple-touch-icon/i,BU+'favicon.png']];
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

/* ---------- Darkinator branding ---------- */
var TXT=/veilit\.xyz|Veil/;
function rt(s){
 return s.replace(/app\.veilit\.xyz/g,location.host+'/shield')
  .replace(/(?:www\.)?veilit\.xyz/g,location.host)
  .replace(/(^|[^$A-Za-z])Veil/g,'$1'+BRAND);
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
  if(!b&&/^(veil|darkinator)$/i.test(el.getAttribute('alt')||''))b=LK();
  if(b&&s!==b&&s.indexOf(b)<0){sa.call(el,'src',b);el.removeAttribute('srcset');}
 }
}
function brandText(n){if(DBG.notext)return;if(n.parentNode&&(SKIPTAG[n.parentNode.nodeName]||n.parentNode.nodeName==='TITLE'))return;var v=n.nodeValue;if(v&&TXT.test(v)){var r=rt(v);if(r!==v)n.nodeValue=r;}}
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
 for(var i=0;i<ms.length;i++){var m=ms[i];
  if(m.type==='characterData')brandText(m.target);
  else if(m.type==='attributes'){if(m.attributeName==='data-theme'){var im=document.images;for(var k=0;k<im.length;k++)brandEl(im[k]);}else brandEl(m.target);}
  else for(var j=0;j<m.addedNodes.length;j++)walk(m.addedNodes[j]);}});
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


def head_inject(target: str, prefix: str) -> str:
    js = (_SHIM.replace("__P__", f"{prefix}/{target}")
          .replace("__R__", f"{prefix}/")
          .replace("__T__", target)
          .replace("__BRAND__", BRAND_NAME))
    return (
        f"<script>{js}</script>"
        '<link rel="preconnect" href="https://fonts.googleapis.com">'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&display=swap">'
        f"<style id=\"bifrost-brand\">{BRAND_CSS}</style>"
    )


def brand_asset(name: str):
    """Return (bytes, content_type) or None."""
    if name == "lockup.svg":
        return lockup_svg().encode(), "image/svg+xml"
    if name == "lockup-light.svg":
        return lockup_svg(True).encode(), "image/svg+xml"
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
