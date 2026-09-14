var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_app = require("firebase-admin/app");
var import_auth = require("firebase-admin/auth");
var import_firestore = require("firebase-admin/firestore");
var import_cors = __toESM(require("cors"), 1);
var import_fs = __toESM(require("fs"), 1);
var auth = null;
var dbAdmin = null;
try {
  const configPath = import_path.default.resolve("firebase-applet-config.json");
  let firebaseConfig = {};
  if (import_fs.default.existsSync(configPath)) {
    firebaseConfig = JSON.parse(import_fs.default.readFileSync(configPath, "utf8"));
  }
  const app = (0, import_app.initializeApp)({
    projectId: firebaseConfig.projectId || process.env.FIREBASE_PROJECT_ID
  });
  auth = (0, import_auth.getAuth)(app);
  dbAdmin = (0, import_firestore.getFirestore)(app);
  console.log(`Firebase Admin initialized successfully for project ${firebaseConfig.projectId}.`);
} catch (error) {
  console.error("Firebase Admin initialization failed. Admin API routes will mock or return errors:", error);
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use((0, import_cors.default)());
  app.use(import_express.default.json());
  const verifyAdminToken = async (req, res, next) => {
    if (!auth) {
      return res.status(500).json({ error: "Firebase Admin not configured (ADC missing)." });
    }
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const userDoc = await dbAdmin.collection("users").doc(uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden: Admin role required" });
      }
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  };
  app.post("/api/admin/users", verifyAdminToken, async (req, res) => {
    try {
      const { email, password, fullName, userId } = req.body;
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: fullName
      });
      res.status(201).json({ uid: userRecord.uid });
    } catch (error) {
      console.error("Error creating new user:", error);
      res.status(500).json({ error: error.code || error.message });
    }
  });
  app.put("/api/admin/users/:userId/password", async (req, res) => {
    try {
      if (!auth) throw new Error("Firebase Admin not configured (ADC missing). Deployment is required for true admin capabilities.");
      const { userId } = req.params;
      const { password } = req.body;
      await auth.updateUser(userId, {
        password
      });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).send(error.message);
    }
  });
  app.delete("/api/admin/users/:uid", async (req, res) => {
    try {
      if (!auth) throw new Error("Firebase Admin not configured (ADC missing). Deployment is required for true admin capabilities.");
      const { uid } = req.params;
      await auth.deleteUser(uid);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).send(error.message);
    }
  });
  app.post("/api/admin/bootstrap", async (req, res) => {
    try {
      const { userId, password } = req.body;
      if (userId !== "ADMIN" || password !== "Admin001") {
        return res.status(403).json({ error: "Invalid bootstrap credentials" });
      }
      const email = `ADMIN@fieldengineer.local`;
      let uid = "";
      try {
        if (auth) {
          let userRecord;
          try {
            userRecord = await auth.getUserByEmail(email);
          } catch (e) {
            if (e.code === "auth/user-not-found") {
              userRecord = await auth.createUser({
                uid: "ADMIN",
                email,
                password,
                displayName: "Administrator"
              });
            } else {
              throw e;
            }
          }
          uid = userRecord.uid;
          if (dbAdmin) {
            await dbAdmin.collection("users").doc(uid).set({
              userId: "ADMIN",
              fullName: "Administrator",
              role: "ADMIN",
              status: "Active"
            }, { merge: true });
          }
        }
      } catch (adminErr) {
        console.error("Firebase Admin SDK bootstrap failed, falling back to Web SDK if possible", adminErr);
        throw adminErr;
      }
      res.status(200).json({ success: true, uid });
    } catch (error) {
      console.error("Bootstrap error:", error);
      res.status(500).send(error.message);
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
