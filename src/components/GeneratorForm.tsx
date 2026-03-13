import React, { useState } from 'react';
import { ContentType } from '../types';
import { Sparkles, Loader2 } from 'lucide-react';

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

const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: "lesson_plan", label: "Plan de cours", description: "Objectifs, plan détaillé et activités" },
  { value: "exercises", label: "Exercices", description: "10 exercices progressifs avec corrigés" },
  { value: "quiz", label: "Quiz / QCM", description: "Questions à choix multiples avec explications" },
  { value: "simplification", label: "Simplifier un concept", description: "Explications claires avec analogies locales" },
  { value: "activity", label: "Activité interactive", description: "Jeux, débats et travaux de groupe" },
  { value: "evaluation", label: "Évaluation complète", description: "Devoir complet avec barème et corrigé" },
  { value: "revision_sheet", label: "Fiche de révision", description: "Résumé, notions clés et mini-quiz" },
];

export default function GeneratorForm({ onGenerate, isGenerating }: GeneratorFormProps) {
  const [type, setType] = useState<ContentType>("lesson_plan");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState(LEVELS[1]);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [duration, setDuration] = useState("1 heure");
  const [theme, setTheme] = useState("");
  const [concept, setConcept] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ type, subject, level, country, duration, theme, concept });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
      <div className="p-6 border-b border-black/5 bg-gray-50/50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="text-emerald-500" size={20} />
          Paramètres de génération
        </h3>
      </div>

      <div className="p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* Type de contenu */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-3">Que souhaitez-vous créer ?</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CONTENT_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setType(ct.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    type === ct.value 
                      ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <p className={`text-sm font-semibold ${type === ct.value ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {ct.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{ct.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sujet / Thème */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'simplification' ? 'Concept à expliquer' : 'Sujet ou Thème'}
            </label>
            <input
              type="text"
              required
              value={type === 'simplification' ? concept : subject}
              onChange={(e) => type === 'simplification' ? setConcept(e.target.value) : setSubject(e.target.value)}
              placeholder={type === 'simplification' ? "Ex: La photosynthèse, La démocratie..." : "Ex: Les fractions, L'histoire de l'Empire du Mali..."}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Niveau */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niveau scolaire</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Pays */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contexte pays</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Durée (Optionnel pour certains types) */}
          {type === 'lesson_plan' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée prévue</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: 1 heure, 2 séances de 45 min"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isGenerating || (!subject && !concept)}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Générer le contenu
            </>
          )}
        </button>
      </div>
    </form>
  );
}
