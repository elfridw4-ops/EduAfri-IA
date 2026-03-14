import React, { useState, useEffect } from 'react';
import { ContentType } from '../types';
import { Sparkles, Loader2, ChevronRight, Book, Target, Layers } from 'lucide-react';

interface GeneratorFormProps {
  onGenerate: (params: any) => Promise<void>;
  isGenerating: boolean;
}

const COUNTRIES = [
  "Sénégal", "Côte d'Ivoire", "Cameroun", "Mali", "Burkina Faso", 
  "Bénin", "Togo", "Gabon", "Congo", "RDC", "Guinée", "Niger", 
  "Tchad", "Centrafrique", "Mauritanie", "Madagascar"
];

const LEVELS = [
  "CI", "CP", "CE1", "CE2", "CM1", "CM2",
  "6ème", "5ème", "4ème", "3ème",
  "2nde", "1ère", "Terminale",
  "Licence 1", "Licence 2", "Licence 3", "Master", "Doctorat"
];

const CURRICULUM_DATA: Record<string, Record<string, Record<string, string[]>>> = {
  "Terminale": {
    "Mathématiques": {
      "Intégrales": ["Calcul d'aires", "Primitives", "Intégration par parties", "Propriétés de l'intégrale", "Valeur moyenne"],
      "Nombres Complexes": ["Forme algébrique", "Forme trigonométrique", "Équations du second degré", "Géométrie et complexes", "Forme exponentielle"],
      "Probabilités": ["Probabilités conditionnelles", "Variables aléatoires", "Loi binomiale", "Lois à densité", "Loi normale"],
      "Suites Numériques": ["Raisonnement par récurrence", "Limites de suites", "Suites arithmético-géométriques", "Convergence"],
      "Fonctions": ["Limites et continuité", "Dérivabilité", "Fonction Logarithme", "Fonction Exponentielle"]
    },
    "Physique-Chimie": {
      "Mécanique": ["Lois de Newton", "Mouvement de projectiles", "Satellites et planètes", "Travail et énergie"],
      "Chimie": ["Acides et bases", "Estérification et hydrolyse", "Cinétique chimique", "Électrolyse"],
      "Ondes": ["Ondes mécaniques", "Ondes lumineuses", "Dualité onde-particule"]
    },
    "SVT": {
      "Génétique": ["Méiose et fécondation", "Brassage génétique", "Anomalies chromosomiques"],
      "Géologie": ["Tectonique des plaques", "Magmatisme", "Métamorphisme"],
      "Immunologie": ["Réponse innée", "Réponse adaptative", "SIDA et vaccins"]
    }
  },
  "3ème": {
    "Mathématiques": {
      "Arithmétique": ["PGCD", "Nombres premiers", "Calcul littéral"],
      "Géométrie": ["Théorème de Thalès", "Théorème de Pythagore", "Trigonométrie", "Vecteurs et repères"],
      "Fonctions": ["Fonctions linéaires", "Fonctions affines", "Statistiques"]
    },
    "Français": {
      "Grammaire": ["Les propositions", "Le passif", "Les connecteurs logiques"],
      "Littérature": ["Le roman au XIXe", "La poésie engagée", "Le théâtre classique"]
    }
  }
};

const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: "lesson_plan", label: "Plan de cours complet", description: "Objectifs, plan ultra-détaillé, cours magistral et activités" },
  { value: "exercises", label: "Série d'exercices", description: "10-15 exercices progressifs avec corrigés détaillés" },
  { value: "quiz", label: "Quiz / QCM", description: "Questions à choix multiples avec explications approfondies" },
  { value: "simplification", label: "Vulgarisation", description: "Explications imagées avec analogies locales fortes" },
  { value: "activity", label: "Guide d'activité", description: "Scénario pédagogique, matériel et étapes pas à pas" },
  { value: "evaluation", label: "Examen blanc", description: "Sujet type examen avec barème et corrigé type" },
  { value: "revision_sheet", label: "Fiche de synthèse", description: "L'essentiel à retenir, formules et erreurs à éviter" },
];

