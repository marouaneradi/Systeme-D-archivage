import React, { useState, useEffect } from 'react';
import {
  FileBox, CheckCircle, AlertTriangle,
  FileText, Plus, Download, Clock,
  Edit3, Trash2, Eye, Upload, LogIn,
} from 'lucide-react';
import { motion } from 'motion/react';
import api from '../services/api';

// ── Action map (same as ActivityLog) ─────────────────────────────
const ACTION_MAP = {
  CREATE: { label: 'Ajout', icon: Plus, color: 'bg-green-500' },
  UPDATE: { label: 'Modification', icon: Edit3, color: 'bg-blue-500' },
  DELETE: { label: 'Suppression', icon: Trash2, color: 'bg-red-500' },
  VIEW: { label: 'Consultation', icon: Eye, color: 'bg-slate-400' },
  UPLOAD: { label: 'Upload', icon: Upload, color: 'bg-violet-500' },
  VALIDATE: { label: 'Validation', icon: CheckCircle, color: 'bg-emerald-500' },
  LOGIN: { label: 'Connexion', icon: LogIn, color: 'bg-primary' },
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

// ── StatCard ──────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon: Icon, colorClass, loading }) => (
  <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
    <p className="text-secondary text-xs font-semibold uppercase tracking-wider">{title}</p>
    {loading ? (
      <div className="h-8 w-20 bg-surface-container-low rounded-lg animate-pulse mt-1" />
    ) : (
      <h3 className="text-2xl font-bold text-primary mt-1 tracking-tight">{value ?? '—'}</h3>
    )}
    {sub && <p className="text-[10px] text-secondary font-medium mt-1">{sub}</p>}
  </div>
);

// ── Bar chart ─────────────────────────────────────────────────────
const MONTHS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];

