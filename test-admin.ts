import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const app = initializeApp({
  projectId: "gen-lang-client-0069655450"
});
const auth = getAuth(app);

auth.createUser({
  uid: 'TEST2',
  email: 'TEST2@engineerlog.local',
  password: 'Password001'
}).then(user => console.log('Created:', user.uid)).catch(e => console.error(e));
