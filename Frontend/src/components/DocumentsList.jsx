import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, MoreVertical, FileText,
  Download, Eye, ChevronLeft, ChevronRight, Clock,
} from 'lucide-react';
import { motion } from 'motion/react';
import api from '../services/api';

// ── Status badge mapping (backend enums → display) ────────────────
const STATUS_MAP = {
  BROUILLON: { label: 'Brouillon', cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  VALIDE_PAPIER: { label: 'Validé papier', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400' },
  ARCHIVE_NUMERIQUE: { label: 'Archivé numérique', cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  ARCHIVE_COMPLET: { label: 'Archive complète', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
};

const TYPE_MAP = {
  PV_FF: { label: 'PV-FF', cls: 'bg-purple-50 text-purple-700' },
  PV_PASSAGE: { label: 'PV-Passage', cls: 'bg-blue-50 text-blue-700' },
  PV_INTERMEDIAIRE: { label: 'PV-Intermédiaire', cls: 'bg-green-50 text-green-700' },
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
  return `${doc.filiere ?? '—'} · ${doc.niveau ?? ''} · G${doc.groupe ?? ''}`;
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Main component ────────────────────────────────────────────────
export const DocumentsList = ({ onViewPv, yearId = null, pvType = null, yearLabel = null, niveau = null }) => {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState(pvType ?? '');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sync when tree navigation sends new props — also clear status filter so it doesn't bleed across pages
  useEffect(() => { setTypeFilter(pvType ?? ''); setStatusFilter(''); setShowFilters(false); setCurrentPage(1); }, [pvType]);
  useEffect(() => { setCurrentPage(1); }, [yearId, niveau]);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: currentPage, per_page: 10 };
      if (searchQuery) params.search = searchQuery;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (yearId) params.academic_year_id = yearId;
      if (niveau) params.year_level = niveau; // sidebar sends '1','2','3' — matched via group code prefix in backend

      const { data } = await api.get('/pv-documents', { params });

      setDocuments(data.data);
      setTotalCount(data.total);
      setTotalPages(data.last_page);
    } catch (err) {
      setError('Impossible de charger les documents. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, typeFilter, statusFilter, yearId, niveau]);

  // Debounced search — wait 400ms after typing
  useEffect(() => {
    const t = setTimeout(() => { setCurrentPage(1); fetchDocuments(); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Immediate fetch on page/filter/sidebar change
  useEffect(() => { fetchDocuments(); }, [currentPage, typeFilter, statusFilter, yearId, niveau]);

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
          {(yearLabel || pvType) && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {yearLabel && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-primary/10 text-primary px-2.5 py-1 rounded-full uppercase tracking-widest">
                  <img src="data:image/png;base64,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" alt="calendar" className="w-3.5 h-3.5 object-contain" /> {yearLabel}
                </span>
              )}
              {pvType && TYPE_MAP[pvType] && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${TYPE_MAP[pvType].cls}`}>
                  {TYPE_MAP[pvType].label}
                </span>
              )}
            </div>
          )}
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
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 border rounded-lg font-bold text-[10px] uppercase tracking-[0.15em] transition-all flex-shrink-0 ${showFilters || (!pvType && typeFilter) || statusFilter
              ? 'border-primary bg-primary text-white'
              : 'border-outline-variant/60 bg-white text-secondary hover:text-primary hover:bg-surface-container-low'
              }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filtres</span> {((!pvType && typeFilter) || statusFilter) ? '●' : ''}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 p-4 bg-white border border-outline-variant/50 rounded-xl">
          {!pvType && (
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-outline-variant/50 rounded-lg text-xs font-bold bg-surface-container-low outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
            >
              <option value="">Tous les types</option>
              <option value="PV_FF">PV-FF</option>
              <option value="PV_PASSAGE">PV-Passage</option>
              <option value="PV_INTERMEDIAIRE">PV-Intermédiaire</option>
            </select>
          )}
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
          {((!pvType && typeFilter) || statusFilter) && (
            <button
              onClick={() => { setTypeFilter(pvType ?? ''); setStatusFilter(''); setCurrentPage(1); }}
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
      <div className="bg-white rounded-xl border border-outline-variant shadow-lg overflow-hidden min-w-0">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                <th className="px-3 lg:px-4 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em]">Document</th>
                <th className="px-3 lg:px-4 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em]">Type</th>
                <th className="px-3 lg:px-4 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em]">Année / Filière</th>
                <th className="px-3 lg:px-4 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em]">Créé le</th>
                <th className="px-3 lg:px-4 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em] text-center">Statut</th>
                <th className="px-3 lg:px-4 py-5 text-[10px] font-black uppercase text-secondary tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
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
                      <td className="px-3 lg:px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary border border-outline-variant/20 flex-shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-primary tracking-tight max-w-[150px] truncate">{docTitle(doc)}</p>
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">
                              REF: #{doc.id}
                              {doc.files_count > 0 && (
                                <span className="ml-2 text-primary">📎 {doc.files_count}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${type.cls}`}>
                          {type.label}
                        </span>
                      </td>
                      <td className="px-3 lg:px-4 py-4">
                        <p className="text-sm font-bold text-on-surface truncate max-w-[120px]">{doc.academic_year ?? doc.semester ?? '—'}</p>
                        <p className="text-[11px] font-medium text-secondary truncate max-w-[120px]">
                          {doc.filiere ?? doc.module ?? '—'}
                        </p>
                      </td>
                      <td className="px-3 lg:px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-secondary">
                          <Clock size={14} />
                          <span className="text-xs font-semibold">{fmtDate(doc.created_at)}</span>
                        </div>
                        <p className="text-[10px] text-outline font-medium mt-0.5">{doc.creator?.name ?? '—'}</p>
                      </td>
                      <td className="px-3 lg:px-4 py-4 text-center">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-3 lg:px-4 py-4 text-right">
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
                  className={`w-8 h-8 flex items-center justify-center rounded text-[11px] font-black transition-all ${p === currentPage
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