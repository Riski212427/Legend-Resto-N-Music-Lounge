import React, { useState } from 'react';
import {
  Crown,
  Receipt,
  ArrowLeft,
  Lock,
  User,
  Music,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

export type StaffRole = 'cashier' | 'superadmin';

interface StaffLoginScreenProps {
  onLoginSuccess: (role: StaffRole) => void;
  onBackToCustomer: () => void;
}

export const StaffLoginScreen: React.FC<StaffLoginScreenProps> = ({
  onLoginSuccess,
  onBackToCustomer,
}) => {
  const [selectedRole, setSelectedRole] = useState<StaffRole>('superadmin');

  // Retrieve stored credentials or use defaults
  const getExpectedCredentials = (role: StaffRole) => {
    try {
      if (role === 'superadmin') {
        const u = localStorage.getItem('legend_user_superadmin') || 'admin';
        const p = localStorage.getItem('legend_pass_superadmin') || 'admin123';
        return { username: u, password: p };
      } else {
        const u = localStorage.getItem('legend_user_cashier') || 'kasir';
        const p = localStorage.getItem('legend_pass_cashier') || 'kasir123';
        return { username: u, password: p };
      }
    } catch {
      return role === 'superadmin'
        ? { username: 'admin', password: 'admin123' }
        : { username: 'kasir', password: 'kasir123' };
    }
  };

  // Username & Password fields initialized with selected role's credentials
  const initialCreds = getExpectedCredentials('superadmin');
  const [username, setUsername] = useState(initialCreds.username);
  const [password, setPassword] = useState(initialCreds.password);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRoleChange = (newRole: StaffRole) => {
    setSelectedRole(newRole);
    setErrorMsg(null);
    const creds = getExpectedCredentials(newRole);
    setUsername(creds.username);
    setPassword(creds.password);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const creds = getExpectedCredentials(selectedRole);
    const uInput = username.trim().toLowerCase();
    const pInput = password.trim();

    // 1. Verify against currently selected role
    if (uInput === creds.username.toLowerCase() && pInput === creds.password) {
      onLoginSuccess(selectedRole);
      return;
    }

    // 2. Smart auto-detect: if user typed cashier credentials on superadmin or vice versa
    const otherRole: StaffRole = selectedRole === 'superadmin' ? 'cashier' : 'superadmin';
    const otherCreds = getExpectedCredentials(otherRole);
    if (uInput === otherCreds.username.toLowerCase() && pInput === otherCreds.password) {
      onLoginSuccess(otherRole);
      return;
    }

    setErrorMsg(
      `Username atau Password ${
        selectedRole === 'superadmin' ? 'Super Admin' : 'Kasir'
      } salah. Gunakan default: ${creds.username} / ${creds.password}`
    );
  };

  const handleQuickBypass = () => {
    const creds = getExpectedCredentials(selectedRole);
    setUsername(creds.username);
    setPassword(creds.password);
    onLoginSuccess(selectedRole);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-neutral-950 font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative z-10">
        {/* Resto Branding Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-0.5 shadow-inner">
            <Music className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 font-serif tracking-wider uppercase">
            LEGEND RESTO
          </h1>
          <p className="text-xs text-neutral-400">
            Portal Masuk Staf & Manajemen Restoran
          </p>
        </div>

        {/* Role Selector: Kasir vs Super Admin */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-300 block">
            Pilih Peran Akun Masuk:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Card 1: Super Admin */}
            <button
              type="button"
              onClick={() => handleRoleChange('superadmin')}
              className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                selectedRole === 'superadmin'
                  ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40 text-amber-300 shadow-md'
                  : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`p-1.5 rounded-xl ${
                    selectedRole === 'superadmin'
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-neutral-700 text-neutral-300'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                </div>
                {selectedRole === 'superadmin' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <div>
                <strong
                  className={`text-xs sm:text-sm font-bold block ${
                    selectedRole === 'superadmin' ? 'text-amber-300' : 'text-neutral-200'
                  }`}
                >
                  Super Admin
                </strong>
                <span className="text-[10px] text-neutral-400 block mt-0.5 line-clamp-1">
                  Owner / Laporan & Menu
                </span>
              </div>
            </button>

            {/* Card 2: Kasir */}
            <button
              type="button"
              onClick={() => handleRoleChange('cashier')}
              className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                selectedRole === 'cashier'
                  ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40 text-amber-300 shadow-md'
                  : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`p-1.5 rounded-xl ${
                    selectedRole === 'cashier'
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-neutral-700 text-neutral-300'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                </div>
                {selectedRole === 'cashier' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <div>
                <strong
                  className={`text-xs sm:text-sm font-bold block ${
                    selectedRole === 'cashier' ? 'text-amber-300' : 'text-neutral-200'
                  }`}
                >
                  Akun Kasir
                </strong>
                <span className="text-[10px] text-neutral-400 block mt-0.5 line-clamp-1">
                  POS & KDS Dapur
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* USERNAME & PASSWORD FORM (NO PIN) */}
        <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
          {/* Username Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-300">
                Username:
              </label>
              <span className="text-[10px] text-amber-400/90 font-mono">
                Default: <strong>{selectedRole === 'superadmin' ? 'admin' : 'kasir'}</strong>
              </span>
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={selectedRole === 'superadmin' ? 'admin' : 'kasir'}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 focus:border-amber-500 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-300">
                Password:
              </label>
              <span className="text-[10px] text-amber-400/90 font-mono">
                Default: <strong>{selectedRole === 'superadmin' ? 'admin123' : 'kasir123'}</strong>
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                className="w-full pl-10 pr-10 py-2.5 bg-neutral-800 border border-neutral-700 focus:border-amber-500 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-neutral-400 hover:text-neutral-200 absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan Password' : 'Lihat Password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all uppercase tracking-wider active:scale-95 cursor-pointer mt-1"
          >
            Masuk sebagai {selectedRole === 'superadmin' ? 'Super Admin' : 'Kasir'}
          </button>
        </form>

        {/* Quick Bypass Button for Demo Testing */}
        <button
          type="button"
          onClick={handleQuickBypass}
          className="w-full py-2.5 bg-neutral-800/80 hover:bg-neutral-800 text-amber-300 text-xs font-bold rounded-xl border border-neutral-700/80 transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>
            Masuk Cepat Demo ({selectedRole === 'superadmin' ? 'admin / admin123' : 'kasir / kasir123'})
          </span>
        </button>

        {/* Back Link to Customer View */}
        <div className="pt-2 border-t border-neutral-800 text-center">
          <button
            type="button"
            onClick={onBackToCustomer}
            className="text-xs text-neutral-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Tamu / Meja Pelanggan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
