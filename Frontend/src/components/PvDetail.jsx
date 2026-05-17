import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, FileText, Download, CheckCircle,
  Clock, Upload, Trash2, AlertTriangle,
  File, Eye, ChevronRight, User, Calendar,
  MapPin, BookOpen, Users, AlertCircle, X,
  Link, GitBranch, GraduationCap, FileBarChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';

// ── Constants ─────────────────────────────────────────────────────
const LIFECYCLE = [
  { key: 'BROUILLON', label: 'Brouillon', color: 'bg-slate-400' },
  { key: 'EN_ATTENTE', label: 'En attente', color: 'bg-amber-400' },
  { key: 'VALIDE_PAPIER', label: 'Validé (papier)', color: 'bg-blue-400' },
  { key: 'ARCHIVE_NUMERIQUE', label: 'Archivé numérique', color: 'bg-violet-500' },
  { key: 'ARCHIVE_COMPLET', label: 'Archive complète', color: 'bg-green-500' },
];

const STATUS_BADGE = {
  BROUILLON: 'bg-slate-100 text-slate-600 border-slate-200',
  EN_ATTENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  VALIDE_PAPIER: 'bg-blue-50 text-blue-700 border-blue-200',
  ARCHIVE_NUMERIQUE: 'bg-violet-50 text-violet-700 border-violet-200',
  ARCHIVE_COMPLET: 'bg-green-50 text-green-700 border-green-200',
};

const TYPE_BADGE = {
  PV_FF: 'bg-purple-50 text-purple-700',
  PV_PASSAGE: 'bg-blue-50 text-blue-700',
  PV_INTERMEDIAIRE: 'bg-green-50 text-green-700',
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ACTION_MAP = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  UPLOAD: 'Ajout de fichier',
  VIEW: 'Consultation',
  VALIDATE: 'Validation',
  EXPORT: 'Export',
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
};

// ── Sub-components ────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary flex-shrink-0 mt-0.5">
      <Icon size={16} />
    </div>
    <div>
      <p className="text-[10px] font-black text-outline uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-on-surface mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

