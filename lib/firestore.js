import { getFirebaseAdmin } from './firebaseAdmin.js';

let db;

export async function getFirestore() {
  try {
    if (!db) {
      const admin = getFirebaseAdmin();
      db = admin.firestore();
    }
    return db;
  } catch (e) {
    console.error('[firestore] init error:', e.message);
    throw new Error('Firestore not configured. Set Firebase env vars.');
  }
}

// MongoDB-like wrapper for Firestore
export const getDb = async () => {
  const firestore = await getFirestore();
  return {
    collection: (name) => ({
      countDocuments: async () => {
        const snap = await firestore.collection(name).limit(1).get();
        return snap.size > 0 ? 1 : 0; // simplified
      },
      findOne: async (filter) => {
        let query = firestore.collection(name);
        for (const [key, value] of Object.entries(filter)) {
          query = query.where(key, '==', value);
        }
        const snap = await query.limit(1).get();
        const doc = snap.docs[0];
        return doc ? { ...doc.data(), _id: doc.id } : null;
      },
      find: (filter = {}) => ({
        sort: (sortObj) => ({
          limit: (limit) => ({
            toArray: async () => {
              let query = firestore.collection(name);
              for (const [key, value] of Object.entries(filter)) {
                if (Array.isArray(value) && value.$in) {
                  query = query.where(key, 'in', value.$in);
                } else if (value && typeof value === 'object' && value.$ne) {
                  // Firestore doesn't support $ne natively, fetch and filter
                  const snap = await query.get();
                  return snap.docs
                    .map(d => ({ ...d.data(), _id: d.id }))
                    .filter(doc => doc[key] !== value.$ne)
                    .sort((a, b) => {
                      for (const [k, dir] of Object.entries(sortObj)) {
                        if (a[k] < b[k]) return dir === 1 ? -1 : 1;
                        if (a[k] > b[k]) return dir === 1 ? 1 : -1;
                      }
                      return 0;
                    })
                    .slice(0, limit);
                } else {
                  query = query.where(key, '==', value);
                }
              }
              for (const [key, dir] of Object.entries(sortObj)) {
                query = query.orderBy(key, dir === 1 ? 'asc' : 'desc');
              }
              const snap = await query.limit(limit).get();
              return snap.docs.map(d => ({ ...d.data(), _id: d.id }));
            }
          }),
          toArray: async () => {
            let query = firestore.collection(name);
            for (const [key, value] of Object.entries(filter)) {
              if (value && typeof value === 'object' && value.$regex) {
                // Regex search — fetch and filter client-side
                const snap = await query.get();
                const regex = new RegExp(value.$regex, value.$options || 'i');
                return snap.docs
                  .map(d => ({ ...d.data(), _id: d.id }))
                  .filter(doc => regex.test(doc[key]))
                  .sort((a, b) => {
                    for (const [k, dir] of Object.entries(sortObj)) {
                      if (a[k] < b[k]) return dir === 1 ? -1 : 1;
                      if (a[k] > b[k]) return dir === 1 ? 1 : -1;
                    }
                    return 0;
                  });
              }
              query = query.where(key, '==', value);
            }
            for (const [key, dir] of Object.entries(sortObj)) {
              query = query.orderBy(key, dir === 1 ? 'asc' : 'desc');
            }
            const snap = await query.get();
            return snap.docs.map(d => ({ ...d.data(), _id: d.id }));
          }
        }),
        toArray: async () => {
          let query = firestore.collection(name);
          for (const [key, value] of Object.entries(filter)) {
            if (Array.isArray(value) && value.$in) {
              query = query.where(key, 'in', value.$in);
            } else if (value && typeof value === 'object' && value.$regex) {
              const snap = await query.get();
              const regex = new RegExp(value.$regex, value.$options || 'i');
              return snap.docs
                .map(d => ({ ...d.data(), _id: d.id }))
                .filter(doc => regex.test(doc[key]));
            } else if (value && typeof value === 'object' && value.$ne) {
              const snap = await query.get();
              return snap.docs
                .map(d => ({ ...d.data(), _id: d.id }))
                .filter(doc => doc[key] !== value.$ne);
            } else {
              query = query.where(key, '==', value);
            }
          }
          const snap = await query.get();
          return snap.docs.map(d => ({ ...d.data(), _id: d.id }));
        }
      }),
      limit: (limit) => ({
        toArray: async () => {
          let query = firestore.collection(name);
          for (const [key, value] of Object.entries(filter)) {
            query = query.where(key, '==', value);
          }
          const snap = await query.limit(limit).get();
          return snap.docs.map(d => ({ ...d.data(), _id: d.id }));
        }
      }),
      insertOne: async (doc) => {
        const docRef = firestore.collection(name).doc(doc._id);
        await docRef.set(doc);
        return { insertedId: doc._id };
      },
      insertMany: async (docs) => {
        const batch = firestore.batch();
        docs.forEach(doc => {
          batch.set(firestore.collection(name).doc(doc._id), doc);
        });
        await batch.commit();
        return { insertedCount: docs.length };
      },
      updateOne: async (filter, update) => {
        const snap = await firestore.collection(name).where(Object.keys(filter)[0], '==', Object.values(filter)[0]).limit(1).get();
        if (snap.empty) return { modifiedCount: 0 };
        const doc = snap.docs[0];
        await doc.ref.update(update.$set || update);
        return { modifiedCount: 1 };
      },
      deleteOne: async (filter) => {
        const snap = await firestore.collection(name).where(Object.keys(filter)[0], '==', Object.values(filter)[0]).limit(1).get();
        if (snap.empty) return { deletedCount: 0 };
        await snap.docs[0].ref.delete();
        return { deletedCount: 1 };
      },
    }),
  };
};
