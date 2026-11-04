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

    // 2. Health check or static assets serving
    if (request.method === "GET") {
      const url = new URL(request.url);
      if (env.ASSETS && url.pathname !== "/health" && url.pathname !== "/api/health") {
        return env.ASSETS.fetch(request);
      }
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

    const url = new URL(request.url);

    // ================= RAZORPAY SUBSCRIPTION & PAYMENT ENDPOINTS =================
    if (url.pathname === "/api/create-subscription") {
      try {
        const body = await request.json().catch(() => ({}));
        const plan = (body.plan || "daily_autopay").toLowerCase();
        const userId = body.userId;
        const userEmail = body.email || "";

        // Plan ID mapping
        const planIds = {
          daily_autopay: env.PLAN_ID_TEST_DAILY || "plan_TwAgpRAFXFr3pF",
          test: env.PLAN_ID_TEST_DAILY || "plan_TwAgpRAFXFr3pF",
          monthly: env.PLAN_ID_MONTHLY || ""
        };

        const planId = planIds[plan] || body.plan_id || "plan_TwAgpRAFXFr3pF";
        const keyId = env.RAZORPAY_KEY_ID || "rzp_live_Tvm5Coo5TFFYRa";
        const keySecret = env.RAZORPAY_KEY_SECRET || env.RAZORPAY_SECRET || "";

        if (!keyId || !keySecret) {
          return new Response(
            JSON.stringify({
              error: "Razorpay credentials not configured in Cloudflare secrets.",
              setupHelp: "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Cloudflare Worker secrets."
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const totalCount = plan === "daily_autopay" ? 7 : (body.total_count || 12);
        const authHeader = "Basic " + btoa(`${keyId}:${keySecret}`);

        const rzpSubRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            plan_id: planId,
            total_count: totalCount,
            quantity: 1,
            customer_notify: 1,
            notes: {
              user_id: userId || "",
              email: userEmail,
              plan: plan
            }
          })
        });

        const subData = await rzpSubRes.json();
        if (!rzpSubRes.ok) {
          return new Response(
            JSON.stringify({
              error: subData.error?.description || "Failed to create Razorpay AutoPay subscription.",
              details: subData
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            subscription_id: subData.id,
            plan_id: planId,
            keyId: keyId,
            plan: plan
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message || "Subscription creation error." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (url.pathname === "/api/cancel-subscription") {
      try {
        const body = await request.json().catch(() => ({}));
        const { subscription_id, cancel_at_cycle_end } = body;
        const keyId = env.RAZORPAY_KEY_ID || "rzp_live_Tvm5Coo5TFFYRa";
        const keySecret = env.RAZORPAY_KEY_SECRET || env.RAZORPAY_SECRET || "";

        if (!subscription_id) {
          return new Response(
            JSON.stringify({ error: "Missing subscription_id." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const authHeader = "Basic " + btoa(`${keyId}:${keySecret}`);
        const rzpCancelRes = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscription_id}/cancel`, {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cancel_at_cycle_end: cancel_at_cycle_end ? 1 : 0
          })
        });

        const cancelData = await rzpCancelRes.json();
        return new Response(
          JSON.stringify({ success: rzpCancelRes.ok, data: cancelData }),
          { status: rzpCancelRes.ok ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message || "Cancellation error." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (url.pathname === "/api/razorpay-webhook") {
      try {
        const rawBody = await request.text();
        const signature = request.headers.get("x-razorpay-signature") || "";
        const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || "Dhatry@27";
        const supabaseUrl = env.SUPABASE_URL || "https://hssphsykrgyvejxfkfin.supabase.co";
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || "";

        // Verify webhook signature if secret exists
        if (signature && webhookSecret) {
          const encoder = new TextEncoder();
          const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(webhookSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
          );
          const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
          const hexSignature = Array.from(new Uint8Array(sigBuffer))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");

          if (hexSignature.toLowerCase() !== signature.toLowerCase()) {
            console.warn("Invalid webhook signature received");
            return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }

        const payload = JSON.parse(rawBody || "{}");
        const event = payload.event;
        const subEntity = payload.payload?.subscription?.entity;
        const paymentEntity = payload.payload?.payment?.entity;

        const userId = subEntity?.notes?.user_id || paymentEntity?.notes?.user_id;
        const plan = subEntity?.notes?.plan || "daily_autopay";
        const subscriptionId = subEntity?.id;
        const paymentId = paymentEntity?.id;

        if (userId && supabaseKey) {
          if (event === "subscription.charged" || event === "subscription.activated") {
            // Mandate charged: extend valid_until by 1 day for daily, 30 days for monthly
            const extensionMs = plan === "daily_autopay" ? 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000;
            const validUntil = new Date(Date.now() + extensionMs).toISOString();

            await fetch(`${supabaseUrl}/rest/v1/user_memberships`, {
              method: "POST",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
              },
              body: JSON.stringify({
                user_id: userId,
                plan_type: plan,
                status: "active",
                payment_gateway: "razorpay",
                payment_id: paymentId || null,
                order_id: subscriptionId || null,
                valid_until: validUntil,
                updated_at: new Date().toISOString()
              })
            });
            console.log(`[Webhook] User ${userId} membership renewed until ${validUntil}`);
          } else if (event === "subscription.cancelled" || event === "subscription.halted") {
            // Mandate cancelled in GPay or revoked
            await fetch(`${supabaseUrl}/rest/v1/user_memberships`, {
              method: "POST",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
              },
              body: JSON.stringify({
                user_id: userId,
                status: "cancelled",
                updated_at: new Date().toISOString()
              })
            });
            console.log(`[Webhook] User ${userId} AutoPay mandate cancelled/halted`);
          }
        }

        return new Response(JSON.stringify({ status: "ok", event: event }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (wErr) {
        console.error("Webhook processing error:", wErr);
        return new Response(JSON.stringify({ error: wErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    if (url.pathname === "/api/create-order") {
      try {
        const body = await request.json().catch(() => ({}));
        const plan = (body.plan || "lifetime").toLowerCase();
        const userId = body.userId;
        const userEmail = body.email || "";

        const planAmounts = {
          "3min_test": 100, // ₹1 in paise (3-minute live transaction check)
          test: 100,        // ₹1 in paise (live gateway test & bank settlement check)
          lifetime: 99900,  // ₹999 in paise
          monthly: 49900,   // ₹499 in paise
          annual: 399900    // ₹3,999 in paise
        };

        const amount = planAmounts[plan] || (plan === "3min_test" || plan === "test" ? 100 : 99900);
        const keyId = env.RAZORPAY_KEY_ID || "rzp_live_Tvm5Coo5TFFYRa";
        const keySecret = env.RAZORPAY_KEY_SECRET || "";

        if (!keyId || !keySecret) {
          return new Response(
            JSON.stringify({
              error: "Razorpay credentials not configured in Cloudflare secrets.",
              setupHelp: "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Cloudflare Worker secrets."
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const authHeader = "Basic " + btoa(`${keyId}:${keySecret}`);

        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            amount,
            currency: "INR",
            receipt,
            payment_capture: 1,
            notes: {
              user_id: userId || "",
              plan: plan,
              email: userEmail
            }
          })
        });

        const rzpData = await rzpRes.json();
        if (!rzpRes.ok) {
          return new Response(
            JSON.stringify({ error: rzpData.error?.description || "Failed to create Razorpay order." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            orderId: rzpData.id,
            amount: rzpData.amount,
            currency: rzpData.currency,
            keyId: keyId,
            plan: plan
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message || "Order creation error." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (url.pathname === "/api/verify-payment") {
      try {
        const body = await request.json().catch(() => ({}));
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan } = body;
        const keySecret = env.RAZORPAY_KEY_SECRET || "";
        const supabaseUrl = env.SUPABASE_URL || "https://hssphsykrgyvejxfkfin.supabase.co";
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || "";

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          return new Response(
            JSON.stringify({ error: "Missing required payment parameters." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(keySecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`));
        const hexSignature = Array.from(new Uint8Array(sigBuffer))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");

        const isValid = hexSignature.toLowerCase() === (razorpay_signature || "").toLowerCase();

        if (!isValid && keySecret) {
          return new Response(
            JSON.stringify({ error: "Invalid payment signature verification failed." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Calculate expiration date
        let validUntil = null;
        if (plan === "3min_test") {
          validUntil = new Date(Date.now() + 3 * 60 * 1000).toISOString();
        } else if (plan === "monthly") {
          validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        } else if (plan === "annual") {
          validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        } else if (plan === "test") {
          validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
        }

        // Attempt auto-capture via Razorpay API if keySecret is available
        if (keyId && keySecret && razorpay_payment_id) {
          try {
            const authHeader = "Basic " + btoa(`${keyId}:${keySecret}`);
            await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}/capture`, {
              method: "POST",
              headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ amount: planAmounts[plan] || 100, currency: "INR" })
            });
          } catch (capErr) {
            console.warn("Auto-capture call error:", capErr);
          }
        }

        // Update Supabase if credentials available
        if (userId && supabaseKey) {
          try {
            await fetch(`${supabaseUrl}/rest/v1/user_memberships`, {
              method: "POST",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
              },
              body: JSON.stringify({
                user_id: userId,
                plan_type: plan || "lifetime",
                status: "active",
                payment_gateway: "razorpay",
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                valid_until: validUntil,
                updated_at: new Date().toISOString()
              })
            });
          } catch (dbErr) {
            console.warn("Could not write membership directly to Supabase:", dbErr);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            status: "active",
            plan: plan,
            paymentId: razorpay_payment_id
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message || "Payment verification error." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    try {
      const body = await request.json().catch(() => ({}));
      const query = (body.query || body.prompt || "").toString().trim();
      const context = body.context || {};
      const sectionTitle = (context.title || "Document Context").toString().trim();
      const sectionText = (context.text || "").toString().trim().slice(0, 5000);

      if (!query) {
        return new Response(
          JSON.stringify({ error: "Query cannot be empty." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Read API Key from Cloudflare Secrets (support various possible variable names/casing)
      const apiKey = (
        env.GEMINI_API_KEY ||
        env.gemini_api_key ||
        env.GEMINI_KEY ||
        env.gemini_key ||
        env["gemini apr"] ||
        env["gemini api"] ||
        env.GEMINI_API ||
        ""
      ).toString().trim();

      if (!apiKey || apiKey.length === 0) {
        return new Response(
          JSON.stringify({
            error: "GEMINI_API_KEY secret is not found in Cloudflare Worker environment.",
            detectedKeys: Object.keys(env || {}).filter(k => k !== "ASSETS"),
            setupHelp: "In Cloudflare: Settings -> Variables and Secrets -> Add Variable named exactly: GEMINI_API_KEY, then click Save and Deploy."
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
