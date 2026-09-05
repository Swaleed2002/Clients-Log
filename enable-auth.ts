import { GoogleAuth } from 'google-auth-library';

async function enableAuth() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const projectId = '150148597949';

  console.log('Fetching access token...');
  const accessToken = await auth.getAccessToken();

  console.log('Enabling identitytoolkit.googleapis.com...');
  const enableRes = await fetch(`https://serviceusage.googleapis.com/v1/projects/${projectId}/services/identitytoolkit.googleapis.com:enable`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  console.log('Enable API response:', await enableRes.text());

  console.log('Waiting 5 seconds for propagation...');
  await new Promise(resolve => setTimeout(resolve, 5000));

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
