/**
 * IndexIndia — Cloudflare Worker AI Proxy for Google Gemini
 * 
 * This serverless worker sits between the static GitHub Pages website and Google Gemini API.
 * - Visitors can ask questions without needing any API keys or logins.
 * - Your Google Gemini API key is stored securely on Cloudflare as an environment variable (Secret).
 * - Visitors NEVER see your API key in browser source code or network tabs.
 * - Generous Free Tier: Cloudflare gives 100,000 requests/day, Google Gemini gives 1,500 queries/day.
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // 2. Health check / status
    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "online",
          service: "IndexIndia Cloudflare Worker Gemini Proxy",
          models: ["gemini-3.5-flash-lite", "gemini-3.5-flash"]
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    try {
      const body = await request.json().catch(() => ({}));
      const query = (body.query || body.prompt || "").toString().trim();
      const context = body.context || {};
      const sectionTitle = (context.title || "Visible Content").toString().trim();
      const sectionText = (context.text || "").toString().trim().slice(0, 3000);

      if (!query) {
        return new Response(
          JSON.stringify({ error: "Query cannot be empty." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Read API Key from Cloudflare Secrets
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey || apiKey.trim().length === 0) {
        return new Response(
          JSON.stringify({
            error: "GEMINI_API_KEY secret is not set in Cloudflare Worker settings.",
            setupHelp: "Go to Cloudflare Worker -> Settings -> Variables and Secrets -> Add Variable: GEMINI_API_KEY"
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Grounding prompt with section context & factual safety
      const promptText = `You are the built-in intelligent reading companion for the IndexIndia book and investigation platform.

--- ACTIVE SECTION (IF RELEVANT) ---
Title: ${sectionTitle}
Content:
${sectionText || "(No active section text provided)"}
--- ACTIVE SECTION END ---

READER'S QUESTION / DOUBT:
"${query}"

INSTRUCTIONS:
1. Answer the question directly, accurately, and concisely in 2 to 3 clear sentences.
2. If the user asks about the story section, characters (Leo, Pip), or financial forensics, ground your answer in the provided text.
3. If the user asks general knowledge, geography, science, or factual questions (e.g. "is Sydney a country?", "what is the capital of Australia?", "why is the sky blue?"), answer with 100% factual correctness and logical clarity. Never hallucinate or give circular definitions.
4. If the question is about language, grammar, wordplay, definitions, or antonyms, answer with standard linguistic precision.
5. Provide only the direct factual explanation without conversational pleasantries (do not say "Sure!", "Here is your answer:", etc.).`;

      // Call Google Gemini API (gemini-3.5-flash-lite is sub-second fast)
      const primaryModel = "gemini-3.5-flash-lite";
      const fallbackModel = "gemini-3.5-flash";

      async function callGemini(modelName) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
        const payload = {
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 350,
          },
        };
        return await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      let geminiRes = await callGemini(primaryModel);
      let usedModel = primaryModel;

      // Fallback if primary model is unavailable
      if (!geminiRes.ok && geminiRes.status === 404) {
        geminiRes = await callGemini(fallbackModel);
        usedModel = fallbackModel;
      }

      if (!geminiRes.ok) {
        const errData = await geminiRes.json().catch(() => ({}));
        const msg = errData.error?.message || `Google API HTTP ${geminiRes.status}`;
        return new Response(
          JSON.stringify({ error: msg }),
          {
            status: geminiRes.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const data = await geminiRes.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!answer) {
        return new Response(
          JSON.stringify({ error: "Gemini did not return any text candidate." }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          text: answer,
          model: usedModel,
          source: "Google Gemini (via Cloudflare Edge)"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message || "Internal Worker error." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  },
};
