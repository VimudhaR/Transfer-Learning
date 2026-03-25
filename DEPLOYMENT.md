# Deployment Guide

## 1. Push Changes to GitHub

Your project is already a Git repository. To save your changes to GitHub:

1.  **Stage all changes:**
    ```bash
    git add .
    ```

2.  **Commit the changes:**
    ```bash
    git commit -m "feat: Enhanced UI, Batch Processing, and Fine-Tuning demo"
    ```

3.  **Push to main branch:**
    ```bash
    git push origin main
    ```

## 2. Backend Deployment (Supabase)

If you modified the backend (e.g., `index.ts`), you must redeploy the Edge Functions.
*(I have already done this for you in this session, but for future reference)*:

```bash
npx supabase functions deploy clinical-nlp-analysis --no-verify-jwt
```

## 3. Frontend Deployment

### Option A: Vercel (Recommended)
1.  Go to [Vercel.com](https://vercel.com) and sign up/login.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository (`clinical-nlp-platform` or similar).
4.  **Environment Variables:**
    *   Add `VITE_SUPABASE_URL`
    *   Add `VITE_SUPABASE_ANON_KEY`
    *   (Copy these values from your local `.env` file).
5.  Click **Deploy**.

### Option B: Netlify
1.  Go to [Netlify.com](https://netlify.com).
2.  "Add new site" -> "Import an existing project".
3.  Connect to GitHub and select your repo.
4.  Add the same Environment Variables in "Site settings".
5.  Deploy.

### Checking Deployment
Once deployed, your app will be live at a URL like `https://your-project.vercel.app`.
Ensure the **Supabase URL** and **Anon Key** are correctly set in the deployment platform, or the app won't connect to the backend!
