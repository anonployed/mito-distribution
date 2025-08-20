"use client";
import { useEffect, useState } from "react";

type Stats = {
  totalUsers: number;
  totalOptionA: number;
  totalOptionB: number;
  totalOptionATokenAmount: string;
  totalOptionBTokenAmount: string;
  totalTokenSupplyAmount: string;
};

export default function Page() {
  const [data, setData] = useState<Stats | null>(null);
  const [lastFetched, setLastFetched] = useState<string>("—");
  const [lastChanged, setLastChanged] = useState<string>("—");

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats?_=" + Date.now(), { cache: "no-store" });
      const json: Stats = await res.json();
      setData(json);
      setLastFetched(new Date().toLocaleTimeString());
      setLastChanged(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("fetch error", e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="text-gray-500">Loading…</div>
      </main>
    );
  }

  const { totalUsers, totalOptionA, totalOptionB, totalOptionATokenAmount, totalOptionBTokenAmount, totalTokenSupplyAmount } = data;

  const pctA = totalUsers ? ((totalOptionA / totalUsers) * 100).toFixed(1) : "0";
  const pctB = totalUsers ? ((totalOptionB / totalUsers) * 100).toFixed(1) : "0";
  const tokensA = parseFloat(totalOptionATokenAmount);
  const tokensB = parseFloat(totalOptionBTokenAmount);
  const tokenTotal = tokensA + tokensB;
  const pctTokA = tokenTotal ? ((tokensA / tokenTotal) * 100).toFixed(1) : "0";
  const pctTokB = tokenTotal ? ((tokensB / tokenTotal) * 100).toFixed(1) : "0";

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 p-6 flex flex-col">
      <div className="mb-6">
        <div className="uppercase tracking-wide text-sm text-gray-500">Mitosis Airdrop — Live</div>
        <h1 className="text-2xl font-extrabold">Overview</h1>
        <p className="text-sm text-gray-500">
          Last fetched: {lastFetched} · Last change: {lastChanged}
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">Total Users</div>
          <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
          <p className="text-xs text-gray-500">
            A: {totalOptionA.toLocaleString()} · B: {totalOptionB.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">User Split</div>
          <div className="text-2xl font-bold">
            {pctA}% A · {pctB}% B
          </div>
          <p className="text-xs text-gray-500">B:A ratio → {(totalOptionA ? (totalOptionB / totalOptionA).toFixed(2) : "—")} : 1</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">Tokens</div>
          <div className="text-2xl font-bold">{tokenTotal.toLocaleString()}</div>
          <p className="text-xs text-gray-500">supply: {parseFloat(totalTokenSupplyAmount).toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            A: {tokensA.toLocaleString()} · B: {tokensB.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            Share → A: {pctTokA}% · B: {pctTokB}%
          </p>
        </div>
      </div>

      {/* Options A and B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-bold text-indigo-600 mb-2">Option A — Enhanced Rewards</h2>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Max long-term value</li>
            <li>~2.5× allocation via Bonus Pool</li>
            <li>Full allocation in tMITO (≥1 MITO)</li>
            <li>Stake / swap / LP in ecosystem</li>
            <li>Instant claims grow your pool</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-bold text-blue-600 mb-2">Option B — Instant Claim</h2>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Immediate liquidity</li>
            <li>Full allocation now in MITO</li>
            <li>No Bonus Pool upside</li>
          </ul>
        </div>
      </div>

      {/* Hint */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="font-bold text-gray-800 mb-2">Hint</h2>
        <p className="text-sm text-gray-700">
          💡 80% A (upside), 20% B (liquidity). Need funds &lt;30 days → B; otherwise → A. If crowd &gt;65% in B, A gets juicier.
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
