import React, { useState } from 'react';
import ofpptMiniLogo from '../assets/OFPPT-Mini-Logo.png';
import { Eye, EyeOff, LogIn, AlertCircle, ArrowLeft, Send, CheckCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../services/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 'login', 'forgot-email', 'forgot-code', 'forgot-password'
  const [view, setView] = useState('login');
  
  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const clearMessages = () => { setError(''); setSuccess(''); };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authService.login(email, password);

      sessionStorage.setItem('auth_token', data.token);
      sessionStorage.setItem('auth_user', JSON.stringify(data.user));

      onLogin(data.user);
    } catch (err) {
      const msg = err.response?.data?.errors?.email?.[0] || err.response?.data?.message || 'Une erreur est survenue. Vérifiez votre connexion.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!resetEmail) { setError('Veuillez entrer votre adresse e-mail.'); return; }

    setLoading(true);
    try {
      await authService.forgotPassword(resetEmail);
      setSuccess('Un code a été envoyé à votre adresse e-mail.');
      setView('forgot-code');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    clearMessages();
    setLoading(true);
    try {
      await authService.forgotPassword(resetEmail);
      setSuccess('Un nouveau code a été envoyé à votre adresse e-mail.');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du renvoi du code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotCodeSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!resetCode || resetCode.length !== 6) { setError('Veuillez entrer un code valide à 6 chiffres.'); return; }

    setLoading(true);
    try {
      await authService.verifyCode(resetEmail, resetCode);
      setSuccess('Code vérifié avec succès.');
      setView('forgot-password');
    } catch (err) {
      setError(err.response?.data?.message || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas ou sont vides.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(resetEmail, resetCode, newPassword, confirmPassword);
      setSuccess('Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.');
      // Reset flow
      setView('login');
      setEmail(resetEmail);
      setPassword('');
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    clearMessages();
    setView('login');
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
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -right-16 w-[500px] h-[500px] bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center gap-3">
          <img src={ofpptMiniLogo} alt="OFPPT Logo" className="w-12 h-12 object-contain" />
          <div>
            <p className="text-white font-black text-lg leading-none tracking-tight">Système PV</p>
            <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-0.5">Archivage Institutionnel</p>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
            Gérez vos<br /><span className="text-white/60">archives PV</span><br />en toute sécurité.
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
        <div className="w-full max-w-md space-y-10 relative">

          <div className="lg:hidden flex items-center gap-3">
            <img src={ofpptMiniLogo} alt="OFPPT Logo" className="w-10 h-10 object-contain" />
            <p className="text-primary font-black text-lg tracking-tight">Système PV</p>
          </div>

          <AnimatePresence mode="wait">
            {/* LOGIN VIEW */}
            {view === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-2 mb-10">
                  <h2 className="text-3xl font-black text-primary tracking-tight">Connexion</h2>
                  <p className="text-secondary text-sm font-medium">Entrez vos identifiants pour accéder à votre espace.</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  {error && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                      <AlertCircle size={18} className="flex-shrink-0" />
                      <p className="text-sm font-semibold">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
                      <CheckCircle size={18} className="flex-shrink-0" />
                      <p className="text-sm font-semibold">{success}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Adresse e-mail</label>
                    <input
                      type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="Votre Email"
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm font-semibold text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-12 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm font-semibold text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors p-1">
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end mt-2">
                    <button type="button" onClick={() => { clearMessages(); setView('forgot-email'); }} className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-[0.15em] hover:bg-primary-container transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                    {loading ? 'Connexion en cours…' : <><LogIn size={18} />Se connecter</>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* FORGOT PASSWORD: EMAIL VIEW */}
            {view === 'forgot-email' && (
              <motion.div
                key="forgot-email"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-2 mb-10">
                  <button onClick={backToLogin} className="flex items-center gap-2 text-xs font-black text-secondary hover:text-primary uppercase tracking-widest mb-6 transition-colors">
                    <ArrowLeft size={16} /> Retour
                  </button>
                  <h2 className="text-3xl font-black text-primary tracking-tight">Mot de passe oublié</h2>
                  <p className="text-secondary text-sm font-medium">Entrez votre adresse email pour recevoir un code de réinitialisation.</p>
                </div>

                <form onSubmit={handleForgotEmailSubmit} className="space-y-5">
                  {error && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                      <AlertCircle size={18} className="flex-shrink-0" />
                      <p className="text-sm font-semibold">{error}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Adresse e-mail</label>
                    <input
                      type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Votre Email"
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm font-semibold text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-[0.15em] hover:bg-primary-container transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                    {loading ? 'Envoi en cours…' : <><Send size={18} />Envoyer le code</>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* FORGOT PASSWORD: CODE VIEW */}
            {view === 'forgot-code' && (
              <motion.div
                key="forgot-code"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-2 mb-10">
                  <button onClick={backToLogin} className="flex items-center gap-2 text-xs font-black text-secondary hover:text-primary uppercase tracking-widest mb-6 transition-colors">
                    <ArrowLeft size={16} /> Annuler
                  </button>
                  <h2 className="text-3xl font-black text-primary tracking-tight">Code de vérification</h2>
                  <p className="text-secondary text-sm font-medium">Entrez le code à 6 chiffres envoyé à <span className="font-bold">{resetEmail}</span>.</p>
                </div>

                <form onSubmit={handleForgotCodeSubmit} className="space-y-5">
                  {error && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                      <AlertCircle size={18} className="flex-shrink-0" />
                      <p className="text-sm font-semibold">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
                      <CheckCircle size={18} className="flex-shrink-0" />
                      <p className="text-sm font-semibold">{success}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Code à 6 chiffres</label>
                    <input
                      type="text" required maxLength="6" value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="000000"
                      className="w-full px-4 py-3 text-center tracking-[1em] font-bold bg-surface-container-low border border-outline-variant/50 rounded-xl text-lg text-on-surface focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-[0.15em] hover:bg-primary-container transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                    {loading ? 'Vérification…' : <><CheckCircle size={18} />Vérifier</>}
                  </button>

                  <div className="text-center mt-4">
                    <button type="button" onClick={handleResendCode} disabled={loading} className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest disabled:opacity-50">
                      Renvoyer le code
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* FORGOT PASSWORD: NEW PASSWORD VIEW */}
            {view === 'forgot-password' && (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-2 mb-10">
                  <h2 className="text-3xl font-black text-primary tracking-tight">Nouveau mot de passe</h2>
                  <p className="text-secondary text-sm font-medium">Veuillez choisir un nouveau mot de passe sécurisé.</p>
                </div>

                <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                  {error && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                      <AlertCircle size={18} className="flex-shrink-0" />
                      <p className="text-sm font-semibold">{error}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'} required minLength="8" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-12 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors p-1">
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Confirmer le mot de passe</label>
                    <input
                      type="password" required minLength="8" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-[0.15em] hover:bg-primary-container transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                    {loading ? 'Enregistrement…' : <><Lock size={18} />Enregistrer</>}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-[10px] text-outline font-bold uppercase tracking-widest mt-10">
            Accès réservé au personnel autorisé.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
