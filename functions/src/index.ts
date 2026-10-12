import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Helper function to verify admin privileges
async function verifyAdmin(auth: any) {
  if (!auth || !auth.uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const userDoc = await db.collection("users").doc(auth.uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== "ADMIN" || userDoc.data()?.status === "Disabled") {
    throw new HttpsError("permission-denied", "User does not have admin privileges.");
  }
}

export const adminCreateUser = onCall(async (request) => {
  await verifyAdmin(request.auth);

  const { email, password, fullName } = request.data;
  
  if (!email || !password || !fullName) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
    });
    
    return { uid: userRecord.uid };
  } catch (error: any) {
    console.error("Error creating user:", error);
    throw new HttpsError("internal", error.message || "Failed to create user");
  }
});

export const adminUpdatePassword = onCall(async (request) => {
  await verifyAdmin(request.auth);

  const { uid, password } = request.data;
  
  if (!uid || !password) {
    throw new HttpsError("invalid-argument", "Missing uid or password.");
  }

  try {
    await admin.auth().updateUser(uid, { password });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating password:", error);
    throw new HttpsError("internal", error.message || "Failed to update password");
  }
});

export const adminDeleteUser = onCall(async (request) => {
  await verifyAdmin(request.auth);

  const { uid } = request.data;
  
  if (!uid) {
    throw new HttpsError("invalid-argument", "Missing uid.");
  }

  try {
    await admin.auth().deleteUser(uid);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    throw new HttpsError("internal", error.message || "Failed to delete user");
  }
});

// Verify whether the current Firebase session has been revoked
export const verifySession = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { idToken } = request.data || {};

  if (!idToken || typeof idToken !== "string") {
    throw new HttpsError("invalid-argument", "Missing ID token.");
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken, true);

    if (decoded.uid !== request.auth.uid) {
      throw new HttpsError("permission-denied", "Token user mismatch.");
    }

    const profile = await db.collection('users').doc(decoded.uid).get();
    if (!profile.exists || profile.data()?.status === 'Disabled') {
      throw new HttpsError('permission-denied', 'Account is disabled or missing.');
    }
    return { valid: true };
  } catch (error: any) {
    console.error("Session verification failed:", error);
    throw new HttpsError(
      "unauthenticated",
      "Session expired or revoked."
    );
  }
});


/**
 * Atomic, idempotent service report persistence. Client code must not directly
 * mutate partTransactions or engineerBags while saving a service report.
 * An existing report's parts are immutable until a separate audited stock
 * correction workflow is implemented.
 */
