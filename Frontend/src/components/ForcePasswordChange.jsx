import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, LogOut, KeyRound } from 'lucide-react';
import { authService } from '../services/api';
import ofpptMiniLogo from '../assets/OFPPT-Mini-Logo.png';

export const ForcePasswordChange = ({ user, onPasswordChanged, onLogout }) => {
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (form.newPw !== form.confirm) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (form.newPw.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authService.changePassword(form.current, form.newPw);
      onPasswordChanged(data.user);
    } catch (err) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        const firstErr = Object.values(errors ?? {})[0];
        setError(Array.isArray(firstErr) ? firstErr[0] : (firstErr ?? 'Erreur de validation.'));
      } else {
        setError(err.response?.data?.message ?? 'Impossible de modifier le mot de passe.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all text-slate-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091426] p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10 space-y-6">
        <div className="text-center space-y-3">
          <img src={ofpptMiniLogo} alt="OFPPT Logo" className="w-16 h-16 object-contain mx-auto drop-shadow-md" />
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">Sécurité de votre compte</h2>
          <p className="text-xs text-slate-500 font-semibold px-4">
            Pour la sécurité de votre compte, vous devez modifier votre mot de passe temporaire avant de pouvoir accéder à la plateforme.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p className="flex-1 leading-normal">{error}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Current password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mot de passe temporaire</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                type={showCurrent ? 'text' : 'password'}
                value={form.current}
                onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
                placeholder="Mot de passe reçu par email"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors"
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nouveau mot de passe</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                type={showNew ? 'text' : 'password'}
                value={form.newPw}
                onChange={(e) => setForm((p) => ({ ...p, newPw: e.target.value }))}
                placeholder="Minimum 8 caractères"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirmer le nouveau mot de passe</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                type="password"
                value={form.confirm}
                onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Répétez le mot de passe"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-60 flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Enregistrement...
              </>
            ) : (
              'Valider et accéder'
            )}
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 flex justify-center">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-red-600 transition-colors uppercase tracking-widest cursor-pointer"
          >
            <LogOut size={14} /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};
