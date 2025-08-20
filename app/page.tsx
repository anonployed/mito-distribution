"use client";
import { useEffect, useState } from "react";

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

  // fetch loop + live progress bar
  useEffect(() => {
    let interval: number;
    let raf = 0;
    const bar = document.getElementById("bar");
    let start = performance.now();

    const tick = (now: number) => {
      const pct = ((now - start) % REFRESH_MS) / REFRESH_MS * 100;
      if (bar) bar.style.width = `${pct.toFixed(0)}%`;
      if (now - start >= REFRESH_MS) start = now;
      raf = requestAnimationFrame(tick);
    };

    const pull = async () => {
      try {
        const res = await fetch(`/api/stats?_=${Date.now()}`, { cache: "no-store" });
        const j: Stats = await res.json();
        setData(j);
        const t = new Date().toLocaleTimeString();
        setLastFetched(t);
        setLastChanged(t); // simple; replace with diff logic if needed
      } catch (e) {
        console.error("fetch error", e);
      }
    };

    pull();
    interval = window.setInterval(pull, REFRESH_MS);
    raf = requestAnimationFrame(tick);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(raf);
    };
  }, []);

  // countdown (smaller UI)
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
      `}</style>

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-extrabold">MITOSIS AIRDROP — LIVE
</h1>
        <p className="text-xs text-gray-500">
          Last fetched: {lastFetched} · Last change: {lastChanged}
        </p>
      </div>

      {/* Countdown (smaller) */}
      <div className="kard p-4 mb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm font-semibold text-gray-800">Claim closes in</div>
          <div className="inline-flex items-center gap-2 text-[11px] px-2.5 py-1 rounded-full bg-black/5">
            <span>Live</span>
            <div className="bar-wrap"><div id="bar" className="bar"></div></div>
          </div>
        </div>

        <div className="clock mt-3">
          <div className="tile">
            <div className="num">{String(cd.d).padStart(2, "0")}</div>
            <div className="lbl">Days</div>
          </div>
          <div className="tile">
            <div className="num">{String(cd.h).padStart(2, "0")}</div>
            <div className="lbl">Hours</div>
          </div>
          <div className="tile">
            <div className="num">{String(cd.m).padStart(2, "0")}</div>
            <div className="lbl">Minutes</div>
          </div>
          <div className="tile">
            <div className="num">{String(cd.s).padStart(2, "0")}</div>
            <div className="lbl">Seconds</div>
          </div>
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
          <p className="text-[11px] text-gray-500">
            A: {fmtInt(totalOptionA)} · B: {fmtInt(totalOptionB)}
          </p>
        </div>
        <div className="kard p-4">
          <div className="text-[11px] uppercase text-gray-500 mb-1">User Split</div>
          <div className="text-xl font-bold">
            {pctA}% A · {pctB}% B
          </div>
          <p className="text-[11px] text-gray-500">
            B : A = <strong>{totalOptionA ? (totalOptionB / totalOptionA).toFixed(3) : "—"}</strong> : 1
          </p>
        </div>
        <div className="kard p-4">
          <div className="text-[11px] uppercase text-gray-500 mb-1">Tokens (A + B)</div>
          <div className="text-xl font-bold">
            {compact(tokTotal)}{" "}
            <span className="text-[11px] text-gray-500"> (supply: {compact(+totalTokenSupplyAmount)})</span>
          </div>
          <p className="text-[11px] text-gray-500">A: {compact(aTok)} · B: {compact(bTok)}</p>
          <p className="text-[11px] text-gray-500">
            Share → A: {pctTokA}% · B: {pctTokB}% | B : A = <strong>{aTok ? (bTok / aTok).toFixed(3) : "—"}</strong> : 1
          </p>
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
        <h2 className="font-bold text-gray-800 mb-1">Hint</h2>
        <p className="text-[13px] text-gray-700">
          💡 It is not the man who has too little, but the man who craves more, that is poor.
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-auto text-center text-sm text-gray-500">
        Made by{" "}
        <a
          href="https://x.com/anonployed"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 font-semibold hover:underline"
        >
          Anonployed
        </a>
      </footer>
    </main>
  );
}