export const saveServiceReport = onCall(async (request) => {
  const authUid = request.auth?.uid;
  if (!authUid) throw new HttpsError('unauthenticated', 'Sign in to save a service report.');
  const profileSnap = await db.collection('users').doc(authUid).get();
  const profile = profileSnap.data();
  if (!profileSnap.exists || !profile || profile.status === 'Disabled') {
    throw new HttpsError('permission-denied', 'Your account is inactive.');
  }
  const raw = request.data?.report;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new HttpsError('invalid-argument', 'A service report object is required.');
  }
  if (JSON.stringify(raw).length > 850000) {
    throw new HttpsError('invalid-argument', 'Report exceeds the maximum size.');
  }
  const reportId = request.data?.reportId;
  const editing = typeof reportId === 'string' && reportId.length > 0;
  if (editing && (reportId.length > 128 || reportId.includes('/'))) {
    throw new HttpsError('invalid-argument', 'Invalid report identifier.');
  }

  const canAct = (action: 'add' | 'edit') => {
    if (profile.role === 'ADMIN') return true;
    if (profile.permissions != null) {
      return profile.permissions.serviceReports?.access === true &&
        profile.permissions.serviceReports?.[action] === true;
    }
    return profile.role === 'ENGINEER';
  };
  if (!canAct(editing ? 'edit' : 'add')) {
    throw new HttpsError('permission-denied', 'Insufficient service report permissions.');
  }

  const customer = String(raw.customer || '').trim();
  const date = String(raw.date || '').trim();
  if (!customer || !date) {
    throw new HttpsError('invalid-argument', 'Customer and report date are required.');
  }
  const parts = Array.isArray(raw.partsUsed) ? raw.partsUsed : [];
  if (parts.length > 100) {
    throw new HttpsError('invalid-argument', 'Too many part lines.');
  }
  const bagUsage = new Map<string, { qty: number; part: any }>();
  for (const part of parts) {
    if (!part || !String(part.partNumber || '').trim() ||
        !Number.isInteger(part.quantity) || part.quantity < 1 || part.quantity > 1000) {
      throw new HttpsError('invalid-argument', 'Part number and quantity must be valid.');
    }
    if (part.source === 'STORE') {
      throw new HttpsError('failed-precondition',
        'Store parts must first be issued through the Store Inventory workflow.');
    }
    if (part.source === 'MY BAG') {
      const key = (String(profile.userId) + '_' + String(part.partNumber) + '_' + String(part.condition))
        .replace(/[^a-zA-Z0-9_]/g, '_');
      const current = bagUsage.get(key);
      bagUsage.set(key, { qty: (current?.qty || 0) + part.quantity, part });
    }
  }

  const ref = editing ? db.collection('serviceReports').doc(reportId) :
    db.collection('serviceReports').doc();
  const sequenceRef = db.collection('config').doc('reportSequence');
  const now = Date.now();

  const result = await db.runTransaction(async (tx) => {
    const existingSnap = editing ? await tx.get(ref) : null;
    const seqSnap = !editing ? await tx.get(sequenceRef) : null;
    if (editing && !existingSnap?.exists) {
      throw new HttpsError('not-found', 'Service report no longer exists.');
    }
    const existing = existingSnap?.data();
    if (editing && (
      (existing?.userId !== authUid && existing?.userId !== profile.userId && profile.role !== 'ADMIN') ||
      existing?.linkedEntryId
    )) {
      throw new HttpsError('permission-denied',
        'This report is managed from its original work entry or by another user.');
    }
    if (editing && JSON.stringify(existing?.partsUsed || []) !== JSON.stringify(parts)) {
      throw new HttpsError('failed-precondition',
        'Changing saved parts requires a separate inventory adjustment.');
    }

    const bagSnapshots = new Map<string, FirebaseFirestore.DocumentSnapshot>();
    if (!editing) {
      for (const key of bagUsage.keys()) {
        bagSnapshots.set(key, await tx.get(db.collection('engineerBags').doc(key)));
      }
      for (const [key, { qty }] of bagUsage) {
        const currentQty = Number(bagSnapshots.get(key)?.data()?.quantity || 0);
        if (currentQty < qty) {
          throw new HttpsError('failed-precondition',
            'Not enough engineer bag stock for ' + key + '. Available: ' + currentQty);
        }
      }
    }

    const number = editing ? String(existing?.reportNo || '') :
      String((Number(seqSnap?.data()?.current) || 40000) + 1);
    // Strip client-supplied privileged values. Server owns identity and numbering.
    const { id: ignoredId, reportNo: ignoredNo, userId: ignoredUser,
      createdAt: ignoredCreated, updatedAt: ignoredUpdated,
      linkedEntryId: ignoredLinked, ...fields } = raw;
    const clean = JSON.parse(JSON.stringify(fields));
    const document = {
      ...clean,
      id: ref.id,
      reportNo: number,
      userId: editing ? existing?.userId : authUid,
      engineerName: editing ? existing?.engineerName : profile.fullName,
      createdAt: editing ? existing?.createdAt : now,
      updatedAt: now,
      partsUsed: parts
    };
    tx.set(ref, document);

    if (!editing) {
      tx.set(sequenceRef, { current: Number(number) }, { merge: true });
      for (const [key, { qty }] of bagUsage) {
        const bagRef = db.collection('engineerBags').doc(key);
        const balance = Number(bagSnapshots.get(key)?.data()?.quantity || 0) - qty;
        if (balance === 0) tx.delete(bagRef);
        else tx.update(bagRef, { quantity: balance, updatedAt: now });
      }
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const status = part.action === 'Left for Testing' ? 'TESTING' :
          part.action === 'Left as Backup' ? 'BACKUP' : 'INSTALLED';
        const txDoc = db.collection('partTransactions').doc(ref.id + '_part_' + i);
        tx.set(txDoc, {
          id: txDoc.id,
          partId: part.partId || part.partNumber,
          partNumber: part.partNumber,
          description: part.description || part.partNumber,
          brand: part.brand || 'LINX',
          sourceType: part.source || 'OTHER',
          sourceDetails: part.sourceDetails || '',
          destinationType: 'CUSTOMER_MACHINE',
          destinationDetails: customer + ' - ' + String(raw.printerSerial || raw.modelNumber || ''),
          engineerId: profile.userId,
          engineerName: profile.fullName,
          customerName: customer,
          machineSerial: String(raw.printerSerial || ''),
          serviceReportId: ref.id,
          linkedServiceReportId: ref.id,
          serviceReportNo: number,
          quantity: part.quantity,
          condition: part.condition || 'New',
          purpose: status === 'TESTING' ? 'Testing' : status === 'BACKUP' ? 'Backup' : 'Customer Replacement',
          status,
          createdAt: now,
          updatedAt: now,
          createdBy: profile.fullName
        });
      }
    }
    return { id: ref.id, reportNo: number };
  });
  return result;
});
