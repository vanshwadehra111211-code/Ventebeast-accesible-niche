# Firebase Migration Guide

This project currently uses MongoDB. If you want to migrate to Firebase, follow the steps below.

## 1. Environment variables

Add these values to your `.env` or deployment settings:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_DATABASE_URL`

Also keep these for current features:

- `RESEND_API_KEY`
- `NEXT_PUBLIC_HERO_VIDEO`

## 2. Install Firebase Admin SDK

```bash
yarn add firebase-admin
```

## 3. Create `lib/firebase.js`

Example initializer:

```js
import admin from 'firebase-admin';

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });
}

export const firestore = admin.firestore();
export const authAdmin = admin.auth();
```

## 4. Migrate `lib/mongodb.js`

Replace the Mongo helper with a Firebase helper that exports `firestore`.

## 5. Migrate API routes

Current backend routes expect Mongo collections such as `products`, `users`, `orders`, `reviews`, `coupons`, and `collections`.

You will need to rewrite the following patterns:

- `db.collection('products').find(...)`
- `db.collection('users').findOne(...)`
- `db.collection('orders').insertOne(...)`
- `db.collection('products').updateOne(...)`

Use Firestore collections instead:

```js
const productsRef = firestore.collection('products');
const snapshot = await productsRef.where('slug', '==', slug).limit(1).get();
```

## 6. Data model suggestions

Use Firestore collections with documents keyed by `_id` or auto-generated IDs.

Example collections:

- `users`
- `products`
- `orders`
- `reviews`
- `coupons`
- `collections`

## 7. Hero video placement

This app already reads `NEXT_PUBLIC_HERO_VIDEO` in `app/page.js`.

Add your direct video URL here:

```env
NEXT_PUBLIC_HERO_VIDEO=https://example.com/path/to/hero.mp4
```

Use a public MP4 or streaming URL. Gemini share pages are not direct video file URLs, so the video tag will not load from that page.

## 8. Deploy notes

- For production, do not commit `FIREBASE_PRIVATE_KEY` to source control.
- Use deployment platform secrets to set `RESEND_API_KEY`, Firebase credentials, and `JWT_SECRET`.
- If you keep Mongo as backup, keep `MONGO_URL` and `DB_NAME` until the migration is complete.

## 9. Run the migration script

A script has been added at `scripts/migrate-mongo-to-firestore.js`.

1. Fill in your `.env` or use environment variables for Mongo and Firebase service account values.
2. Run:

```bash
yarn migrate:firebase
```

3. Verify Firestore collections in the Firebase console.
4. Deploy on Vercel with the same Firebase env vars set.
