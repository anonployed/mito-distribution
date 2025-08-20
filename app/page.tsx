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
  const [lastFetched, setLastFetched] = useState("—");
  const [lastChanged, setLastChanged] = useState("—");
  const lastRef = useRef<Partial<Record<string, number>>>({});
  const flashRef = useRef<Record<string, number>>({});

  const tokensTotal = useMemo(() => {
    if (!data) return 0;
    return +data.totalOptionATokenAmount + +data.totalOptionBTokenAmount;
  }, [data]);

  useEffect(() => {
    let t: any, raf: number;

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

  const fmtInt = (n: number) => Number(n).toLocaleString();
  const compact = (n: number) => {
    const a = Math.abs(n);
    if (a >= 1_000_000_000) return (n/1_000_000_000).toFixed(1) + "B";
    if (a >= 1_000_000) return (n/1_000_000).toFixed(1) + "M";
    if (a >= 1_000) return (n/1_000).toFixed(1) + "K";
    return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);
  };

  const u   = data?.totalUsers ?? 0;
  const aU  = data?.totalOptionA ?? 0;
  const bU  = data?.totalOptionB ?? 0;
  const aT  = +(data?.totalOptionATokenAmount ?? 0);
  const bT  = +(data?.totalOptionBTokenAmount ?? 0);
  const sup = +(data?.totalTokenSupplyAmount ?? 0);

  const usersPctA   = u ? (aU/u)*100 : 0;
  const usersPctB   = u ? (bU/u)*100 : 0;
  const tokensPctA  = tokensTotal ? (aT/tokensTotal)*100 : 0;
  const tokensPctB  = tokensTotal ? (bT/tokensTotal)*100 : 0;
  const ratioUsers  = aU ? bU/aU : 0;
  const ratioTokens = aT ? bT/aT : 0;

  return (
    <div className="wrap">
      <style jsx>{`
        .wrap{display:flex;flex-direction:column;min-height:100vh;background:linear-gradient(180deg,#f9f8ff 0%,#f0efff 100%);padding:24px;}
        .content{flex:1;}
        .top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}
        .title{font-weight:900;font-size:22px;letter-spacing:-.02em;color:#333}
        .label{font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin-bottom:6px}
        .sub{font-size:12px;opacity:.75;margin-top:4px}
        .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        .card{background:#fff;border-radius:18px;padding:18px 16px;box-shadow:0 8px 20px rgba(0,0,0,.06)}
        @media (max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:520px){.grid{grid-template-columns:1fr}}
        .value{font-weight:800;font-size:28px;line-height:1.1;letter-spacing:-.02em;transition:color .2s ease}
        .pill{display:inline-flex;align-items:center;gap:10px;font-size:11px;padding:6px 12px;border-radius:999px;background:rgba(0,0,0,.05)}
        .bar-wrap{width:260px;height:8px;background:rgba(0,0,0,.08);border-radius:999px;overflow:hidden}
        .bar{height:100%;width:0%;background:#6b5dfc;transition:width .1s linear}
        .explain{margin-top:28px;padding:18px;background:linear-gradient(135deg,#faf9ff 0%,#f0f0ff 100%);border-radius:16px;box-shadow:0 6px 14px rgba(0,0,0,.05)}
        .explain h2{font-size:16px;font-weight:800;margin-bottom:6px}
        .explain h2.a{color:#6b5dfc}
        .explain h2.b{color:#3b82f6}
        .explain ul{margin:8px 0 0 18px;padding:0}
        .explain li{font-size:14px;line-height:1.5;color:#444;margin:6px 0}
        .conclusion{margin-top:16px;font-size:14px;font-weight:700;color:#222;padding:12px;background:#f7f6ff;border-left:4px solid #6b5dfc;border-radius:8px}
        footer{margin-top:28px;text-align:center;font-size:14px;color:#666;}
        footer a{color:#6b5dfc;text-decoration:none;font-weight:600;}
        footer a:hover{text-decoration:underline;}
      `}</style>

      <div className="content">
        <div className="top">
          <div>
            <div className="label">Mitosis Airdrop — Live</div>
            <div className="title">Overview</div>
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
            <div className="value">{fmtInt(u)}</div>
            <div className="sub">A: {fmtInt(aU)} · B: {fmtInt(bU)}</div>
          </div>

        <div className="card">
          <div className="label">User Split</div>
          <div className="value">{usersPctA.toFixed(1)}% A · {usersPctB.toFixed(1)}% B</div>
          <div className="sub">B : A = <strong>{ratioUsers.toFixed(3)}</strong> : 1</div>
        </div>

          <div className="card">
            <div className="label">Tokens (A + B)</div>
            <div className="value">{compact(tokensTotal)} <span className="sub">(supply: {compact(sup)})</span></div>
            <div className="sub">A: {compact(aT)} · B: {compact(bT)}</div>
            <div className="sub">Share → A: {tokensPctA.toFixed(1)}% · B: {tokensPctB.toFixed(1)}% | B : A = <strong>{ratioTokens.toFixed(3)}</strong> : 1</div>
          </div>
        </div>

        <div className="explain">
          <h2 className="a">Option A — Enhanced Rewards</h2>
          <ul>
            <li>Goal: max long-term value.</li>
            <li>~2.5× allocation via Bonus Pool.</li>
            <li>Receive <code>tMITO</code> (redeemable ≥ 1 MITO).</li>
            <li>Stake/swap/LP in the ecosystem.</li>
            <li>Instant claims expand the pool → A gains.</li>
          </ul>

          <h2 className="b">Option B — Instant Claim</h2>
          <ul>
            <li>Goal: instant liquidity.</li>
            <li>Full allocation now in MITO.</li>
            <li>No Bonus Pool upside.</li>
          </ul>

          <div className="conclusion">
            💡 80% A for upside, 20% B for liquidity.  
            Rule of thumb: if you need funds in &lt; 30 days → lean B; otherwise → A.  
            Edge: if the crowd piles into B (&gt;65% users), A gets relatively sweeter.
          </div>
        </div>
      </div>

      <footer>
        Made by <a href="https://x.com/anonployed" target="_blank" rel="noopener noreferrer">Anonployed</a>
      </footer>
    </div>
  );
}
