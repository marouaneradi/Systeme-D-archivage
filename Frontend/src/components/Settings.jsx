import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Database,
  Globe,
  Save,
  CheckCircle,
  Eye,
  EyeOff,
  Shield,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../services/api';

// ── Sub-components ────────────────────────────────────────────────

const Section = ({ icon: Icon, title, description, children }) => (
  <div className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
    <div className="flex items-center gap-4 px-8 py-6 border-b border-outline-variant/30 bg-surface-container-low/20">
      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-sm font-black text-primary uppercase tracking-wider">{title}</h3>
        {description && <p className="text-xs text-secondary font-medium mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="px-8 py-6 space-y-5">{children}</div>
  </div>
);

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-secondary uppercase tracking-widest">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-outline font-medium pl-1">{hint}</p>}
  </div>
);

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-1">
    <div>
      <p className="text-sm font-bold text-on-surface">{label}</p>
      {description && <p className="text-xs text-secondary font-medium mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
        checked ? 'bg-primary' : 'bg-outline-variant'
      }`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
        checked ? 'left-7' : 'left-1'
      }`} />
    </button>
  </div>
);

const inputCls = 'w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all';

// ── Password Modal ────────────────────────────────────────────────
const PasswordModal = ({ isOpen, onClose }) => {
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw]         = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwords.newPw !== passwords.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(passwords.current, passwords.newPw, passwords.confirm);
      setSuccess('Mot de passe modifié avec succès.');
      // Optional: close after a small delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.errors?.current_password?.[0] ||
        err.response?.data?.errors?.new_password?.[0] ||
        err.response?.data?.message ||
        'Erreur lors de la modification.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 space-y-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-primary tracking-tight">
            Changer le mot de passe
          </h3>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
              <p className="text-sm font-semibold">{success}</p>
            </div>
          )}

          <Field label="Mot de passe actuel">
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                placeholder="••••••••"
                className={`${inputCls} pr-12`}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
              >
                {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          
          <Field label="Nouveau mot de passe" hint="Minimum 8 caractères">
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={passwords.newPw}
                onChange={(e) => setPasswords((p) => ({ ...p, newPw: e.target.value }))}
                placeholder="••••••••"
                className={`${inputCls} pr-12`}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
              >
                {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          
          <Field label="Confirmer le mot de passe">
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="••••••••"
              className={inputCls}
              required
              minLength={8}
            />
          </Field>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 py-3 border border-outline-variant rounded-xl bg-white text-primary font-bold text-sm uppercase tracking-wider hover:bg-surface-container-low transition-all disabled:opacity-50">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-primary-container transition-all shadow-lg shadow-primary/20 disabled:opacity-60">
              {loading ? 'Enregistrement…' : 'Confirmer'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────
export const Settings = () => {
  const [saved, setSaved] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw]         = useState(false);

  // Profile settings — pre-filled from current session
  const storedUser = (() => { try { return JSON.parse(sessionStorage.getItem('auth_user') ?? '{}'); } catch { return {}; } })();
  const [profile, setProfile] = useState({ name: storedUser.name ?? '', email: storedUser.email ?? '' });

  // Password modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // System settings (admin-only)
  const [system, setSystem] = useState({
    institutionName: '',
    maxFileSize: '10',
    allowedTypes: 'pdf,jpg,png',
    defaultRole: 'consultant',
  });

  // Notification preferences
  const [notifs, setNotifs] = useState({
    onUpload:   true,
    onValidate: true,
    onDelete:   false,
    emailDigest: false,
  });

  const handleSave = () => {
    // TODO Phase 8: POST /api/settings + PATCH /api/auth/me
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <AnimatePresence>
        {isPasswordModalOpen && (
          <PasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        )}
      </AnimatePresence>
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tighter uppercase">Paramètres</h1>
          <p className="text-secondary text-sm font-medium mt-1">
            Gérez votre compte et la configuration de la plateforme.
          </p>
        </div>
        <button
          id="settings-save-btn"
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-primary-container transition-all shadow-lg shadow-primary/20"
        >
          {saved ? <><CheckCircle size={18} /> Enregistré !</> : <><Save size={18} /> Enregistrer</>}
        </button>
      </div>

      {/* ── Section 1: Profile ─────────────────────────────────── */}
      <Section icon={User} title="Mon profil" description="Informations de votre compte">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Nom complet">
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="Votre nom"
              className={inputCls}
            />
          </Field>
          <Field label="Adresse e-mail">
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              placeholder="votre@email.dz"
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 2: Password ────────────────────────────────── */}
      <Section icon={Lock} title="Sécurité" description="Gérez la sécurité de votre compte">
        <button
          onClick={() => setIsPasswordModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-outline-variant text-primary rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-surface-container-low transition-all"
        >
          <Lock size={18} /> Changer le mot de passe
        </button>
      </Section>

      {/* ── Section 3: Notifications ──────────────────────────── */}
      <Section icon={Bell} title="Notifications" description="Choisissez quand être notifié">
        <div className="space-y-4 divide-y divide-outline-variant/20">
          <Toggle
            label="Nouvel upload"
            description="Quand un fichier est ajouté à un PV"
            checked={notifs.onUpload}
            onChange={(v) => setNotifs((p) => ({ ...p, onUpload: v }))}
          />
          <div className="pt-4">
            <Toggle
              label="Validation de document"
              description="Quand un PV change de statut"
              checked={notifs.onValidate}
              onChange={(v) => setNotifs((p) => ({ ...p, onValidate: v }))}
            />
          </div>
          <div className="pt-4">
            <Toggle
              label="Suppression"
              description="Quand un document est supprimé"
              checked={notifs.onDelete}
              onChange={(v) => setNotifs((p) => ({ ...p, onDelete: v }))}
            />
          </div>
          <div className="pt-4">
            <Toggle
              label="Rapport hebdomadaire par e-mail"
              description="Résumé des activités envoyé chaque lundi"
              checked={notifs.emailDigest}
              onChange={(v) => setNotifs((p) => ({ ...p, emailDigest: v }))}
            />
          </div>
        </div>
      </Section>

      {/* ── Section 4: System (admin only) ───────────────────── */}
      <Section
        icon={Database}
        title="Système"
        description="Configuration globale — Administrateurs uniquement"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Nom de l'institution" hint="Affiché dans les exports PDF">
            <input
              type="text"
              value={system.institutionName}
              onChange={(e) => setSystem((p) => ({ ...p, institutionName: e.target.value }))}
              placeholder="Ex: ISTA Ouarzazate"
              className={inputCls}
            />
          </Field>
          <Field label="Taille max des fichiers (Mo)" hint="Défaut : 10 Mo">
            <input
              type="number"
              min={1}
              max={50}
              value={system.maxFileSize}
              onChange={(e) => setSystem((p) => ({ ...p, maxFileSize: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Types de fichiers acceptés" hint="Séparés par des virgules">
            <input
              type="text"
              value={system.allowedTypes}
              onChange={(e) => setSystem((p) => ({ ...p, allowedTypes: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Rôle par défaut des nouveaux comptes">
            <select
              value={system.defaultRole}
              onChange={(e) => setSystem((p) => ({ ...p, defaultRole: e.target.value }))}
              className={`${inputCls} appearance-none cursor-pointer`}
            >
              <option value="consultant">Consultant</option>
              <option value="archiviste">Archiviste</option>
              <option value="gestionnaire">Gestionnaire</option>
            </select>
          </Field>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl mt-2">
          <Shield size={18} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-primary-container leading-relaxed">
            Ces paramètres affectent l'ensemble de la plateforme. Toute modification est enregistrée dans le journal d'activité.
          </p>
        </div>
      </Section>
    </div>
    </>
  );
};
