import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp({
  projectId: firebaseConfig.projectId
});
const auth = getAuth(app);

auth.listUsers().then(users => {
  users.users.forEach(u => console.log(u.email, u.uid));
});
