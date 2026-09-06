const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// Replace fetch('/api/admin/users') with Callable Function
const searchStr1 = `      // 1. Ask backend to create the user securely using Admin SDK
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${idToken}\`
        },
        body: JSON.stringify({
          userId: normalizedUserId,
          email: email,
          password: newPassword, // Password unmodified as requested
          fullName: newFullName
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || 'Failed to create user on backend');
      }

      const { uid: newUid } = await res.json();`;

const replacementStr1 = `      // 1. Ask backend to create the user securely using Admin SDK
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase');
      const adminCreateUser = httpsCallable(functions, 'adminCreateUser');
      
      const res = await adminCreateUser({
        email: email,
        password: newPassword,
        fullName: newFullName
      });
      
      const newUid = (res.data as any).uid;`;
      
content = content.replace(searchStr1, replacementStr1);


// Replace fetch DELETE with Callable Function
const searchStr2 = `      // 2. Attempt to delete from Backend Auth (may fail in preview environments without Service Account keys)
      try {
        const res = await fetch(\`/api/admin/users/\${uid}\`, { method: 'DELETE' });
        if (!res.ok) {
           console.warn('Backend Auth deletion skipped:', await res.text());
        }
      } catch (backendErr) {
        console.warn('Backend Auth deletion skipped:', backendErr);
      }`;

const replacementStr2 = `      // 2. Attempt to delete from Backend Auth (may fail in preview environments without Service Account keys)
      try {
        const { httpsCallable } = await import('firebase/functions');
        const { functions } = await import('../firebase');
        const adminDeleteUser = httpsCallable(functions, 'adminDeleteUser');
        await adminDeleteUser({ uid });
      } catch (backendErr) {
        console.warn('Backend Auth deletion skipped:', backendErr);
      }`;
      
content = content.replace(searchStr2, replacementStr2);


// Replace fetch PUT with Callable Function
const searchStr3 = `        const response = await fetch(\`/api/admin/users/\${selectedUser.userId}/password\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: resetPassword })
        });
        if (!response.ok) throw new Error(await response.text());`;

const replacementStr3 = `        const { httpsCallable } = await import('firebase/functions');
        const { functions } = await import('../firebase');
        const adminUpdatePassword = httpsCallable(functions, 'adminUpdatePassword');
        // selectedUser.uid is the actual Firebase Auth UID we need to pass
        await adminUpdatePassword({ uid: selectedUser.uid, password: resetPassword });`;

content = content.replace(searchStr3, replacementStr3);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log("Patched AdminPanel.tsx successfully");
