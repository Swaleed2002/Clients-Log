import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import cors from 'cors';
import fs from 'fs';

let auth: any = null;
let dbAdmin: any = null;

try {
  const configPath = path.resolve('firebase-applet-config.json');
  let firebaseConfig: any = {};
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  // Explicitly initialize with the project ID to avoid using the environment's default ADC project,
  // which causes Identity Toolkit API 403 errors.
  const app = initializeApp({
    projectId: firebaseConfig.projectId || process.env.FIREBASE_PROJECT_ID
  });
  
  auth = getAuth(app);
  dbAdmin = getFirestore(app);
  console.log(`Firebase Admin initialized successfully for project ${firebaseConfig.projectId}.`);
} catch (error) {
  console.error("Firebase Admin initialization failed. Admin API routes will mock or return errors:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Secure middleware to verify Firebase Auth ID token and check Admin role
  const verifyAdminToken = async (req: any, res: any, next: any) => {
    if (!auth) {
      return res.status(500).json({ error: 'Firebase Admin not configured (ADC missing).' });
    }
    
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      // Verify admin role from Firestore
      const userDoc = await dbAdmin.collection('users').doc(uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admin role required' });
      }
      
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };

  app.post("/api/admin/users", verifyAdminToken, async (req, res) => {
    try {
      const { email, password, fullName, userId } = req.body;
      
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: fullName,
      });
      
      res.status(201).json({ uid: userRecord.uid });
    } catch (error: any) {
      console.error('Error creating new user:', error);
      res.status(500).json({ error: error.code || error.message });
    }
  });

  app.put("/api/admin/users/:userId/password", async (req, res) => {
    try {
      if (!auth) throw new Error("Firebase Admin not configured (ADC missing). Deployment is required for true admin capabilities.");
      const { userId } = req.params;
      const { password } = req.body;
      await auth.updateUser(userId, {
        password: password
      });
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error updating password:', error);
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/admin/users/:uid", async (req, res) => {
    try {
      if (!auth) throw new Error("Firebase Admin not configured (ADC missing). Deployment is required for true admin capabilities.");
      const { uid } = req.params;
      await auth.deleteUser(uid);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).send(error.message);
    }
  });

  app.post("/api/admin/bootstrap", async (req, res) => {
    try {
      const { userId, password } = req.body;
      if (userId !== 'ADMIN' || password !== 'Admin001') {
        return res.status(403).json({ error: "Invalid bootstrap credentials" });
      }

      const email = `ADMIN@fieldengineer.local`;
      let uid = '';
      
      try {
        if (auth) {
          // If we have Admin API working
          let userRecord;
          try {
            userRecord = await auth.getUserByEmail(email);
          } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
              userRecord = await auth.createUser({
                uid: 'ADMIN',
                email: email,
                password: password,
                displayName: 'Administrator',
              });
            } else {
              throw e;
            }
          }
          uid = userRecord.uid;
          
          if (dbAdmin) {
            await dbAdmin.collection('users').doc(uid).set({
              userId: 'ADMIN',
              fullName: 'Administrator',
              role: 'ADMIN',
              status: 'Active'
            }, { merge: true });
          }
        }
      } catch (adminErr: any) {
        console.error("Firebase Admin SDK bootstrap failed, falling back to Web SDK if possible", adminErr);
        // We will just let the client try to use the REST API directly or just return error
        // Actually, the Web SDK requires a browser, so we can't easily do it here securely without Web API key.
        throw adminErr;
      }
      
      res.status(200).json({ success: true, uid });
    } catch (error: any) {
      console.error('Bootstrap error:', error);
      res.status(500).send(error.message);
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
