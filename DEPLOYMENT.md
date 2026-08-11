# OmniStud - Deployment Guide

This guide explains how to set up, build, and deploy the OmniStud Multi-Role Education SaaS to GitHub Pages using GitHub Actions.

---

## 1. Repository Overview

- **Repository:** `https://github.com/meritfox/MultiRoleSaaS`
- **Branch:** `main`
- **Framework:** Next.js 16 (App Router)
- **Frontend:** React 19, TypeScript, Tailwind CSS v4
- **Backend / Auth / DB:** Firebase Authentication + Firestore
- **Deployment target:** GitHub Pages (static export)

---

## 2. Local Development Setup

### 2.1 Clone the Repository

Open Git Bash (or any terminal) and run:

```bash
git clone https://github.com/meritfox/MultiRoleSaaS.git
cd MultiRoleSaaS
```

### 2.2 Install Dependencies

```bash
npm install
```

> The project includes a `package-lock.json`. You can also use `npm ci` for a clean install.

### 2.3 Add Environment Variables

Create a `.env.local` file in the project root. Use the values from your Firebase project:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBA1LhWONnbUmEBsifNyNbwC4hOZqBdbZI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=multirolesaas.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=multirolesaas
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=multirolesaas.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=888460259773
NEXT_PUBLIC_FIREBASE_APP_ID=1:888460259773:web:34908ef1c05948842d62d4
```

For local development you do **not** need `NEXT_PUBLIC_BASE_PATH`.

### 2.4 Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 3. Firebase Setup (already configured in workspace)

If you ever create a new Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Enable **Authentication** ? **Email/Password** provider.
4. Enable **Cloud Firestore** database.
5. Register a **Web App** and copy the config values into `.env.local`.
6. Deploy the included Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

> `firebase` CLI must be installed globally: `npm install -g firebase-tools`.

---

## 4. Build Locally (Optional)

To verify the static export works on your machine:

```bash
npm run build
```

The static files will be output to the `dist/` directory.

If the build succeeds, the GitHub Actions workflow should also succeed.

---

## 5. Deploy to GitHub Pages

The repository already includes `.github/workflows/deploy.yml`. After setup, every push to `main` will automatically build and deploy the site.

### 5.1 Configure GitHub Pages

1. Open your repository on GitHub: `https://github.com/meritfox/MultiRoleSaaS`
2. Go to **Settings ? Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.

### 5.2 Add Repository Variables

GitHub Action needs your Firebase config values as **repository variables** (not secrets), because they are used at build time.

1. Go to **Settings ? Secrets and variables ? Actions ? Variables**.
2. Click **New repository variable**.
3. Add the following variables using your Firebase values:

| Variable Name | Example Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyBA1LhWONnbUmEBsifNyNbwC4hOZqBdbZI` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `multirolesaas.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `multirolesaas` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `multirolesaas.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `888460259773` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:888460259773:web:34908ef1c05948842d62d4` |

4. Also add the base path variable:

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_BASE_PATH` | `/MultiRoleSaaS` |

> `NEXT_PUBLIC_BASE_PATH` is required because GitHub Pages serves project repos under a subpath (`https://meritfox.github.io/MultiRoleSaaS/`).

### 5.3 Push the Code

```bash
git add .
git commit -m "Deploy OmniStud to GitHub Pages"
git push origin main
```

If Git Bash asks for login, enter your GitHub credentials or personal access token.

### 5.4 Monitor the Deployment

1. Go to the **Actions** tab in your repository.
2. Click the latest workflow run.
3. Wait for both the **build** and **deploy** jobs to turn green.
4. Once the deploy job finishes, your site will be live at:

```
https://meritfox.github.io/MultiRoleSaaS/
```

---

## 6. Demo Login Accounts

The app seeds demo accounts on first load:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@omnistud.com` | `demo123` |
| Teacher | `teacher@omnistud.com` | `demo123` |
| Transporter | `transporter@omnistud.com` | `demo123` |
| Student | `student@omnistud.com` | `demo123` |
| Parent | `parent@omnistud.com` | `demo123` |

---

## 7. Project Structure

```
MultiRoleSaaS/
+-- .github/workflows/deploy.yml   # GitHub Actions CI/CD
+-- public/                        # Static assets
+-- src/
¦   +-- app/                       # Next.js app router pages
¦   +-- components/                # Reusable UI components
¦   +-- lib/                       # Firebase, auth, utilities
¦   +-- types/                     # TypeScript type definitions
+-- firestore.rules                # Firestore security rules
+-- next.config.mjs               # Next.js static export config
+-- package.json                  # Dependencies and scripts
+-- README.md                     # Project overview
```

---

## 8. Troubleshooting

### Build fails with Firebase errors
- Make sure all 6 `NEXT_PUBLIC_FIREBASE_*` variables are added as repository variables.
- Variables (not secrets) are required because Next.js reads them during `next build`.

### Site loads but assets/CSS are missing (404 errors)
- Make sure `NEXT_PUBLIC_BASE_PATH` is set to `/MultiRoleSaaS` in repository variables.
- Make sure `next.config.mjs` contains `basePath: process.env.NEXT_PUBLIC_BASE_PATH || ''`.

### GitHub Pages shows 404 on all routes except home
- Next.js static export with `trailingSlash: true` creates folders like `/login/index.html`.
- GitHub Pages supports this pattern by default when using GitHub Actions upload.

### Push asks for password repeatedly
- In Git Bash a credential popup may appear. Enter your GitHub username and personal access token (not password).
- Or configure HTTPS credentials:

```bash
git config --global credential.helper cache
git config --global credential.helper store
```

### Firestore permission errors
- Deploy the security rules:

```bash
firebase deploy --only firestore:rules
```

---

## 9. Next Steps

1. Visit the live site after deployment.
2. Log in with a demo account.
3. Review Firestore rules before production use.
4. Consider adding Google Analytics, custom domain, or Progressive Web App support.

For more details, see the [Next.js static export docs](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports) and [GitHub Pages docs](https://docs.github.com/en/pages).
