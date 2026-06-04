import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, Info, Plus, ChevronRight, Trash2 } from 'lucide-react';
import api from '../services/api';

const inputCls = 'w-full bg-surface-container-low/50 border border-outline-variant/50 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all';
const buttonCls = 'inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-[0.08em] transition-all hover:bg-primary-container disabled:opacity-60 disabled:cursor-not-allowed';
const buttonSecondary = 'inline-flex items-center justify-center gap-2 w-full px-6 py-3 border border-outline-variant bg-white text-primary rounded-xl font-bold text-sm uppercase tracking-[0.08em] hover:bg-surface-container-low transition-all';

export const TrainingImport = ({ onNavigate, user }) => {
  const isAdmin = user?.role === 'admin';
  // Form state
  const [promotionYear, setPromotionYear] = useState(''); // format: 'YYYY-YYYY'
  const [file, setFile] = useState(null);
  const [years, setYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [importResult, setImportResult] = useState(null);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importError, setImportError] = useState('');

  // Load existing years
  useEffect(() => {
    setLoadingYears(true);
    api.get('/training/academic-years')
      .then(({ data }) => setYears(data))
      .catch(() => setYears([]))
      .finally(() => setLoadingYears(false));
  }, []);

  // ── Form Handling ──────────────────────────────────────────────
  const parseAcademicYear = (value) => {
    const match = value.trim().match(/^(\d{4})-(\d{4})$/);
    if (!match) return null;
    const start = parseInt(match[1], 10);
    const end   = parseInt(match[2], 10);
    if (end !== start + 1) return null;
    if (start < 2000 || start > 2100) return null;
    return start;
  };

  const handleFileChange = (event) => {
    setImportError('');
    setImportResult(null);
    const selected = event.target.files?.[0] || null;
    if (selected && !selected.name.toLowerCase().endsWith('.xlsx')) {
      setImportError('Veuillez sélectionner un fichier au format .xlsx.');
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleImportSubmit = async (event) => {
    event.preventDefault();
    
    const year = parseAcademicYear(promotionYear);
    if (!year) {
      setImportError('Format d\'année invalide. Utilisez le format AAAA-AAAA (ex : 2025-2026).');
      return;
    }
    
    if (!file) {
      setImportError('Sélectionnez un fichier XLSX avant de lancer l\'import.');
      return;
    }

    setImportError('');
    setImportResult(null);
    setImportSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', year);

      const response = await api.post('/training/import', formData);
      const importData = response.data?.data ?? {};
      setImportResult(importData);
      setFile(null);
      
      // Refresh the years list to include the newly created one
      api.get('/training/academic-years')
        .then(({ data }) => setYears(data))
        .catch(() => {});
        
    } catch (err) {
      if (err.response?.status === 422) {
        setImportError(err.response?.data?.message || 'Le fichier est invalide ou le format ne correspond pas.');
      } else {
        setImportError(err.response?.data?.message ?? 'Impossible d\'importer le fichier.');
      }
    } finally {
      setImportSubmitting(false);
    }
  };

  const handleDeletePromotion = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette promotion ?')) return;
    
    try {
      await api.delete(`/training/academic-years/${id}`);
      setYears(prev => prev.filter(y => y.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Impossible de supprimer la promotion.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setPromotionYear('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-right-4 duration-500">
      <div>
        <div className="flex items-center gap-2 text-outline mb-3">
          <button onClick={() => onNavigate?.('documents')} className="text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">
            Documents PV
          </button>
          <ChevronRight size={12} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Nouvelle Promotion</span>
        </div>
        <h1 className="text-3xl font-black text-primary tracking-tighter uppercase">Nouvelle Promotion</h1>
      {/* ── Form: Promotion Creation & File Import ────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6 min-w-0">
          <div className="bg-white border border-outline-variant rounded-3xl p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
              <div className="p-3 bg-primary text-white rounded-2xl"><Plus size={20} /></div>
              <div>
                <h2 className="text-lg font-black text-primary uppercase tracking-tight">Ajouter une promotion</h2>
                <p className="text-sm text-secondary">Saisissez l'année académique et importez la carte de formation.</p>
              </div>
            </div>

            {!isAdmin ? (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-4 flex gap-3">
                <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-amber-700 text-sm">Accès restreint</p>
                  <p className="text-xs text-amber-600 mt-1">Seul l'administrateur peut créer une promotion. Contactez votre administrateur.</p>
                </div>
              </div>
            ) : importResult ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-green-50 border border-green-200 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-black text-green-700">Promotion ajoutée et importation réussie</p>
                      <p className="text-sm text-green-600 mt-2">
                        <strong>{importResult.counts.trainingGroups}</strong> groupes et <strong>{importResult.counts.filieres}</strong> filières importés.
                      </p>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={handleReset} className={buttonSecondary}>
                  Ajouter une autre promotion
                </button>
              </div>
            ) : (
              <form onSubmit={handleImportSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="year-input" className="block text-[10px] font-black uppercase tracking-widest text-secondary">
                    Année académique *
                  </label>
                  <div className="relative">
                    <input
                      id="year-input"
                      type="text"
                      value={promotionYear}
                      onChange={(e) => { setPromotionYear(e.target.value); setImportError(''); }}
                      placeholder="Ex : 2025-2026"
                      maxLength={9}
                      className={inputCls}
                    />
                    {parseAcademicYear(promotionYear) && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
                        ✓ {promotionYear.trim()}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-outline">Format attendu : AAAA-AAAA (ex : 2025-2026).</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="training-file" className="block text-[10px] font-black uppercase tracking-widest text-secondary">
                    Fichier Carte de Formation (.xlsx) *
                  </label>
                  <input id="training-file" type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
                  <button
                    type="button"
                    onClick={() => document.getElementById('training-file')?.click()}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 border border-outline-variant/60 rounded-2xl bg-surface-container-low text-sm font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                  >
                    <span>{file ? file.name : 'Choisir un fichier .xlsx'}</span>
                    <Upload size={18} />
                  </button>
                  <p className="text-[10px] text-outline">Le fichier doit contenir : Créneau, Année, Niveau, Secteur, Code Filière, Filière et Groupe.</p>
                </div>

                {importError && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex gap-3 text-sm text-red-700">
                    <Info size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                <button type="submit" disabled={importSubmitting} className={buttonCls}>
                  {importSubmitting ? 'Traitement en cours…' : 'Créer et Importer'}
                </button>
              </form>
            )}
          </div>

            <div className="bg-white border border-outline-variant rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-secondary/10 text-secondary rounded-2xl"><Info size={20} /></div>
                <div>
                  <p className="text-sm font-black text-primary uppercase tracking-[0.18em]">Bonnes pratiques</p>
                  <p className="text-xs text-secondary mt-1">Importez une seule fois par promotion. Si vous modifiez le fichier, créez une nouvelle promotion puis réimportez.</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-secondary">
                <li className="flex items-start gap-2"><span className="mt-0.5 font-black">•</span>Ne renommez pas les en-têtes de colonne clés.</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 font-black">•</span>Les lignes sans groupe sont ignorées.</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 font-black">•</span>L'année du fichier doit correspondre à la promotion.</li>
              </ul>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="bg-white border border-outline-variant rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl"><FileText size={18} /></div>
                <div>
                  <p className="text-sm font-black text-primary uppercase tracking-[0.18em]">Promotions</p>
                  <p className="text-xs text-secondary mt-1">Liste des promotions enregistrées.</p>
                </div>
              </div>
              {loadingYears ? (
                <div className="space-y-3">
                  <div className="h-3 rounded-full bg-surface-container-low" />
                  <div className="h-3 rounded-full bg-surface-container-low w-4/5" />
                </div>
              ) : years.length === 0 ? (
                <p className="text-sm text-secondary">Aucune promotion pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {years.map((year) => (
                    <div
                      key={year.id}
                      className="flex items-center justify-between gap-3 p-4 rounded-2xl transition-colors bg-surface-container-low group"
                    >
                      <div>
                        <span className="block text-sm font-bold text-primary">{year.label}</span>
                        <span className="block text-[10px] uppercase font-black tracking-[0.18em] text-secondary mt-1">{year.year}</span>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeletePromotion(year.id)}
                          className="p-2 text-outline hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Supprimer la promotion"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
