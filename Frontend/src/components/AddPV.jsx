import React, { useState, useEffect } from 'react';
import {
  School, Upload, Save, Info, Plus,
  ChevronRight, FileText, X, Database,
  FileBox, BookOpen, ClipboardList, AlertCircle,
} from 'lucide-react';
import api from '../services/api';

const SEMESTERS = ['Semestre 1', 'Semestre 2'];

const PV_TYPES = [
  {
    key: 'PV_FF',
    label: 'PV Fin de Formation',
    short: 'PV-FF',
    description: "Document global des résultats finaux d'une promotion.",
    icon: FileBox,
    color: 'border-purple-400 bg-purple-50 text-purple-700',
    activeColor: 'border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-200',
  },
  {
    key: 'PV_CC',
    label: 'PV Contrôles Continus',
    short: 'PV-CC',
    description: 'Notes de contrôle continu liées à un module.',
    icon: BookOpen,
    color: 'border-blue-400 bg-blue-50 text-blue-700',
    activeColor: 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-200',
  },
  {
    key: 'PV_EFM',
    label: 'PV Examen Fin de Module',
    short: 'PV-EFM',
    description: "Résultats d'examen final par module et session.",
    icon: ClipboardList,
    color: 'border-green-400 bg-green-50 text-green-700',
    activeColor: 'border-green-500 bg-green-500 text-white shadow-lg shadow-green-200',
  },
];

// ── Reusable field components ──────────────────────────────────────
const FieldLabel = ({ children }) => (
  <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">
    {children}
  </label>
);
const inputCls  = 'w-full bg-surface-container-low/50 border border-outline-variant/50 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all';
const selectCls = `${inputCls} appearance-none cursor-pointer`;

// ── PV-FF form (cascading dynamic selects) ────────────────────────
const FormPvFF = ({ form, onChange, academicYears, filieres, groups, loadingYears, loadingFil, loadingGroups }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
    <div className="space-y-1.5">
      <FieldLabel>Année académique *</FieldLabel>
      <select value={form.academicYearId} onChange={(e) => onChange('academicYearId', e.target.value)} className={selectCls} disabled={loadingYears}>
        <option value="">{loadingYears ? 'Chargement…' : '— Sélectionner —'}</option>
        {academicYears.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}
      </select>
    </div>
    <div className="space-y-1.5">
      <FieldLabel>Filière *</FieldLabel>
      <select value={form.filiereId} onChange={(e) => onChange('filiereId', e.target.value)} className={selectCls} disabled={!form.academicYearId || loadingFil}>
        <option value="">{loadingFil ? 'Chargement…' : (!form.academicYearId ? `— Choisir une année d'abord —` : '— Sélectionner —')}</option>
        {filieres.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.code})</option>)}
      </select>
    </div>
    <div className="space-y-1.5">
      <FieldLabel>Niveau</FieldLabel>
      <div className={`${inputCls} bg-surface-container-low/30 text-secondary ${form.niveau ? 'text-primary font-black' : ''}`}>
        {form.niveau || '— auto-rempli après filière —'}
      </div>
    </div>
    <div className="space-y-1.5">
      <FieldLabel>Groupe *</FieldLabel>
      <select value={form.groupeId} onChange={(e) => onChange('groupeId', e.target.value)} className={selectCls} disabled={!form.filiereId || loadingGroups}>
        <option value="">{loadingGroups ? 'Chargement…' : (!form.filiereId ? `— Choisir une filière d'abord —` : '— Sélectionner —')}</option>
        {groups.map((g) => <option key={g.id} value={g.id}>{g.code}{g.name ? ` — ${g.name}` : ''}</option>)}
      </select>
    </div>
  </div>
);

