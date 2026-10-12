import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync('server.ts', 'utf8');
const login = fs.readFileSync('src/components/Login.tsx', 'utf8');
const auth = fs.readFileSync('src/hooks/useAuth.ts', 'utf8');

test('Account mutation endpoints require admin bearer token verification', () => {
  assert.match(server, /app\.put\("\/api\/admin\/users\/:userId\/password",\s*verifyAdminToken/);
  assert.match(server, /app\.delete\("\/api\/admin\/users\/:uid",\s*verifyAdminToken/);
  assert.match(server, /app\.post\("\/api\/admin\/users",\s*verifyAdminToken/);
  assert.match(server, /verifyIdToken\(idToken,\s*true\)/);
});

test('No public bootstrap route or hard-coded administrator password', () => {
  assert.doesNotMatch(server, /\/api\/admin\/bootstrap/);
  assert.doesNotMatch(login, /\/api\/admin\/bootstrap/);
  assert.doesNotMatch(server + login, /Admin001/);
  assert.doesNotMatch(auth, /Auto-heal admin profile/);
});
