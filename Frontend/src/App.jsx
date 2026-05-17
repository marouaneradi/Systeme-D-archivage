import React, { useState, useEffect } from 'react';
import { authService } from './services/api';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { Sidebar, TopBar } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { DocumentsList } from './components/DocumentsList';
import { AddPV } from './components/AddPV';
import { AdvancedSearch } from './components/AdvancedSearch';
import { ActivityLog } from './components/ActivityLog';
import { PvDetail } from './components/PvDetail';
import { TrainingImport } from './components/TrainingImport';
import { UserManagement } from './components/UserManagement';
import { Settings } from './components/Settings';
import Login from './components/Login';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading]  = useState(true);
  const [activePage, setActivePage]    = useState('dashboard');
  const [selectedPvId, setSelectedPvId]= useState(null);
  const [sidebarOpen, setSidebarOpen]  = useState(false); // mobile drawer
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true); // desktop sidebar

  // ── On mount: verify token via /auth/me ──────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setAuthLoading(false);
      return;
    }

    authService.me()
      .then(({ data }) => {
        // Token still valid — restore user from server (fresh data)
        setUser(data);
        // Sync localStorage with latest user data
        localStorage.setItem('auth_user', JSON.stringify(data));
      })
      .catch(() => {
        // Token expired or invalid — clean up
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setActivePage('dashboard');
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  // ── Session timeout management ───────────────────────────────────
  useSessionTimeout(user, handleLogout, 15); // 15 minutes timeout

  const openPvDetail  = (pvId) => { setSelectedPvId(pvId); setActivePage('pv-detail'); };
  const closePvDetail = ()     => { setSelectedPvId(null); setActivePage('documents'); };

  // ── Loading screen while verifying token ─────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-secondary text-xs font-bold uppercase tracking-widest">Vérification de la session…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login onLogin={handleLogin} />;

  // ── Role-based page access guard ─────────────────────────────────
  const canAccess = (page) => {
    const role = user.role;
    const restricted = {
      users:    ['admin'],
      training: ['admin', 'gestionnaire'],
      activity: ['admin', 'gestionnaire'],
      settings: ['admin'],
    };
    return restricted[page] ? restricted[page].includes(role) : true;
  };

  const renderPage = () => {
    if (!canAccess(activePage)) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-3xl">🚫</p>
          <p className="text-primary font-black text-lg">Accès refusé</p>
          <p className="text-secondary text-sm">Vous n'avez pas les droits pour accéder à cette page.</p>
          <button
            onClick={() => setActivePage('dashboard')}
            className="mt-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest"
          >
            Retour au tableau de bord
          </button>
        </div>
      );
    }

    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} user={user} />;
      case 'documents': return <DocumentsList onViewPv={openPvDetail} />;
      case 'add':       return <AddPV onNavigate={setActivePage} />;
      case 'training':  return <TrainingImport onNavigate={setActivePage} user={user} />;
      case 'search':    return <AdvancedSearch onViewPv={openPvDetail} />;
      case 'activity':  return <ActivityLog />;
      case 'pv-detail': return <PvDetail pvId={selectedPvId} onBack={closePvDetail} onViewPv={openPvDetail} />;
      case 'users':     return <UserManagement />;
      case 'settings':  return <Settings />;
      default:          return <Dashboard />;
    }
  };

  const getPageLabel = () => {
    const labels = {
      dashboard: 'Tableau de bord',
      documents: 'Documents PV',
      add:       'Nouvel Ajout',
      training:  'Nouvelle Promotion',
      search:    'Recherche Avancée',
      activity:  "Journal d'activité",
      'pv-detail': 'Détail du document',
      users:     'Gestion des utilisateurs',
      settings:  'Paramètres',
    };
    return labels[activePage] || '';
  };

  const handleMenuToggle = () => {
    if (window.innerWidth >= 1024) {
      setDesktopSidebarOpen(!isDesktopSidebarOpen);
    } else {
      setSidebarOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar
          activePage={activePage}
          onPageChange={setActivePage}
          user={user}
          onLogout={handleLogout}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isDesktopOpen={isDesktopSidebarOpen}
          onToggleDesktop={() => setDesktopSidebarOpen(!isDesktopSidebarOpen)}
        />

      <main className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${isDesktopSidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-0'}`}>
        <TopBar activePage={activePage} activeLabel={getPageLabel()} user={user} onLogout={handleLogout} onNavigate={openPvDetail} onMenuToggle={handleMenuToggle} />

        <div className="p-4 sm:p-6 lg:p-10 xl:p-12 max-w-[1440px] mx-auto w-full flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="px-12 py-6 border-t border-outline-variant/20 flex justify-between items-center bg-white/50">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest italic">
            Confidentialité & Sécurité des données institutionnelles garanties.
          </p>
          <div className="flex gap-6">
            <button className="text-[10px] font-black text-secondary hover:text-primary transition-colors uppercase tracking-widest">Support</button>
            <button className="text-[10px] font-black text-secondary hover:text-primary transition-colors uppercase tracking-widest">Documentation</button>
          </div>
        </footer>
      </main>
    </div>
  );
}