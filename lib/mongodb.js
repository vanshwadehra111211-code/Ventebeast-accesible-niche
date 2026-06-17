import { MongoClient } from 'mongodb';
import admin from 'firebase-admin';
import { v4 as uuid } from 'uuid';

const useFirebase = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

let client;
let clientPromise;
let firestore;
let dbName = process.env.DB_NAME || 'ventebeast';

const getNested = (obj, path) => {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
};

const setNested = (obj, path, value) => {
  const parts = path.split('.');
  const last = parts.pop();
  let current = obj;
  for (const part of parts) {
    if (current[part] == null || typeof current[part] !== 'object') current[part] = {};
    current = current[part];
  }
  current[last] = value;
  return obj;
};

const matchesFilter = (doc, filter) => {
  if (!filter || Object.keys(filter).length === 0) return true;
  return Object.entries(filter).every(([key, value]) => {
    if (key === '$or') return value.some((sub) => matchesFilter(doc, sub));
    if (key === '$and') return value.every((sub) => matchesFilter(doc, sub));
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (value.$ne !== undefined) return getNested(doc, key) !== value.$ne;
      if (value.$in !== undefined) return value.$in.includes(getNested(doc, key));
      if (value.$nin !== undefined) return !value.$nin.includes(getNested(doc, key));
      if (value.$regex !== undefined) {
        const re = new RegExp(value.$regex, value.$options || 'i');
        return re.test(String(getNested(doc, key) || ''));
      }
      return Object.entries(value).every(([op, val]) => {
        if (op === '$ne') return getNested(doc, key) !== val;
        if (op === '$in') return val.includes(getNested(doc, key));
        if (op === '$nin') return !val.includes(getNested(doc, key));
        if (op === '$regex') {
          const re = new RegExp(val, value.$options || 'i');
          return re.test(String(getNested(doc, key) || ''));
        }
        return getNested(doc, key) === val;
      });
    }
    return getNested(doc, key) === value;
  });
};

const applyProjection = (doc, projection) => {
  if (!projection) return doc;
  const result = { ...doc };
  const hideKeys = Object.entries(projection).filter(([, value]) => value === 0).map(([key]) => key);
  hideKeys.forEach((key) => {
    const parts = key.split('.');
    if (parts.length === 1) {
      delete result[key];
    } else {
      const last = parts.pop();
      const parent = getNested(result, parts.join('.'));
      if (parent && typeof parent === 'object') delete parent[last];
    }
  });
  return result;
};

const compareValues = (a, b, direction) => {
  if (a === b) return 0;
  if (a == null) return 1 * direction;
  if (b == null) return -1 * direction;
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b) * direction;
  return a > b ? 1 * direction : -1 * direction;
};

const applyUpdate = (doc, update, filter = {}) => {
  let next = { ...doc };
  if (update.$set) {
    for (const [key, value] of Object.entries(update.$set)) {
      if (key.includes('.$.')) {
        const [arrayPath, fieldPath] = key.split('.$.');
        const array = getNested(next, arrayPath);
        const matchKey = Object.keys(filter).find((k) => k.startsWith(`${arrayPath}.`));
        if (Array.isArray(array) && matchKey) {
          const matchValue = filter[matchKey];
          const fieldName = matchKey.split('.').slice(1).join('.');
          next[arrayPath] = array.map((item) => item[fieldName] === matchValue ? { ...item, [fieldPath]: value } : item);
        }
      } else {
        setNested(next, key, value);
      }
    }
  }
  if (update.$inc) {
    for (const [key, value] of Object.entries(update.$inc)) {
      if (key.includes('.$.')) {
        const [arrayPath, fieldPath] = key.split('.$.');
        const array = getNested(next, arrayPath);
        const matchKey = Object.keys(filter).find((k) => k.startsWith(`${arrayPath}.`));
        if (Array.isArray(array) && matchKey) {
          const fieldName = matchKey.split('.').slice(1).join('.');
          const matchValue = filter[matchKey];
          next[arrayPath] = array.map((item) => item[fieldName] === matchValue ? { ...item, [fieldPath]: (item[fieldPath] || 0) + value } : item);
        }
      } else {
        const current = getNested(next, key) || 0;
        setNested(next, key, current + value);
      }
    }
  }
  if (update.$addToSet) {
    for (const [key, value] of Object.entries(update.$addToSet)) {
      const arr = getNested(next, key) || [];
      if (Array.isArray(arr) && !arr.includes(value)) {
        setNested(next, key, [...arr, value]);
      }
    }
  }
  if (update.$pull) {
    for (const [key, value] of Object.entries(update.$pull)) {
      const arr = getNested(next, key) || [];
      if (Array.isArray(arr)) {
        setNested(next, key, arr.filter((item) => item !== value));
      }
    }
  }
  return next;
};

const sortDocs = (docs, sortSpec) => {
  const entries = Object.entries(sortSpec || {});
  if (!entries.length) return docs;
  return [...docs].sort((a, b) => {
    for (const [key, direction] of entries) {
      const aValue = getNested(a, key);
      const bValue = getNested(b, key);
      const cmp = compareValues(aValue, bValue, direction === -1 ? -1 : 1);
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
};

class FirestoreCursor {
  constructor(items) {
    this.items = items;
  }
  sort(sortSpec) {
    this.items = sortDocs(this.items, sortSpec);
    return this;
  }
  limit(count) {
    this.items = this.items.slice(0, count);
    return this;
  }
  async toArray() {
    return this.items;
  }
}

class FirestoreCollection {
  constructor(name) {
    this.ref = firestore.collection(name);
  }
  async find(filter = {}, opts = {}) {
    const snapshot = await this.ref.get();
    let items = snapshot.docs.map((doc) => doc.data());
    items = items.filter((item) => matchesFilter(item, filter));
    if (opts.projection) items = items.map((item) => applyProjection(item, opts.projection));
    if (opts.sort) items = sortDocs(items, opts.sort);
    if (opts.limit) items = items.slice(0, opts.limit);
    return new FirestoreCursor(items);
  }
  async findOne(filter = {}, opts = {}) {
    const cursor = await this.find(filter, opts);
    const items = await cursor.limit(1).toArray();
    return items[0] || null;
  }
  async insertOne(doc) {
    const id = doc._id || uuid();
    const data = { ...doc, _id: id };
    await this.ref.doc(id).set(data);
    return { insertedId: id };
  }
  async insertMany(docs) {
    for (const doc of docs) await this.insertOne(doc);
    return { insertedCount: docs.length };
  }
  async updateOne(filter, update, opts = {}) {
    let doc = await this.findOne(filter);
    if (!doc) {
      if (!opts.upsert) return { matchedCount: 0, modifiedCount: 0 };
      const id = filter._id || uuid();
      doc = { _id: id, ...filter };
    }
    const updated = applyUpdate(doc, update, filter);
    await this.ref.doc(updated._id).set(updated);
    return { matchedCount: 1, modifiedCount: 1 };
  }
  async deleteOne(filter) {
    const doc = await this.findOne(filter);
    if (!doc) return { deletedCount: 0 };
    await this.ref.doc(doc._id).delete();
    return { deletedCount: 1 };
  }
  async countDocuments(filter = {}) {
    const docs = await this.find(filter);
    const items = await docs.toArray();
    return items.length;
  }
}

if (useFirebase) {
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  firestore = admin.firestore();
} else {
  const uri = process.env.MONGO_URL;
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
}

export async function getDb() {
  if (useFirebase) return { collection: (name) => new FirestoreCollection(name) };
  const c = await clientPromise;
  return c.db(dbName);
}

export function isFirebaseEnabled() {
  return useFirebase;
}
