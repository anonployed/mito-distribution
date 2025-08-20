# Mitosis Airdrop — Live Dashboard
![Preview](https://abmito.vercel.app/gif.gif)



A **Next.js + Vercel** dashboard that displays live statistics from  
`https://airdrop.mitosis.org/api/register/stats`.

## Features
- Auto-refresh every 5s
- Green/Red flash (1s) on value changes
- Refresh progress bar
- User and token splits, ratios, and percentages
- Server-side API proxy (`/api/stats`) to bypass CORS

## Local Development

```bash
npm install
npm run dev
