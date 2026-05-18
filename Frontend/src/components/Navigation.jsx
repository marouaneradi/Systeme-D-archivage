import React, { useState, useEffect, useRef, useCallback } from 'react';
import ofpptMiniLogo from '../assets/OFPPT-Mini-Logo.png';
import navback from '../assets/navback.png';
import {
  BarChart3, FileText, PlusCircle, Search,
  History, Settings, Menu, Bell, LogOut, User,
  AlertTriangle, CheckCircle2, Clock, Info, X,
  ChevronLeft, ChevronRight, ChevronDown, Calendar, BookOpen,
  ClipboardList, FileBox, GraduationCap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';

// ── Role display helpers ──────────────────────────────────────────
const ROLE_STYLES = {
  admin: 'bg-purple-100 text-purple-700',
  gestionnaire: 'bg-blue-100 text-blue-700',
  archiviste: 'bg-green-100 text-green-700',
  consultant: 'bg-amber-100 text-amber-700',
};

const ROLE_LABELS = {
  admin: 'Administrateur',
  gestionnaire: 'Gestionnaire',
  archiviste: 'Archiviste',
  consultant: 'Consultant',
};

// ── Notification icon + color mapping ────────────────────────────
const ALERT_CONFIG = {
  created: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  status_changed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
  missing: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  reminder: { icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
  info: { icon: Info, color: 'text-slate-400', bg: 'bg-slate-50' },
};

const fmtRelative = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
};

// ── NotificationBell ──────────────────────────────────────────────
const NotificationBell = ({ onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifs] = useState([]);
  const [unreadCount, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      setNotifs(data.notifications ?? []);
      setUnread(data.unread_count ?? 0);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  useEffect(() => {
    const fn = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleMarkRead = async (n) => {
    if (n.type === 'notification' && !n.read) {
      await api.patch(`/notifications/${n.id}/read`).catch(() => { });
      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
      setUnread((c) => Math.max(0, c - 1));
    }
    if (n.pv_id && onNavigate) onNavigate(n.pv_id);
    setOpen(false);
  };

  const handleMarkAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => { });
    setNotifs((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        id="topbar-notifications-btn"
        onClick={() => { setOpen((o) => !o); if (!open) fetchNotifications(); }}
        className="p-2 text-secondary hover:bg-surface-container-high rounded-full relative transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white px-0.5 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-[min(360px,90vw)] bg-white rounded-2xl shadow-2xl border border-outline-variant/40 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/30 bg-surface-container-low/60">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-primary" />
                <span className="text-sm font-bold text-primary">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                    {unreadCount} non lues
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[11px] text-primary font-semibold hover:underline">
                    Tout marquer lu
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-surface-container rounded-full text-secondary">
                  <X size={13} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-outline-variant/20">
              {loading && notifications.length === 0 ? (
                <div className="py-10 text-center text-secondary text-sm">Chargement…</div>
              ) : notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 text-secondary">
                  <Bell size={30} className="opacity-20" />
                  <p className="text-sm font-medium">Aucune notification</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const cfg = ALERT_CONFIG[n.alert_type] ?? ALERT_CONFIG.info;
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleMarkRead(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-container-low/60 transition-colors ${!n.read ? 'bg-primary/[0.025]' : ''}`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg}`}>
                        <Icon size={14} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold leading-tight ${!n.read ? 'text-primary' : 'text-secondary'}`}>{n.title}</p>
                        <p className="text-[11px] text-secondary mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-outline mt-1">{fmtRelative(n.created_at)}</p>
                      </div>
                      {!n.read && <span className="mt-2.5 flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── PV Accordion (3-level) ───────────────────────────────────────
const PV_TYPE_INFO = [
  { id: 'PV_PASSAGE', label: 'PV Passage', icon: BookOpen },
  { id: 'PV_INTERMEDIAIRE', label: 'PV Intermédiaire', icon: ClipboardList },
  { id: 'PV_FF', label: 'PV Fin Formation', icon: FileBox }
];

const YEAR_LEVELS = [
  { key: '1', label: '1ère année' },
  { key: '2', label: '2ème année' },
  { key: '3', label: '3ème année' }
];

const DocsAccordion = ({ onNavigate, activePage, currentFilter }) => {
  const [years, setYears] = useState([]);
  const [openYear, setOpenYear] = useState(null);
  const [openLevel, setOpenLevel] = useState(null);

  useEffect(() => {
    api.get('/training/academic-years')
      .then(({ data }) => setYears(data))
      .catch(() => setYears([]));
  }, []);

  const go = (filter) => onNavigate(filter);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="mt-1 ml-3 border-l-2 border-white/10 pl-2 space-y-0.5 pb-2">
        <button
          onClick={() => go({})}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activePage === 'documents' && !currentFilter?.yearId
              ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          <FileText size={12} className="flex-shrink-0" />
          Tous les documents
        </button>

        {years.map((year) => {
          const isYearOpen = openYear === year.id;
          const isYearActive = currentFilter?.yearId === year.id && !currentFilter?.niveau;
          
          return (
            <div key={year.id}>
              <button
                onClick={() => { setOpenYear(prev => prev === year.id ? null : year.id); go({ yearId: year.id, yearLabel: year.label }); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isYearActive ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Calendar size={11} className={`flex-shrink-0 ${isYearActive ? 'text-blue-400' : 'text-white/40'}`} />
                <span className="flex-1 text-left truncate">{year.label}</span>
                <ChevronDown size={11} className={`flex-shrink-0 text-white/40 transition-transform duration-200 ${isYearOpen ? 'rotate-0' : '-rotate-90'}`} />
              </button>

              <AnimatePresence initial={false}>
                {isYearOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="ml-3 border-l border-white/10 pl-2 mt-0.5 space-y-0.5 pb-1">
                      {YEAR_LEVELS.map(level => {
                        const lk = `${year.id}-${level.key}`;
                        const isLvlOpen = openLevel === lk;
                        const isLvlActive = currentFilter?.yearId === year.id && currentFilter?.niveau === level.key && !currentFilter?.type;

                        return (
                          <div key={level.key}>
                            <button
                              onClick={() => { setOpenLevel(prev => prev === lk ? null : lk); go({ yearId: year.id, yearLabel: year.label, niveau: level.key }); }}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                isLvlActive ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10' : 'text-white/60 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <GraduationCap size={10} className={`flex-shrink-0 ${isLvlActive ? 'text-blue-400' : 'text-white/40'}`} />
                              <span className="flex-1 text-left">{level.label}</span>
                              <ChevronDown size={10} className={`flex-shrink-0 text-white/40 transition-transform duration-200 ${isLvlOpen ? 'rotate-0' : '-rotate-90'}`} />
                            </button>

                            <AnimatePresence initial={false}>
                              {isLvlOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="ml-3 border-l border-white/10 pl-2 mt-0.5 space-y-0.5 pb-1">
                                    {PV_TYPE_INFO.map(type => {
                                      const isTypeActive = currentFilter?.yearId === year.id && currentFilter?.niveau === level.key && currentFilter?.type === type.id;
                                      return (
                                        <button
                                          key={type.id}
                                          onClick={() => go({ yearId: year.id, yearLabel: year.label, niveau: level.key, type: type.id })}
                                          className={`w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                            isTypeActive ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10' : 'text-white/60 hover:bg-white/10 hover:text-white'
                                          }`}
                                        >
                                          <type.icon size={10} className={`flex-shrink-0 ${isTypeActive ? 'text-blue-400' : 'text-white/40'}`} />
                                          <span className="flex-1 text-left truncate">{type.label}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// ── Sidebar menu items ────────────────────────────────────────────
const ALL_MENU_ITEMS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
  { id: 'documents', label: 'Documents PV', icon: FileText, hasAccordion: true },
  { id: 'add', label: 'Nouvel Ajout', icon: PlusCircle, allowedRoles: ['admin', 'gestionnaire', 'archiviste'] },
  { id: 'training', label: 'Nouvelle Promotion', icon: PlusCircle, allowedRoles: ['admin', 'gestionnaire'] },
  { id: 'search', label: 'Recherche Avancée', icon: Search },
  { id: 'activity', label: "Journal d'activité", icon: History, allowedRoles: ['admin', 'gestionnaire'] },
  { id: 'users', label: 'Utilisateurs', icon: User, allowedRoles: ['admin'] },
  { id: 'settings', label: 'Paramètres', icon: Settings, allowedRoles: ['admin'] },
];

// ── Sidebar ───────────────────────────────────────────────────────
// `open`    — controlled by parent (mobile drawer state)
// `onClose` — called when drawer should close (mobile)
export const Sidebar = ({ activePage, onPageChange, user, onLogout, open, onClose, isDesktopOpen, onToggleDesktop, onNavigateDocuments }) => {
  const role = user?.role;
  const [docsOpen, setDocsOpen] = useState(activePage === 'documents');
  const [docFilter, setDocFilter] = useState({});

  const menuItems = ALL_MENU_ITEMS.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(role)
  );

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleNav = (id) => {
    onPageChange(id);
    onClose?.(); // auto-close drawer on mobile
  };

  const handleDocNavigate = (filter) => {
    setDocFilter(filter);
    onNavigateDocuments?.(filter);
    setDocsOpen(true);
    onClose?.();
  };

  // Sidebar inner content (shared between desktop fixed & mobile drawer)
  const sidebarContent = (
    <div 
      className="flex flex-col h-full bg-cover bg-center relative text-white"
      style={{ backgroundImage: `url(${navback})` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-slate-900/90 z-0"></div>

      {/* Content wrapper with z-10 */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo + close button (mobile) */}
        <div className="px-6 mb-8 flex items-center justify-between gap-3 pt-6">
          <div className="flex items-center gap-3">
            <img src={ofpptMiniLogo} alt="OFPPT Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
            <div>
              <p className="text-lg font-black text-white leading-none tracking-tight">Système PV</p>
              <p className="text-[10px] text-blue-300 font-bold mt-1 uppercase tracking-widest drop-shadow-md">Archivage</p>
            </div>
          </div>
          {/* Close button — only visible on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-full hover:bg-white/10 text-white/60 transition-colors"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            const hasAccordion = item.hasAccordion;

            const btnBase = `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 relative group overflow-hidden`;
            const btnActive = `bg-white/15 text-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.5)] ring-1 ring-white/10`;
            const btnIdle = `text-white/60 hover:bg-white/10 hover:text-white`;

            if (hasAccordion) {
              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      setDocsOpen(v => !v);
                      handleNav(item.id);
                      setDocFilter({});
                      onNavigateDocuments?.({});
                    }}
                    className={`${btnBase} ${isActive ? btnActive : btnIdle}`}
                  >
                    {isActive && <motion.div layoutId="activeBar" className="absolute left-0 top-2 bottom-2 w-1 bg-blue-400 rounded-r-full" />}
                    <item.icon size={20} className={`transition-colors duration-300 z-10 ${isActive ? 'text-blue-400' : 'text-white/40 group-hover:text-white/80'}`} />
                    <span className="z-10 flex-1 text-left">{item.label}</span>
                    <ChevronDown size={16} className={`transition-transform duration-300 ${docsOpen ? 'rotate-0 text-white' : '-rotate-90 text-white/40'}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {docsOpen && (
                      <DocsAccordion onNavigate={handleDocNavigate} activePage={activePage} currentFilter={docFilter} />
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`${btnBase} ${isActive ? btnActive : btnIdle}`}
              >
                {isActive && (
                  <motion.div layoutId="activeBar" className="absolute left-0 top-2 bottom-2 w-1 bg-blue-400 rounded-r-full" />
                )}
                <item.icon size={20} className={`transition-colors duration-300 z-10 ${isActive ? 'text-blue-400' : 'text-white/40 group-hover:text-white/80'}`} />
                <span className="z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="mt-auto px-4 py-4 border-t border-white/10 space-y-3 bg-black/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-lg shadow-blue-500/30">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name ?? 'Utilisateur'}</p>
              <p className="text-[10px] text-blue-200 truncate">{ROLE_LABELS[role] ?? role}</p>
            </div>
            <button
              onClick={onLogout}
              title="Se déconnecter"
              className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop: fixed sidebar (lg+) ─────────────────────────── */}
      <aside className={`hidden lg:flex fixed left-0 top-0 h-screen w-[260px] border-r border-slate-200/60 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] flex-col z-50 transition-transform duration-300 ${isDesktopOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>

      {/* ── Desktop Toggle Arrow ─────────────────────────────────── */}
      <button
        onClick={onToggleDesktop}
        className={`hidden lg:flex fixed top-1/2 -translate-y-1/2 z-[60] w-7 h-7 bg-white border border-slate-200/60 items-center justify-center text-slate-400 shadow-md hover:text-slate-800 transition-all duration-300 ${
          isDesktopOpen 
            ? 'left-[246px] rounded-full hover:bg-slate-50' 
            : 'left-0 rounded-r-full border-l-0 hover:w-8 hover:bg-blue-50 hover:text-blue-600'
        }`}
        aria-label="Basculer le menu"
      >
        {isDesktopOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* ── Mobile/Tablet: slide-in drawer (<lg) ─────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
              onClick={onClose}
            />
            {/* Drawer panel */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-[280px] border-r border-slate-200/60 shadow-2xl flex flex-col z-50"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ── TopBar ────────────────────────────────────────────────────────
export const TopBar = ({ activePage, activeLabel, user, onLogout, onNavigate, onMenuToggle }) => {
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const activeItem = ALL_MENU_ITEMS.find(item => item.id === activePage) || {};

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex justify-between items-center px-4 sm:px-8 h-16 transition-all">
      {/* Left: hamburger (mobile) + page label */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-800 focus:outline-none"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>
        {activeItem.icon && (
          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-blue-50 items-center justify-center text-blue-600">
            <activeItem.icon size={16} />
          </div>
        )}
        <span className="text-sm font-black text-slate-800 truncate max-w-[160px] sm:max-w-none tracking-tight">
          {activeLabel || activeItem.label || activePage}
        </span>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBell onNavigate={onNavigate} />

        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-200/80">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-md shadow-blue-600/20">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-black text-slate-900 leading-none">{user?.name ?? 'Utilisateur'}</p>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">En ligne</p>
          </div>
          <button
            id="topbar-logout-btn"
            onClick={onLogout}
            title="Se déconnecter"
            className="ml-1 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};