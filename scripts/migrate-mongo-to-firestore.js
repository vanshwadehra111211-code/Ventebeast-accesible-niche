const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');
const { v4: uuid } = require('uuid');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=').trim();
    if (!key) continue;
    const parsed = value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    if (process.env[key] === undefined) process.env[key] = parsed;
  }
}

loadDotEnv(envPath);

const required = [
  'MONGO_URL',
  'DB_NAME',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_DATABASE_URL',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error('Missing required env vars:', missing.join(', '));
  console.error('Create a .env file or set env variables before running this script.');
  process.exit(1);
}

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});

const firestore = admin.firestore();
const client = new MongoClient(mongoUrl);

const collections = [
  'users',
  'products',
  'orders',
  'reviews',
  'coupons',
  'collections',
  'settings',
];

const normalizeDoc = (doc) => {
  const normalized = { ...doc };
  if (normalized._id && typeof normalized._id !== 'string') {
    normalized._id = normalized._id.toString();
  }
  if (!normalized._id) {
    normalized._id = uuid();
  }
  return normalized;
};

async function migrateCollection(db, name) {
  const mongoColl = db.collection(name);
  const docs = await mongoColl.find({}).toArray();
  if (!docs.length) {
    console.log(`- ${name}: no documents to migrate`);
    return 0;
  }

  let count = 0;
  let batch = firestore.batch();
  for (const doc of docs) {
    const normalized = normalizeDoc(doc);
    const docId = normalized._id;
    delete normalized._id;
    const ref = firestore.collection(name).doc(docId);
    batch.set(ref, { _id: docId, ...normalized });
    count += 1;
    if (count % 400 === 0) {
      await batch.commit();
      batch = firestore.batch();
    }
  }
  if (count % 400 !== 0) {
    await batch.commit();
  }

  console.log(`- ${name}: migrated ${count} documents`);
  return count;
}

async function main() {
  console.log('Starting MongoDB to Firestore migration');
  await client.connect();
  const db = client.db(dbName);

  for (const collection of collections) {
    await migrateCollection(db, collection);
  }

  await client.close();
  console.log('Migration complete. Verify your Firestore console and app behavior.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
