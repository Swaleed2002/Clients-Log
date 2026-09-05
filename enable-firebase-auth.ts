import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

async function enableAuth() {
  const configPath = path.resolve('firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const projectId = firebaseConfig.projectId;

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  console.log(`Using Firebase project: ${projectId}`);
  console.log('Fetching access token...');
  const accessToken = await auth.getAccessToken();

  console.log('Configuring Email/Password provider...');
  const configRes = await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      signIn: {
        email: {
          enabled: true,
          passwordRequired: true
        }
      }
    })
  });
  console.log('Config response:', await configRes.text());
}

enableAuth().catch(console.error);
