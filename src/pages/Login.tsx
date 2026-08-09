import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Lock, User as UserIcon, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('superadmin@deltatravel.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoAccount = (roleEmail: string) => {
    setUsername(roleEmail);
    setPassword('admin123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Accents - Using brand colors */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C8102E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#C8102E]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C8102E]/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Brand Identity - Using admin theme */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#C8102E] flex items-center justify-center text-white mx-auto shadow-xl shadow-[#C8102E]/30 mb-3 border border-[#FC8181]/30">
            <Compass className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">DELTA TRAVEL & TOUR</h1>
          <p className="text-xs font-semibold text-[#FC8181] tracking-widest uppercase mt-1 border-b border-[#FC8181]/20 pb-1 inline-block">
            Admin Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-[#E2E8F0] shadow-black/30">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#111827]">Sign in to your account</h2>
            <p className="text-xs text-[#718096] mt-1">Manage website packages, leads, and SMS campaigns.</p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C8102E]" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">Username or Email</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="superadmin@deltatravel.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#111827] focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] placeholder:text-[#A0AEC0]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#111827] focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] placeholder:text-[#A0AEC0]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#4A5568]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#C8102E] focus:ring-[#C8102E] border-[#E2E8F0]"
                />
                Remember my session
              </label>
              <span className="text-[#A0AEC0]">JWT Token Auth</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-sm shadow-lg shadow-[#C8102E]/30 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Preset Bar */}
          <div className="mt-8 pt-5 border-t border-[#E2E8F0]">
            <p className="text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C8102E]" /> Evaluator Demo Presets:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoAccount('superadmin@deltatravel.com')}
                className="p-2 rounded-xl bg-[#C8102E]/10 hover:bg-[#C8102E]/20 border border-[#C8102E]/30 text-[11px] font-semibold text-[#C8102E] text-center transition-colors"
              >
                SuperAdmin
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('admin@deltatravel.com')}
                className="p-2 rounded-xl bg-[#C8102E]/10 hover:bg-[#C8102E]/20 border border-[#C8102E]/30 text-[11px] font-semibold text-[#C8102E] text-center transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('editor@deltatravel.com')}
                className="p-2 rounded-xl bg-[#C8102E]/10 hover:bg-[#C8102E]/20 border border-[#C8102E]/30 text-[11px] font-semibold text-[#C8102E] text-center transition-colors"
              >
                Editor
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[#718096] mt-6 font-medium">
          © 2026 Delta Travel & Tour. All rights reserved.
        </p>
      </div>
    </div>
  );
};