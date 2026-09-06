import React, { useState, useEffect } from 'react';
import { UserProfile, WorkEntry } from '../types';
import { db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { Users, Lock, UserPlus, UserX, UserCheck, Trash2, ArrowLeft, Download } from 'lucide-react';
import { DOMAIN_SUFFIX } from '../hooks/useAuth';
import { exportToExcel } from '../utils';

interface AdminPanelProps {
  onBack: () => void;
  currentUser: UserProfile;
}

export function AdminPanel({ onBack, currentUser }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedReportUser, setSelectedReportUser] = useState<string>('ALL');
  const [exporting, setExporting] = useState(false);
  
  // Forms
  const [newUserId, setNewUserId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const fetched: UserProfile[] = [];
      snapshot.forEach(docSnap => fetched.push({ ...docSnap.data(), uid: docSnap.id } as UserProfile));
      setUsers(fetched);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load users. Are you an Admin?' });
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    try {
      // Get the admin's ID token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      if (!auth.currentUser) throw new Error('Not authenticated');
      
      const idToken = await auth.currentUser.getIdToken();
      const normalizedUserId = newUserId.trim().toUpperCase();
      const email = `${normalizedUserId}${DOMAIN_SUFFIX}`;
      
      // 1. Ask backend to create the user securely using Admin SDK
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase');
      const adminCreateUser = httpsCallable(functions, 'adminCreateUser');
      
      const res = await adminCreateUser({
        email: email,
        password: newPassword,
        fullName: newFullName
      });
      
      const newUid = (res.data as any).uid;

      // 2. Create Firestore Profile
      await setDoc(doc(db, 'users', newUid), {
        userId: normalizedUserId,
        fullName: newFullName,
        role: 'ENGINEER',
        status: 'Active'
      });
      
      setMessage({ type: 'success', text: 'User created successfully.' });
      setNewUserId('');
      setNewFullName('');
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      if (err.message?.includes('operation-not-allowed')) {
        setMessage({ type: 'error', text: 'Firebase Email/Password provider is disabled. Please enable it in the Firebase Console.' });
      } else {
        setMessage({ type: 'error', text: `Failed to create user: ${err.message}` });
      }
    }
  };

  const handleStatusChange = async (uid: string, newStatus: 'Active' | 'Disabled') => {
    try {
      await updateDoc(doc(db, 'users', uid), { status: newStatus });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update user status.' });
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      setMessage({ type: '', text: '' });
      
      // 1. Delete from Firestore first (this instantly revokes all access)
      await deleteDoc(doc(db, 'users', uid));
      
      // 2. Attempt to delete from Backend Auth (may fail in preview environments without Service Account keys)
      try {
        const { httpsCallable } = await import('firebase/functions');
        const { functions } = await import('../firebase');
        const adminDeleteUser = httpsCallable(functions, 'adminDeleteUser');
        await adminDeleteUser({ uid });
      } catch (backendErr) {
        console.warn('Backend Auth deletion skipped:', backendErr);
      }

      setMessage({ type: 'success', text: 'User access permanently revoked and profile deleted.' });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: `Failed to delete user profile: ${err.message || err}` });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (resetPassword !== resetConfirm) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    
    try {
      if (selectedUser.userId === currentUser.userId) {
        // Use client SDK to update own password to bypass the need for Admin SDK (which requires deployment)
        const { getAuth, updatePassword } = await import('firebase/auth');
        const auth = getAuth();
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, resetPassword);
        } else {
          throw new Error('Not authenticated');
        }
      } else {
        const { httpsCallable } = await import('firebase/functions');
        const { functions } = await import('../firebase');
        const adminUpdatePassword = httpsCallable(functions, 'adminUpdatePassword');
        // selectedUser.uid is the actual Firebase Auth UID we need to pass
        await adminUpdatePassword({ uid: selectedUser.uid, password: resetPassword });
      }
      
      setMessage({ type: 'success', text: `Password for ${selectedUser.fullName} changed successfully.` });
      setResetPassword('');
      setResetConfirm('');
      setSelectedUser(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: `Failed to change password: ${err.message}` });
    }
  };

  const handleExportAdminReport = async () => {
    setExporting(true);
    setMessage({ type: '', text: '' });
    try {
      let q;
      if (selectedReportUser === 'ALL') {
        q = query(collection(db, 'entries'));
      } else {
        q = query(collection(db, 'entries'), where('userId', '==', selectedReportUser));
      }
      const snapshot = await getDocs(q);
      const entries: WorkEntry[] = [];
      snapshot.forEach(docSnap => entries.push(docSnap.data() as WorkEntry));
      
      if (entries.length === 0) {
        setMessage({ type: 'error', text: 'No records found for the selected criteria.' });
        setExporting(false);
        return;
      }

      // Sort by date asc
      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Create user map
      const userMap: Record<string, string> = {};
      users.forEach(u => userMap[u.userId] = u.fullName);

      exportToExcel(entries, new Date(), userMap, currentUser, selectedReportUser);
      setMessage({ type: 'success', text: `Exported ${entries.length} records successfully.` });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: `Failed to export reports: ${err.message}` });
    }
    setExporting(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-2xl font-black text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            ADMIN PANEL
          </h1>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-lg font-bold text-sm ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-8">
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2 text-blue-600" />
              Export Reports
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">SELECT ENGINEER</label>
                <select 
                  value={selectedReportUser}
                  onChange={(e) => setSelectedReportUser(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Engineers</option>
                  {users.map(u => (
                    <option key={u.userId} value={u.userId}>{u.fullName} ({u.userId})</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleExportAdminReport}
                disabled={exporting}
                className="w-full py-2 bg-[#E61C24] hover:bg-red-700 disabled:opacity-70 text-white font-bold rounded-lg text-sm flex items-center justify-center"
              >
                {exporting ? 'EXPORTING...' : 'EXPORT EXCEL'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-emerald-600" />
              Create Engineer
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">USER ID</label>
                <input type="text" value={newUserId} onChange={e => setNewUserId(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="ENG002" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">FULL NAME</label>
                <input type="text" value={newFullName} onChange={e => setNewFullName(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ali Khan" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">PASSWORD</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm">
                CREATE USER
              </button>
            </form>
          </div>

          {selectedUser && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-amber-600" />
                Reset Password
              </h2>
              <p className="text-sm font-bold text-gray-600 mb-4">{selectedUser.fullName} ({selectedUser.userId})</p>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">NEW PASSWORD</label>
                  <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">CONFIRM PASSWORD</label>
                  <input type="password" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                </div>
                <button type="submit" className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-sm">
                  CHANGE PASSWORD
                </button>
                <button type="button" onClick={() => setSelectedUser(null)} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-sm">
                  CANCEL
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">Team Roster</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center text-gray-500 font-medium">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-medium">No users found.</div>
              ) : (
                users.map(u => (
                  <div key={u.userId} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg flex items-center">
                        {u.fullName}
                        {u.role === 'ADMIN' && <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">ADMIN</span>}
                        {u.status === 'Disabled' && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">DISABLED</span>}
                      </h3>
                      <p className="text-sm font-medium text-gray-500">{u.userId}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3 py-1.5 text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg flex items-center"
                      >
                        <Lock className="w-3 h-3 mr-1" /> Reset Pass
                      </button>
                      
                      {u.userId !== currentUser.userId && u.uid && (
                        <>
                          <button
                            onClick={() => handleStatusChange(u.uid!, u.status === 'Active' ? 'Disabled' : 'Active')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center ${u.status === 'Active' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                          >
                            {u.status === 'Active' ? <><UserX className="w-3 h-3 mr-1" /> Disable</> : <><UserCheck className="w-3 h-3 mr-1" /> Enable</>}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.uid!)}
                            className="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-800 hover:bg-red-200 rounded-lg flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
