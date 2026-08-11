# OmniStud - Multi-Role Education SaaS

A Next.js + Firebase application that connects Students, Parents, Teachers, Transporters, and Admins in one education ecosystem. Features include role-based dashboards, service listings, service requests, demo payments with escrow, transport GPS check-ins, notifications, and an admin control panel.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend / Auth:** Firebase Authentication
- **Database:** Firebase Firestore
- **Deployment:** GitHub Pages (via GitHub Actions static export)

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/meritfox/MultiRoleSaaS.git
cd MultiRoleSaas
npm install
```

### 2. Firebase Configuration

Create a Firebase project and enable **Authentication** (Email/Password) and **Cloud Firestore**.

Create a `.env.local` file in the project root with your Firebase web app credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Deploy Firestore Security Rules

This project includes `firestore.rules`. Deploy them before running the app:

```bash
firebase deploy --only firestore:rules
```

> **Note:** The included rules allow authenticated users to manage their own data and allow public read access to app settings/subscription plans. Review and tighten before production.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Demo Login

The app seeds demo accounts on first load. Use any of the following:

| Role          | Email                       | Password |
|---------------|-----------------------------|----------|
| Admin         | admin@omnistud.com          | demo123  |
| Teacher       | teacher@omnistud.com        | demo123  |
| Transporter   | transporter@omnistud.com    | demo123  |
| Student       | student@omnistud.com        | demo123  |
| Parent        | parent@omnistud.com         | demo123  |

## Build & Deploy to GitHub Pages

The repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

### Setup

1. Push this repo to `https://github.com/meritfox/MultiRoleSaaS.git`.
2. In your GitHub repository, go to **Settings > Pages** and set the source to **GitHub Actions**.
3. Add your Firebase config as **repository variables** (not secrets) under **Settings > Secrets and variables > Actions > Variables**:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
4. If your GitHub Pages URL includes the repository name (e.g. `https://meritfox.github.io/MultiRoleSaaS/`), also add a repository variable `NEXT_PUBLIC_BASE_PATH` with value `/MultiRoleSaaS`.

### Trigger Deployment

Any push to `main` will trigger the workflow:

```bash
git add .
git commit -m "Initial complete build"
git push origin main
```

You can also run a local static build:

```bash
npm run build
```

The static export is output to the `dist/` directory.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── admin/dashboard/    # Admin overview, users, escrow, subscriptions
│   ├── parent/dashboard/   # Parent overview, payments, services, tracking
│   ├── provider/dashboard/ # Provider services, requests, earnings, check-in
│   ├── student/dashboard/  # Student services, requests, tracking
│   ├── login/              # Login page
│   ├── register/           # Multi-step registration + payment
│   └── page.tsx            # Public landing page
├── components/             # Reusable UI & layout components
├── lib/
│   ├── firebase.ts         # Firebase app initialization
│   ├── auth-context.tsx    # Global auth state
│   ├── auth-utils.ts       # Auth & profile helpers
│   └── services/           # Firestore service modules
│       ├── services.ts     # Services & requests
│       ├── payments.ts     # Payments & escrow
│       ├── users.ts        # User management & child linking
│       └── transport.ts    # GPS check-ins
├── types/index.ts          # Shared TypeScript types
firestore.rules             # Firestore security rules
next.config.mjs             # Next.js static export config
.github/workflows/deploy.yml # GitHub Actions CI/CD
```

## Key Features

- **Role-based access control:** Separate dashboards for Admin, Provider, Student, and Parent.
- **Service marketplace:** Providers create services; students request them.
- **Real-time notifications:** Request approvals and alerts are stored in Firestore and streamed to users.
- **Escrow & payments:** Demo payment gateway creates held escrow transactions; admins can release or refund.
- **Transport tracking:** Providers record GPS check-ins/check-outs; parents and students view them.
- **Admin control panel:** Manage users, platform settings, subscription plans, and escrow transactions.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
