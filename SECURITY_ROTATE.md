Immediate actions after accidental secret exposure

1) Rotate exposed credentials now
   - Firebase service account: Console → Project Settings → Service accounts → Manage keys → Delete the compromised key → Create new key.
   - Google OAuth client secret / client ID: Console → APIs & Services → Credentials → find the OAuth client → Regenerate secret or create a new client.
   - Razorpay keys: Log in to Razorpay dashboard and rotate API keys.

2) Remove secrets from the repository
   - Ensure `.env`, `.env.local`, and any files that contained secrets are removed or sanitized (this repo now has `.env` sanitized).
   - Add any secret files to `.gitignore` (already present in this repo).

3) Add new secrets to your deployment environment
   - Vercel: Project → Settings → Environment Variables → add the new values (FIREBASE_PRIVATE_KEY as single-line with `\n` for newlines).
   - For local testing create `.env.local` (do NOT commit)

4) Verify and redeploy
   - Redeploy the application so the backend picks up the new service account key.
   - Test sign-in flow: sign in via site and confirm `POST /api/auth/google` returns an app token and a logged-in session.

5) Audit
   - Review access logs for suspicious activity if possible.

If you want, I can prepare the exact Vercel env add commands and a `.env.local` template (without secrets) for you to paste the new keys into.