import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ArrowDown, ClipboardPaste, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CoinIcon from './CoinIcon';
import TokenSelector from './TokenSelector';
import OrderModal from './OrderModal';
import {
  getTokens, getQuotes, createOrder,
  getNearTokens, getNearQuote, createNearOrder, saveLocalOrder,
} from '../api/api';

const METHODS = [
  { id: 'private', label: 'Private route', sub: 'Best live rate' },
  { id: 'privacy', label: 'Privacy swap', sub: 'Shielded settlement' },
  { id: 'zk', label: 'ZK Shield', sub: 'Powered by Veil', to: '/shield' },
];

const REFRESH_SECS = 60;

const fmt = (n) => {
  const x = Number(n);
  if (!isFinite(x) || x === 0) return '0';
  if (x >= 1000) return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (x >= 1) return x.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return x.toLocaleString(undefined, { maximumFractionDigits: 8 });
};

const usd = (n) => {
  const x = Number(n);
  if (!isFinite(x) || x <= 0) return null;
  return '$' + x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function MethodTabs({ method, setMethod }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-black/30 border border-white/5">
      {METHODS.map((m) => {
        const active = method === m.id;
        return (
          <button
            key={m.id}
            data-testid={`method-tab-${m.id}`}
            onClick={() => (m.to ? navigate(m.to) : setMethod(m.id))}
            className={`rounded-xl py-2.5 text-center transition-all ${
              active
                ? 'aurora-btn shadow-lg'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="text-sm font-semibold">{m.label}</div>
            <div className={`text-[0.68rem] ${active ? 'text-white/70' : 'text-white/35'}`}>{m.sub}</div>
          </button>
        );
      })}
    </div>
  );
}

function TokenButton({ token, onClick }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors"
    >
      {token ? (
        <>
          <CoinIcon src={token.icon} symbol={token.symbol} size={22} />
          <span className="text-sm font-medium max-w-[90px] truncate">{token.symbol}</span>
        </>
      ) : (
        <span className="text-sm text-white/70">Select</span>
      )}
      <ChevronDown className="h-4 w-4 text-white/50" />
    </button>
  );
}

export default function SwapCard() {
  const [method, setMethod] = useState('private');
  const [sendToken, setSendToken] = useState(null);
  const [recvToken, setRecvToken] = useState(null);
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [refund, setRefund] = useState('');

  const [routes, setRoutes] = useState([]);       // normalized route list
  const [routeIdx, setRouteIdx] = useState(0);
  const [quoting, setQuoting] = useState(false);
  const [quoteErr, setQuoteErr] = useState('');
  const [validUntil, setValidUntil] = useState(0); // ms timestamp for refresh countdown
  const [now, setNow] = useState(Date.now());

  const [selOpen, setSelOpen] = useState(false);
  const [selSide, setSelSide] = useState('source');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [order, setOrder] = useState(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const reqId = useRef(0);

  const isNear = method === 'privacy';
  const amt = parseFloat(amount);
  const validDest = destination.trim().length >= 20;
  const validRefund = refund.trim().length >= 20;
  const selected = routes[routeIdx] || null;

  // reset token-specific state when the method (token universe) changes
  useEffect(() => {
    setSendToken(null);
    setRecvToken(null);
    setRoutes([]);
    setRouteIdx(0);
    setQuoteErr('');
  }, [method]);

  const fetchSource = useCallback(
    (term) => (isNear ? getNearTokens('source', term) : getTokens('source', term)),
    [isNear]
  );
  const fetchDest = useCallback(
    (term) => (isNear ? getNearTokens('destination', term) : getTokens('destination', term)),
    [isNear]
  );

  const fetchQuote = useCallback(async () => {
    const amtNum = parseFloat(amount);
    const ready =
      sendToken && recvToken && amtNum > 0 &&
      (!isNear || (validDest && validRefund));
    if (!ready) {
      setRoutes([]);
      setQuoting(false);
      setQuoteErr('');
      return;
    }
    const id = ++reqId.current;
    setQuoting(true);
    setQuoteErr('');
    try {
      if (isNear) {
        const q = await getNearQuote({
          from: sendToken.id, to: recvToken.id, amount,
          recipient: destination.trim(), refundTo: refund.trim(),
        });
        if (id !== reqId.current) return;
        const out = parseFloat(q.amountOut);
        const r = {
          quoteId: q.quoteId,
          out,
          usdIn: amtNum * (sendToken.price || 0),
          usdOut: out * (recvToken.price || 0),
          etaMin: q.estimatedSeconds ? Math.max(1, Math.round(q.estimatedSeconds / 60)) : null,
          min: q.min, max: q.max,
        };
        setRoutes([r]);
        setRouteIdx(0);
        setValidUntil(q.validUntil ? new Date(q.validUntil).getTime() : Date.now() + REFRESH_SECS * 1000);
      } else {
        const quotes = await getQuotes({ amount, from: sendToken.id, to: recvToken.id });
        if (id !== reqId.current) return;
        if (!quotes || !quotes.length) {
          setRoutes([]);
          setQuoteErr('No route available for this pair. Try a different asset or amount.');
        } else {
          const sorted = [...quotes].sort((a, b) => b.amountOut - a.amountOut).slice(0, 6);
          const rs = sorted.map((q) => ({
            quoteId: q.quoteId,
            out: q.amountOut,
            usdIn: q.amountInUsd,
            usdOut: q.amountOutUsd,
            etaMin: q.duration ? Math.max(1, Math.round(q.duration)) : null,
            min: q.min, max: q.max,
          }));
          setRoutes(rs);
          setRouteIdx(0);
          setValidUntil(Date.now() + REFRESH_SECS * 1000);
        }
      }
    } catch (e) {
      if (id === reqId.current) { setRoutes([]); setQuoteErr(e.message); }
    } finally {
      if (id === reqId.current) setQuoting(false);
    }
  }, [sendToken, recvToken, amount, isNear, destination, refund, validDest, validRefund]);

  // debounced quote on input change
  useEffect(() => {
    const h = setTimeout(fetchQuote, 550);
    return () => clearTimeout(h);
  }, [fetchQuote]);

  // 1s ticker for the refresh countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const secsLeft = validUntil ? Math.max(0, Math.round((validUntil - now) / 1000)) : 0;

  // auto-refresh the quote when the countdown hits zero
  useEffect(() => {
    if (routes.length && secsLeft <= 0 && !quoting) fetchQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secsLeft]);

  const openSel = (side) => { setSelSide(side); setSelOpen(true); };

  const paste = async (setter) => {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt) setter(txt.trim());
    } catch { /* clipboard blocked */ }
  };

  const canReview = sendToken && recvToken && selected && validDest && (!isNear || validRefund) && !quoting && !submitting;

  let cta = 'Review swap';
  if (!sendToken) cta = 'Choose the asset you send';
  else if (!amt || amt <= 0) cta = 'Enter an amount';
  else if (!recvToken) cta = 'Pick an asset to receive';
  else if (isNear && !validRefund) cta = 'Enter your Solana refund address';
  else if (!validDest) cta = 'Enter a destination address';
  else if (quoteErr) cta = 'No quote — adjust and retry';
  else if (quoting || !selected) cta = 'Fetching quote…';

  const doReview = async () => {
    if (!canReview) return;
    setSubmitErr('');
    setSubmitting(true);
    try {
      let rec;
      if (isNear) {
        const rid = (crypto.randomUUID && crypto.randomUUID()) ||
          'req-' + Math.random().toString(16).slice(2);
        const o = await createNearOrder({ quoteId: selected.quoteId, requestId: rid });
        rec = {
          id: o.requestId, method, depositAddress: o.depositAddress,
          depositMemo: o.depositMemo || null, addressTo: o.recipient,
          amount: o.amountIn, sendSymbol: (o.from && o.from.symbol) || sendToken.symbol,
          outAmount: o.amountOut, recvSymbol: (o.to && o.to.symbol) || recvToken.symbol,
          networkName: (o.to && o.to.chainName) || recvToken.chainName,
          sendIcon: sendToken.icon, recvIcon: recvToken.icon,
          expires: o.deadline, eta: o.estimatedSeconds, createdAt: Date.now(),
        };
      } else {
        const o = await createOrder({ quoteId: selected.quoteId, addressTo: destination.trim() });
        rec = {
          id: o.houdiniId, method, depositAddress: o.depositAddress,
          depositMemo: null, addressTo: o.receiverAddress || destination.trim(),
          amount: o.inAmount, sendSymbol: o.inSymbol || sendToken.symbol,
          outAmount: o.outAmount, recvSymbol: recvToken.symbol,
          networkName: recvToken.chainName, sendIcon: sendToken.icon, recvIcon: recvToken.icon,
          expires: o.expires, eta: o.eta, createdAt: Date.now(),
        };
      }
      saveLocalOrder(rec);
      setOrder(rec);
      setOrderOpen(true);
    } catch (e) {
      setSubmitErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const usdIn = selected ? usd(selected.usdIn) : (sendToken && amt > 0 ? usd(amt * (sendToken.price || 0)) : null);

  return (
    <div className="swap-card rounded-3xl border border-white/10 p-4 sm:p-5">
      <MethodTabs method={method} setMethod={setMethod} />

      {/* You send */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/80">You send</span>
          <span className="text-xs text-white/40">On Solana</span>
        </div>
        <div className="glow-ring flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 transition-shadow">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            className="w-full bg-transparent text-2xl font-display font-medium outline-none placeholder:text-white/25"
          />
          <TokenButton token={sendToken} onClick={() => openSel('source')} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-white/45">
            {usdIn ? <>&asymp; {usdIn}</> : (sendToken ? sendToken.name : 'Pick a Solana asset')}
          </span>
          <span className="text-white/40">Min $3.00</span>
        </div>
      </div>

      {/* direction */}
      <div className="relative flex justify-center my-1">
        <div className="h-9 w-9 rounded-xl border border-white/10 bg-[#141020] flex items-center justify-center">
          <ArrowDown className="h-4 w-4 text-violet-300" />
        </div>
      </div>

      {/* You receive */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/80">
            You receive <span className="text-white/40 font-normal">(estimate)</span>
          </span>
          <span className="text-xs text-white/40">{recvToken ? recvToken.chainName : 'Any supported network'}</span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5">
          <div className="w-full text-2xl font-display font-medium overflow-hidden">
            {quoting && !selected ? (
              <span className="inline-flex items-center gap-2 text-white/40 text-lg">
                <Loader2 className="h-4 w-4 animate-spin" /> fetching…
              </span>
            ) : (
              <span className={selected ? 'text-white' : 'text-white/25'}>{selected ? fmt(selected.out) : '0.00'}</span>
            )}
          </div>
          <TokenButton token={recvToken} onClick={() => openSel('destination')} />
        </div>

        {/* rate + live */}
        <div className="flex items-center justify-between mt-2 text-xs gap-2">
          <span className="text-white/45 truncate">
            {selected && sendToken && recvToken && amt > 0
              ? <>1 {sendToken.symbol} &asymp; {fmt(selected.out / amt)} {recvToken.symbol}</>
              : (recvToken ? `${recvToken.name} on ${recvToken.chainName}` : 'Pick a network, then an asset')}
          </span>
          {selected && (
            <span className="inline-flex items-center gap-1.5 shrink-0 text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 animate-pulse" /> Live
            </span>
          )}
        </div>
      </div>

      {/* Route cards + details (parity with original) */}
      {selected && (
        <div className="mt-4 space-y-3">
          {routes.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {routes.map((r, i) => {
                const active = i === routeIdx;
                return (
                  <button
                    key={r.quoteId}
                    onClick={() => setRouteIdx(i)}
                    className={`shrink-0 rounded-xl border px-3.5 py-2 text-left transition-colors ${
                      active ? 'border-violet-400/60 bg-violet-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
                    }`}
                  >
                    <div className="text-[0.65rem] uppercase tracking-wider text-white/40">Route {i + 1}</div>
                    <div className="mt-0.5 font-mono text-sm">{fmt(r.out)} {recvToken.symbol}</div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
              <div className="text-[0.65rem] uppercase tracking-wider text-white/40">Route fee</div>
              <div className="mt-0.5 font-mono text-xs text-white/85">In final quote</div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
              <div className="text-[0.65rem] uppercase tracking-wider text-white/40">Expected time</div>
              <div className="mt-0.5 font-mono text-xs text-white/85">{selected.etaMin ? `~${selected.etaMin} min` : '—'}</div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
              <div className="text-[0.65rem] uppercase tracking-wider text-white/40">Quote</div>
              <div className="mt-0.5 font-mono text-xs text-white/85">
                {quoting ? 'refreshing…' : `New in ${secsLeft}s`}
              </div>
            </div>
          </div>

          {sendToken && selected.min != null && selected.max != null && (
            <p className="text-xs text-white/40">
              Limits {fmt(selected.min)}&ndash;{fmt(selected.max)} {sendToken.symbol}
            </p>
          )}
        </div>
      )}

      {/* Destination address */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/80">Destination address</span>
          <span className="text-xs text-white/40">{recvToken ? `${recvToken.symbol} on ${recvToken.chainName}` : 'Destination chain'}</span>
        </div>
        <div className="glow-ring flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-shadow">
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={recvToken ? `Your ${recvToken.chainName} receiving address` : 'Your receiving address'}
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
          />
          <button onClick={() => paste(setDestination)} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors">
            <ClipboardPaste className="h-3.5 w-3.5" /> Paste
          </button>
        </div>
        <p className="mt-2 text-xs text-white/40">Check the chain and address. Transfers cannot be reversed.</p>
      </div>

      {/* Refund address (NEAR only) */}
      {isNear && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">Refund address</span>
            <span className="text-xs text-white/40">Solana</span>
          </div>
          <div className="glow-ring flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-shadow">
            <input
              value={refund}
              onChange={(e) => setRefund(e.target.value)}
              placeholder="Your Solana refund address"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            />
            <button onClick={() => paste(setRefund)} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors">
              <ClipboardPaste className="h-3.5 w-3.5" /> Paste
            </button>
          </div>
          <p className="mt-2 text-xs text-white/40">Funds return here if the swap cannot complete.</p>
        </div>
      )}

      {(quoteErr || submitErr) && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-2.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{submitErr || quoteErr}</span>
        </div>
      )}

      <button
        onClick={doReview}
        disabled={!canReview}
        className={`mt-5 w-full rounded-2xl py-3.5 text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 ${
          canReview
            ? 'aurora-btn'
            : 'bg-white/5 text-white/40 cursor-not-allowed'
        }`}
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? 'Creating order…' : cta}
      </button>
      <p className="mt-3 text-center text-xs text-white/35">Creating an order moves no funds · live on-chain quotes</p>

      <TokenSelector
        open={selOpen}
        onOpenChange={setSelOpen}
        side={selSide}
        title={selSide === 'source' ? 'Select a Solana asset' : 'Select a network & asset'}
        fetchTokens={selSide === 'source' ? fetchSource : fetchDest}
        onSelect={(t) => (selSide === 'source' ? setSendToken(t) : setRecvToken(t))}
      />
      <OrderModal order={order} open={orderOpen} onOpenChange={setOrderOpen} />
    </div>
  );
}
