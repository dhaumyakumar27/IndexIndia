# ⚡ IndexIndia — Cloudflare Worker + Google Gemini AI Setup

This Cloudflare Worker allows any visitor on your static GitHub Pages site to use **Google Gemini AI** in the Doubt Solver with **zero API keys and zero configuration required on their end**.

---

## 🚀 3-Minute Deployment Steps (100% Free Forever)

### Step 1: Create a Free Cloudflare Account & Worker
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/) and log in (or sign up for free).
2. On the left sidebar, click **Compute (Workers) > Workers & Pages**.
3. Click the blue **Create application** button $\rightarrow$ click **Create Worker**.
4. Give your worker a name (e.g. `indexindia-doubt-solver`).
5. Click **Deploy**.

---

### Step 2: Paste the Worker Code
1. Once deployed, click **Edit code** (or **Quick Edit**).
2. Select all existing boilerplate code and delete it.
3. Open `worker.js` from this folder, copy all code, and paste it into the Cloudflare code editor.
4. Click **Deploy** (top right).

---

### Step 3: Add Your Secret Gemini API Key
1. Go back to your Worker's main dashboard in Cloudflare.
2. Click the **Settings** tab at the top.
3. On the left menu, click **Variables and Secrets** (or **Variables**).
4. Click **Add** under *Secrets* / *Environment Variables*:
   - **Variable name**: `GEMINI_API_KEY`
   - **Value**: Your Google Gemini API key (the one you generated at Google AI Studio)
   - Click **Encrypt** / **Save and Deploy**.

---

### Step 4: Connect the Worker to Your Website
1. On your Worker overview page, copy your Worker's public URL. It looks like:
   `https://indexindia-doubt-solver.<your-subdomain>.workers.dev`
2. Open `script.js` in your `IndexIndia` repository.
3. Find the line:
   ```javascript
   const CLOUDFLARE_WORKER_URL = "";
   ```
4. Paste your Worker URL between the quotes:
   ```javascript
   const CLOUDFLARE_WORKER_URL = "https://indexindia-doubt-solver.<your-subdomain>.workers.dev";
   ```
5. Commit and push to GitHub!

---

## 🛡️ Why This Architecture is Best:
- **Zero-Setup for Readers**: Any visitor simply presses `M`, types their question, and receives an intelligent answer.
- **Key Protection**: Your private API key is encrypted on Cloudflare's servers. Visitors can never see or steal it.
- **100% Free**:
  - Cloudflare Workers: 100,000 requests/day ($0.00).
  - Google Gemini: 1,500 queries/day ($0.00).
