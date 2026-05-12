import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, MoreVertical, FileText,
  Download, Eye, ChevronLeft, ChevronRight, Clock,
} from 'lucide-react';
import { motion } from 'motion/react';
import api from '../services/api';

// ── Status badge mapping (backend enums → display) ────────────────
const STATUS_MAP = {
  BROUILLON:          { label: 'Brouillon',         cls: 'bg-slate-50 text-slate-600 border-slate-200',   dot: 'bg-slate-400'  },
  EN_ATTENTE:         { label: 'En attente',         cls: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400'  },
  VALIDE_PAPIER:      { label: 'Validé papier',      cls: 'bg-blue-50 text-blue-700 border-blue-200',      dot: 'bg-blue-400'   },
  ARCHIVE_NUMERIQUE:  { label: 'Archivé numérique',  cls: 'bg-violet-50 text-violet-700 border-violet-200',dot: 'bg-violet-500' },
  ARCHIVE_COMPLET:    { label: 'Archive complète',   cls: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500'  },
};

const TYPE_MAP = {
  PV_FF:  { label: 'PV-FF',  cls: 'bg-purple-50 text-purple-700' },
  PV_CC:  { label: 'PV-CC',  cls: 'bg-blue-50 text-blue-700'     },
  PV_EFM: { label: 'PV-EFM', cls: 'bg-green-50 text-green-700'   },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] ?? { label: status, cls: 'bg-surface-container text-secondary border-outline-variant', dot: 'bg-outline' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ── Helpers ───────────────────────────────────────────────────────
const docTitle = (doc) => {
  if (doc.type === 'PV_FF')  return `${doc.filiere ?? '—'} · ${doc.niveau ?? ''} · G${doc.groupe ?? ''}`;
  if (doc.type === 'PV_CC')  return `${doc.module ?? '—'} · ${doc.semester ?? ''}`;
  if (doc.type === 'PV_EFM') return `${doc.module ?? '—'} · ${doc.session ?? ''}`;
  return `PV #${doc.id}`;
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Main component ────────────────────────────────────────────────
export const DocumentsList = ({ onViewPv }) => {
  const [documents,    setDocuments]    = useState([]);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters,  setShowFilters]  = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: currentPage, per_page: 10 };
      if (searchQuery)  params.search = searchQuery;
      if (typeFilter)   params.type   = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const { data } = await api.get('/pv-documents', { params });

      setDocuments(data.data);
      setTotalCount(data.total);
      setTotalPages(data.last_page);
    } catch (err) {
      setError('Impossible de charger les documents. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, typeFilter, statusFilter]);

  // Debounced search — wait 400ms after typing
  useEffect(() => {
    const t = setTimeout(() => { setCurrentPage(1); fetchDocuments(); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Immediate fetch on page/filter change
  useEffect(() => { fetchDocuments(); }, [currentPage, typeFilter, statusFilter]);

  const handleDownload = async (doc) => {
    if (!doc.files_count) return;
    // Download is handled per-file in PvDetail; here we just open detail
    onViewPv?.(doc.id);
  };

  const perPage = 10;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tighter uppercase">Documents PV</h1>
          <p className="text-secondary text-sm font-medium mt-1">
            Gestion complète des archives documentaires et scans.
            {totalCount > 0 && (
              <span className="ml-2 text-primary font-black">{totalCount} document{totalCount > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative group flex-1 sm:flex-none">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher filière, module…"
              className="pl-10 pr-4 py-2 bg-white border border-outline-variant/50 rounded-lg text-sm w-full sm:w-64 md:w-72 focus:ring-2 focus:ring-primary-container outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 border rounded-lg font-bold text-[10px] uppercase tracking-[0.15em] transition-all flex-shrink-0 ${
              showFilters || typeFilter || statusFilter
                ? 'border-primary bg-primary text-white'
                : 'border-outline-variant/60 bg-white text-secondary hover:text-primary hover:bg-surface-container-low'
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filtres</span> {(typeFilter || statusFilter) ? '●' : ''}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 p-4 bg-white border border-outline-variant/50 rounded-xl">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-outline-variant/50 rounded-lg text-xs font-bold bg-surface-container-low outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
          >
            <option value="">Tous les types</option>
            <option value="PV_FF">PV-FF</option>
            <option value="PV_CC">PV-CC</option>
            <option value="PV_EFM">PV-EFM</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-outline-variant/50 rounded-lg text-xs font-bold bg-surface-container-low outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {(typeFilter || statusFilter) && (
            <button
              onClick={() => { setTypeFilter(''); setStatusFilter(''); setCurrentPage(1); }}
              className="px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50 rounded-lg transition-colors uppercase tracking-widest"
            >
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                <th className="px-6 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em]">Document</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em]">Type</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em]">Année / Filière</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em]">Créé le</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em] text-center">Statut</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                [1,2,3,4].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-10 bg-surface-container-low rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-secondary">
                      <FileText size={40} className="text-outline-variant" />
                      <p className="text-sm font-bold uppercase tracking-widest">Aucun document trouvé</p>
                      <p className="text-xs font-medium text-outline">
                        {searchQuery || typeFilter || statusFilter
                          ? 'Essayez de modifier vos filtres.'
                          : 'Ajoutez votre premier PV pour commencer.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((doc, idx) => {
                  const type = TYPE_MAP[doc.type] ?? { label: doc.type, cls: 'bg-surface-container text-secondary' };
                  return (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="hover:bg-surface-container-low/30 transition-colors group cursor-default"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary border border-outline-variant/20">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-primary tracking-tight max-w-[200px] truncate">{docTitle(doc)}</p>
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">
                              REF: #{doc.id}
                              {doc.files_count > 0 && (
                                <span className="ml-2 text-primary">📎 {doc.files_count}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${type.cls}`}>
                          {type.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-on-surface">{doc.academic_year ?? doc.semester ?? '—'}</p>
                        <p className="text-[11px] font-medium text-secondary truncate max-w-[140px]">
                          {doc.filiere ?? doc.module ?? '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-secondary">
                          <Clock size={14} />
                          <span className="text-xs font-semibold">{fmtDate(doc.created_at)}</span>
                        </div>
                        <p className="text-[10px] text-outline font-medium mt-0.5">{doc.creator?.name ?? '—'}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            onClick={() => onViewPv?.(doc.id)}
                            className="p-2 text-secondary hover:text-primary hover:bg-surface-container-low rounded-full transition-all"
                            title="Voir le détail"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={!doc.files_count}
                            className="p-2 text-secondary hover:text-primary hover:bg-surface-container-low rounded-full transition-all disabled:opacity-30"
                            title={doc.files_count ? 'Télécharger' : 'Aucun fichier'}
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 sm:px-8 py-4 border-t border-outline-variant/20 bg-surface-container-low/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] font-bold text-secondary uppercase tracking-widest">
            {totalCount === 0
              ? 'Aucun document'
              : `${(currentPage - 1) * perPage + 1}–${Math.min(currentPage * perPage, totalCount)} sur ${totalCount}`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-outline-variant rounded bg-white text-secondary hover:text-primary disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-[11px] font-black transition-all ${
                    p === currentPage
                      ? 'bg-primary text-white shadow-md'
                      : 'border border-outline-variant hover:bg-surface-container-low text-secondary'
                  }`}
                >
                  {p}
                </button>
              ))}
              {totalPages > 5 && <span className="w-8 h-8 flex items-center justify-center text-outline-variant">…</span>}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 border border-outline-variant rounded bg-white text-secondary hover:text-primary disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};