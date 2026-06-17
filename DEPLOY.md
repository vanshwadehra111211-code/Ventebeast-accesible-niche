# VENTEBEAST — Deployment Guide

## Architecture
- **Frontend + API**: Vercel (serverless)
- **Database**: MongoDB Atlas (free M0 tier)
- **Emails**: Resend (free 3K/mo)
- **Auth**: Custom JWT + Google OAuth

## Environment Variables (set these in Vercel Project Settings → Environment Variables)

| Variable | Example | Required |
|---|---|---|
| `MONGO_URL` | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` | Yes |
| `DB_NAME` | `ventebeast` | Yes |
| `JWT_SECRET` | long random string (run `openssl rand -base64 48`) | Yes |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `21140296197-xxx.apps.googleusercontent.com` | For Google login |
| `GOOGLE_CLIENT_ID` | same as above | For Google login |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxx` | For Google login |
| `RESEND_API_KEY` | `re_xxxxxxxx` | For email notifications |
| `ADMIN_EMAIL` | `vanshwadehra606@gmail.com` | Admin notification recipient |
| `FROM_EMAIL` | `VENTEBEAST <onboarding@resend.dev>` (or your verified domain) | Email "from" header |
| `NEXT_PUBLIC_BASE_URL` | `https://ventebeast.vercel.app` (or your custom domain) | Frontend URL |
| `RESEND_API_KEY` | `re_xxxxxxxx` | Email notifications |
| `NEXT_PUBLIC_HERO_VIDEO` | `https://your-site.com/hero.mp4` | Homepage video URL |

### Firebase alternative
- This app currently uses MongoDB. To migrate to Firebase, install `firebase-admin` and replace `lib/mongodb.js` plus all backend collection operations in `app/api/[[...path]]/route.js`.
- Set these env vars if you move to Firebase:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `FIREBASE_DATABASE_URL`

## Build settings (Vercel auto-detects)
- Framework: Next.js
- Build Command: `next build` (default)
- Output Directory: `.next` (default)
- Install Command: `yarn install`
- Node Version: 20.x

## Deploying on Vercel
1. Sign in at https://vercel.com and create a new project.
2. Import this Git repository.
3. Set the environment variables listed above in the Vercel dashboard.
4. If using Firebase instead of MongoDB, set the Firebase env vars and keep `MONGO_URL` only until migration is complete.
5. Deploy the project.

If you want to migrate existing MongoDB data into Firestore, run:

```bash
yarn migrate:firebase
```

Make sure your `.env` or deployment environment includes Firebase Admin credentials before running the migration.

## Post-deploy checklist
1. ✅ Visit your live URL — homepage should load
2. ✅ Visit `/api/products` — should return JSON
3. ✅ Register a new account with email/password
4. ✅ Update Google OAuth Authorized JavaScript Origins to include your live URL
5. ✅ Place a test order — verify it shows in `/admin` and email arrives