const StatusTimeline = ({ currentStatus }) => {
  const currentIdx = LIFECYCLE.findIndex((s) => s.key === currentStatus);
  return (
    <div className="flex items-center">
      {LIFECYCLE.map((step, idx) => {
        const done = idx <= currentIdx;
        const current = idx === currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${done ? `${step.color} border-transparent text-white` : 'bg-surface-container border-outline-variant text-outline'
                } ${current ? 'ring-4 ring-offset-2 ring-primary/20' : ''}`}>
                {done ? <CheckCircle size={16} /> : <Clock size={14} />}
              </div>
              <p className={`text-[9px] font-black uppercase tracking-wider text-center w-16 leading-tight ${done ? 'text-primary' : 'text-outline'}`}>
                {step.label}
              </p>
            </div>
            {idx < LIFECYCLE.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-1 ${idx < currentIdx ? 'bg-primary' : 'bg-outline-variant/30'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};


// ── Main Component ────────────────────────────────────────────────
export const PvDetail = ({ pvId, onBack, onViewPv, user }) => {
  const [document, setDocument] = useState(null);
  const [files, setFiles] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Pagination for history
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PER_PAGE = 5;
  const [uploadErr, setUploadErr] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDocument = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/pv-documents/${pvId}`);
      setDocument(data.document);
      setFiles(data.document.files ?? []);
      setHistory(data.history ?? []);
    } catch {
      setError('Impossible de charger ce document.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (pvId) fetchDocument(); }, [pvId]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    setShowStatusMenu(false);
    try {
      const { data } = await api.patch(`/pv-documents/${pvId}/status`, { status: newStatus });
      setDocument(data);
      const { data: fresh } = await api.get(`/pv-documents/${pvId}`);
      setHistory(fresh.history ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Impossible de mettre à jour le statut.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFileUpload = async (e) => {
    const fileList = Array.from(e.target.files);
    if (!fileList.length) return;
    setUploading(true);
    setUploadErr('');
    try {
      await Promise.all(
        fileList.map((file) => {
          const fd = new FormData();
          fd.append('files[]', file); // ✅ correct key
          return api.post(`/pv-documents/${pvId}/files`, fd);
        })
      );
      const { data } = await api.get(`/pv-documents/${pvId}`);
      setFiles(data.document.files ?? []);
    } catch (err) {
      setUploadErr(err.response?.data?.message ?? 'Erreur lors du téléversement.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (file) => {
    try {
      const res = await api.get(`/pv-files/${file.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = window.document.createElement('a');
      link.href = url; link.download = file.original_name; link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Impossible de télécharger ce fichier.');
    }
  };

  const handleFileDelete = async (fileId) => {
    try {
      await api.delete(`/pv-files/${fileId}`);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch {
      setError('Impossible de supprimer ce fichier.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/pv-documents/${pvId}`);
      onBack?.();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Impossible de supprimer ce document.');
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const currentIdx = LIFECYCLE.findIndex((s) => s.key === document?.status);
  const nextStatuses = LIFECYCLE.filter((_, i) => i === currentIdx + 1 || i === currentIdx - 1);

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 bg-surface-container-low rounded-xl w-1/3" />
      <div className="h-32 bg-surface-container-low rounded-2xl" />
      <div className="h-64 bg-surface-container-low rounded-2xl" />
    </div>
  );

  if (error && !document) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle size={40} className="text-red-400" />
      <p className="text-red-600 font-bold">{error}</p>
      <button onClick={onBack} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest">Retour</button>
    </div>
  );

  const docLabel = `${document?.filiere ?? ''} · G${document?.groupe ?? ''}`;
  const isPvFF = document?.type === 'PV_FF';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm font-semibold flex-1">{error}</p>
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={onBack} className="p-2 border border-outline-variant rounded-xl bg-white text-secondary hover:text-primary hover:bg-surface-container-low transition-all flex-shrink-0 mt-1">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-outline mb-1">
            <button onClick={onBack} className="text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">Documents PV</button>
            <ChevronRight size={12} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">REF: #{document?.id}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black text-primary tracking-tight">{docLabel}</h1>
            {document?.type && (
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${TYPE_BADGE[document.type] ?? 'bg-surface-container text-secondary'}`}>
                {document.type.replace('_', '-')}
              </span>
            )}
          </div>
          {document?.status && (
            <span className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_BADGE[document.status]}`}>
              {LIFECYCLE.find((s) => s.key === document.status)?.label ?? document.status}
            </span>
          )}
        </div>

        {/* Status action */}
        <div className="flex gap-2 flex-shrink-0 relative">
          <button
            onClick={() => setShowStatusMenu((v) => !v)}
            disabled={updatingStatus}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary-container transition-all shadow-lg shadow-primary/10 disabled:opacity-60"
          >
            {updatingStatus
              ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
              : <CheckCircle size={16} />}
            Changer statut
          </button>
          <AnimatePresence>
            {showStatusMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-12 right-0 z-50 bg-white border border-outline-variant rounded-xl shadow-xl overflow-hidden min-w-[200px]"
              >
                {nextStatuses.length === 0
                  ? <p className="px-4 py-3 text-xs text-secondary font-medium">Aucun changement disponible.</p>
                  : nextStatuses.map((s) => (
                    <button key={s.key} onClick={() => handleStatusUpdate(s.key)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider text-left hover:bg-surface-container-low transition-colors">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      {s.label}
                    </button>
                  ))
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white border border-outline-variant rounded-2xl p-8 shadow-sm">
        <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-8">Cycle de vie du document</h3>
        <StatusTimeline currentStatus={document?.status ?? 'BROUILLON'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left */}
        <div className="lg:col-span-8 space-y-8">

          {/* Metadata */}
          <div className="bg-white border border-outline-variant rounded-2xl p-8 shadow-sm">
            <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-6">Informations académiques</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              <InfoRow icon={FileText} label="Type de PV" value={document?.type?.replace('_', '-')} />
              <InfoRow icon={Calendar} label="Année universitaire" value={document?.academic_year} />
              <InfoRow icon={BookOpen} label="Filière" value={document?.filiere} />
              <InfoRow icon={Users} label="Niveau & Groupe" value={`${document?.niveau ?? '—'} — G${document?.groupe ?? '?'}`} />

              <InfoRow icon={MapPin} label="Localisation physique" value={document?.physical_location} />
              <InfoRow icon={User} label="Créé par" value={document?.creator?.name} />
              <InfoRow icon={Calendar} label="Date de création" value={fmtDate(document?.created_at)} />
              {document?.validator && (
                <InfoRow icon={CheckCircle} label="Validé par" value={document.validator?.name} />
              )}
            </div>

            {document?.notes && (
              <div className="mt-6 p-4 bg-surface-container-low/50 rounded-xl border border-outline-variant/30">
                <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Notes</p>
                <p className="text-sm font-medium text-on-surface">{document.notes}</p>
              </div>
            )}
          </div>

          {/* Files */}
          <div className="bg-white border border-outline-variant rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-primary uppercase tracking-widest">Scans & Fichiers ({files.length})</h3>
              <label className={`flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer hover:bg-primary-container ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                {uploading
                  ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                  : <Upload size={16} />}
                {uploading ? 'Envoi…' : 'Ajouter un scan'}
              </label>
            </div>

            {uploadErr && (
              <p className="mb-4 text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadErr}</p>
            )}

            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 border-2 border-dashed border-outline-variant/40 rounded-2xl">
                <File size={36} className="text-outline-variant" />
                <p className="text-sm font-bold text-secondary uppercase tracking-widest">Aucun fichier joint</p>
                <p className="text-xs text-outline font-medium">Les scans apparaîtront ici une fois uploadés.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {files.map((file) => (
                  <motion.div key={file.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 bg-surface-container-low/50 border border-outline-variant/30 rounded-xl group hover:shadow-sm transition-all">
                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-primary truncate">{file.original_name}</p>
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mt-0.5">
                        {file.file_type?.toUpperCase()} • {(file.file_size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDownload(file)} className="p-1.5 text-secondary hover:text-primary transition-colors"><Download size={16} /></button>
                      <button onClick={() => handleFileDelete(file.id)} className="p-1.5 text-secondary hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-4 space-y-6">

          {/* History */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-6">Historique des actions</h3>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-secondary">
                <Clock size={28} className="text-outline-variant" />
                <p className="text-xs font-bold uppercase tracking-widest">Aucune action</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-outline-variant/30" />
                <div className="space-y-6">
                  {history.slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE).map((entry) => (
                    <div key={entry.id} className="flex gap-4 relative">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0 relative z-10">
                        <Clock size={14} className="text-secondary" />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-xs font-black text-primary">
                          {ACTION_MAP[entry.action] ?? entry.action}
                        </p>
                        <p className="text-[10px] font-medium text-secondary">{entry.user?.name}</p>
                        <p className="text-[10px] font-bold text-outline mt-1">{fmtDate(entry.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination Controls */}
                {history.length > HISTORY_PER_PAGE && (
                  <div className="flex items-center justify-between pt-6 border-t border-outline-variant/30 mt-6 relative z-10 bg-white">
                    <button
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className="px-3 py-1.5 text-xs font-bold text-secondary border border-outline-variant rounded-lg hover:bg-surface-container-low disabled:opacity-30 transition-all"
                    >
                      Précédent
                    </button>
                    <span className="text-[10px] font-black text-secondary tracking-widest">
                      {historyPage} / {Math.ceil(history.length / HISTORY_PER_PAGE)}
                    </span>
                    <button
                      onClick={() => setHistoryPage(p => Math.min(Math.ceil(history.length / HISTORY_PER_PAGE), p + 1))}
                      disabled={historyPage === Math.ceil(history.length / HISTORY_PER_PAGE)}
                      className="px-3 py-1.5 text-xs font-bold text-secondary border border-outline-variant rounded-lg hover:bg-surface-container-low disabled:opacity-30 transition-all"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Danger zone */}
          {user?.role === 'admin' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-3 mt-8">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={16} />
                <h3 className="text-xs font-black uppercase tracking-widest">Zone de danger</h3>
              </div>
              <p className="text-xs font-medium text-red-600 leading-relaxed">La suppression d'un document est irréversible.</p>
              {!deleteConfirm ? (
                <button onClick={() => setDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-300 bg-white text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                  <Trash2 size={14} /> Supprimer ce PV
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-black text-red-700 text-center">Confirmer la suppression ?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirm(false)}
                      className="flex-1 py-2 border border-red-200 bg-white text-red-600 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-red-50 transition-all">
                      Annuler
                    </button>
                    <button onClick={handleDelete} disabled={deleting}
                      className="flex-1 py-2 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-red-700 transition-all disabled:opacity-60 flex items-center justify-center gap-1">
                      {deleting
                        ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                        : <Trash2 size={14} />}
                      Confirmer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};