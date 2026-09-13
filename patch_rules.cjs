const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const additionalRules = `
    // Service Reports Collection
    match /serviceReports/{reportId} {
      allow read: if (isSignedIn() && resource.data.userId == request.auth.uid) || isAdmin();
      allow create: if (isSignedIn() && incoming().userId == request.auth.uid) || isAdmin();
      allow update: if (isSignedIn() && existing().userId == request.auth.uid && incoming().userId == request.auth.uid) || isAdmin();
      allow delete: if isAdmin();
    }

    // Config Collection (for reportSequence)
    match /config/{document=**} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
`;

if (!rules.includes('serviceReports')) {
  // Insert before the last closing brace
  const lastBraceIndex = rules.lastIndexOf('}');
  const preLastBrace = rules.lastIndexOf('}', lastBraceIndex - 1);
  
  if (preLastBrace !== -1) {
    rules = rules.substring(0, preLastBrace + 1) + additionalRules + rules.substring(preLastBrace + 1);
    fs.writeFileSync('firestore.rules', rules);
    console.log("Patched firestore.rules successfully");
  }
}
