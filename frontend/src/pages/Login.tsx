import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle } from 'lucide-react';
import { authService } from '../services/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authService.login({ username, password });
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-amber-600/10 blur-[150px] pointer-events-none" />
      
      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl z-10 transition animate-in fade-in slide-in-from-bottom-8 duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-slate-800 p-2 rounded-2xl text-slate-950 mb-3 shadow-lg border border-slate-700">
            <img src="/jcb.png" alt="Logo" className="w-14 h-14 object-contain rounded-xl" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white m-0 text-center">Sri Lakshmi Narayana Swamy Earth Movers</h1>
          <p className="text-sm text-amber-500 font-bold uppercase tracking-wider mt-1">JCB & Tractor Rental Portal</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 p-3.5 bg-rose-950/40 border border-rose-900/50 rounded-xl text-rose-300 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5 text-left">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <User size={18} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter owner username"
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition duration-200"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter owner password"
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition duration-200"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
      </div>
      
      {/* Help footer */}
      <p className="text-xs text-slate-600 mt-6 z-10 font-medium">
        Default Owner Login: <span className="font-semibold text-slate-400">admin</span> / <span className="font-semibold text-slate-400">admin123</span>
      </p>
    </div>
  );
};

export default Login;