export default function GeneratorForm({ onGenerate, isGenerating }: GeneratorFormProps) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ContentType>("lesson_plan");
  const [level, setLevel] = useState(LEVELS[12]); // Terminale par défaut
  const [subject, setSubject] = useState("");
  const [notion, setNotion] = useState("");
  const [subTopic, setSubTopic] = useState("");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [duration, setDuration] = useState("2 heures");

  const [customSubject, setCustomSubject] = useState("");
  const [customNotion, setCustomNotion] = useState("");
  const [customSubTopic, setCustomSubTopic] = useState("");

  const subjects = CURRICULUM_DATA[level] ? Object.keys(CURRICULUM_DATA[level]) : [];
  const notions = (level && subject && CURRICULUM_DATA[level]?.[subject]) ? Object.keys(CURRICULUM_DATA[level][subject]) : [];
  const subTopics = (level && subject && notion && CURRICULUM_DATA[level]?.[subject]?.[notion]) ? CURRICULUM_DATA[level][subject][notion] : [];

  const finalSubject = subject === "Autre" ? customSubject : subject;
  const finalNotion = notion === "Autre" ? customNotion : notion;
  const finalSubTopic = subTopic === "Autre" ? customSubTopic : subTopic;

  const canGoNext = () => {
    if (step === 1) return !!type;
    if (step === 2) return !!level && !!country;
    if (step === 3) return !!finalSubject;
    if (step === 4) return !!finalNotion;
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ 
      type, 
      level, 
      country, 
      subject: finalSubject, 
      notion: finalNotion, 
      subTopic: finalSubTopic,
      duration 
    });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-2">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            step === s ? 'bg-emerald-600 text-white scale-110 shadow-lg shadow-emerald-200' : 
            step > s ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {s}
          </div>
          {s < 5 && <div className={`w-8 sm:w-12 h-0.5 mx-1 ${step > s ? 'bg-emerald-200' : 'bg-gray-100'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-black/5 overflow-hidden max-w-4xl mx-auto">
      <div className="p-6 border-b border-black/5 bg-gray-50/30 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="text-emerald-500" size={20} />
          Assistant Pédagogique Structuré
        </h3>
        <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Étape {step}/5</span>
      </div>

      <div className="p-6 lg:p-10">
        {renderStepIndicator()}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ÉTAPE 1: TYPE DE CONTENU */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <label className="block text-xl font-bold text-gray-900 mb-6 text-center">Que souhaitez-vous créer aujourd'hui ?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => { setType(ct.value); setStep(2); }}
                    className={`p-5 rounded-2xl border-2 text-left transition-all group ${
                      type === ct.value 
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-inner' 
                        : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-base font-bold ${type === ct.value ? 'text-emerald-700' : 'text-gray-900'}`}>
                          {ct.label}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{ct.description}</p>
                      </div>
                      <ChevronRight className={`transition-transform ${type === ct.value ? 'text-emerald-500 translate-x-1' : 'text-gray-300 group-hover:translate-x-1'}`} size={20} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 2: NIVEAU ET PAYS */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <label className="block text-xl font-bold text-gray-900 mb-2 text-center">Définissons le contexte</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                    <Layers size={16} className="text-emerald-500" /> Niveau scolaire
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {LEVELS.map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLevel(l)}
                        className={`py-3 px-2 rounded-xl border text-sm font-bold transition-all ${
                          level === l ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                    🌍 Pays / Programme
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-emerald-500 focus:ring-0 outline-none transition-all text-lg font-medium"
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 italic">Le contenu sera adapté aux spécificités du programme de ce pays.</p>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 3: MATIÈRE */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <label className="block text-xl font-bold text-gray-900 mb-2 text-center">Quelle est la discipline ?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setSubject(s); setStep(4); }}
                    className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      subject === s ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-emerald-200'
                    }`}
                  >
                    <span className="font-bold">{s}</span>
                    <Book size={18} className={subject === s ? 'text-emerald-500' : 'text-gray-300'} />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSubject("Autre")}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    subject === "Autre" ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'
                  }`}
                >
                  <span className="font-bold">Autre discipline...</span>
                </button>
              </div>
              {subject === "Autre" && (
                <input
                  type="text"
                  autoFocus
                  placeholder="Entrez le nom de la matière (ex: Philosophie, Économie...)"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-emerald-200 focus:border-emerald-500 outline-none"
                />
              )}
            </div>
          )}

          {/* ÉTAPE 4: NOTION */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <label className="block text-xl font-bold text-gray-900 mb-2 text-center">Sur quelle notion travaillerez-vous ?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notions.map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => { setNotion(n); setStep(5); }}
                    className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      notion === n ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-emerald-200'
                    }`}
                  >
                    <span className="font-bold">{n}</span>
                    <Target size={18} className={notion === n ? 'text-emerald-500' : 'text-gray-300'} />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setNotion("Autre")}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    notion === "Autre" ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'
                  }`}
                >
                  <span className="font-bold">Autre notion...</span>
                </button>
              </div>
              {notion === "Autre" && (
                <input
                  type="text"
                  autoFocus
                  placeholder="Ex: Les intégrales, La colonisation, La cellule..."
                  value={customNotion}
                  onChange={(e) => setCustomNotion(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-emerald-200 focus:border-emerald-500 outline-none"
                />
              )}
            </div>
          )}

          {/* ÉTAPE 5: SOUS-THÈME ET DURÉE */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <label className="block text-xl font-bold text-gray-900 mb-2 text-center">Précisons les détails finaux</label>
              
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Sous-thème ou aspect spécifique (Optionnel)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subTopics.map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSubTopic(st)}
                      className={`p-4 rounded-xl border text-sm font-medium transition-all ${
                        subTopic === st ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-100 hover:border-emerald-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSubTopic("Autre")}
                    className={`p-4 rounded-xl border text-sm font-medium transition-all ${
                      subTopic === "Autre" ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-gray-100 hover:border-emerald-200'
                    }`}
                  >
                    Autre aspect...
                  </button>
                </div>
                {subTopic === "Autre" && (
                  <input
                    type="text"
                    autoFocus
                    placeholder="Précisez l'aspect (ex: Calcul d'aires, Intégration par parties...)"
                    value={customSubTopic}
                    onChange={(e) => setCustomSubTopic(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-emerald-200 focus:border-emerald-500 outline-none"
                  />
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Durée de la séance</label>
                <div className="flex flex-wrap gap-2">
                  {["1 heure", "2 heures", "3 heures", "4 heures", "Cycle complet"].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${
                        duration === d ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NAVIGATION */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-8 py-4 text-gray-500 font-bold hover:text-gray-900 transition-all hover:bg-gray-50 rounded-2xl"
              >
                Retour
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                disabled={!canGoNext()}
                onClick={() => setStep(step + 1)}
                className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-xl shadow-gray-200 flex items-center gap-2 active:scale-95"
              >
                Continuer <ChevronRight size={20} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isGenerating || !canGoNext()}
                className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 disabled:bg-gray-200 transition-all shadow-xl shadow-emerald-200 flex items-center gap-2 active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Lancer la génération
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