// ── PV-CC form ─────────────────────────────────────────────────────
const FormPvCC = ({ form, onChange, pvFfList, pvFfLoading }) => (
  <div className="space-y-6">
    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
      <p className="text-xs font-medium text-blue-700 leading-relaxed">
        Un PV-CC est lié à un PV Fin de Formation existant. Sélectionnez d'abord le PV-FF parent.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      <div className="space-y-1.5 md:col-span-2">
        <FieldLabel>PV Fin de Formation parent *</FieldLabel>
        <select value={form.pvFfId} onChange={(e) => onChange('pvFfId', e.target.value)} className={selectCls} disabled={pvFfLoading}>
          <option value="">{pvFfLoading ? 'Chargement…' : '— Sélectionner le PV-FF —'}</option>
          {pvFfList.map((pv) => (
            <option key={pv.id} value={pv.id}>
              {pv.filiere} · {pv.niveau} · G{pv.groupe} · {pv.academic_year}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Module *</FieldLabel>
        <input type="text" value={form.module} onChange={(e) => onChange('module', e.target.value)} placeholder="Ex: Algorithmique et Structures de données" className={inputCls} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Semestre *</FieldLabel>
        <select value={form.semester} onChange={(e) => onChange('semester', e.target.value)} className={selectCls}>
          <option value="">— Sélectionner —</option>
          {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
    </div>
  </div>
);

// ── PV-EFM form ────────────────────────────────────────────────────
const FormPvEFM = ({ form, onChange, pvFfList, pvFfLoading }) => (
  <div className="space-y-6">
    <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
      <Info size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
      <p className="text-xs font-medium text-green-700 leading-relaxed">
        Un PV-EFM est lié à un PV Fin de Formation existant. Indiquez le module et la session concernés.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      <div className="space-y-1.5 md:col-span-2">
        <FieldLabel>PV Fin de Formation parent *</FieldLabel>
        <select value={form.pvFfId} onChange={(e) => onChange('pvFfId', e.target.value)} className={selectCls} disabled={pvFfLoading}>
          <option value="">{pvFfLoading ? 'Chargement…' : '— Sélectionner le PV-FF —'}</option>
          {pvFfList.map((pv) => (
            <option key={pv.id} value={pv.id}>
              {pv.filiere} · {pv.niveau} · G{pv.groupe} · {pv.academic_year}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Module *</FieldLabel>
        <input type="text" value={form.module} onChange={(e) => onChange('module', e.target.value)} placeholder="Ex: Base de données" className={inputCls} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Session *</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          {['Ordinaire', 'Rattrapage'].map((s) => (
            <button key={s} type="button" onClick={() => onChange('session', s)}
              className={`py-3 rounded-xl border-2 font-black text-xs uppercase tracking-wider transition-all ${
                form.session === s
                  ? 'border-green-500 bg-green-500 text-white shadow-md'
                  : 'border-outline-variant/50 bg-surface-container-low/30 text-secondary hover:border-green-400'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────
export const AddPV = ({ onNavigate }) => {
  const [pvType,        setPvType]        = useState('PV_FF');
  const [dragActive,    setDragActive]    = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [pvFfList,      setPvFfList]      = useState([]);
  const [pvFfLoading,   setPvFfLoading]   = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');
  const [fieldErrors,   setFieldErrors]   = useState({});

  // Catalog state
  const [academicYears,  setAcademicYears]  = useState([]);
  const [filieres,       setFilieres]       = useState([]);
  const [groups,         setGroups]         = useState([]);
  const [loadingYears,   setLoadingYears]   = useState(false);
  const [loadingFil,     setLoadingFil]     = useState(false);
  const [loadingGroups,  setLoadingGroups]  = useState(false);

  const [form, setForm] = useState({
    academicYearId: '', filiereId: '', groupeId: '', niveau: '',
    pvFfId: '', module: '', semester: '', session: '',
    physicalLocation: '', notes: '',
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Load academic years on mount
  useEffect(() => {
    setLoadingYears(true);
    api.get('/training/academic-years')
      .then(({ data }) => setAcademicYears(data))
      .catch(() => setAcademicYears([]))
      .finally(() => setLoadingYears(false));
  }, []);

  // Load filières when year changes
  useEffect(() => {
    if (!form.academicYearId) { setFilieres([]); setGroups([]); return; }
    setLoadingFil(true);
    setFilieres([]); setGroups([]);
    setForm((p) => ({ ...p, filiereId: '', groupeId: '', niveau: '' }));
    api.get('/training/filieres', { params: { academic_year_id: form.academicYearId } })
      .then(({ data }) => setFilieres(data))
      .catch(() => setFilieres([]))
      .finally(() => setLoadingFil(false));
  }, [form.academicYearId]);

  // Load groups + auto-fill niveau when filière changes
  useEffect(() => {
    if (!form.filiereId) { setGroups([]); return; }
    const sel = filieres.find((f) => String(f.id) === String(form.filiereId));
    setForm((p) => ({ ...p, niveau: sel?.level?.name ?? sel?.level?.code ?? '', groupeId: '' }));
    setLoadingGroups(true);
    setGroups([]);
    api.get('/training/groups', { params: { academic_year_id: form.academicYearId, filiere_id: form.filiereId } })
      .then(({ data }) => setGroups(data))
      .catch(() => setGroups([]))
      .finally(() => setLoadingGroups(false));
  }, [form.filiereId]);

  // Fetch PV-FF list when switching to CC or EFM
  useEffect(() => {
    if (pvType === 'PV_CC' || pvType === 'PV_EFM') {
      setPvFfLoading(true);
      api.get('/pv-documents', { params: { type: 'PV_FF', per_page: 100 } })
        .then(({ data }) => setPvFfList(data.data))
        .catch(() => setPvFfList([]))
        .finally(() => setPvFfLoading(false));
    }
  }, [pvType]);

  // File handling
  const addFiles = (fileList) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const valid = Array.from(fileList).filter((f) => {
      if (!allowed.includes(f.type)) { setError(`Fichier "${f.name}" non accepté. PDF, JPG, PNG uniquement.`); return false; }
      if (f.size > maxSize)          { setError(`Fichier "${f.name}" trop volumineux (max 10Mo).`);            return false; }
      return true;
    });
    setUploadedFiles((prev) => [...prev, ...valid]);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e) => addFiles(e.target.files);
  const handleRemoveFile = (i) => setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i));

  // Build payload based on type
  const buildPayload = () => {
    const base = { type: pvType, physical_location: form.physicalLocation || null, notes: form.notes || null };
    if (pvType === 'PV_FF') {
      const year    = academicYears.find((y) => String(y.id) === String(form.academicYearId));
      const filiere = filieres.find((f) => String(f.id) === String(form.filiereId));
      const groupe  = groups.find((g) => String(g.id) === String(form.groupeId));
      return { ...base, academic_year: year?.label ?? '', niveau: form.niveau, filiere: filiere?.name ?? '', groupe: groupe?.code ?? '' };
    }
    if (pvType === 'PV_CC')  return { ...base, pv_ff_id: form.pvFfId, module: form.module, semester: form.semester };
    if (pvType === 'PV_EFM') return { ...base, pv_ff_id: form.pvFfId, module: form.module, session: form.session };
    return base;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);

    try {
      // Step 1: Create the PV document
      const { data: created } = await api.post('/pv-documents', buildPayload());

      // Step 2: Upload files if any
      if (uploadedFiles.length > 0) {
        const fd = new FormData();
        uploadedFiles.forEach((file) => fd.append('files[]', file));
        await api.post(`/pv-documents/${created.id}/files`, fd);
      }

      // Success — navigate to the new document's detail
      onNavigate?.('documents');
    } catch (err) {
      if (err.response?.status === 422) {
        // Laravel validation errors
        const errs = err.response.data.errors ?? {};
        setFieldErrors(errs);
        setError('Veuillez corriger les erreurs dans le formulaire.');
      } else {
        setError(err.response?.data?.message ?? 'Une erreur est survenue. Réessayez.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTypeConfig = PV_TYPES.find((t) => t.key === pvType);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500">

      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-outline mb-3">
          <button onClick={() => onNavigate?.('documents')} className="text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">
            Documents PV
          </button>
          <ChevronRight size={12} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Nouvel Ajout</span>
        </div>
        <h1 className="text-3xl font-black text-primary tracking-tighter uppercase">Ajouter un PV</h1>
        <p className="text-secondary text-sm font-medium mt-1">
          Sélectionnez le type de PV, puis renseignez les informations correspondantes.
        </p>
      </div>

      {/* Step 1: Type selector */}
      <div className="bg-white border border-outline-variant rounded-2xl p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
          <div className="p-1.5 bg-primary rounded text-white"><FileText size={18} /></div>
          <div>
            <h3 className="text-sm font-black text-primary uppercase tracking-wider">Étape 1 — Type de PV</h3>
            <p className="text-xs text-secondary font-medium mt-0.5">Le formulaire s'adapte automatiquement selon votre choix.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PV_TYPES.map((type) => {
            const isActive = pvType === type.key;
            const Icon = type.icon;
            return (
              <button key={type.key} type="button" onClick={() => { setPvType(type.key); setFieldErrors({}); setError(''); }}
                className={`flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${isActive ? type.activeColor : `bg-white ${type.color} hover:scale-[1.02]`}`}>
                <Icon size={24} />
                <div>
                  <p className="font-black text-sm tracking-tight">{type.short}</p>
                  <p className={`text-xs font-medium mt-0.5 leading-relaxed ${isActive ? 'opacity-80' : 'opacity-70'}`}>{type.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-outline-variant rounded-2xl shadow-xl shadow-black/[0.02] p-8 md:p-12 space-y-10">

        {/* Global error */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle size={18} className="flex-shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Dynamic fields */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
            <div className="p-1.5 bg-primary rounded text-white"><School size={18} /></div>
            <div>
              <h3 className="text-lg font-black text-primary tracking-tight uppercase">{selectedTypeConfig?.label}</h3>
              <p className="text-xs text-secondary font-medium mt-0.5">
                {pvType === 'PV_FF'  && 'Informations de la promotion et de la filière.'}
                {pvType === 'PV_CC'  && 'Lien avec le PV-FF parent et informations du module.'}
                {pvType === 'PV_EFM' && "Lien avec le PV-FF parent, module et session d'examen."}
              </p>
            </div>
          </div>

          {/* Field-level errors summary */}
          {Object.values(fieldErrors).some((v) => v) && (
            <ul className="text-xs text-red-600 font-semibold space-y-1 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {Object.entries(fieldErrors)
                .filter(([, msgs]) => msgs)
                .map(([k, msgs]) => (
                  <li key={k}>• {Array.isArray(msgs) ? msgs[0] : msgs}</li>
                ))}
            </ul>
          )}

          {pvType === 'PV_FF'  && <FormPvFF  form={form} onChange={handleChange} academicYears={academicYears} filieres={filieres} groups={groups} loadingYears={loadingYears} loadingFil={loadingFil} loadingGroups={loadingGroups} />}
          {pvType === 'PV_CC'  && <FormPvCC  form={form} onChange={handleChange} pvFfList={pvFfList} pvFfLoading={pvFfLoading} />}
          {pvType === 'PV_EFM' && <FormPvEFM form={form} onChange={handleChange} pvFfList={pvFfList} pvFfLoading={pvFfLoading} />}
        </section>

        {/* File upload */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
            <div className="p-1.5 bg-primary rounded text-white rotate-3"><Upload size={18} /></div>
            <h3 className="text-lg font-black text-primary tracking-tight uppercase">Scans Numériques</h3>
          </div>

          <div
            className={`border-4 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer group ${
              dragActive ? 'border-primary bg-surface-container-low' : 'border-outline-variant/30 bg-surface-container-low/20 hover:border-outline-variant/60 hover:bg-surface-container-low/40'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input id="file-input" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileInput} />
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-primary border border-outline-variant/20">
              <Plus size={32} />
            </div>
            <p className="text-lg font-black text-primary tracking-tight">Déposer les scans ici</p>
            <p className="text-xs text-secondary font-bold uppercase tracking-widest mt-1">PDF, JPG, PNG acceptés • Max 10Mo</p>
            <p className="mt-3 px-6 py-2.5 bg-white border border-outline-variant/50 shadow-sm rounded-xl text-xs font-black uppercase tracking-[0.2em] text-primary">
              Parcourir les fichiers
            </p>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white border border-outline-variant/50 rounded-xl shadow-sm">
                  <div className="w-10 h-10 bg-red-50 text-red-600 rounded flex items-center justify-center flex-shrink-0">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-primary truncate">{file.name}</p>
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <button type="button" onClick={() => handleRemoveFile(i)} className="p-2 text-outline hover:text-red-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Physical archive */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
            <div className="p-1.5 bg-primary rounded text-white -rotate-3"><Database size={18} /></div>
            <h3 className="text-lg font-black text-primary tracking-tight uppercase">Archive Physique</h3>
          </div>
          <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Info size={16} />
            </div>
            <p className="text-xs font-medium text-primary-container leading-relaxed">
              Référence du classeur physique. Format recommandé : Rayon / Armoire / Dossier.
            </p>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Localisation précise</FieldLabel>
            <input type="text" value={form.physicalLocation} onChange={(e) => handleChange('physicalLocation', e.target.value)} placeholder="Ex: A2/3/15" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Notes (optionnel)</FieldLabel>
            <textarea rows={3} value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Observations, remarques particulières…" className={`${inputCls} resize-none`} />
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => onNavigate?.('documents')}
            className="flex-1 px-6 py-3 border border-outline-variant rounded-xl bg-white text-primary font-bold text-sm uppercase tracking-[0.1em] hover:bg-surface-container-low transition-all">
            Annuler
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-[0.1em] hover:bg-primary-container transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Enregistrement…
              </>
            ) : (
              <>
                <Save size={18} />
                Enregistrer le {selectedTypeConfig?.short}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};