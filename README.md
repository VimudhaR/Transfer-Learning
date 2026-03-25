# Transfer-Learning
My Final year  group project implementing transfer learning for image classification using a pre-trained deep learning model, fine-tuned on a custom dataset.
Clinical NLP System (Breast Cancer Analysis)

A React + TypeScript web application designed to analyze clinical text related to breast cancer using advanced Natural Language Processing (NLP) models.
This system processes clinical notes and extracts meaningful insights using AI-powered analysis.

Project Type: Final Year Group Project

Tech Stack
Frontend: React + TypeScript
Backend: Supabase
NLP Models: Hugging Face
Deployment: Vercel / Netlify
Prerequisites

Before running the project, install the following:

Node.js – https://nodejs.org
Git – https://git-scm.com
Supabase Account – https://supabase.com
Hugging Face Account – https://huggingface.co
Installation Guide
1. Clone the Repository

Open CMD / PowerShell / Terminal and run:

git clone https://github.com/ShreehariMenon/TL_MP.git
cd TL_MP
2. Install Dependencies
npm install
Backend Setup (Supabase)
Go to https://database.new
Create a New Project
Navigate to:
Settings → API

Copy the following:

Project URL
Anon Public Key
Configure Local Environment

Copy the example environment file:

cp .env.example .env

Windows CMD:

copy .env.example .env

Open .env and update the following values:

VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
Setup AI Models (Hugging Face)
Generate a token from:

https://huggingface.co/settings/tokens

Login to Supabase CLI
npx supabase login
Link Local Project to Supabase
npx supabase link --project-ref your_project_ref_id

Example:

https://abcdefgh.supabase.co

Project reference ID = abcdefgh

Set API Secret
npx supabase secrets set HUGGING_FACE_API_KEY=hf_your_token_here
Deploy Backend Function
npx supabase functions deploy clinical-nlp-analysis --no-verify-jwt
Running the Application

Start the development server:

npm run dev

Open in browser:

http://localhost:5173
Deployment

You can deploy the project using Vercel or Netlify.

Option 1: Vercel (Recommended)
Push your code to GitHub
Go to https://vercel.com
Sign in with GitHub
Click Add New Project
Select this repository

Add the following Environment Variables:

VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

Click Deploy

Your app will be available at:

https://your-project-name.vercel.app
Option 2: Netlify
Go to https://netlify.com
Sign up or login
Deploy using one of the methods:
Option A — GitHub Integration

Connect your GitHub repository and deploy.

Option B — Manual Deployment

Build the project:

npm run build

Upload the dist folder to Netlify.

Add environment variables under:

Site Settings → Build & Deploy → Environment
