const fs = require('fs');
const p = './firestore.rules';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/match \/entries\/\{entryId\} \{\s*allow get, list: if isSignedIn\(\);\s*/, "match /entries/{entryId} {\n      allow get, list: if hasPerm('workEntries', 'view');\n      ");

c = c.replace(/match \/serviceReports\/\{reportId\} \{\s*allow get, list: if isSignedIn\(\);\s*/, "match /serviceReports/{reportId} {\n      allow get, list: if hasPerm('serviceReports', 'view');\n      ");

c = c.replace(/match \/inventory\/\{itemId\} \{\s*allow get, list: if isSignedIn\(\);\s*/, "match /inventory/{itemId} {\n      allow get, list: if hasPerm('inventory', 'view');\n      ");

c = c.replace(/match \/engineerBags\/\{bagItemId\} \{\s*allow get, list: if isSignedIn\(\);\s*/, "match /engineerBags/{bagItemId} {\n      allow get, list: if hasPerm('engineerBag', 'view') || hasPerm('partsIssue', 'view');\n      ");

c = c.replace(/match \/partTransactions\/\{transactionId\} \{\s*allow get, list: if isSignedIn\(\);\s*/, "match /partTransactions/{transactionId} {\n      allow get, list: if hasPerm('partsIssue', 'view');\n      ");

c = c.replace(/match \/clients\/\{clientId\} \{\s*allow get, list: if isSignedIn\(\);\s*/, "match /clients/{clientId} {\n      allow get, list: if hasPerm('clients', 'view');\n      ");

c = c.replace(/match \/customerMachines\/\{machineId\} \{\s*allow get, list: if isSignedIn\(\);\s*/, "match /customerMachines/{machineId} {\n      allow get, list: if hasPerm('machines', 'view');\n      ");

c = c.replace(/match \/workshopCases\/\{caseId\} \{\s*allow get, list: if isSignedIn\(\);\s*/, "match /workshopCases/{caseId} {\n      allow get, list: if hasPerm('workshop', 'view');\n      ");

fs.writeFileSync(p, c);
