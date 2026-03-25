# Supabase Setup Instructions

The "Failed to fetch" error occurs because the application is trying to connect to a Supabase project that doesn't exist. You need to create your own free Supabase project and connect it.

## Step 1: Create a Supabase Project

1.  Go to [database.new](https://database.new) and sign up/log in to Supabase.
2.  Click **New Project**.
3.  Name it **"Clinical NLP"** (or anything you like).
4.  Set a database password and choose a region near you.
5.  Click **Create user**.

## Step 2: Get Your Credentials

1.  Once your project is ready (it takes a minute), go to **Settings** (the gear icon similar to ⚙️) in the sidebar.
2.  Click on **API**.
3.  You will see `Project URL` and `anon public` key. Keep this tab open.

## Step 3: Configure Your Local Environment

1.  Open the file named `.env` in your project folder (`d:\Major Project\ProjBolt`).
2.  Replace the existing contents with your new details:

    ```env
    VITE_SUPABASE_URL=https://your-project-id.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key-from-dashboard
    ```

    *Replace `https://your-project-id.supabase.co` with the **Project URL** from Step 2.*
    *Replace `your-anon-key-from-dashboard` with the **anon public** key from Step 2.*

3.  Save the file.

## Step 3.5: Get a Hugging Face API Key (For Real ML)

To use real AI models, you need a free API token from Hugging Face.

1.  Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
2.  Create a new token (type: "Read").
3.  Add it to your `.env` file:
    ```env
    HUGGING_FACE_API_KEY=hf_your_token_here
    ```

4.  **IMPORTANT:** You must also set this key in your Supabase cloud project so the deployed function can see it:
    ```bash
    npx supabase secrets set HUGGING_FACE_API_KEY=hf_your_token_here
    ```

## Step 4: Deploy the Backend Functions

The AI analysis logic lives in your local `supabase/functions` folder. You need to upload this to your new cloud project.

1.  Open your terminal (Command Prompt or PowerShell) and run:
    ```bash
    npx supabase login
    ```
    *(Press Enter to open your browser and authorize the CLI)*

2.  Link your local project to your cloud project:
    ```bash
    npx supabase link --project-ref <your-project-ref>
    ```
    *Replace `<your-project-ref>` with the reference ID found in your Project URL (e.g., if your URL is `https://abcdefghijklm.supabase.co`, your ref is `abcdefghijklm`).*

3.  Deploy the function:
    ```bash
    npx supabase functions deploy clinical-nlp-analysis --no-verify-jwt
    ```

## Step 5: Restart the Application

1.  Stop the running server (Ctrl+C in the terminal).
2.  Run `npm run dev` again.
3.  Reload the browser page. The error should be gone!
