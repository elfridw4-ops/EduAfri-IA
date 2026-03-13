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
  subject: string;
  level: string;
  country: string;
  duration?: string;
  theme?: string;
  concept?: string;
}

export const generatePedagogicalContent = async (params: GenerationParams) => {
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: `Tu es un expert en éducation africaine (EdTech). Ton objectif est de générer du contenu pédagogique de haute qualité adapté aux programmes scolaires africains. 
      
      RÈGLES CRITIQUES :
      1. Utilise des exemples locaux, des références culturelles africaines et un langage adapté au niveau scolaire spécifié.
      2. Pour les formules mathématiques ou scientifiques, utilise EXCLUSIVEMENT le format LaTeX avec des délimiteurs $ pour les formules en ligne (ex: $E=mc^2$) et $$ pour les blocs (ex: $$\\int_a^b f(x)dx$$).
      3. Si une illustration visuelle est pertinente pour le sujet, commence TOUJOURS ta réponse par une ligne au format : IMAGE_PROMPT: [description détaillée en anglais pour un générateur d'images]. La description doit être précise et pédagogique.
      4. Ne généralise pas les niveaux scolaires, respecte strictement le niveau demandé.`,
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
  const { type, subject, level, country, duration, theme, concept } = params;
  
  switch (type) {
    case "lesson_plan":
      return `Génère un plan de cours détaillé pour le sujet suivant : "${subject}". 
      Niveau : ${level}. Pays : ${country}. Durée : ${duration}.
      Inclus : Objectifs pédagogiques, Plan détaillé, Notions clés, Activité pratique. 
      Utilise des exemples concrets du contexte de ${country}.`;
    
    case "exercises":
      return `Génère 10 exercices progressifs pour le thème : "${theme || subject}". 
      Niveau : ${level}. Pays : ${country}.
      Inclus : Niveaux de difficulté (Facile, Moyen, Difficile), Corrigé détaillé. 
      Adapte les énoncés au contexte africain.`;
    
    case "quiz":
      return `Génère un quiz (QCM) pour le sujet : "${subject}". 
      Niveau : ${level}.
      Inclus : 10 questions, 4 options par question, Réponses correctes, Explications pédagogiques.`;
    
    case "simplification":
      return `Explique de manière simplifiée la notion suivante : "${concept || subject}". 
      Niveau : ${level}.
      Inclus : Langage simple, Exemples africains, Analogies concrètes.`;
    
    case "activity":
      return `Propose des activités interactives pour le sujet : "${subject}". 
      Niveau : ${level}.
      Inclus : Jeux pédagogiques, Activités de groupe, Débats en classe, Mises en situation.`;
    
    case "evaluation":
      return `Crée un devoir complet (évaluation) pour le sujet : "${subject}". 
      Niveau : ${level}. Pays : ${country}.
      Inclus : QCM, Questions ouvertes, Exercice pratique, Corrigé détaillé.`;
    
    case "revision_sheet":
      return `Génère une fiche de révision pour le sujet : "${subject}". 
      Niveau : ${level}.
      Inclus : Résumé du cours, Notions clés, Dates ou formules importantes, Exemples, Mini quiz de 3 questions.`;
    
    default:
      return `Génère du contenu pédagogique pour : ${subject}, Niveau : ${level}.`;
  }
}
