# OmniRoute integration (branch: omniroute-integration)

This branch adds a safe, mock-first integration between the frontend and a backend proxy for the "OmniRoute" skill/service. It's designed to allow:

- Quick local demo without real keys (mock mode)
- Safe production usage behind a backend proxy (no keys in the browser)
- A scaffold for connecting LLMs (Claude/OpenAI) to call the proxy as a "tool"

Files added
- api/omniroute.js - Vercel-style serverless function / Express-compatible handler that proxies to OMNI_BASE_URL or serves mock data when OMNI_MOCK=true
- src/api/omniroute.ts - frontend wrapper used by UI components
- db/omniroute-db.json - sample mock data (used when OMNI_MOCK=true)

How to run a local demo (mock)
1. In your local environment, set the following env vars (or put them in .env):
   - OMNI_MOCK=true
   - REACT_APP_DEMO=true (optional, used by frontend)
2. Start your frontend dev server (npm install && npm run dev / npm start depending on the project)
3. If you use Vercel local dev (`vercel dev`) the api/omniroute.js will be available under /api/omniroute

How to connect to a real OmniRoute backend (safe)
1. Deploy the proxy (api/omniroute.js) to your serverless host (Vercel/Netlify) or to your backend service.
2. Set these environment variables in your hosting platform (do NOT commit them):
   - OMNI_BASE_URL=https://api.omniroute.example
   - OMNIROUTE_API_KEY=YOUR_PRIVATE_KEY
3. The frontend will call /api/omniroute which passes through to OMNI_BASE_URL with the Authorization header added on the server.

LLM Integration (how to let Claude/Codex call OmniRoute)
- Use the backend proxy as the single tool endpoint. When the model decides to call the tool, send a POST to /api/omniroute/route (or other mapped path).
- For OpenAI function calling: define a function like `get_route` and when the model returns a function_call, execute the corresponding proxy endpoint and return the result to the model.
- For Anthropic Claude: either include retrieved context from the OmniRoute DB (RAG) or implement a small tool router that Claude's orchestration layer can call.

Next steps I can implement now (if you want):
- Add unit smoke tests for the proxy
- Wire up a small UI page (e.g. /omni-demo) that lists routes using src/api/omniroute.ts and demonstrates create/get
- Add OpenAI/Claude adapter endpoints to show how to call the proxy from an LLM (safe, with env secrets)

If you want me to proceed, confirm which of these to add next:
- Add demo UI page that uses the wrapper (recommended for client meeting)
- Add LLM adapter endpoints (OpenAI functions + Anthropic example)
- Deploy to Vercel and set environment variables (you will need to add secrets in the Vercel dashboard)

I've pushed these changes to the branch `omniroute-integration`. I can open a PR when you confirm which additions you want next.
