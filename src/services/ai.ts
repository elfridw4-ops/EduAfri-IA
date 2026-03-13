import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type ContentType = 
  | "lesson_plan" 
  | "exercises" 
  | "quiz" 
  | "simplification" 
  | "activity" 
  | "evaluation" 
  | "revision_sheet";

interface GenerationParams {
  type: ContentType;
  level: string;
  country: string;
  subject: string;
  notion: string;
  subTopic?: string;
  duration?: string;
}

export const generatePedagogicalContent = async (params: GenerationParams) => {
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: `Tu es un expert en éducation africaine (EdTech) de classe mondiale. Ton objectif est de générer du contenu pédagogique EXHAUSTIF, structuré et de haute qualité.
      
      RÈGLES CRITIQUES :
      1. EXHAUSTIVITÉ : Ne te limite pas à un résumé. Si on demande un plan de cours, fournis un contenu de 10 à 15 pages équivalent (en texte Markdown). Développe chaque point, donne des exemples, des démonstrations et des explications profondes.
      2. CONTEXTE : Utilise des exemples locaux, des références culturelles africaines (noms, lieux, situations) et un langage adapté au niveau scolaire.
      3. MATHÉMATIQUES : Utilise EXCLUSIVEMENT le format LaTeX avec des délimiteurs $ pour les formules en ligne (ex: $E=mc^2$) et $$ pour les blocs (ex: $$\\int_a^b f(x)dx$$).
      4. ILLUSTRATION : Commence TOUJOURS ta réponse par une ligne au format : IMAGE_PROMPT: [description détaillée en anglais pour un générateur d'images].
      5. STRUCTURE : Utilise des titres (H1, H2, H3), des listes, des tableaux et du gras pour rendre le contenu lisible et professionnel.`,
    },
    contents: [
      {
        parts: [
          {
            text: getPrompt(params)
          }
        ]
      }
    ]
  });

  const response = await model;
  return response.text;
};

function getPrompt(params: GenerationParams): string {
  const { type, level, country, subject, notion, subTopic, duration } = params;
  const detail = subTopic ? `en mettant l'accent sur : ${subTopic}` : "";
  
  switch (type) {
    case "lesson_plan":
      return `Génère un PLAN DE COURS MAGISTRAL ET EXHAUSTIF.
      Discipline : ${subject}
      Notion : ${notion} ${detail}
      Niveau : ${level}
      Pays : ${country}
      Durée : ${duration}
      
      Le contenu doit inclure :
      - Une introduction captivante avec les objectifs d'apprentissage (Bloom).
      - Un développement structuré en plusieurs grandes parties (I, II, III...) très détaillées.
      - Des démonstrations complètes, des théorèmes, des définitions précises.
      - Des exemples concrets tirés du quotidien en ${country}.
      - Une section "Le saviez-vous ?" ou "Application pratique" liée au contexte africain.
      - Une conclusion et un résumé des points clés.
      - Une proposition d'activité interactive pour la classe.
      
      Sois extrêmement généreux dans les détails. Le texte doit être long et complet.`;
    
    case "exercises":
      return `Génère une SÉRIE D'EXERCICES PROGRESSIFS ET COMPLÈTE.
      Discipline : ${subject}
      Notion : ${notion} ${detail}
      Niveau : ${level}
      Pays : ${country}
      
      Inclus :
      - 5 exercices de base (application directe).
      - 5 exercices intermédiaires (analyse).
      - 5 exercices complexes ou problèmes de synthèse (type examen).
      - Un CORRIGÉ ULTRA-DÉTAILLÉ pour chaque exercice avec explications des étapes.
      - Des conseils méthodologiques pour les élèves.`;
    
    case "quiz":
      return `Génère un QUIZ PÉDAGOGIQUE APPROFONDI.
      Discipline : ${subject}
      Notion : ${notion} ${detail}
      Niveau : ${level}
      
      Inclus :
      - 15 questions à choix multiples (QCM).
      - 4 options par question.
      - La réponse correcte.
      - Une EXPLICATION DÉTAILLÉE pour chaque réponse (pourquoi c'est juste, pourquoi les autres sont fausses).`;
    
    case "simplification":
      return `VULGARISE ET SIMPLIFIE ce concept complexe : "${notion} ${detail}".
      Niveau : ${level}
      
      Objectif : Rendre le concept compréhensible par un enfant de 10 ans tout en restant rigoureux pour le niveau ${level}.
      Inclus :
      - Des analogies puissantes liées à la vie quotidienne en Afrique (marché, famille, nature, contes).
      - Un langage imagé et simple.
      - Une section "En résumé : ce qu'il faut retenir".`;
    
    case "activity":
      return `Crée un GUIDE D'ACTIVITÉ INTERACTIVE ET PRATIQUE.
      Discipline : ${subject}
      Notion : ${notion} ${detail}
      Niveau : ${level}
      
      Inclus :
      - Objectifs de l'activité.
      - Matériel nécessaire (accessible localement).
      - Étapes de préparation.
      - Déroulement pas à pas (Scénario pédagogique).
      - Questions à poser aux élèves pendant l'activité.
      - Évaluation de l'activité.`;
    
    case "evaluation":
      return `Crée un EXAMEN BLANC COMPLET (Évaluation sommative).
      Discipline : ${subject}
      Notion : ${notion} ${detail}
      Niveau : ${level}
      Pays : ${country}
      
      Inclus :
      - Un sujet structuré (Partie A : Théorie, Partie B : Pratique/Problème).
      - Un barème de notation précis (sur 20 points).
      - Un CORRIGÉ TYPE complet avec les critères d'évaluation.
      - Durée conseillée et consignes.`;
    
    case "revision_sheet":
      return `Génère une FICHE DE SYNTHÈSE (MÉMO).
      Discipline : ${subject}
      Notion : ${notion} ${detail}
      Niveau : ${level}
      
      Inclus :
      - Les définitions incontournables.
      - Les formules ou dates clés.
      - Les erreurs classiques à éviter (pièges).
      - Un schéma textuel ou un tableau récapitulatif.
      - 3 astuces pour mémoriser.`;
    
    default:
      return `Génère du contenu pédagogique exhaustif pour : ${subject}, Notion : ${notion}, Niveau : ${level}.`;
  }
}
