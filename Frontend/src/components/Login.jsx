import React, { useState, useEffect } from 'react';
import ofpptMiniLogo from '../assets/OFPPT-Mini-Logo.png';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../services/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authService.login(email, password);

      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      // Persist token and user in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      onLogin(data.user);
    } catch (err) {
      const msg =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        'Une erreur est survenue. Vérifiez votre connexion.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">

      {/* ── Left panel — branding ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-16 relative overflow-hidden"
      >
        {/* Background decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -right-16 w-[500px] h-[500px] bg-white/5 rounded-full" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src={ofpptMiniLogo}
            alt="OFPPT Logo"
            className="w-12 h-12 object-contain"
          />
          <div>
            <p className="text-white font-black text-lg leading-none tracking-tight">Système PV</p>
            <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-0.5">
              Archivage Institutionnel
            </p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
            Gérez vos<br />
            <span className="text-white/60">archives PV</span><br />
            en toute sécurité.
          </h1>
          <p className="text-white/60 text-base font-medium leading-relaxed max-w-sm">
            Plateforme sécurisée de gestion et d'archivage des procès-verbaux académiques.
          </p>


        </div>


      </motion.div>

      {/* ── Right panel — login form ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex-1 flex items-center justify-center px-6 py-12"
      >
        <div className="w-full max-w-md space-y-10">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <img
              src={ofpptMiniLogo}
              alt="OFPPT Logo"
              className="w-10 h-10 object-contain"
            />
            <p className="text-primary font-black text-lg tracking-tight">Système PV</p>
          </div>



          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-primary tracking-tight">Connexion</h2>
            <p className="text-secondary text-sm font-medium">
              Entrez vos identifiants pour accéder à votre espace.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700"
                >
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <p className="text-sm font-semibold">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">
                Adresse e-mail
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre Email"
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm font-semibold text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest">
                  Mot de passe
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm font-semibold text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors p-1"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-outline-variant/50 text-primary focus:ring-primary accent-primary"
                />
                <span className="text-sm font-semibold text-secondary">Se souvenir de moi</span>
              </label>
              <button
                type="button"
                className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-[0.15em] hover:bg-primary-container transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Connexion en cours…
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[10px] text-outline font-bold uppercase tracking-widest">
            Accès réservé au personnel autorisé.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
