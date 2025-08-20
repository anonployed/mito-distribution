"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Stats = {
  totalUsers: number;
  totalOptionA: number;
  totalOptionB: number;
  totalOptionATokenAmount: number | string;
  totalOptionBTokenAmount: number | string;
  totalTokenSupplyAmount: number | string;
};

const REFRESH_MS = 5000;
const FLASH_MS = 1000;

export default function Page() {
  const [data, setData] = useState<Stats | null>(null);
  const [lastFetched, setLastFetched] = useState<string>("—");
  const [lastChanged, setLastChanged] = useState<string>("—");
  const lastRef = useRef<Partial<Record<string, number>>>({});
  const flashRef = useRef<Record<string, number>>({});

  const tokensTotal = useMemo(() => {
    if (!data) return 0;
    const a = +data.totalOptionATokenAmount;
    const b = +data.totalOptionBTokenAmount;
    return a + b;
  }, [data]);

  function changed(key: string, curr: number) {
    const prev = lastRef.current[key];
    lastRef.current[key] = curr;
    if (prev === undefined) return 0;
    const diff = curr - prev;
    if (diff !== 0) {
      flashRef.current[key] = Date.now() + FLASH_MS;
      setLastChanged(new Date().toLocaleTimeString());
    }
    return diff;
  }

  function cls(key: string) {
    const until = flashRef.current[key] ?? 0;
    if (Date.now() < until) {
      const diff = (lastRef.current[key] ?? 0) - (lastRef.current[key] ?? 0); // not used here
      // just keep class set by caller
    }
    return "";
  }

  useEffect(() => {
    let t: any;
    let raf: number;

    async function pull() {
      try {
        const r = await fetch(`/api/stats?_=${Date.now()}`, { cache: "no-store" });
        const j: Stats = await r.json();
        setData(j);
        setLastFetched(new Date().toLocaleTimeString());
      } catch (e) {
        console.error(e);
      }
    }

    // progress bar repaint
    const bar = document.getElementById("bar");
    let start = performance.now();
    const tick = (now: number) => {
      const pct = ((now - start) % REFRESH_MS) / REFRESH_MS * 100;
      if (bar) bar.style.width = `${pct.toFixed(0)}%`;
      if (now - start >= REFRESH_MS) start = now;
      raf = requestAnimationFrame(tick);
    };

    pull();
    t = setInterval(pull, REFRESH_MS);
    raf = requestAnimationFrame(tick);

    return () => { clearInterval(t); cancelAnimationFrame(raf); };
  }, []);

  // helpers
  const fmtInt = (n: number) => Number(n).toLocaleString();
  const fmt1 = (n: number) => Number(n).toFixed(1);
  const compact = (n: number) => {
    const a = Math.abs(n);
    if (a >= 1_000_000_000) return (n/1_000_000_000).toFixed(1)+"B";
    if (a >= 1_000_000) return (n/1_000_000).toFixed(1)+"M";
    if (a >= 1_000) return (n/1_000).toFixed(1)+"K";
    return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);
  };

  // values & flashes
  const val = (key: string, curr: number, pretty: (n:number)=>string) => {
    const prev = lastRef.current[key];
    const diff = changed(key, curr);
    const until = flashRef.current[key] ?? 0;
    const flashClass =
      prev !== undefined && Date.now() < until
        ? diff > 0 ? "flash-up" : diff < 0 ? "flash-down" : ""
        : "";
    return <span className={`value ${flashClass}`}>{pretty(curr)}</span>;
  };

  const u = data?.totalUsers ?? 0;
  const aU = data?.totalOptionA ?? 0;
  const bU = data?.totalOptionB ?? 0;
  const aT = +(data?.totalOptionATokenAmount ?? 0);
  const bT = +(data?.totalOptionBTokenAmount ?? 0);
  const supply = +(data?.totalTokenSupplyAmount ?? 0);

  const usersPctA = u ? (aU/u)*100 : 0;
  const usersPctB = u ? (bU/u)*100 : 0;
  const tokensPctA = tokensTotal ? (aT/tokensTotal)*100 : 0;
  const tokensPctB = tokensTotal ? (bT/tokensTotal)*100 : 0;
  const ratioUsersBA = aU ? bU/aU : 0;
  const ratioTokensBA = aT ? bT/aT : 0;

  return (
    <div className="wrap">
      <style jsx>{`
        .wrap{background:radial-gradient(1000px 600px at 10% -20%, #f7f7f7, #f0f0f0 40%, #e9e9e9);padding:24px;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,.08);max-width:1280px;margin:24px auto}
        .top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}
        .title{font-weight:900;font-size:22px;letter-spacing:-.02em}
        .label{font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin-bottom:8px}
        .sub{font-size:12px;opacity:.75;margin-top:6px}
        .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
        .card{background:#fff;border-radius:18px;padding:18px 16px;box-shadow:0 8px 20px rgba(0,0,0,.06)}
        .row-2{grid-column:span 2 / span 2}
        @media (max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.row-2{grid-column:span 2 / span 2}}
        @media (max-width:520px){.grid{grid-template-columns:1fr}}
        .value{font-weight:800;font-size:28px;line-height:1.1;letter-spacing:-.02em;transition:color .2s ease}
        .pill{display:inline-flex;align-items:center;gap:10px;font-size:11px;padding:6px 12px;border-radius:999px;background:rgba(0,0,0,.05)}
        .bar-wrap{width:260px;height:8px;background:rgba(0,0,0,.08);border-radius:999px;overflow:hidden}
        .bar{height:100%;width:0%;background:#111;transition:width .1s linear}
        .flash-up{color:#128a0a!important}
        .flash-down{color:#c91414!important}
      `}</style>

      <div className="top">
        <div>
          <div className="label">Mitosis Airdrop — Live</div>
          <div className="title">Overview</div>
          <div className="sub">Source: <code>https://airdrop.mitosis.org/api/register/stats</code></div>
          <div className="sub">Last fetched: {lastFetched} · Last change: {lastChanged}</div>
        </div>
        <div className="pill">
          <span>Live</span>
          <div className="bar-wrap"><div id="bar" className="bar" /></div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="label">Total Users</div>
          {val("totalUsers", u, fmtInt)}
          <div className="sub">A: {val("aUsers", aU, fmtInt)} · B: {val("bUsers", bU, fmtInt)}</div>
        </div>

        <div className="card">
          <div className="label">User Split</div>
          <div className="value">{val("usersPctA", +usersPctA.toFixed(1), fmt1)}% A · {val("usersPctB", +usersPctB.toFixed(1), fmt1)}% B</div>
          <div className="sub">B : A = <strong>{ratioUsersBA.toFixed(3)}</strong> : 1</div>
        </div>

        <div className="card row-2">
          <div className="label">Tokens (A + B)</div>
          <div className="value">{val("tokensTotal", tokensTotal, compact)} <span className="sub">(supply: {val("supply", supply, compact)})</span></div>
          <div className="sub">A: {val("aTok", aT, compact)} · B: {val("bTok", bT, compact)}</div>
          <div className="sub">Share → A: {val("tokensPctA", +tokensPctA.toFixed(1), fmt1)}% · B: {val("tokensPctB", +tokensPctB.toFixed(1), fmt1)}% | B : A = <strong>{ratioTokensBA.toFixed(3)}</strong> : 1</div>
        </div>

        <div className="card row-2">
          <div className="label">Raw</div>
          <div className="sub" style={{whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
            {data ? JSON.stringify(data, null, 2) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
