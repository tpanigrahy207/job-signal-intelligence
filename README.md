# Job Signal Intelligence

> Layoff trackers tell you who got cut. This tells you where the real AI hiring is going.

AI-powered job market intelligence tool with two modes:

- **Company Intel** — Scan any company's job postings for AI practice investment signals, tech stack tells, seniority patterns, and a signal score
- **JD Decoder** — Paste any job description to reveal what they *really* want, hidden requirements, salary fairness, and your best interview angle

Built with React + Claude API (with web search). Deploy in minutes on Vercel.

---

## Deploy to Vercel (fastest path)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/job-signal-intelligence)

1. Click the button above
2. Connect your GitHub account
3. Add your `ANTHROPIC_API_KEY` as an environment variable
4. Deploy — done

Get your API key at [console.anthropic.com](https://console.anthropic.com)

---

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/job-signal-intelligence
cd job-signal-intelligence

# 2. Install dependencies
npm install

# 3. Set up your API key
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# 4. Run locally (uses vercel dev to run both frontend + API function)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** Local dev uses `vercel dev` which runs the Vite frontend and the `/api` serverless function together. If you haven't used Vercel CLI before, it will prompt you to log in on first run — you can create a free account at vercel.com.

---

## How It Works

```
User Input
    │
    ▼
React Frontend (Vite)
    │  POST /api/analyze
    ▼
Vercel Serverless Function
    │  Claude Sonnet 4 + Web Search
    ▼
Anthropic API
    │  Agentic loop: search → extract → structure
    ▼
JSON Intelligence Card
    │
    ▼
Rendered Result
```

The API key **never touches the browser** — all Anthropic calls are proxied through the Vercel serverless function. Safe to share the deployed URL publicly.

---

## Project Structure

```
job-signal-intelligence/
├── api/
│   └── analyze.js       ← Vercel serverless function (Anthropic proxy)
├── src/
│   ├── main.jsx         ← React entry point
│   └── App.jsx          ← Full application component
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
└── .gitignore
```

---

## Customization

**Change the model:** In `api/analyze.js`, update the `model` field. Defaults to `claude-sonnet-4-20250514`.

**Tune the prompts:** The `COMPANY_SYS` and `JD_SYS` system prompts in `api/analyze.js` control what gets extracted. Edit them to focus on different signals (e.g., specific industries, geographies, seniority levels).

**Add more companies to the default list:** Edit the placeholder text in `src/App.jsx`.

---

## Built By

Built by [Tanu](https://linkedin.com/in/YOUR_PROFILE) — ServiceNow practice strategist and AI builder.

> *"I spent years implementing enterprise platforms that solve this for F500s. I built a version anyone can run in an afternoon."*

---

## LinkedIn Post (feel free to use/adapt)

```
Layoff trackers show you who's losing jobs.

I built something that shows you where the real AI consulting investment 
is going — before the roles get cold.

Two modes:
→ Company Intel: scan any firm's AI hiring signals, tech stack, 
  seniority pattern, and get a verdict (Strong Buy → Avoid)
→ JD Decoder: paste any job posting and get what they REALLY want, 
  hidden requirements, salary fairness signal, and your interview angle

Fully open source. Connect your own Anthropic API key and deploy 
to Vercel in minutes.

GitHub: [link]
Live demo: [link]

#AI #JobSearch #OpenSource #ServiceNow #Consulting
```

---

## License

MIT — use it, fork it, build on it.
