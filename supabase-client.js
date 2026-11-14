/**
 * IndexIndia — Supabase Authentication & Cross-Device Cloud Sync Client
 * 
 * Provides frictionless, zero-bloat user login and bidirectional sync for:
 * 1. User Annotations (pencil strokes, highlights, sticky notes, stickers)
 * 2. Gemini AI Doubt Solver History
 * 
 * Works 100% local-first: if logged out or offline, localStorage is used seamlessly.
 * When logged in, changes sync transparently in the background.
 */

(function () {
  const SUPABASE_CDN_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

  // Configuration: Can be prefilled here or set via Account settings flyout panel
  const STORAGE_KEY_CONFIG = "indexindia_supabase_config_v1";

  // Default / hardcoded credentials placeholder (can also be configured at runtime)
  let CONFIG = {
    url: "https://hssphsykrgyvejxfkfin.supabase.co",
    anonKey: "sb_publishable_PwCnO8oI58ESwGGwtLgsQw_vZ9o05_n"
  };

  // Load any runtime credentials saved in browser
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.url.trim()) CONFIG.url = parsed.url.trim();
      if (parsed.anonKey && parsed.anonKey.trim()) CONFIG.anonKey = parsed.anonKey.trim();
    }
  } catch (e) {
    console.warn("[Supabase] Failed to read saved config from localStorage:", e);
  }

  let supabaseClient = null;
  let currentUser = null;
  let isSdkLoading = false;
  let sdkLoadPromise = null;
  const authListeners = new Set();

  /**
   * Dynamically loads the Supabase JS client from CDN if not already in document
   */
  function loadSupabaseSdk() {
    if (window.supabase && typeof window.supabase.createClient === "function") {
      return Promise.resolve(window.supabase);
    }
    if (sdkLoadPromise) return sdkLoadPromise;

    sdkLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SUPABASE_CDN_URL;
      script.async = true;
      script.onload = () => {
        isSdkLoading = false;
        resolve(window.supabase);
      };
      script.onerror = (err) => {
        isSdkLoading = false;
        console.error("[Supabase] Failed to load Supabase SDK from CDN", err);
        reject(err);
      };
      document.head.appendChild(script);
    });

    return sdkLoadPromise;
  }

  /**
   * Initializes the Supabase client if configured
   */
  async function initClient() {
    if (supabaseClient) return supabaseClient;
    if (!CONFIG.url || !CONFIG.anonKey) return null;

    try {
      const sdk = await loadSupabaseSdk();
      if (!sdk) return null;

      supabaseClient = sdk.createClient(CONFIG.url, CONFIG.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });

      // Fetch active session
      const { data: { session } } = await supabaseClient.auth.getSession();
      currentUser = session ? session.user : null;

      // Listen for auth state changes
      supabaseClient.auth.onAuthStateChange((event, session) => {
        currentUser = session ? session.user : null;
        authListeners.forEach((fn) => {
          try { fn(event, currentUser, session); } catch (err) { console.error(err); }
        });
      });

      // Notify existing listeners that client has initialized with current session
      authListeners.forEach((fn) => {
        try { fn("CLIENT_BOOT", currentUser, session); } catch (err) { console.error(err); }
      });

      return supabaseClient;
    } catch (err) {
      console.warn("[Supabase] Initialization error:", err);
      return null;
    }
  }

  // Public Interface
  const IndexIndiaSupabase = {
    /**
     * Check if credentials are set
     */
    isConfigured() {
      return Boolean(CONFIG.url && CONFIG.anonKey);
    },

    /**
     * Get current credentials
     */
    getConfig() {
      return { ...CONFIG };
    },

    /**
     * Save new Supabase credentials and re-init
     */
    async setCredentials(url, anonKey) {
      CONFIG.url = (url || "").trim();
      CONFIG.anonKey = (anonKey || "").trim();

      try {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(CONFIG));
      } catch (e) {
        console.warn("[Supabase] Could not save config:", e);
      }

      supabaseClient = null;
      currentUser = null;
      if (CONFIG.url && CONFIG.anonKey) {
        return await initClient();
      }
      return null;
    },

    /**
     * Get current authenticated user
     */
    getUser() {
      return currentUser;
    },

    /**
     * Check if user is actively logged in
     */
    isAuthenticated() {
      return Boolean(currentUser);
    },

    /**
     * Subscribe to auth changes: callback(event, user, session)
     */
    onAuthStateChange(callback) {
      if (typeof callback === "function") {
        authListeners.add(callback);
        // Call immediately with current state
        callback(currentUser ? "INITIAL_LOGGED_IN" : "INITIAL_LOGGED_OUT", currentUser, null);
      }
      return () => authListeners.delete(callback);
    },

    /**
     * Initialize on page boot
     */
    async boot() {
      if (this.isConfigured()) {
        await initClient();
      }
      return this;
    },

    // ---------------- AUTH METHODS ----------------

    async loginWithEmailPassword(email, password) {
      const client = await initClient();
      if (!client) throw new Error("Supabase is not configured yet.");
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      currentUser = data.user;
      return data;
    },

    async registerWithEmailPassword(email, password) {
      const client = await initClient();
      if (!client) throw new Error("Supabase is not configured yet.");
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.href
        }
      });
      if (error) throw error;
      if (data && data.user && data.session) {
        currentUser = data.user;
      }
      return data;
    },

    async loginWithMagicLink(email) {
      const client = await initClient();
      if (!client) throw new Error("Supabase is not configured yet.");
      const redirectTarget = window.location.origin + window.location.pathname;
      const { data, error } = await client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTarget
        }
      });
      if (error) throw error;
      return data;
    },

    async loginWithGoogle() {
      const client = await initClient();
      if (!client) throw new Error("Supabase is not configured yet.");

      // Check if Google provider is enabled in Supabase project settings
      try {
        const settingsRes = await fetch(`${CONFIG.url}/auth/v1/settings`, {
          headers: { apikey: CONFIG.anonKey }
        }).then(r => r.json()).catch(() => null);

        if (settingsRes && settingsRes.external && settingsRes.external.google === false) {
          throw new Error("Google login is disabled in your Supabase project. Enable it in Supabase Dashboard -> Authentication -> Providers -> Google, or use Email / Magic Link below.");
        }
      } catch (err) {
        if (err.message && err.message.includes("Google login is disabled")) {
          throw err;
        }
      }

      const redirectTarget = window.location.origin + window.location.pathname;
      const { data, error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTarget,
          skipBrowserRedirect: true
        }
      });
      if (error) throw error;

      if (data && data.url) {
        const popup = window.open(data.url, "_blank");
        if (!popup || popup.closed || typeof popup.closed === "undefined") {
          throw new Error("Popup blocked by browser. Please allow popups for this site.");
        }
      }
      return data;
    },

    async logout() {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      currentUser = null;
    },

    // ---------------- ANNOTATION CLOUD SYNC ----------------

    /**
     * Fetches annotations for page and merges with local data (takes latest timestamp)
     */
    async syncAnnotationsDown(pagePath, localData) {
      if (!this.isAuthenticated() || !supabaseClient) return localData;

      try {
        const { data, error } = await supabaseClient
          .from("user_annotations")
          .select("data, updated_at")
          .eq("page_path", pagePath)
          .maybeSingle();

        if (error) {
          console.warn("[Supabase] Failed to fetch annotations:", error.message);
          return localData;
        }

        if (!data || !data.data) {
          // If no cloud data exists yet but local data has content, push local to cloud
          if (localData && (
            (localData.strokes && localData.strokes.length) ||
            (localData.highlights && localData.highlights.length) ||
            (localData.stickynotes && localData.stickynotes.length) ||
            (localData.textboxes && localData.textboxes.length) ||
            (localData.stickers && localData.stickers.length)
          )) {
            await this.uploadAnnotations(pagePath, localData);
          }
          return localData;
        }

        const remoteData = data.data;
        const remoteTime = new Date(data.updated_at).getTime() || 0;
        const localTime = localData && localData.updatedAt ? localData.updatedAt : 0;

        // If remote is newer, return remote; otherwise upload local
        if (remoteTime >= localTime) {
          return {
            version: remoteData.version || 1,
            strokes: Array.isArray(remoteData.strokes) ? remoteData.strokes : [],
            textboxes: Array.isArray(remoteData.textboxes) ? remoteData.textboxes : [],
            stickynotes: Array.isArray(remoteData.stickynotes) ? remoteData.stickynotes : [],
            highlights: Array.isArray(remoteData.highlights) ? remoteData.highlights : [],
            stickers: Array.isArray(remoteData.stickers) ? remoteData.stickers : [],
            updatedAt: remoteTime
          };
        } else {
          await this.uploadAnnotations(pagePath, localData);
          return localData;
        }
      } catch (err) {
        console.warn("[Supabase] syncAnnotationsDown error:", err);
        return localData;
      }
    },

    /**
     * Uploads annotations to cloud
     */
    async uploadAnnotations(pagePath, annotationsData) {
      if (!this.isAuthenticated() || !supabaseClient) return;

      try {
        const payload = {
          user_id: currentUser.id,
          page_path: pagePath,
          data: {
            version: annotationsData.version || 1,
            strokes: annotationsData.strokes || [],
            textboxes: annotationsData.textboxes || [],
            stickynotes: annotationsData.stickynotes || [],
            highlights: annotationsData.highlights || [],
            stickers: annotationsData.stickers || []
          },
          updated_at: new Date().toISOString()
        };

        const { error } = await supabaseClient
          .from("user_annotations")
          .upsert(payload, { onConflict: "user_id,page_path" });

        if (error) {
          console.warn("[Supabase] Failed to upload annotations:", error.message);
        }
      } catch (err) {
        console.warn("[Supabase] uploadAnnotations exception:", err);
      }
    },

    // ---------------- AI DOUBT SOLVER CLOUD SYNC ----------------

    /**
     * Syncs AI Doubts down and merges with local list (deduplicated by id or timestamp)
     */
    async syncDoubtsDown(localDoubts) {
      if (!this.isAuthenticated() || !supabaseClient) return localDoubts;

      try {
        const { data, error } = await supabaseClient
          .from("user_ai_history")
          .select("record_id, question, answer_html, exact_timestamp, timestamp, page_path")
          .order("timestamp", { ascending: false })
          .limit(100);

        if (error) {
          console.warn("[Supabase] Failed to fetch AI doubts:", error.message);
          return localDoubts;
        }

        const remoteDoubts = (data || []).map((r) => ({
          id: r.record_id,
          question: r.question,
          answerHtml: r.answer_html,
          exactTimestamp: r.exact_timestamp,
          timestamp: Number(r.timestamp),
          pagePath: r.page_path
        }));

        // Merge and deduplicate by id or question + timestamp, preserving local tree linkages
        const localById = new Map();
        for (const l of (localDoubts || [])) {
          const k = String(l.id || `${l.timestamp}_${l.question}`);
          localById.set(k, l);
          if (l.id) localById.set(String(l.id), l);
        }

        const seenIds = new Set();
        const merged = [];

        // Remote doubts first (merge with local attributes so parentId / sectionId are never lost)
        for (const r of remoteDoubts) {
          const key = String(r.id || `${r.timestamp}_${r.question}`);
          if (!seenIds.has(key)) {
            seenIds.add(key);
            const l = localById.get(key) || localById.get(String(r.id));
            const mergedItem = {
              ...r,
              parentId: (l && l.parentId) || r.parentId || null,
              rootId: (l && l.rootId) || r.rootId || null,
              sectionId: (l && l.sectionId) || r.sectionId || "",
              sectionTitle: (l && l.sectionTitle) || r.sectionTitle || "",
              isFollowUp: (l && typeof l.isFollowUp === "boolean") ? l.isFollowUp : Boolean(r.parentId || (l && l.parentId)),
              isPaidMemberThread: (l && l.isPaidMemberThread) || r.isPaidMemberThread || false
            };
            merged.push(mergedItem);
          }
        }

        // Local doubts that haven't been pushed to cloud yet
        for (const l of (localDoubts || [])) {
          const key = l.id || `${l.timestamp}_${l.question}`;
          if (!seenIds.has(key)) {
            seenIds.add(key);
            merged.push(l);
            // Push missing local doubt to cloud in background
            this.uploadDoubt(l);
          }
        }

        merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        return merged;
      } catch (err) {
        console.warn("[Supabase] syncDoubtsDown exception:", err);
        return localDoubts;
      }
    },

    /**
     * Upload single doubt record to Supabase
     */
    async uploadDoubt(record) {
      if (!this.isAuthenticated() || !supabaseClient || !record) return;

      try {
        const recordId = record.id || `doubt_${record.timestamp || Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        record.id = recordId;

        const payload = {
          user_id: currentUser.id,
          record_id: recordId,
          question: record.question || "",
          answer_html: record.answerHtml || "",
          exact_timestamp: record.exactTimestamp || "",
          timestamp: Number(record.timestamp) || Date.now(),
          page_path: window.location.pathname
        };

        const { error } = await supabaseClient
          .from("user_ai_history")
          .upsert(payload, { onConflict: "user_id,record_id" });

        if (error) {
          console.warn("[Supabase] Failed to upload doubt:", error.message);
        }
      } catch (err) {
        console.warn("[Supabase] uploadDoubt exception:", err);
      }
    },

    /**
     * Delete doubt record from cloud
     */
    async deleteDoubt(recordId) {
      if (!this.isAuthenticated() || !supabaseClient || !recordId) return;

      try {
        const { error } = await supabaseClient
          .from("user_ai_history")
          .delete()
          .eq("record_id", recordId);

        if (error) {
          console.warn("[Supabase] Failed to delete doubt:", error.message);
        }
      } catch (err) {
        console.warn("[Supabase] deleteDoubt exception:", err);
      }
    },

    // ---------------- USER MEMBERSHIP & PAYMENTS ----------------

    /**
     * Fetch active membership for current logged-in user
     */
    async getUserMembership() {
      if (!this.isAuthenticated()) return null;

      const cacheKey = `indexindia_membership_${currentUser.id}`;
      let cached = null;
      try {
        cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
        if (cached && (cached.plan_type === "10min_recurring" || cached.plan_type === "test")) {
          localStorage.removeItem(cacheKey);
          cached = null;
        }
      } catch (e) {}

      let data = null;

      if (supabaseClient) {
        try {
          const { data: dbData, error } = await supabaseClient
            .from("user_memberships")
            .select("plan_type, status, amount_paid, valid_until, payment_id, updated_at")
            .eq("user_id", currentUser.id)
            .maybeSingle();

          if (!error && dbData) {
            data = dbData;
          }
        } catch (err) {
          console.warn("[Supabase] getUserMembership query exception:", err);
        }
      }

      if (!data && cached) {
        data = cached;
      }

      if (!data) return null;

      // Shut down testing codes: ignore and invalidate legacy test plans
      if (data.plan_type === "10min_recurring" || data.plan_type === "test") {
        data.status = "expired";
        try { localStorage.removeItem(cacheKey); } catch (e) {}
        return null;
      }

      // Handle real pass expiration (monthly / annual)
      if (data.valid_until) {
        const expiresAt = new Date(data.valid_until).getTime();
        const now = Date.now();
        if (now > expiresAt) {
          data.status = "expired";
        }
      }

      // Update cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {}

      return data;
    },

    /**
     * Record or update verified membership in Supabase
     */
    async recordMembership({ planType, paymentId, orderId, amountPaid, validUntil }) {
      if (!this.isAuthenticated()) return false;

      const cacheKey = `indexindia_membership_${currentUser.id}`;
      const payload = {
        user_id: currentUser.id,
        plan_type: planType,
        status: "active",
        amount_paid: amountPaid || 0,
        currency: "INR",
        payment_gateway: "razorpay",
        payment_id: paymentId || null,
        order_id: orderId || null,
        valid_until: validUntil || null,
        updated_at: new Date().toISOString()
      };

      try {
        localStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch (e) {}

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient
            .from("user_memberships")
            .upsert(payload, { onConflict: "user_id" });

          if (error) {
            console.warn("[Supabase] recordMembership upsert error:", error.message);
          }
        } catch (err) {
          console.warn("[Supabase] recordMembership exception:", err);
        }
      }

      return true;
    },

    /**
     * Cancel or stop membership immediately
     */
    async cancelUserMembership() {
      if (!this.isAuthenticated()) return false;

      const cacheKey = `indexindia_membership_${currentUser.id}`;
      const autoRenewKey = `indexindia_autorenew_${currentUser.id}`;
      try {
        localStorage.setItem(autoRenewKey, "false");
        localStorage.removeItem(cacheKey);
      } catch (e) {}

      if (supabaseClient) {
        try {
          const payload = {
            user_id: currentUser.id,
            status: "cancelled",
            valid_until: new Date(Date.now() - 1000).toISOString(),
            updated_at: new Date().toISOString()
          };
          await supabaseClient
            .from("user_memberships")
            .upsert(payload, { onConflict: "user_id" });
        } catch (err) {
          console.warn("[Supabase] cancelUserMembership exception:", err);
        }
      }

      return true;
    },

    /**
     * Toggle auto-renew state
     */
    setAutoRenew(enabled) {
      if (!currentUser) return false;
      const autoRenewKey = `indexindia_autorenew_${currentUser.id}`;
      try {
        localStorage.setItem(autoRenewKey, enabled ? "true" : "false");
      } catch (e) {}
      return true;
    },

    /**
     * Check if auto-renew is active
     */
    getAutoRenew() {
      if (!currentUser) return false;
      const autoRenewKey = `indexindia_autorenew_${currentUser.id}`;
      return localStorage.getItem(autoRenewKey) !== "false";
    },

    // ---------------- CUSTOM KEYBOARD SHORTCUTS CLOUD SYNC ----------------

    /**
     * Get user shortcuts from cloud account or local storage fallback
     */
    async getUserShortcuts() {
      // 1. Check local storage cache
      let localShortcuts = null;
      try {
        const raw = localStorage.getItem("indexindia_custom_shortcuts");
        if (raw) localShortcuts = JSON.parse(raw);
      } catch (e) {}

      // 2. If logged in, fetch from user account metadata
      if (currentUser && currentUser.user_metadata && currentUser.user_metadata.custom_shortcuts) {
        const cloudShortcuts = currentUser.user_metadata.custom_shortcuts;
        try {
          localStorage.setItem("indexindia_custom_shortcuts", JSON.stringify(cloudShortcuts));
        } catch (e) {}
        return cloudShortcuts;
      }

      // If user is authenticated but currentUser might need refreshing
      if (this.isAuthenticated() && supabaseClient) {
        try {
          const { data: { user } } = await supabaseClient.auth.getUser();
          if (user && user.user_metadata && user.user_metadata.custom_shortcuts) {
            currentUser = user;
            const cloudShortcuts = user.user_metadata.custom_shortcuts;
            try {
              localStorage.setItem("indexindia_custom_shortcuts", JSON.stringify(cloudShortcuts));
            } catch (e) {}
            return cloudShortcuts;
          }
        } catch (err) {
          console.warn("[Supabase] getUserShortcuts fetch error:", err);
        }
      }

      return localShortcuts;
    },

    /**
     * Save custom shortcuts to account (cloud sync) and local storage
     */
    async saveUserShortcuts(shortcutsMap) {
      if (!shortcutsMap || typeof shortcutsMap !== "object") return false;

      // 1. Save to local storage first (instant local persistence)
      try {
        localStorage.setItem("indexindia_custom_shortcuts", JSON.stringify(shortcutsMap));
      } catch (e) {}

      // 2. If authenticated, update user metadata in Supabase Auth
      if (this.isAuthenticated() && supabaseClient) {
        try {
          const { data, error } = await supabaseClient.auth.updateUser({
            data: {
              custom_shortcuts: shortcutsMap,
              shortcuts_updated_at: new Date().toISOString()
            }
          });

          if (!error && data?.user) {
            currentUser = data.user;
            return true;
          } else if (error) {
            console.warn("[Supabase] updateUser custom_shortcuts error:", error.message);
          }
        } catch (err) {
          console.warn("[Supabase] saveUserShortcuts exception:", err);
        }
      }

      return false;
    },

    /**
     * Reset shortcuts to default in local storage and account
     */
    async resetUserShortcuts() {
      try {
        localStorage.removeItem("indexindia_custom_shortcuts");
      } catch (e) {}

      if (this.isAuthenticated() && supabaseClient) {
        try {
          const { data, error } = await supabaseClient.auth.updateUser({
            data: {
              custom_shortcuts: null,
              shortcuts_updated_at: new Date().toISOString()
            }
          });
          if (!error && data?.user) {
            currentUser = data.user;
            return true;
          }
        } catch (err) {
          console.warn("[Supabase] resetUserShortcuts exception:", err);
        }
      }
      return true;
    }
  };

  // Attach to window
  window.IndexIndiaSupabase = IndexIndiaSupabase;

  // Auto-boot on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => IndexIndiaSupabase.boot());
  } else {
    IndexIndiaSupabase.boot();
  }
})();

