# Deploy to Vercel

The project is set up for Vercel: `vercel.json` and a Vite build that outputs to `dist/`.

## Option 1: Connect GitHub (recommended)

1. Go to [vercel.com](https://vercel.com) and sign in (or create an account).
2. Click **Add New…** → **Project**.
3. **Import** your Git repository (`atharvachaudhari1/WT` or your fork).
4. Vercel will detect Vite. Use:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**. Future pushes to `main` will trigger automatic deploys.

## Option 2: Vercel CLI

1. Log in and deploy from the project folder:
   ```bash
   npx vercel login
   npx vercel --prod
   ```
2. Follow the prompts (link to existing project or create a new one).

---

## 3. Set the API URL (required for the app to work)

The dashboard and login call a **backend API**. On Vercel we only deploy the frontend; the API is hosted on Cloudflare Workers.

In your **Vercel project**: **Settings** → **Environment Variables** → Add:

- **Name:** `VITE_API_URL`
- **Value:** your backend API base URL (e.g. `https://wt2.btsjungarmy2007.workers.dev/api`)

Then **Redeploy** so the build uses it. Without this, the app tries `https://your-domain:3000/api` and all requests fail.
