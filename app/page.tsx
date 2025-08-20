"use client";
import { useEffect, useRef, useState } from "react";

type Stats = {
  totalUsers: number;
  totalOptionA: number;
  totalOptionB: number;
  totalOptionATokenAmount: string | number;
  totalOptionBTokenAmount: string | number;
  totalTokenSupplyAmount: string | number;
};

const REFRESH_MS = 5000;
const DEADLINE_UTC =
  process.env.NEXT_PUBLIC_CLAIM_DEADLINE || "2025-08-25T00:00:00Z";

// helpers
const fmtInt = (n: number) => Number(n).toLocaleString();
const compact = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (a >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);
};

export default function Page() {
  const [data, setData] = useState<Stats | null>(null);
  const [lastFetched, setLastFetched] = useState("—");
  const [lastChanged, setLastChanged] = useState("—");

  // refs for live bar + timers
  const barRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const lastPayloadRef = useRef<string>("");

  // fetch loop + live progress bar
  useEffect(() => {
    let abort: AbortController | null = null;

    const tick = (now: number) => {
      if (startRef.current === 0) startRef.current = now;
      const elapsed = now - startRef.current;
      const pct = ((elapsed % REFRESH_MS) / REFRESH_MS) * 100;
      if (barRef.current) barRef.current.style.width = `${pct.toFixed(0)}%`;
      if (elapsed >= REFRESH_MS) startRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };

    const pull = async () => {
      try {
        // align the bar with each fetch start
        startRef.current = performance.now();

        abort?.abort();
        abort = new AbortController();
        const res = await fetch(`/api/stats?_=${Date.now()}`, {
          cache: "no-store",
          signal: abort.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j: Stats = await res.json();

        setData(j);
        const t = new Date().toLocaleTimeString();
        setLastFetched(t);

        const payload = JSON.stringify(j);
        if (payload !== lastPayloadRef.current) {
          lastPayloadRef.current = payload;
          setLastChanged(t);
        }
      } catch (e) {
        // keep ticking even on errors
        // eslint-disable-next-line no-console
        console.error("fetch error", e);
      }
    };

    pull();
    intervalRef.current = window.setInterval(pull, REFRESH_MS);
    rafRef.current = requestAnimationFrame(tick);

    // pause rAF when tab is hidden (saves battery)
    const onVis = () => {
      if (document.hidden) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      } else if (!rafRef.current) {
        startRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      abort?.abort();
    };
  }, []);

  // countdown
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0, s: 0, done: false });
  useEffect(() => {
    const target = new Date(DEADLINE_UTC).getTime();
    const update = () => {
      const now = Date.now();
      let diff = Math.max(0, target - now);
      const d = Math.floor(diff / 86_400_000);
      diff -= d * 86_400_000;
      const h = Math.floor(diff / 3_600_000);
      diff -= h * 3_600_000;
      const m = Math.floor(diff / 60_000);
      diff -= m * 60_000;
      const s = Math.floor(diff / 1000);
      setCd({ d, h, m, s, done: target <= now });
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="text-gray-500">Loading…</div>
      </main>
    );
  }

  const {
    totalUsers,
    totalOptionA,
    totalOptionB,
    totalOptionATokenAmount,
    totalOptionBTokenAmount,
    totalTokenSupplyAmount,
  } = data;

  const aTok = +totalOptionATokenAmount;
  const bTok = +totalOptionBTokenAmount;
  const tokTotal = aTok + bTok;

  const pctA = totalUsers ? ((totalOptionA / totalUsers) * 100).toFixed(1) : "0";
  const pctB = totalUsers ? ((totalOptionB / totalUsers) * 100).toFixed(1) : "0";
  const pctTokA = tokTotal ? ((aTok / tokTotal) * 100).toFixed(1) : "0";
  const pctTokB = tokTotal ? ((bTok / tokTotal) * 100).toFixed(1) : "0";

  // donut math
  const aPctNum = Number(pctA);
  const bPctNum = Number(pctB);
  const R = 54;
  const C = 2 * Math.PI * R;
  const dashA = (aPctNum / 100) * C;
  const dashB = (bPctNum / 100) * C;

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 p-6 flex flex-col">
      <style>{`
        .kard{background:#fff;border-radius:16px;box-shadow:0 8px 20px rgba(0,0,0,.06)}
        .clock{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
        .tile{display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:12px;padding:10px 8px;background:linear-gradient(180deg,#ffffff 0%,#f6f6ff 100%);border:1px solid rgba(107,93,252,.12)}
        .num{font-weight:900;font-size:22px;letter-spacing:.02em;color:#6b5dfc}
        .lbl{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#666;margin-top:4px}
        .bar-wrap{width:200px;height:6px;background:rgba(0,0,0,.08);border-radius:999px;overflow:hidden}
        .bar{height:100%;width:0%;background:#6b5dfc;transition:width .1s linear}
        @media (max-width:600px){.clock{grid-template-columns:repeat(2,minmax(0,1fr))}}
        /* donut chart */
        .donut { display:flex; align-items:center; gap:14px }
        .donut svg { width:120px; height:120px }
        .donut .track { fill:none; stroke:#e9e9ff; stroke-width:16 }
        .donut .seg { fill:none; stroke-width:16; transform:rotate(-90deg); transform-origin:70px 70px; transition:stroke-dasharray .4s ease }
        .donut .seg.a { stroke:#6b5dfc }
        .donut .seg.b { stroke:#3b82f6 }
        .legend { display:grid; gap:6px; font-size:12px; color:#555 }
        .legend .row { display:flex; align-items:center; gap:8px }
        .legend .dot { width:10px; height:10px; border-radius:999px }
        .legend .dot.a { background:#6b5dfc }
        .legend .dot.b { background:#3b82f6 }
      `}</style>

      <title>Mitosis Airdrop Distribution</title>
      <meta name="description" content="Live stats and countdown for Mitosis Airdrop" />

      <div className="mb-5">
        <h1 className="text-xl font-extrabold">MITOSIS AIRDROP DISTRIBUTION— LIVE</h1>
        <p className="text-xs text-gray-500">
          Last fetched: {lastFetched} · Last change: {lastChanged}
        </p>
      </div>

      {/* Countdown */}
      <div className="kard p-4 mb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm font-semibold text-gray-800">Claim closes in</div>
          <div className="inline-flex items-center gap-2 text-[11px] px-2.5 py-1 rounded-full bg-black/5">
            <span>Live</span>
            <div className="bar-wrap">
              <div id="bar" ref={barRef} className="bar"></div>
            </div>
          </div>
        </div>

        <div className="clock mt-3">
          <div className="tile"><div className="num">{String(cd.d).padStart(2, "0")}</div><div className="lbl">Days</div></div>
          <div className="tile"><div className="num">{String(cd.h).padStart(2, "0")}</div><div className="lbl">Hours</div></div>
          <div className="tile"><div className="num">{String(cd.m).padStart(2, "0")}</div><div className="lbl">Minutes</div></div>
          <div className="tile"><div className="num">{String(cd.s).padStart(2, "0")}</div><div className="lbl">Seconds</div></div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-2">
          Target (UTC): {new Date(DEADLINE_UTC).toUTCString()}
        </p>
        {cd.done && (
          <p className="text-center text-xs font-semibold text-red-600 mt-1">Claim window closed.</p>
        )}
      </div>

      {/* Top stats: 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="kard p-4">
          <div className="text-[11px] uppercase text-gray-500 mb-1">Total Users</div>
          <div className="text-xl font-bold">{fmtInt(totalUsers)}</div>
          <p className="text-[11px] text-gray-500">A: {fmtInt(totalOptionA)} · B: {fmtInt(totalOptionB)}</p>
        </div>

        {/* User Split donut */}
        <div className="kard p-4">
          <div className="text-[11px] uppercase text-gray-500 mb-1">User Split</div>
          <div className="donut relative">
            <svg viewBox="0 0 140 140" aria-label="User split donut">
              <circle className="track" cx="70" cy="70" r={R} />
              <circle className="seg a" cx="70" cy="70" r={R} strokeDasharray={`${dashA} ${C - dashA}`} strokeDashoffset={0}/>
              <circle className="seg b" cx="70" cy="70" r={R} strokeDasharray={`${dashB} ${C - dashB}`} strokeDashoffset={-dashA}/>
            </svg>
            <div className="legend">
              <div className="row"><span className="dot a"></span><span>A — {pctA}%</span></div>
              <div className="row"><span className="dot b"></span><span>B — {pctB}%</span></div>
              <div className="row text-gray-500">B : A = <strong className="ml-1">{totalOptionA ? (totalOptionB / totalOptionA).toFixed(3) : "—"}</strong> : 1</div>
            </div>
          </div>
        </div>

        <div className="kard p-4">
          <div className="text-[11px] uppercase text-gray-500 mb-1">Tokens (A + B)</div>
          <div className="text-xl font-bold">{compact(tokTotal)} <span className="text-[11px] text-gray-500"> (supply: {compact(+totalTokenSupplyAmount)})</span></div>
          <p className="text-[11px] text-gray-500">A: {compact(aTok)} · B: {compact(bTok)}</p>
          <p className="text-[11px] text-gray-500">Share → A: {pctTokA}% · B: {pctTokB}% | B : A = <strong>{aTok ? (bTok / aTok).toFixed(3) : "—"}</strong> : 1</p>
        </div>
      </div>

      {/* Options A & B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="kard p-4">
          <h2 className="font-bold text-indigo-600 mb-1">Option A — Enhanced Rewards</h2>
          <ul className="list-disc pl-5 text-[13px] text-gray-700 space-y-1">
            <li>Max long-term value</li>
            <li>~2.5× allocation via Bonus Pool</li>
            <li>Full allocation in tMITO (≥1 MITO)</li>
            <li>Stake / swap / LP in ecosystem</li>
            <li>Instant claims grow your pool</li>
          </ul>
        </div>
        <div className="kard p-4">
          <h2 className="font-bold text-blue-600 mb-1">Option B — Instant Claim</h2>
          <ul className="list-disc pl-5 text-[13px] text-gray-700 space-y-1">
            <li>Immediate liquidity</li>
            <li>Full allocation now in MITO</li>
            <li>No Bonus Pool upside</li>
          </ul>
        </div>
      </div>

      {/* Hint full width */}
      <div className="kard p-4 mb-6">
        <p className="text-[13px] text-gray-700">
          “The hope of gain has made many a man greedy.” — Cicero, On Duties I.83
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-auto text-center text-sm text-gray-500">
        Made by{" "}
        <a href="https://x.com/anonployed" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold hover:underline">
          Anonployed
        </a>
      </footer>
    </main>
  );
}
