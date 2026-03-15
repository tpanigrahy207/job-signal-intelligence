import Anthropic from "@anthropic-ai/sdk";

const COMPANY_SYS = "You are an elite job market intelligence analyst. Search for current job postings AND recent layoff news for the given company. Return ONLY valid JSON with no markdown, no backticks, no explanation. JSON structure: {\"company\":\"Official Name\",\"signalScore\":0,\"verdict\":\"Watch\",\"practiceDirection\":\"description\",\"techStackSignals\":[],\"seniorityPattern\":\"description\",\"velocity\":\"description\",\"redFlags\":[],\"greenFlags\":[],\"keyInsight\":\"description\",\"estimatedRoles\":0}. Rules for signalScore: integer 0-100. Base on AI hiring NOW + layoffs last 90 days + AI investment + practice maturity. Cannot exceed 70 if layoffs in past 90 days. Most companies 40-70. Above 85 only if exceptional AI velocity AND no recent layoffs. 2026 layoff rumors count as red flags. Rules for verdict: Strong Buy only if score 85+. Apply Now for 65-84. Watch for 40-64. Avoid below 40 or if active layoffs.";

const JD_SYS = "You are a senior executive recruiter who decodes job descriptions. Return ONLY valid JSON with no markdown, no backticks, no explanation. JSON structure: {\"title\":\"role title\",\"realSeniority\":\"actual level\",\"actualStack\":[],\"statedStack\":[],\"whatTheyReallyWant\":\"description\",\"salaryFairness\":\"Fair\",\"salarySignals\":\"description\",\"redFlags\":[],\"greenFlags\":[],\"hiddenRequirements\":[],\"verdict\":\"Apply\",\"verdictReason\":\"one sentence\",\"interviewAngle\":\"advice\"}. salaryFairness must be one of: Fair, Below Market, Above Market, Unknown. verdict must be one of: Apply, Negotiate, Avoid, Dream Role.";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured in Vercel environment variables." });

  const { mode, input } = req.body;
  if (!mode || !input) return res.status(400).json({ error: "Missing mode or input" });

  try {
    const client = new Anthropic({ apiKey });

    const userMessage = mode === "company"
      ? "Analyze job market signals for: " + input + ". Search for THREE things: (1) AI-related job postings active in 2026, (2) layoffs or workforce reductions in the past 90 days, (3) any rumored restructuring for 2026. Prioritize news from last 30 days. Heavily penalize any layoff activity from past 90 days in the score."
      : "Decode this job description:\n\n" + input;

    let messages = [{ role: "user", content: userMessage }];
    let data;

    for (let turn = 0; turn < 5; turn++) {
      const params = {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: mode === "company" ? COMPANY_SYS : JD_SYS,
        messages,
      };

      if (mode === "company") {
        params.tools = [{ type: "web_search_20250305", name: "web_search" }];
      }

      data = await client.messages.create(params);

      const toolUseBlocks = data.content.filter((b) => b.type === "tool_use");
      if (data.stop_reason === "end_turn" || toolUseBlocks.length === 0) break;

      messages = [
        ...messages,
        { role: "assistant", content: data.content },
        {
          role: "user",
          content: toolUseBlocks.map((b) => ({
            type: "tool_result",
            tool_use_id: b.id,
            content: "Search executed",
          })),
        },
      ];
    }

    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const clean = text.replace(/```json\n?|```\n?/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: "Could not parse response — please try again" });

    return res.status(200).json(JSON.parse(match[0]));
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: err.message || "Analysis failed" });
  }
}
