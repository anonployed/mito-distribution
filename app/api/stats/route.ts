export const runtime = "edge";

export async function GET() {
  const upstream = "https://airdrop.mitosis.org/api/register/stats?_=" + Date.now();
  const r = await fetch(upstream, { cache: "no-store" });
  if (!r.ok) {
    return new Response(JSON.stringify({ error: `upstream ${r.status}` }), {
      status: r.status,
      headers: { "content-type": "application/json" },
    });
  }
  const json = await r.text(); // keep as text → pass-through
  return new Response(json, {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*", // opcional
    },
  });
}
