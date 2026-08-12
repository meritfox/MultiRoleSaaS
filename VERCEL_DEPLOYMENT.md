# Vercel Deployment Guide

This guide explains how to deploy the **OmniStud Multi-Role SaaS** app to Vercel from a GitHub repository.

---

## Prerequisites

1. A **GitHub repository** containing this project code.
2. A **Vercel account** (free tier is fine).
3. A **Firebase project** with:
   - Authentication → Email/Password provider enabled.
   - Cloud Firestore database created.
   - Firestore security rules deployed (see `firestore.rules`).
4. Your Firebase web app configuration values ready.

---

## Step 1: Push the latest code to GitHub

Make sure the code changes that fix the `auth/invalid-api-key` build error are committed and pushed to your repository:

```bash
git add .
git commit -m "fix: defer Firebase initialization to runtime"
git push origin main
```

> These changes make the static export build succeed even when Firebase env vars are not yet configured, but Firebase still needs the correct values to work in the browser.

---

## Step 2: Import your repository into Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New Project**.
3. Under **Import Git Repository**, find and select your GitHub repository (`meritfox/MultiRoleSaaS` or your fork).
4. Click **Import**.

---

## Step 3: Configure the project

On the **Configure Project** page:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Root Directory | `./` (default) |
| Build Command | `npm run build` (default) |
| Output Directory | `dist` (because `next.config.mjs` sets `distDir: 'dist'`) |
| Install Command | `npm install` (default) |

You do **not** need to change the framework preset. Vercel will detect Next.js automatically.

Click **Deploy**.

The first deploy will likely build successfully but the app will show warnings in the browser because Firebase is not configured yet. That is expected.

---

## Step 4: Add Firebase environment variables

After the project is created, go to **Project Settings → Environment Variables**.

Add the following variables using your real Firebase project values:

| Variable | Example Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyBA1LhWONnbUmEBsifNyNbwC4hOZqBdbZI` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `multirolesaas.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `multirolesaas` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `multirolesaas.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123456789:web:abcdef123456` |

### Where to find these values

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Click the gear icon → **Project settings**.
4. Scroll to **Your apps** and select the web app (`</>`).
5. Copy each value into the matching Vercel environment variable.

### Important notes

- Use **Production** environment for live deployments.
- Prefix `NEXT_PUBLIC_` is required so Next.js can inline these values into the client bundle.
- Do **not** wrap values in quotes.

---

## Step 5: Redeploy

1. In Vercel, go to your project.
2. Click **Deployments**.
3. Click the **Redeploy** button on the latest deployment.

Vercel will rebuild the project with the Firebase environment variables and the app will work in the browser.

---

## Step 6: Verify the deployment

1. Open the production URL shown by Vercel.
2. Open the browser console (**F12 → Console**).
3. Confirm you do **not** see:
   - `[Firebase] NEXT_PUBLIC_FIREBASE_API_KEY is missing...`
   - `Firebase: Error (auth/invalid-api-key)`
4. Try logging in with the demo credentials (if demo data seeding is enabled):
   - Admin: `admin@omnistud.com` / `demo123`
   - Teacher: `teacher@omnistud.com` / `demo123`
   - Parent: `parent@omnistud.com` / `demo123`
   - Student: `student@omnistud.com` / `demo123`
   - Transporter: `transporter@omnistud.com` / `demo123`

---

## Troubleshooting

### Build fails with `auth/invalid-api-key`

- You are using an older commit. Make sure the lazy Firebase initialization changes are pushed.
- Or, one of your `NEXT_PUBLIC_FIREBASE_*` values is wrong. Recopy them from Firebase Console.

### Build fails with `Expected first argument to collection() ...`

- You are using an older commit. Update to the latest code that uses lazy collection getters in `src/lib/services/`.

### App builds but Firebase features do not work

- Check browser console for the missing API key warning.
- Confirm all six environment variables are added under **Production** environment.
- Redeploy after adding or editing variables.

### Firestore permission errors

- Deploy the security rules from `firestore.rules` in the Firebase Console (Rules → Publish).
- Demo data seeding will fail silently with a permission error until rules allow writes.

---

## Optional: Deploy previews for pull requests

Vercel automatically creates preview deployments for every pull request. To test Firebase in previews, add the same environment variables to the **Preview** environment in **Project Settings → Environment Variables**.

---

## Need help?

If the build still fails after following these steps, share the full Vercel build log so the error can be diagnosed.