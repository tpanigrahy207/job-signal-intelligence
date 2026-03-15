import Anthropic from "@anthropic-ai/sdk";

const COMPANY_SYS = `You are an elite job market intelligence analyst specializing in enterprise AI consulting (ServiceNow, KPMG, Deloitte, Accenture, Microsoft, Atlassian, Salesforce).

Search for current job postings from the given company focusing on AI, consulting, and technology practice roles.

Return ONLY valid JSON. No markdown, no backticks, no explanation — just raw JSON:
{
  "company": "Official Company Name",
  "signalScore": <integer 0-100. Be brutally honest. 90+ is reserved for companies with explosive verified AI hiring growth RIGHT NOW. Most companies score 40-70. A company with layoffs concurrent to AI hiring scores max 60. Atlassian, which has had significant layoffs in 2024-2025 while pivoting to AI, should score in the 45-65 range. Big 4 firms actively building AI practices score 70-85. Only companies with exceptional, verifiable AI investment velocity score above 85>,
 "verdict": <"Strong Buy"|"Apply Now"|"Watch"|"Avoid". Strong Buy only if signalScore >= 85. Apply Now for 65-84. Watch for 40-64. Avoid below 40 or if company has active layoffs in the candidate's target function>,
  "practiceDirection": "<2-3 sentence description of AI/tech investment direction>",
  "techStackSignals": ["platforms","tools","mentioned"],
  "seniorityPattern": "<building new practice or scaling? what levels are they hiring?>",
  "velocity": "<hiring pace, e.g. 8 AI roles posted in 30 days>",
  "redFlags": ["red flags if any"],
  "greenFlags": ["positive signals"],
  "keyInsight": "<one powerful sentence for a senior job seeker>",
  "estimatedRoles": <integer>
}`;

const JD_SYS = `You are a senior executive recruiter who decodes job descriptions to reveal what companies REALLY want behind corporate language.

Return ONLY valid JSON. No markdown, no backticks, no explanation — just raw JSON:
{
  "title": "<role title as stated>",
  "realSeniority": "<actual level regardless of title>",
  "actualStack": ["real","tech","implied"],
  "statedStack": ["what","they","wrote"],
  "whatTheyReallyWant": "<plain English 2-3 sentences>",
  "salaryFairness": <"Fair"|"Below Market"|"Above Market"|"Unknown">,
  "salarySignals": "<compensation assessment>",
  "redFlags": ["red flags if any"],
  "greenFlags": ["positive signals"],
  "hiddenRequirements": ["unstated but implied requirements"],
  "verdict": <"Apply"|"Negotiate"|"Avoid"|"Dream Role">,
  "verdictReason": "<one sentence>",
  "interviewAngle": "<strategic positioning advice for a senior candidate>"
}`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return res.status(500).json({
      error:
        "ANTHROPIC_API_KEY not configured. Add it to your Vercel environment variables.",
    });

  const { mode, input } = req.body;
  if (!mode || !input)
    return res.status(400).json({ error: "Missing mode or input" });

  try {
    const client = new Anthropic({ apiKey });

    const systemPrompt = mode === "company" ? COMPANY_SYS : JD_SYS;
    const userMessage =
      mode === "company"
        ? `Analyze AI and consulting job market signals for: "${input}". Search for their current open roles, focusing on AI practice, consulting, and technology leadership positions.`
        : `Decode this job description and reveal what they really want:\n\n${input}`;

    let messages = [{ role: "user", content: userMessage }];
    let data;

    for (let turn = 0; turn < 5; turn++) {
      const params = {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: systemPrompt,
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
            content: "Search executed successfully",
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
    if (!match)
      return res
        .status(500)
        .json({ error: "Could not parse AI response — please try again" });

    return res.status(200).json(JSON.parse(match[0]));
  } catch (err) {
    console.error("Anthropic API error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Analysis failed. Please try again." });
  }
}
