"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDeleteUser = exports.adminUpdatePassword = exports.adminCreateUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
// Helper function to verify admin privileges
async function verifyAdmin(auth) {
    var _a;
    if (!auth || !auth.uid) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const userDoc = await db.collection("users").doc(auth.uid).get();
    if (!userDoc.exists || ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== "ADMIN") {
        throw new https_1.HttpsError("permission-denied", "User does not have admin privileges.");
    }
}
exports.adminCreateUser = (0, https_1.onCall)(async (request) => {
    await verifyAdmin(request.auth);
    const { email, password, fullName } = request.data;
    if (!email || !password || !fullName) {
        throw new https_1.HttpsError("invalid-argument", "Missing required fields.");
    }
    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: fullName,
        });
        return { uid: userRecord.uid };
    }
    catch (error) {
        console.error("Error creating user:", error);
        throw new https_1.HttpsError("internal", error.message || "Failed to create user");
    }
});
exports.adminUpdatePassword = (0, https_1.onCall)(async (request) => {
    await verifyAdmin(request.auth);
    const { uid, password } = request.data;
    if (!uid || !password) {
        throw new https_1.HttpsError("invalid-argument", "Missing uid or password.");
    }
    try {
        await admin.auth().updateUser(uid, { password });
        return { success: true };
    }
    catch (error) {
        console.error("Error updating password:", error);
        throw new https_1.HttpsError("internal", error.message || "Failed to update password");
    }
});
exports.adminDeleteUser = (0, https_1.onCall)(async (request) => {
    await verifyAdmin(request.auth);
    const { uid } = request.data;
    if (!uid) {
        throw new https_1.HttpsError("invalid-argument", "Missing uid.");
    }
    try {
        await admin.auth().deleteUser(uid);
        return { success: true };
    }
    catch (error) {
        console.error("Error deleting user:", error);
        throw new https_1.HttpsError("internal", error.message || "Failed to delete user");
    }
});
//# sourceMappingURL=index.js.map