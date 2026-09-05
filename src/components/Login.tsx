import React, { useState } from 'react';
import { KeyRound, User as UserIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { BrandLogo } from './Brand';

interface LoginProps {
  onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const { login } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const normalizedUserId = userId.trim().toUpperCase();
    
    try {
      await login(normalizedUserId, password.trim());
      onSuccess();
    } catch (err: any) {
      if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') && normalizedUserId === 'ADMIN' && password.trim() === 'Admin001') {
        try {
          setError('Initializing Admin account securely... Please wait.');
          const res = await fetch('/api/admin/bootstrap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: normalizedUserId, password: password.trim() })
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText);
          }
          await login(normalizedUserId, password.trim());
          onSuccess();
          return;
        } catch (bootstrapErr: any) {
          setError(`Bootstrap failed: ${bootstrapErr.message}`);
          setLoading(false);
          return;
        }
      }
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        setError(`Invalid User ID or password.`);
      } else {
        setError(`Login failed: ${err.code}`);
      }
    } finally {
      if (normalizedUserId !== 'ADMIN' || error) { 
         setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex-1 flex flex-col justify-center max-h-[700px]">
        <BrandLogo className="mb-8" />
        
        <h2 className="text-xl font-bold text-gray-800 text-center mb-8 uppercase tracking-wide">
          Engineer Portal
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">User ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                className="block w-full pl-10 pr-3 py-4 text-base border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-[#E61C24] transition-colors"
                placeholder="e.g. ENG001"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-4 text-base border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-[#E61C24] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-[#E61C24] hover:bg-red-700 text-white font-bold rounded-xl text-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? 'AUTHENTICATING...' : 'SECURE LOGIN'}
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-xs font-semibold text-gray-400 text-center">
        &copy; {new Date().getFullYear()} Reliable Industrial Coding.<br/>All rights reserved.
      </p>
    </div>
  );
}
