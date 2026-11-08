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

    // ================= CONTACT & FEEDBACK INQUIRY ENDPOINT =================
    if (url.pathname === "/api/contact-inquiry") {
      try {
        const body = await request.json().catch(() => ({}));
        const targetEmail = "dhaumyakumar27@gmail.com";
        const inquiryType = body.type || "contact_issue";
        const inquiryStamp = inquiryType === "contact_issue" ? "[INDEXINDIA CONTACT US]" : "[INDEXINDIA FEEDBACK]";
        const referenceId = body.ticketId || body.proposalId || ("REF-" + Date.now().toString().slice(-6));
        const userEmail = body.email || "anonymous@indexindia.internal";
        const userHandle = body.handle || userEmail.split("@")[0] || "User";
        const category = body.category || body.proposal_type || "General";
        const subject = body.subject || `${inquiryStamp} - ${category} [${referenceId}]`;
        const description = body.description || "(No description provided)";

        // 1. Dispatch via Resend API if key is configured in Worker
        const resendKey = env.RESEND_API_KEY;
        if (resendKey) {
          try {
            const resendPayload = {
              from: "IndexIndia <onboarding@resend.dev>",
              to: [targetEmail],
              reply_to: userEmail,
              subject: subject,
              text: `${inquiryStamp} - ${category}\nFrom: ${userEmail}\nRef: ${referenceId}\n\n${description}`
            };
            if (body.html) {
              resendPayload.html = body.html;
            }
            if (Array.isArray(body.screenshots) && body.screenshots.length > 0) {
              resendPayload.attachments = body.screenshots.map((s, idx) => {
                let cleanContent = s.content || "";
                if (typeof cleanContent === "string" && cleanContent.includes(",")) {
                  cleanContent = cleanContent.split(",")[1];
                }
                return {
                  filename: s.filename || `screenshot-${referenceId}-${idx + 1}.png`,
                  content: cleanContent
                };
              });
            } else if (body.screenshot && body.screenshot.content) {
              let cleanContent = body.screenshot.content;
              if (typeof cleanContent === "string" && cleanContent.includes(",")) {
                cleanContent = cleanContent.split(",")[1];
              }
              resendPayload.attachments = [{
                filename: body.screenshot.filename || `screenshot-${referenceId}.jpg`,
                content: cleanContent
              }];
            }
            const resendResp = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(resendPayload)
            });
            if (resendResp.ok) {
              const resendJson = await resendResp.json().catch(() => ({}));
              return new Response(
                JSON.stringify({
                  success: true,
                  provider: "resend",
                  id: resendJson.id,
                  recipient: targetEmail,
                  referenceId: referenceId,
                  status: "delivered"
                }),
                {
                  status: 200,
                  headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
              );
            } else {
              const errText = await resendResp.text().catch(() => "");
              console.warn("Resend API responded with error:", resendResp.status, errText);
            }
          } catch (resendErr) {
            console.warn("Resend dispatch attempt notice:", resendErr);
          }
        }

        // 2. Dispatch via Web3Forms if key is configured in Worker
        if (env.WEB3FORMS_ACCESS_KEY) {
          try {
            await fetch("https://api.web3forms.com/submit", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify({
                access_key: env.WEB3FORMS_ACCESS_KEY,
                subject: subject,
                from_name: "IndexIndia Operations",
                email: userEmail,
                message: description,
                category: category,
                reference_id: referenceId
              })
            });
          } catch (w3Err) {
            console.warn("Web3Forms dispatch attempt notice:", w3Err);
          }
        }

        let mailChannelsDelivered = false;
        try {
          const mcResp = await fetch("https://api.mailchannels.net/tx/v1/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              personalizations: [{
                to: [{ email: targetEmail, name: "Dhaumya Kumar" }]
              }],
              from: {
                email: "dispatch@indexindia.dhaumyakumar27-235.workers.dev",
                name: "IndexIndia Operations Desk"
              },
              reply_to: {
                email: userEmail,
                name: userHandle
              },
              subject: subject,
              content: [{
                type: "text/html",
                value: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; background: #FAFAFA; border: 1.5px solid #121212; border-radius: 6px;">
                    <div style="border-bottom: 2px solid #FF3B00; padding-bottom: 12px; margin-bottom: 16px;">
                      <span style="font-family: monospace; font-size: 12px; font-weight: 700; color: #FF3B00;">${inquiryStamp}</span>
                      <h2 style="margin: 6px 0 0; color: #0A0A0A; font-size: 18px;">${category}</h2>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; font-family: monospace; margin-bottom: 18px;">
                      <tr><td style="padding: 6px 0; color: #737373;">Reference ID:</td><td style="padding: 6px 0; font-weight: bold; color: #0A0A0A;">${referenceId}</td></tr>
                      <tr><td style="padding: 6px 0; color: #737373;">Classification:</td><td style="padding: 6px 0; font-weight: bold; color: #0A0A0A;">${category}</td></tr>
                      <tr><td style="padding: 6px 0; color: #737373;">User Email:</td><td style="padding: 6px 0; color: #0A0A0A;"><a href="mailto:${userEmail}">${userEmail}</a></td></tr>
                    </table>
                    <div style="background: #FFFFFF; border: 1px solid #E2E2E5; border-radius: 4px; padding: 16px; margin-bottom: 16px;">
                      <div style="font-family: monospace; font-size: 11px; font-weight: bold; color: #737373; margin-bottom: 8px;">SUBMISSION CONTENT:</div>
                      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #0A0A0A; white-space: pre-wrap;">${description}</p>
                    </div>
                    <div style="font-size: 11px; font-family: monospace; color: #737373; border-top: 1px dashed #E2E2E5; padding-top: 12px;">
                      Dispatched securely to ${targetEmail} via IndexIndia Operations &bull; ${new Date().toISOString()}
                    </div>
                  </div>
                `
              }]
            })
          });
          if (mcResp.ok) {
            mailChannelsDelivered = true;
          }
        } catch (mailErr) {
          console.warn("Mailchannels dispatch attempt notice:", mailErr);
        }

        if (mailChannelsDelivered) {
          return new Response(
            JSON.stringify({
              success: true,
              provider: "mailchannels",
              recipient: targetEmail,
              referenceId,
              status: "delivered"
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: "No background email provider (RESEND_API_KEY) is configured on this Cloudflare Worker.",
            recipient: targetEmail,
            referenceId
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (inqErr) {
        return new Response(
          JSON.stringify({ error: inqErr.message || "Failed to process inquiry." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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
        const keyId = env.RAZORPAY_KEY_ID || "rzp_live_TwBGCSnpYdT9r5";
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
        const keyId = env.RAZORPAY_KEY_ID || "rzp_live_TwBGCSnpYdT9r5";
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
          lifetime: 9900,   // ₹99 in paise (one-time lifetime clearance)
          "3min_test": 100, // ₹1 in paise (3-minute live transaction check)
          test: 100,        // ₹1 in paise (live gateway test & bank settlement check)
          monthly: 49900,   // ₹499 in paise (legacy)
          annual: 399900    // ₹3,999 in paise (legacy)
        };

        const amount = planAmounts[plan] || (plan === "3min_test" || plan === "test" ? 100 : 9900);
        const keyId = env.RAZORPAY_KEY_ID || "rzp_live_TwBGCSnpYdT9r5";
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
