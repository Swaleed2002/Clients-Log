import React, { useState } from 'react';
import { UserProfile, UserPermissions, ModulePermissions } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Shield, Save } from 'lucide-react';

interface Props {
  users: UserProfile[];
  onUpdate: () => void;
}

const getRoleDefaults = (role: string): UserPermissions => {
  const defaultPermissions: UserPermissions = {
    clients: { access: true, view: true, add: false, edit: false, delete: false },
    machines: { access: true, view: true, add: false, edit: false, delete: false },
    inventory: { access: true, view: true, add: false, edit: false, delete: false },
    partsIssue: { access: true, view: true, issuePart: false, cancelIssue: false },
    engineerBag: { access: true, view: true, add: false, edit: false, delete: false },
    workshop: { access: true, view: true, createIn: false, addActivity: false, markReady: false, prepareOut: false, approveIn: false, approveOut: false },
    serviceReports: { access: true, view: true, add: false, edit: false, delete: false },
    workEntries: { access: true, view: true, add: false, edit: false, delete: false },
    users: { access: false, view: false, createUser: false, resetPassword: false, disableUser: false, deleteUser: false, manageRights: false },
    reports: { access: true, view: true, export: false }
  };

  if (role === 'ADMIN') {
    return {
      clients: { access: true, view: true, add: true, edit: true, delete: true },
      machines: { access: true, view: true, add: true, edit: true, delete: true },
      inventory: { access: true, view: true, add: true, edit: true, delete: true },
      partsIssue: { access: true, view: true, issuePart: true, cancelIssue: true },
      engineerBag: { access: true, view: true, add: true, edit: true, delete: true },
      workshop: { access: true, view: true, createIn: true, addActivity: true, markReady: true, prepareOut: true, approveIn: true, approveOut: true },
      serviceReports: { access: true, view: true, add: true, edit: true, delete: true },
      workEntries: { access: true, view: true, add: true, edit: true, delete: true },
      users: { access: true, view: true, createUser: true, resetPassword: true, disableUser: true, deleteUser: true, manageRights: true },
      reports: { access: true, view: true, export: true }
    };
  } else if (role === 'STORE') {
    return {
      ...defaultPermissions,
      inventory: { ...defaultPermissions.inventory, add: true, edit: true },
      partsIssue: { ...defaultPermissions.partsIssue, issuePart: true },
      workshop: { ...defaultPermissions.workshop, approveIn: true, approveOut: true },
    };
  } else {
    // ENGINEER
    return {
      ...defaultPermissions,
      serviceReports: { ...defaultPermissions.serviceReports, add: true, edit: true },
      workEntries: { ...defaultPermissions.workEntries, add: true, edit: true },
      workshop: { ...defaultPermissions.workshop, createIn: true, addActivity: true, markReady: true, prepareOut: true }
    };
  }
};

export function UserRightsManager({ users, onUpdate }: Props) {
  const [selectedUserUid, setSelectedUserUid] = useState<string>('');
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [search, setSearch] = useState('');

  const selectedUser = users.find(u => u.uid === selectedUserUid);

  const handleSelectUser = (uid: string) => {
    setSelectedUserUid(uid);
    setMessage({ type: '', text: '' });
    const user = users.find(u => u.uid === uid);
    if (user) {
      if (user.permissions) {
        setPermissions(user.permissions);
      } else {
        setPermissions(getRoleDefaults(user.role));
      }
    }
  };

  const handleToggle = (module: keyof UserPermissions, action: keyof ModulePermissions) => {
    if (!permissions) return;
    setPermissions(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [module]: {
          ...prev[module],
          [action]: !prev[module][action]
        }
      };
    });
  };

  const handleSave = async () => {
    if (!selectedUserUid || !permissions) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await updateDoc(doc(db, 'users', selectedUserUid), {
        permissions
      });
      setMessage({ type: 'success', text: 'Permissions saved successfully.' });
      onUpdate();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to save permissions: ' + err.message });
    }
    setSaving(false);
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) || 
    u.userId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-indigo-600" />
          User Rights Management
        </h2>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* User Selection List */}
        <div className="col-span-1 border-r pr-6">
          <input 
            type="text"
            placeholder="Search users..."
            className="w-full p-2 mb-4 border border-gray-300 rounded-lg text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredUsers.map(user => (
              <button
                key={user.uid}
                onClick={() => handleSelectUser(user.uid!)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedUserUid === user.uid 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-sm text-gray-900">{user.fullName}</div>
                <div className="text-xs text-gray-500 flex justify-between mt-1">
                  <span>{user.userId}</span>
                  <span className={`px-2 rounded-full font-bold ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                    user.role === 'STORE' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Editor */}
        <div className="col-span-1 md:col-span-3">
          {message.text && (
            <div className={`p-4 mb-4 rounded-lg text-sm font-bold ${
              message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {message.text}
            </div>
          )}

          {!selectedUser ? (
            <div className="h-full flex items-center justify-center text-gray-400 font-medium">
              Select a user to manage rights
            </div>
          ) : !permissions ? (
            <div className="h-full flex items-center justify-center text-gray-400 font-medium">
              Loading permissions...
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedUser.fullName}</h3>
                  <p className="text-sm text-gray-500">Edit granular permissions for this user</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-4">
                {Object.entries(permissions).map(([moduleKey, mods]) => (
                  <div key={moduleKey} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 font-bold text-gray-800 capitalize border-b">
                      {moduleKey.replace(/([A-Z])/g, ' $1').trim()} Module
                    </div>
                    <div className="p-4 space-y-3">
                      {Object.keys(mods).map((action) => {
                        const act = action as keyof ModulePermissions;
                        return (
                          <label key={action} className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium text-gray-700 capitalize group-hover:text-indigo-600">
                              {action.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                              mods[act] ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={!!mods[act]}
                                onChange={() => handleToggle(moduleKey as keyof UserPermissions, act)}
                              />
                              <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                                mods[act] ? 'translate-x-5' : 'translate-x-0'
                              }`} />
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
