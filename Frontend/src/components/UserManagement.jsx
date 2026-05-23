import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, Search, Shield, Edit3,
  CheckCircle, XCircle, Mail, User, AlertCircle, X, Ban, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';

// ── Constants ─────────────────────────────────────────────────────
const ROLES = ['admin', 'gestionnaire', 'archiviste', 'consultant'];

const ROLE_STYLE = {
  admin:        'bg-purple-50 text-purple-700 border-purple-200',
  gestionnaire: 'bg-blue-50   text-blue-700   border-blue-200',
  archiviste:   'bg-green-50  text-green-700  border-green-200',
  consultant:   'bg-amber-50  text-amber-700  border-amber-200',
};

const ROLE_LABEL = {
  admin:        'Administrateur',
  gestionnaire: 'Gestionnaire',
  archiviste:   'Archiviste',
  consultant:   'Consultant',
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const initials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U';

// ── Modal: Add / Edit user ────────────────────────────────────────
const UserModal = ({ user, onClose, onSave, saving, errors }) => {
  const [form, setForm] = useState({
    name:     user?.name  ?? '',
    email:    user?.email ?? '',
    role:     user?.role  ?? 'consultant',
  });

  const isEdit = !!user;
  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-primary tracking-tight">
            {isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
          </h3>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        {/* Field errors */}
        {Object.keys(errors).length > 0 && (
          <ul className="text-xs text-red-600 font-semibold space-y-1 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {Object.entries(errors).map(([k, msgs]) => (
              <li key={k}>• {Array.isArray(msgs) ? msgs[0] : msgs}</li>
            ))}
          </ul>
        )}

        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Nom complet *</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder="Le nom de l'utilisateur"
                className="w-full pl-9 pr-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Adresse e-mail *</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="l'email de l'utilisateur"
                className="w-full pl-9 pr-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all" />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Rôle *</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button key={r} type="button" onClick={() => set('role', r)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                    form.role === r
                      ? `${ROLE_STYLE[r]} border-current`
                      : 'bg-surface-container-low border-outline-variant/40 text-secondary hover:border-outline-variant'
                  }`}>
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-3 border border-outline-variant rounded-xl bg-white text-primary font-bold text-sm uppercase tracking-wider hover:bg-surface-container-low transition-all disabled:opacity-50">
            Annuler
          </button>
          <button onClick={() => onSave(form)} disabled={saving}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-primary-container transition-all shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving
              ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Enregistrement…</>
              : isEdit ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Delete confirm modal ──────────────────────────────────────────
const DeleteConfirm = ({ user, onCancel, onConfirm, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 space-y-6 text-center"
    >
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
        <Trash2 size={28} className="text-red-500" />
      </div>
      <div>
        <h3 className="text-lg font-black text-primary">Supprimer l'utilisateur ?</h3>
        <p className="text-sm text-secondary mt-2">
          <strong>{user.name}</strong> sera définitivement supprimé. Cette action est irréversible.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={deleting}
          className="flex-1 py-2.5 border border-outline-variant rounded-xl text-primary font-bold text-sm hover:bg-surface-container-low transition-all">
          Annuler
        </button>
        <button onClick={onConfirm} disabled={deleting}
          className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {deleting
            ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            : <Trash2 size={14} />}
          Supprimer
        </button>
      </div>
    </motion.div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────
export const UserManagement = () => {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [searchQuery, setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState('');

  // Modal state
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Delete state
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Fetch users ───────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (roleFilter)  params.role   = roleFilter;
      const { data } = await api.get('/users', { params });
      setUsers(data.data ?? data); // handle paginated or plain array
    } catch {
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(fetchUsers, 350);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  // ── Create / Update ───────────────────────────────────────────
  const handleSave = async (form) => {
    setSaving(true);
    setFieldErrors({});
    try {
      const payload = { name: form.name, email: form.email, role: form.role };

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      setModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors ?? {});
      } else {
        setError(err.response?.data?.message ?? 'Erreur lors de l\'enregistrement.');
        setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ─────────────────────────────────────────────
  const handleToggleActive = async (u) => {
    try {
      await api.patch(`/users/${u.id}/toggle-active`);
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_active: !x.is_active } : x));
    } catch {
      setError('Impossible de modifier le statut.');
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/users/${deletingUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Impossible de supprimer cet utilisateur.');
      setDeletingUser(null);
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => { setEditingUser(null); setFieldErrors({}); setModalOpen(true); };
  const openEdit   = (u) => { setEditingUser(u);   setFieldErrors({}); setModalOpen(true); };


  return (
    <>
      <AnimatePresence>
        {modalOpen && (
          <UserModal
            user={editingUser}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
            saving={saving}
            errors={fieldErrors}
          />
        )}
        {deletingUser && (
          <DeleteConfirm
            user={deletingUser}
            onCancel={() => setDeletingUser(null)}
            onConfirm={handleDelete}
            deleting={deleting}
          />
        )}
      </AnimatePresence>

      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tighter uppercase">Utilisateurs</h1>
            <p className="text-secondary text-sm font-medium mt-1">
              Gérez les comptes et les rôles d'accès à la plateforme.
              {users.length > 0 && <span className="ml-2 font-black text-primary">{users.length} compte{users.length > 1 ? 's' : ''}</span>}
            </p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary-container transition-all shadow-lg shadow-primary/20">
            <UserPlus size={16} /> Nouvel utilisateur
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle size={18} className="flex-shrink-0" />
            <p className="text-sm font-semibold flex-1">{error}</p>
            <button onClick={() => setError('')}><X size={16} /></button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input type="text" value={searchQuery} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-outline-variant/50 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary-container outline-none transition-all" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-outline-variant/50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer min-w-[180px]">
            <option value="">Tous les rôles</option>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-outline-variant shadow-lg overflow-hidden min-w-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                <th className="px-6 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em]">Utilisateur</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em]">Rôle</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em] text-center">Statut</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em]">Créé le</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                [1,2,3].map((i) => (
                  <tr key={i}><td colSpan={5} className="px-6 py-4">
                    <div className="h-10 bg-surface-container-low rounded-xl animate-pulse" />
                  </td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-secondary">
                    <Shield size={40} className="text-outline-variant" />
                    <p className="text-sm font-bold uppercase tracking-widest">Aucun utilisateur</p>
                    <p className="text-xs text-outline font-medium">
                      {searchQuery || roleFilter ? 'Essayez de modifier vos filtres.' : 'Créez le premier compte.'}
                    </p>
                  </div>
                </td></tr>
              ) : (
                users.map((u, idx) => (
                  <motion.tr key={u.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-surface-container-low/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                          {initials(u.name)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-primary">{u.name}</p>
                          <p className="text-[11px] text-secondary font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${ROLE_STYLE[u.role] ?? 'bg-surface-container text-secondary border-outline-variant'}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                          u.is_active
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                            : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                        }`}>
                        {u.is_active
                          ? <><CheckCircle size={12} /> Actif</>
                          : <><XCircle size={12} /> Inactif</>}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-secondary">{fmtDate(u.created_at)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(u)}
                          className="p-2 text-secondary hover:text-primary hover:bg-surface-container-low rounded-lg transition-all"
                          title="Modifier">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleToggleActive(u)}
                          className={`p-2 rounded-lg transition-all ${
                            u.is_active ? 'text-secondary hover:text-orange-600 hover:bg-orange-50' : 'text-secondary hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={u.is_active ? 'Bloquer' : 'Débloquer'}>
                          {u.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button onClick={() => setDeletingUser(u)}
                          className="p-2 text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </>
  );
};