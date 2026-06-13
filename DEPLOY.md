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

## Build settings (Vercel auto-detects)
- Framework: Next.js
- Build Command: `next build` (default)
- Output Directory: `.next` (default)
- Install Command: `yarn install`
- Node Version: 20.x

## Post-deploy checklist
1. ✅ Visit your live URL — homepage should load
2. ✅ Visit `/api/products` — should return JSON
3. ✅ Register a new account with email/password
4. ✅ Update Google OAuth Authorized JavaScript Origins to include your live URL
5. ✅ Place a test order — verify it shows in `/admin` and email arrives