const BarChart = ({ data, loading }) => {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <div className="h-48 flex items-end gap-2 pb-2">
        {MONTHS.map((m, i) => {
          const item = data.find((d) => d.month === i + 1);
          const count = item?.count ?? 0;
          const pct = Math.max((count / max) * 100, 4);
          return (
            <div key={m} className="flex-1 flex flex-col items-center gap-1 group relative">
              {count > 0 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                  {count} PV
                </div>
              )}
              <div
                className={`w-full rounded-t-sm transition-all duration-700 ${count > 0 ? 'bg-primary' : 'bg-surface-container-highest/40'} ${loading ? 'animate-pulse' : ''}`}
                style={{ height: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] font-extrabold text-outline-variant px-0 tracking-tighter mt-1">
        {MONTHS.map((m) => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────
export const Dashboard = ({ onNavigate, user }) => {
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [docsRes, actRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/activity-logs/stats'),
        ]);
        setStats(docsRes.data);
        setChart(docsRes.data.monthly ?? []);
        setRecent(actRes.data.recent ?? []);
      } catch {
        setError('Impossible de charger les statistiques.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const archivingRate = stats
    ? stats.total > 0
      ? Math.round((stats.by_status?.ARCHIVE_COMPLET ?? 0) / stats.total * 100) + '%'
      : '0%'
    : null;

  const canAddPv = ['admin', 'gestionnaire', 'archiviste'].includes(user?.role);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">Tableau de bord</h1>
          <p className="text-secondary mt-1 text-sm">Résumé analytique et statistiques de gestion des documents.</p>
        </div>
        <div className="flex gap-3">
          {canAddPv && (
            <button
              onClick={() => onNavigate?.('add')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-primary-container transition-colors shadow-lg shadow-primary/10"
            >
              <Plus size={16} />
              Nouveau PV
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">{error}</div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total des PV"
          value={stats?.total}
          sub={`${stats?.by_type?.PV_FF ?? 0} FF · ${stats?.by_type?.PV_PASSAGE ?? 0} Passage · ${stats?.by_type?.PV_INTERMEDIAIRE ?? 0} Inter`}
          icon={FileBox}
          colorClass="bg-blue-50 text-blue-600"
          loading={loading}
        />
        <StatCard
          title="Archives complètes"
          value={stats?.by_status?.ARCHIVE_COMPLET ?? '—'}
          sub={`Taux: ${archivingRate ?? '—'}`}
          icon={CheckCircle}
          colorClass="bg-green-50 text-green-600"
          loading={loading}
        />
        <StatCard
          title="En attente"
          value={stats?.by_status?.EN_ATTENTE ?? '—'}
          sub="À valider"
          icon={Clock}
          colorClass="bg-amber-50 text-amber-600"
          loading={loading}
        />
        <StatCard
          title="Brouillons"
          value={stats?.by_status?.BROUILLON ?? '—'}
          sub="Non soumis"
          icon={AlertTriangle}
          colorClass="bg-red-50 text-red-600"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">

          {/* Annual Activity Chart */}
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-primary">Activité Annuelle</h3>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                {new Date().getFullYear()}
              </span>
            </div>
            <BarChart data={chart} loading={loading} />
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary">Activités Récentes</h3>
              <button
                onClick={() => onNavigate?.('activity')}
                className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
              >
                Voir tout →
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-surface-container-low rounded-lg animate-pulse" />)}
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-secondary gap-2">
                <FileText size={32} className="text-outline-variant" />
                <p className="text-xs font-bold uppercase tracking-widest">Aucune activité récente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recent.map((log, idx) => {
                  const mapped = ACTION_MAP[log.action] ?? { label: log.action, icon: FileText, color: 'bg-outline' };
                  const Icon = mapped.icon;
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center gap-4 p-3 hover:bg-surface-container-low rounded-xl transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full ${mapped.color} flex items-center justify-center text-white flex-shrink-0`}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-primary truncate">{log.target_label ?? '—'}</p>
                        <p className="text-xs text-secondary">{log.user?.name ?? '—'} · {fmtDate(log.created_at)}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full text-white ${mapped.color} flex-shrink-0`}>
                        {mapped.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-4 space-y-6">

          {/* Archiving rate */}
          <div className="bg-primary text-white p-6 rounded-xl shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Taux d'archivage</p>
            {loading
              ? <div className="h-10 w-24 bg-white/20 rounded-lg animate-pulse" />
              : <p className="text-4xl font-black tracking-tight">{archivingRate ?? '—'}</p>
            }
            <p className="text-xs mt-2 opacity-60">Documents entièrement archivés</p>
          </div>

          {/* By status breakdown */}
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-primary uppercase tracking-widest">Par statut</h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-6 bg-surface-container-low rounded animate-pulse" />)}
              </div>
            ) : (
              [
                { key: 'BROUILLON', label: 'Brouillon', bar: 'bg-slate-400' },
                { key: 'EN_ATTENTE', label: 'En attente', bar: 'bg-amber-400' },
                { key: 'VALIDE_PAPIER', label: 'Validé papier', bar: 'bg-blue-400' },
                { key: 'ARCHIVE_NUMERIQUE', label: 'Archivé numérique', bar: 'bg-violet-500' },
                { key: 'ARCHIVE_COMPLET', label: 'Archive complète', bar: 'bg-green-500' },
              ].map(({ key, label, bar }) => {
                const count = stats?.by_status?.[key] ?? 0;
                const pct = stats?.total > 0 ? Math.round(count / stats.total * 100) : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-secondary">{label}</span>
                      <span className="text-primary">{count}</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                      <div className={`h-full ${bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick nav */}
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl space-y-3">
            <p className="text-blue-700 text-xs font-black uppercase tracking-widest">Accès rapide</p>
            <div className="space-y-2">
              {[
                { label: 'Tous les documents', page: 'documents' },
                { label: 'Recherche avancée', page: 'search' },
                ...(canAddPv ? [{ label: 'Ajouter un PV', page: 'add' }] : []),
              ].map(({ label, page }) => (
                <button
                  key={page}
                  onClick={() => onNavigate?.(page)}
                  className="w-full text-left text-xs font-black text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors uppercase tracking-widest"
                >
                  → {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};