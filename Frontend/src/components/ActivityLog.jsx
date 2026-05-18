import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Trash2, Edit3, Plus, Eye,
  BarChart2, ChevronDown, ChevronRight, Download, Search,
  LogIn, LogOut, Upload, CheckCircle, X, Activity,
  Filter, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';

// ── Action map ────────────────────────────────────────────────────
const ACTION_MAP = {
  CREATE:   { label: 'Ajout',          icon: Plus,        color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  UPDATE:   { label: 'Modification',   icon: Edit3,       color: 'bg-blue-500',   text: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
  DELETE:   { label: 'Suppression',    icon: Trash2,      color: 'bg-red-500',    text: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200'    },
  VIEW:     { label: 'Consultation',   icon: Eye,         color: 'bg-slate-400',  text: 'text-slate-500',  bg: 'bg-slate-50',   border: 'border-slate-200'  },
  UPLOAD:   { label: 'Upload fichier', icon: Upload,      color: 'bg-violet-500', text: 'text-violet-600', bg: 'bg-violet-50',  border: 'border-violet-200' },
  VALIDATE: { label: 'Validation',     icon: CheckCircle, color: 'bg-teal-500',   text: 'text-teal-600',   bg: 'bg-teal-50',    border: 'border-teal-200'   },
  LOGIN:    { label: 'Connexion',      icon: LogIn,       color: 'bg-primary',    text: 'text-primary',    bg: 'bg-primary/5',  border: 'border-primary/20' },
  LOGOUT:   { label: 'Déconnexion',    icon: LogOut,      color: 'bg-slate-500',  text: 'text-slate-600',  bg: 'bg-slate-50',   border: 'border-slate-200'  },
};

const ROLE_BADGE = {
  admin:        'bg-purple-50 text-purple-700 border-purple-200',
  gestionnaire: 'bg-blue-50   text-blue-700   border-blue-200',
  archiviste:   'bg-green-50  text-green-700  border-green-200',
  consultant:   'bg-amber-50  text-amber-700  border-amber-200',
};

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

const fmtDateKey = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

const fmtDateLabel = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};

const groupByDate = (logs) => {
  const groups = {};
  logs.forEach((log) => {
    const key   = fmtDateKey(log.created_at);
    const label = fmtDateLabel(log.created_at);
    if (!groups[key]) groups[key] = { key, label, items: [] };
    groups[key].items.push(log);
  });
  return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
};

// ── ActivityCard ─────────────────────────────────────────────────
const ActivityCard = ({ log, index }) => {
  const mapped = ACTION_MAP[log.action] ?? { label: log.action, icon: FileText, color: 'bg-outline', text: 'text-secondary', bg: 'bg-surface-container-low', border: 'border-outline-variant' };
  const Icon = mapped.icon;
  const roleCls = ROLE_BADGE[log.user?.role] ?? 'bg-surface-container text-secondary border-outline-variant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low/60 transition-colors rounded-lg group"
    >
      {/* Time */}
      <span className="w-10 text-right text-[10px] font-bold text-outline flex-shrink-0 tabular-nums">
        {fmtTime(log.created_at)}
      </span>

      {/* Icon dot */}
      <div className={`w-7 h-7 rounded-lg ${mapped.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
        <Icon size={13} strokeWidth={2.5} />
      </div>

      {/* Action + user */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={`text-xs font-black uppercase tracking-wide ${mapped.text} flex-shrink-0`}>
          {mapped.label}
        </span>
        {log.target_label && (
          <>
            <span className="text-outline-variant/60 text-xs flex-shrink-0">·</span>
            <span className="text-xs font-semibold text-on-surface truncate">{log.target_label}</span>
          </>
        )}
      </div>

      {/* User + role */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-semibold text-secondary hidden sm:block">{log.user?.name ?? '—'}</span>
        {log.user?.role && (
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${roleCls} hidden md:block`}>
            {log.user.role}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// ── DateGroup ─────────────────────────────────────────────────────
const DateGroup = ({ group, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-outline-variant/40 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Group header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-surface-container-low/40 hover:bg-surface-container-low/70 transition-colors text-left"
      >
        <div className={`transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}>
          <ChevronDown size={15} className="text-secondary" />
        </div>
        <Calendar size={13} className="text-outline flex-shrink-0" />
        <span className="flex-1 text-xs font-black text-primary uppercase tracking-widest capitalize">
          {group.label}
        </span>
        <span className="text-[10px] font-bold text-secondary bg-outline-variant/20 px-2.5 py-0.5 rounded-full">
          {group.items.length} action{group.items.length > 1 ? 's' : ''}
        </span>
      </button>

      {/* Group items */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-outline-variant/10 px-2 py-1">
              {group.items.map((log, i) => (
                <ActivityCard key={log.id} log={log} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────
export const ActivityLog = () => {
  const [logs,        setLogs]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [totalCount,  setTotalCount]  = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [search,   setSearch]   = useState('');
  const [action,   setAction]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const fetchLogs = useCallback(async (page = 1, append = false) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, per_page: 30 };
      if (search)   params.search    = search;
      if (action)   params.action    = action;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo)   params.date_to   = dateTo;

      const { data } = await api.get('/activity-logs', { params });
      setTotalCount(data.total);
      setHasMore(data.current_page < data.last_page);
      setCurrentPage(data.current_page);
      setLogs((prev) => append ? [...prev, ...data.data] : data.data);
    } catch {
      setError("Impossible de charger le journal d'activité.");
    } finally {
      setLoading(false);
    }
  }, [search, action, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(1, false); }, [action, dateFrom, dateTo]);
  useEffect(() => {
    const t = setTimeout(() => fetchLogs(1, false), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleLoadMore = () => fetchLogs(currentPage + 1, true);
  const handleReset = () => { setSearch(''); setAction(''); setDateFrom(''); setDateTo(''); };
  const hasFilters = search || action || dateFrom || dateTo;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-log-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const activityGroups = groupByDate(logs);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity size={18} className="text-primary" />
            </div>
            <h1 className="text-2xl font-black text-primary tracking-tighter">Journal d'activité</h1>
          </div>
          <p className="text-secondary text-sm font-medium mt-1 ml-10">
            Audit log complet de la plateforme.
            {totalCount > 0 && (
              <span className="ml-2 font-black text-primary">{totalCount.toLocaleString('fr-FR')} entrées</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-bold text-xs uppercase tracking-widest transition-all ${showFilters || hasFilters ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-white border-outline-variant text-secondary hover:text-primary hover:border-primary/40'}`}
          >
            <Filter size={14} />
            Filtres
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-white/80 ml-0.5" />}
          </button>
          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant text-secondary hover:text-primary rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-sm disabled:opacity-40"
          >
            <Download size={14} />
            Exporter
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-outline-variant/60 rounded-xl p-5 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary tracking-widest uppercase">Recherche</label>
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Document, utilisateur…"
                      className="w-full pl-8 pr-3 py-2 border border-outline-variant/50 rounded-lg bg-surface-container-low/30 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>
                {/* Action */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary tracking-widest uppercase flex items-center gap-1"><BarChart2 size={11} />Type d'action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full py-2 px-3 border border-outline-variant/50 rounded-lg bg-surface-container-low/30 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Toutes</option>
                    {Object.entries(ACTION_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                {/* Date from */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary tracking-widest uppercase">Date de début</label>
                  <input
                    type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full py-2 px-3 border border-outline-variant/50 rounded-lg bg-surface-container-low/30 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                {/* Date to */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary tracking-widest uppercase">Date de fin</label>
                  <input
                    type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    className="w-full py-2 px-3 border border-outline-variant/50 rounded-lg bg-surface-container-low/30 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              {hasFilters && (
                <button onClick={handleReset} className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors">
                  <X size={11} /> Réinitialiser les filtres
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">{error}</div>
      )}

      {/* ── Timeline ───────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Skeleton */}
        {loading && logs.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-outline-variant/40 rounded-xl overflow-hidden animate-pulse">
                <div className="h-11 bg-surface-container-low/60" />
                <div className="divide-y divide-outline-variant/10 px-2 py-1">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-10 h-3 bg-surface-container-highest rounded" />
                      <div className="w-7 h-7 rounded-lg bg-surface-container-highest" />
                      <div className="flex-1 h-3 bg-surface-container-highest rounded" />
                      <div className="w-20 h-3 bg-surface-container-highest rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && activityGroups.length === 0 && (
          <div className="bg-white border border-outline-variant/40 rounded-xl flex flex-col items-center justify-center py-20 gap-3 text-secondary shadow-sm">
            <div className="p-4 bg-surface-container-low rounded-2xl">
              <Activity size={32} className="text-outline-variant" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest">Aucune activité enregistrée</p>
            <p className="text-xs font-medium text-outline">
              {hasFilters ? 'Essayez de modifier vos filtres.' : 'Les actions apparaîtront ici au fur et à mesure.'}
            </p>
          </div>
        )}

        {/* Groups */}
        {activityGroups.map((group, gIdx) => (
          <DateGroup key={group.key} group={group} defaultOpen={gIdx === 0} />
        ))}

        {/* Loading more */}
        {loading && logs.length > 0 && (
          <div className="flex justify-center py-3">
            <svg className="animate-spin w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {/* Load more button */}
        {hasMore && !loading && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 border border-outline-variant/50 bg-white text-secondary hover:text-primary hover:border-primary/40 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            Charger plus d'activités
            <ChevronDown size={14} />
          </button>
        )}
      </div>
    </div>
  );
};