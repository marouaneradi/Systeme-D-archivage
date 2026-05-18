import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight, ChevronDown, FolderOpen, Folder,
  FileText, Download, Eye, Search, Clock, X,
  BookOpen, ClipboardList, FileBox, GraduationCap,
  Calendar, Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';

// ── Constants ─────────────────────────────────────────────────────
const STATUS_MAP = {
  BROUILLON:          { label: 'Brouillon',         cls: 'bg-slate-100 text-slate-600 border-slate-200',     dot: 'bg-slate-400'   },
  EN_ATTENTE:         { label: 'En attente',         cls: 'bg-amber-50 text-amber-700 border-amber-200',      dot: 'bg-amber-400'   },
  VALIDE_PAPIER:      { label: 'Validé papier',      cls: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-400'    },
  ARCHIVE_NUMERIQUE:  { label: 'Archivé numérique',  cls: 'bg-violet-50 text-violet-700 border-violet-200',   dot: 'bg-violet-500'  },
  ARCHIVE_COMPLET:    { label: 'Archive complète',   cls: 'bg-green-50 text-green-700 border-green-200',      dot: 'bg-green-500'   },
};

const TYPE_INFO = {
  PV_PASSAGE:      { label: 'PV Passage',       short: 'PV-P',  icon: BookOpen,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
  PV_INTERMEDIAIRE:{ label: 'PV Intermédiaire', short: 'PV-I',  icon: ClipboardList, color: 'text-green-600',  bg: 'bg-green-50'  },
  PV_FF:           { label: 'PV Fin Formation', short: 'PV-FF', icon: FileBox,       color: 'text-purple-600', bg: 'bg-purple-50' },
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const docTitle = (doc) => `${doc.filiere ?? '—'} · ${doc.niveau ?? ''} · G${doc.groupe ?? ''}`;

// ── Status Badge ──────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] ?? { label: status, cls: 'bg-surface-container text-secondary border-outline-variant', dot: 'bg-outline' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ── Tree Node ─────────────────────────────────────────────────────
const TreeNode = ({ label, icon: Icon, count, depth = 0, active, onClick, children, defaultOpen = false, color = 'text-secondary' }) => {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = !!children;
  const paddingLeft = depth * 14 + 12;

  const handleClick = () => {
    if (hasChildren) setOpen(v => !v);
    onClick?.();
  };

  return (
    <div>
      <button
        onClick={handleClick}
        style={{ paddingLeft }}
        className={`w-full flex items-center gap-2 py-1.5 pr-3 rounded-lg text-left transition-all group text-xs font-bold
          ${active
            ? 'bg-primary text-white shadow-sm'
            : 'hover:bg-surface-container-low/70 text-secondary hover:text-on-surface'
          }`}
      >
        {hasChildren ? (
          open
            ? <ChevronDown size={13} className={`flex-shrink-0 ${active ? 'text-white/80' : 'text-outline'}`} />
            : <ChevronRight size={13} className={`flex-shrink-0 ${active ? 'text-white/80' : 'text-outline'}`} />
        ) : (
          <span className="w-[13px] flex-shrink-0" />
        )}
        {Icon && <Icon size={13} className={`flex-shrink-0 ${active ? 'text-white/80' : color}`} />}
        <span className="flex-1 truncate leading-tight">{label}</span>
        {count != null && (
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${active ? 'bg-white/20 text-white' : 'bg-outline-variant/20 text-outline'}`}>
            {count}
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Document Row ──────────────────────────────────────────────────
const DocRow = ({ doc, onViewPv, index }) => {
  const type = TYPE_INFO[doc.type];
  const Icon = type?.icon ?? FileText;
  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="hover:bg-surface-container-low/40 transition-colors group"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-lg ${type?.bg ?? 'bg-surface-container-low'} flex items-center justify-center flex-shrink-0`}>
            <Icon size={13} className={type?.color ?? 'text-secondary'} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-primary truncate max-w-[180px]">{docTitle(doc)}</p>
            <p className="text-[10px] text-secondary font-medium">REF: #{doc.id}{doc.files_count > 0 && <span className="ml-1.5 text-primary">📎 {doc.files_count}</span>}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${type?.bg} ${type?.color}`}>{type?.short ?? doc.type}</span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1 text-secondary">
          <Clock size={11} />
          <span className="text-[10px] font-semibold">{fmtDate(doc.created_at)}</span>
        </div>
        <p className="text-[10px] text-outline">{doc.creator?.name ?? '—'}</p>
      </td>
      <td className="px-3 py-3"><StatusBadge status={doc.status} /></td>
      <td className="px-3 py-3 text-right">
        <button onClick={() => onViewPv?.(doc.id)} className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-container-low transition-all" title="Voir">
          <Eye size={15} />
        </button>
      </td>
    </motion.tr>
  );
};

// ── Main Component ────────────────────────────────────────────────
export const DocumentsExplorer = ({ onViewPv }) => {
  // Tree data
  const [years,    setYears]    = useState([]);
  const [filieres, setFilieres] = useState({});   // keyed by yearId
  const [loadingYears, setLoadingYears] = useState(true);

  // Active selection
  const [sel, setSel] = useState({ yearId: null, yearLabel: null, type: null });

  // Documents
  const [docs,       setDocs]       = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [loadingDocs,setLoadingDocs] = useState(false);
  const [docError,   setDocError]   = useState('');

  // Search
  const [search, setSearch] = useState('');

  // Load academic years
  useEffect(() => {
    api.get('/training/academic-years')
      .then(({ data }) => setYears(data))
      .catch(() => setYears([]))
      .finally(() => setLoadingYears(false));
  }, []);

  // Load filieres per year (lazy)
  const loadFilieres = (yearId) => {
    if (filieres[yearId]) return;
    api.get('/training/filieres', { params: { academic_year_id: yearId } })
      .then(({ data }) => setFilieres(prev => ({ ...prev, [yearId]: data })))
      .catch(() => setFilieres(prev => ({ ...prev, [yearId]: [] })));
  };

  // Fetch documents when selection changes
  const fetchDocs = useCallback(async (pageNum = 1) => {
    if (!sel.yearId && !search) { setDocs([]); setTotalCount(0); return; }
    setLoadingDocs(true);
    setDocError('');
    try {
      const params = { page: pageNum, per_page: 15 };
      if (sel.yearId) params.academic_year_id = sel.yearId;
      if (sel.type)   params.type = sel.type;
      if (search)     params.search = search;
      const { data } = await api.get('/pv-documents', { params });
      setDocs(pageNum === 1 ? data.data : prev => [...prev, ...data.data]);
      setTotalCount(data.total);
      setTotalPages(data.last_page);
      setPage(data.current_page);
    } catch {
      setDocError('Impossible de charger les documents.');
    } finally {
      setLoadingDocs(false);
    }
  }, [sel, search]);

  useEffect(() => { fetchDocs(1); }, [sel]);
  useEffect(() => {
    const t = setTimeout(() => fetchDocs(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const selectYear = (yearId, yearLabel) => {
    setSel({ yearId, yearLabel, type: null });
    loadFilieres(yearId);
  };

  const selectType = (yearId, yearLabel, type) => {
    setSel({ yearId, yearLabel, type });
  };

  const clearSel = () => setSel({ yearId: null, yearLabel: null, type: null });

  const isActive = (yearId, type = null) =>
    sel.yearId === yearId && sel.type === type;

  // Derive available PV types per year (all types; business rules apply per group in AddPV)
  const PV_TYPES = ['PV_PASSAGE', 'PV_INTERMEDIAIRE', 'PV_FF'];

  return (
    <div className="flex gap-0 animate-in fade-in duration-500 min-h-[70vh]">

      {/* ── Sidebar Tree ─────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 border-r border-outline-variant/40 bg-white rounded-l-2xl overflow-hidden flex flex-col">
        <div className="px-4 py-4 border-b border-outline-variant/30 bg-surface-container-low/30">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-primary" />
            <span className="text-xs font-black text-primary uppercase tracking-widest">Archives PV</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {/* All documents */}
          <TreeNode
            label="Tous les documents"
            icon={FileText}
            count={sel.yearId == null ? totalCount : null}
            active={sel.yearId === null && !sel.type}
            onClick={clearSel}
          />

          {loadingYears && (
            <div className="space-y-1 p-2">
              {[1,2,3].map(i => <div key={i} className="h-6 bg-surface-container-low rounded-lg animate-pulse" />)}
            </div>
          )}

          {years.map((year) => (
            <TreeNode
              key={year.id}
              label={year.label ?? `${year.year}-${year.year + 1}`}
              icon={Calendar}
              color="text-primary"
              depth={0}
              active={isActive(year.id)}
              onClick={() => selectYear(year.id, year.label)}
              defaultOpen={false}
            >
              {/* PV Types under this year */}
              <div className="mt-0.5 space-y-0.5 pb-1">
                {PV_TYPES.map((pvType) => {
                  const info = TYPE_INFO[pvType];
                  const Icon = info.icon;
                  return (
                    <TreeNode
                      key={pvType}
                      label={info.label}
                      icon={Icon}
                      color={info.color}
                      depth={1}
                      active={isActive(year.id, pvType)}
                      onClick={() => selectType(year.id, year.label, pvType)}
                    />
                  );
                })}
              </div>
            </TreeNode>
          ))}
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 bg-white rounded-r-2xl border border-outline-variant/40 border-l-0 flex flex-col overflow-hidden shadow-lg">

        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-outline-variant/30 bg-surface-container-low/20 flex items-center gap-3 flex-wrap">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-secondary flex-1 min-w-0">
            <button onClick={clearSel} className="hover:text-primary transition-colors flex-shrink-0">Documents PV</button>
            {sel.yearLabel && (
              <>
                <ChevronRight size={12} className="text-outline-variant flex-shrink-0" />
                <button onClick={() => setSel(s => ({ ...s, type: null }))} className="hover:text-primary transition-colors flex-shrink-0">{sel.yearLabel}</button>
              </>
            )}
            {sel.type && (
              <>
                <ChevronRight size={12} className="text-outline-variant flex-shrink-0" />
                <span className="text-primary flex-shrink-0">{TYPE_INFO[sel.type]?.label}</span>
              </>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="pl-8 pr-3 py-1.5 text-xs border border-outline-variant/50 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none w-44 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-primary">
                <X size={11} />
              </button>
            )}
          </div>

          {/* Count */}
          <span className="text-[10px] font-black text-secondary uppercase tracking-widest flex-shrink-0">
            {totalCount} document{totalCount > 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {docError && (
            <div className="m-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">{docError}</div>
          )}

          {loadingDocs && docs.length === 0 ? (
            <div className="p-6 space-y-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-12 bg-surface-container-low rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !loadingDocs && docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-secondary">
              <div className="p-5 bg-surface-container-low rounded-2xl">
                <FileText size={32} className="text-outline-variant" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest">Aucun document</p>
              <p className="text-xs text-outline">
                {sel.yearId ? 'Aucun PV pour cette sélection.' : 'Sélectionnez une promotion dans l\'arborescence.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/40 border-b border-outline-variant/30 sticky top-0 z-10">
                  <th className="px-4 py-3 text-[9px] font-black uppercase text-secondary tracking-[0.2em]">Document</th>
                  <th className="px-3 py-3 text-[9px] font-black uppercase text-secondary tracking-[0.2em]">Type</th>
                  <th className="px-3 py-3 text-[9px] font-black uppercase text-secondary tracking-[0.2em]">Créé le</th>
                  <th className="px-3 py-3 text-[9px] font-black uppercase text-secondary tracking-[0.2em]">Statut</th>
                  <th className="px-3 py-3 text-[9px] font-black uppercase text-secondary tracking-[0.2em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {docs.map((doc, i) => (
                  <DocRow key={doc.id} doc={doc} onViewPv={onViewPv} index={i} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-outline-variant/20 bg-surface-container-low/10 flex items-center justify-between">
            <span className="text-[10px] font-bold text-secondary">Page {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchDocs(page - 1)}
                disabled={page <= 1 || loadingDocs}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-outline-variant rounded-lg text-secondary hover:text-primary hover:bg-surface-container-low disabled:opacity-30 transition-all"
              >← Préc.</button>
              <button
                onClick={() => fetchDocs(page + 1)}
                disabled={page >= totalPages || loadingDocs}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-outline-variant rounded-lg text-secondary hover:text-primary hover:bg-surface-container-low disabled:opacity-30 transition-all"
              >Suiv. →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
