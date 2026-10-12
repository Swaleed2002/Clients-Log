import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';

const projectId = 'demo-reliable-coding-qa';
const uid = { admin: 'uid-admin', engineer: 'uid-engineer', colleague: 'uid-colleague', store: 'uid-store', disabled: 'uid-disabled' };
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') }
  });
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const profiles = [
      [uid.admin, 'ADMIN', 'ADMIN', 'Active'],
      [uid.engineer, 'ENG001', 'ENGINEER', 'Active'],
      [uid.colleague, 'ENG002', 'ENGINEER', 'Active'],
      [uid.store, 'STORE001', 'STORE', 'Active'],
      [uid.disabled, 'ENG003', 'ENGINEER', 'Disabled']
    ];
    for (const [id, userId, role, status] of profiles) {
      await db.collection('users').doc(id).set({ userId, role, status, fullName: userId });
    }
    await db.collection('entries').doc('my-entry').set({ id: 'my-entry', userId: uid.engineer, machineId: 'machine-1' });
    await db.collection('entries').doc('other-entry').set({ id: 'other-entry', userId: uid.colleague });
    await db.collection('entries').doc('legacy-entry').set({ id: 'legacy-entry', userId: 'ENG001' });
    await db.collection('serviceReports').doc('entry_my-entry').set({
      id: 'entry_my-entry', userId: uid.engineer, linkedEntryId: 'my-entry'
    });
    await db.collection('serviceReports').doc('unrelated-report').set({ id: 'unrelated-report', userId: uid.engineer });
    await db.collection('inventory').doc('spare-1').set({ partNumber: '123', quantity: 5 });
  });
});

after(async () => {
  if (env) await env.cleanup();
});

const userDb = (userId) => env.authenticatedContext(userId).firestore();

test('Engineer cannot promote their own account', async () => {
  await assertFails(userDb(uid.engineer).collection('users').doc(uid.engineer).update({ role: 'ADMIN' }));
  await assertFails(userDb(uid.engineer).collection('users').doc(uid.engineer).update({ permissions: { users: { access: true, manageRights: true } } }));
  await assertFails(userDb(uid.engineer).collection('users').doc(uid.engineer).update({ status: 'Active', role: 'ADMIN' }));
});

test('Store cannot change roles; admin can disable a user', async () => {
  await assertFails(userDb(uid.store).collection('users').doc(uid.engineer).update({ role: 'STORE' }));
  await assertSucceeds(userDb(uid.admin).collection('users').doc(uid.colleague).update({ status: 'Disabled' }));
});

test('Disabled user can read own profile but not business records', async () => {
  await assertSucceeds(userDb(uid.disabled).collection('users').doc(uid.disabled).get());
  await assertFails(userDb(uid.disabled).collection('inventory').doc('spare-1').get());
  await assertFails(userDb(uid.disabled).collection('entries').doc('my-entry').get());
  await assertFails(userDb(uid.disabled).collection('config').doc('reportSequence').set({ current: 99999 }));
});

test('Engineer can read and edit own entries but not someone else\'s', async () => {
  const db = userDb(uid.engineer);
  await assertSucceeds(db.collection('entries').doc('my-entry').get());
  await assertSucceeds(db.collection('entries').doc('legacy-entry').get());
  await assertFails(db.collection('entries').doc('other-entry').get());
  await assertSucceeds(db.collection('entries').doc('my-entry').update({ remarks: 'Serviced machine' }));
  await assertFails(db.collection('entries').doc('other-entry').update({ remarks: 'Tampered' }));
  await assertFails(db.collection('entries').doc('my-entry').update({ userId: uid.colleague }));
});

test('Engineer can create only their own work entry; admin can list all', async () => {
  const db = userDb(uid.engineer);
  await assertSucceeds(db.collection('entries').doc('created-own').set({ userId: uid.engineer, id: 'created-own' }));
  await assertFails(db.collection('entries').doc('created-other').set({ userId: uid.colleague, id: 'created-other' }));
  await assertSucceeds(userDb(uid.admin).collection('entries').get());
  await assertFails(db.collection('entries').get());
  await assertSucceeds(db.collection('entries').where('userId', '==', uid.engineer).get());
});

test('Engineer cannot change shared configuration, admin can', async () => {
  await assertFails(userDb(uid.engineer).collection('config').doc('systemSettings').set({ unsafe: true }));
  await assertSucceeds(userDb(uid.admin).collection('config').doc('systemSettings').set({ safe: true }));
});

test('Engineers may delete only their linked entry-derived reports', async () => {
  const db = userDb(uid.engineer);
  await assertFails(db.collection('serviceReports').doc('unrelated-report').delete());
  await assertFails(db.collection('entries').doc('other-entry').delete());
  const batch = db.batch();
  batch.delete(db.collection('entries').doc('my-entry'));
  batch.delete(db.collection('serviceReports').doc('entry_my-entry'));
  await assertSucceeds(batch.commit());
  await assertSucceeds(db.collection('serviceReports').doc('entry_my-entry').get());
  const deleted = await db.collection('serviceReports').doc('entry_my-entry').get();
  assert.equal(deleted.exists, false);
});
