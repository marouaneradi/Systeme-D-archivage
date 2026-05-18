import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, Info, X, Plus, ChevronRight } from 'lucide-react';
import api from '../services/api';

const inputCls = 'w-full bg-surface-container-low/50 border border-outline-variant/50 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all';
const buttonCls = 'inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-[0.08em] transition-all hover:bg-primary-container disabled:opacity-60 disabled:cursor-not-allowed';
const buttonSecondary = 'inline-flex items-center justify-center gap-2 w-full px-6 py-3 border border-outline-variant bg-white text-primary rounded-xl font-bold text-sm uppercase tracking-[0.08em] hover:bg-surface-container-low transition-all';

export const TrainingImport = ({ onNavigate, user }) => {
  const isAdmin = user?.role === 'admin';
  // Step 1: Promotion creation
  const [promotionYear, setPromotionYear] = useState(''); // format: 'YYYY-YYYY'
  const [promotionDesc, setPromotionDesc] = useState('');
  const [creatingPromotion, setCreatingPromotion] = useState(false);
  const [promotionError, setPromotionError] = useState('');

  // Step 2: File import (only shown after promotion is created)
  const [currentPromotion, setCurrentPromotion] = useState(null);
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

  // ── STEP 1: Create Promotion ────────────────────────────────────
  // Parse and validate the "YYYY-YYYY" input
  const parseAcademicYear = (value) => {
    const match = value.trim().match(/^(\d{4})-(\d{4})$/);
    if (!match) return null;
    const start = parseInt(match[1], 10);
    const end   = parseInt(match[2], 10);
    if (end !== start + 1) return null;
    if (start < 2000 || start > 2100) return null;
    return start; // backend expects the start year as integer
  };

  const handleCreatePromotion = async (e) => {
    e.preventDefault();
    setPromotionError('');

    const year = parseAcademicYear(promotionYear);
    if (!year) {
      setPromotionError('Format invalide. Utilisez le format AAAA-AAAA (ex : 2025-2026).');
      return;
    }

    setCreatingPromotion(true);

    try {
      const response = await api.post('/training/academic-years', {
        year: year,
        description: promotionDesc || null,
      });

      const newPromotion = response.data?.data ?? {};
      setCurrentPromotion(newPromotion);
      setYears((prev) => [
        ...prev.filter((y) => y.id !== newPromotion.id),
        newPromotion,
      ]);
      setPromotionYear('');
      setPromotionDesc('');
      setImportResult(null);
    } catch (err) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors ?? {};
        const firstError = Object.values(errors)[0];
        setPromotionError(Array.isArray(firstError) ? firstError[0] : firstError || 'Erreur de validation.');
      } else {
        setPromotionError(err.response?.data?.message ?? 'Impossible de créer la promotion.');
      }
    } finally {
      setCreatingPromotion(false);
    }
  };

  // ── STEP 2: Import Training Catalog ────────────────────────────
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
    if (!file) {
      setImportError('Sélectionnez un fichier XLSX avant de lancer l\'import.');
      return;
    }
    if (!currentPromotion?.id) {
      setImportError('Aucune promotion sélectionnée.');
      return;
    }

    setImportError('');
    setImportResult(null);
    setImportSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('academic_year_id', currentPromotion.id);

      const response = await api.post('/training/import', formData);
      const importData = response.data?.data ?? {};
      setImportResult(importData);
      setFile(null);
    } catch (err) {
      if (err.response?.status === 422) {
        setImportError('Le fichier est invalide ou le format ne correspond pas.');
      } else {
        setImportError(err.response?.data?.message ?? 'Impossible d\'importer le fichier.');
      }
    } finally {
      setImportSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentPromotion(null);
    setFile(null);
    setImportResult(null);
    setPromotionYear('');
    setPromotionDesc('');
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
        <p className="text-secondary text-sm font-medium mt-1 max-w-2xl">
          Créez d'abord une promotion, puis importez la carte de formation Excel pour y ajouter filières et groupes.
        </p>
      </div>

      {/* ── STEP 1: Promotion Creation ────────────────────────────── */}
      <div className="bg-white border border-outline-variant rounded-3xl p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
          <div className="p-3 bg-primary text-white rounded-2xl"><Plus size={20} /></div>
          <div>
            <h2 className="text-lg font-black text-primary uppercase tracking-tight">Étape 1 — Créer une promotion</h2>
            <p className="text-sm text-secondary">Saisissez l'année académique pour créer la promotion.</p>
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
        ) : !currentPromotion ? (
          <form onSubmit={handleCreatePromotion} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="year-input" className="block text-[10px] font-black uppercase tracking-widest text-secondary">
                Année académique *
              </label>
              <div className="relative">
                <input
                  id="year-input"
                  type="text"
                  value={promotionYear}
                  onChange={(e) => { setPromotionYear(e.target.value); setPromotionError(''); }}
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
              <label htmlFor="desc-input" className="block text-[10px] font-black uppercase tracking-widest text-secondary">
                Description (optionnel)
              </label>
              <input
                id="desc-input"
                type="text"
                value={promotionDesc}
                onChange={(e) => setPromotionDesc(e.target.value)}
                placeholder="Ex: Formation initiale ou particulière"
                className={inputCls}
              />
            </div>

            {promotionError && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex gap-3 text-sm text-red-700">
                <Info size={16} className="mt-0.5 flex-shrink-0" />
                <span>{promotionError}</span>
              </div>
            )}

            <button type="submit" disabled={creatingPromotion} className={buttonCls}>
              {creatingPromotion ? 'Création en cours…' : 'Valider'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-green-50 border border-green-200 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-black text-green-700">Promotion créée</p>
                  <p className="text-sm text-green-600 mt-1">{currentPromotion.label}</p>
                  {currentPromotion.description && (
                    <p className="text-xs text-green-600 mt-1 italic">{currentPromotion.description}</p>
                  )}
                </div>
              </div>
            </div>

            <button type="button" onClick={handleReset} className={buttonSecondary}>
              Créer une autre promotion
            </button>
          </div>
        )}
      </div>

      {/* ── STEP 2: File Import (only shown after promotion creation) ─ */}
      {currentPromotion && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-6 min-w-0">
            <div className="bg-white border border-outline-variant rounded-3xl p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl"><Upload size={20} /></div>
                <div>
                  <h2 className="text-lg font-black text-primary">Étape 2 — Importer la carte de formation</h2>
                  <p className="text-sm text-secondary">Le fichier doit contenir les colonnes : Créneau, Année, Niveau, Secteur, Code Filière, Filière et Groupe.</p>
                </div>
              </div>
              <form onSubmit={handleImportSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="training-file" className="block text-[10px] font-black uppercase tracking-widest text-secondary">
                    Fichier Carte de Formation
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
                  <p className="text-[10px] text-outline">Sélectionnez le fichier Excel pour cette promotion.</p>
                </div>

                {importError && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex gap-3 text-sm text-red-700">
                    <Info size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                {importResult && (
                  <div className="rounded-2xl bg-green-50 border border-green-200 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-black text-green-700">Importation réussie</p>
                        <p className="text-sm text-green-600 mt-2">
                          <strong>{importResult.counts.trainingGroups}</strong> groupes et <strong>{importResult.counts.filieres}</strong> filières importés.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={importSubmitting} className={buttonCls}>
                  {importSubmitting ? 'Import en cours…' : 'Importer la carte de formation'}
                </button>
              </form>
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
                      className={`flex items-center justify-between gap-3 p-4 rounded-2xl transition-colors ${
                        currentPromotion?.id === year.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-surface-container-low'
                      }`}
                    >
                      <span className="text-sm font-bold text-primary">{year.label}</span>
                      <span className="text-[10px] uppercase font-black tracking-[0.18em] text-secondary">{year.year}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
