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
  if (!userDoc.exists || userDoc.data()?.role !== "ADMIN") {
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
