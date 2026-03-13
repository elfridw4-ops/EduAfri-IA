import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import Layout from './components/Layout';
import GeneratorForm from './components/GeneratorForm';
import ContentDisplay from './components/ContentDisplay';
import { generatePedagogicalContent } from './services/ai';
import { PedagogicalContent } from './types';
import { GoogleGenAI } from "@google/genai";
import { BookOpen, Sparkles, History, ArrowRight, LogIn, Loader2, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [history, setHistory] = useState<PedagogicalContent[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lastParams, setLastParams] = useState<any>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'contents'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsMap = new Map();
      snapshot.docs.forEach(doc => {
        docsMap.set(doc.id, { ...doc.data(), id: doc.id } as PedagogicalContent);
      });
      setHistory(Array.from(docsMap.values()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'contents');
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Login popup closed by user");
        return;
      }
      console.error("Login error:", error);
      setToast({ message: "Erreur de connexion.", type: 'error' });
    }
  };

  const generateImage = async (prompt: string) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "512px"
          }
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    } catch (error) {
      console.error("Image generation error:", error);
    }
    return null;
  };

  const handleGenerate = async (params: any) => {
    setIsGenerating(true);
    setLastParams(params);
    try {
      const rawContent = await generatePedagogicalContent(params);
      let content = rawContent || "";
      let imageUrl = undefined;

      if (content.startsWith('IMAGE_PROMPT:')) {
        const lines = content.split('\n');
        const promptLine = lines[0];
        const imagePrompt = promptLine.replace('IMAGE_PROMPT:', '').trim();
        content = lines.slice(1).join('\n').trim();
        imageUrl = await generateImage(imagePrompt) || undefined;
      }

      const title = `${params.type.replace('_', ' ').toUpperCase()} : ${params.notion}`;
      const newContent = { 
        title, 
        content, 
        imageUrl,
        type: params.type,
        subject: params.subject,
        notion: params.notion,
        subTopic: params.subTopic,
        level: params.level,
        country: params.country
      };

      setGeneratedContent(newContent);
      setSessionHistory(prev => [...prev, newContent]);
      setCurrentIndex(prev => prev + 1);
      setIsSaved(false);
      setActiveTab('create');
    } catch (error) {
      console.error("Generation error:", error);
      setToast({ message: "Erreur lors de la génération.", type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    if (lastParams) {
      handleGenerate(lastParams);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setGeneratedContent(sessionHistory[newIndex]);
      setIsSaved(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < sessionHistory.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setGeneratedContent(sessionHistory[newIndex]);
      setIsSaved(false);
    }
  };

  const handleSave = async () => {
    if (!user || !generatedContent || isSaved) return;

    const path = 'contents';
    try {
      // Strip id if it exists (e.g. from history) to avoid duplicate id in data
      const { id, ...contentToSave } = generatedContent as any;
      
      const docData = {
        userId: user.uid,
        ...contentToSave,
        imageUrl: generatedContent.imageUrl || null,
        createdAt: serverTimestamp()
      };

      // Estimate document size (Firestore limit is 1MB)
      const sizeEstimate = JSON.stringify(docData).length;
      
      // If size > 900KB, try to save without the image (base64 images are huge)
      if (sizeEstimate > 900000 && docData.imageUrl) {
        console.warn("Document too large, saving without image.");
        docData.imageUrl = null;
        setToast({ message: "Le contenu est très volumineux. Sauvegarde effectuée sans l'image pour respecter les limites.", type: 'success' });
      }

      await addDoc(collection(db, path), docData);
      setIsSaved(true);
      if (!toast) {
        setToast({ message: "Contenu sauvegardé avec succès !", type: 'success' });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      setToast({ message: "Erreur lors de la sauvegarde. Le contenu est peut-être trop volumineux.", type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const path = `contents/${id}`;
    try {
      await deleteDoc(doc(db, 'contents', id));
      setToast({ message: "Contenu supprimé.", type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      setToast({ message: "Erreur lors de la suppression.", type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="inline-flex p-4 bg-emerald-50 rounded-3xl text-emerald-600 mb-4">
            <BookOpen size={48} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">EduAfrica AI</h1>
          <p className="text-lg text-gray-600">
            L'assistant intelligent pour les enseignants africains. Créez vos supports pédagogiques en quelques secondes.
          </p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
          >
            <LogIn size={20} />
            Se connecter avec Google
          </button>
          <div className="pt-8 border-t border-gray-100 grid grid-cols-3 gap-4 text-[10px] uppercase tracking-widest text-gray-400 font-mono">
            <div>Plans de cours</div>
            <div>Quiz & QCM</div>
            <div>Évaluations</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user}>
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="bg-emerald-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-200">
            <div className="relative z-10">
              <h2 className="text-2xl lg:text-3xl font-bold mb-2">Bienvenue, {user.displayName?.split(' ')[0]} !</h2>
              <p className="text-emerald-100 max-w-md text-sm lg:text-base">Prêt à transformer votre prochain cours ? Utilisez nos outils d'IA pour gagner du temps.</p>
              <button 
                onClick={() => setActiveTab('create')}
                className="mt-6 px-6 py-3 bg-white text-emerald-700 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-50 transition-colors w-full sm:w-auto justify-center"
              >
                Commencer <ArrowRight size={18} />
              </button>
            </div>
            <Sparkles className="absolute -right-8 -bottom-8 text-white/10 w-48 h-48 lg:w-64 lg:h-64" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            <StatCard title="Contenus créés" value={history.length.toString()} icon={<History size={20} />} />
            <StatCard title="Dernière activité" value="Aujourd'hui" icon={<Sparkles size={20} />} />
            <StatCard title="Niveau d'accès" value="Enseignant" icon={<BookOpen size={20} />} />
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Activités récentes</h3>
            {history.length > 0 ? (
              <div className="bg-white rounded-2xl border border-black/5 divide-y divide-gray-50">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => {
                    setGeneratedContent(item);
                    setActiveTab('create');
                  }}>
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                        <FileIcon type={item.type} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.subject} • {item.level}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <ArrowRight size={16} className="text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400">Aucun contenu créé pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="space-y-8">
          {!generatedContent || isGenerating ? (
            <GeneratorForm onGenerate={handleGenerate} isGenerating={isGenerating} />
          ) : (
            <div className="space-y-4">
              <button 
                onClick={() => setGeneratedContent(null)}
                className="text-sm text-emerald-600 font-medium flex items-center gap-1 hover:underline no-print"
              >
                ← Créer un autre contenu
              </button>
              <ContentDisplay 
                title={generatedContent.title} 
                content={generatedContent.content} 
                imageUrl={generatedContent.imageUrl}
                onSave={isSaved ? undefined : handleSave} 
                onRegenerate={handleRegenerate}
                onPrevious={handlePrevious}
                onNext={handleNext}
                currentIndex={currentIndex}
                totalCount={sessionHistory.length}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          {history.map((item) => (
            <div 
              key={item.id} 
              className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => {
                setGeneratedContent(item);
                setActiveTab('create');
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileIcon type={item.type} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">{new Date((item.createdAt as any)?.seconds * 1000 || Date.now()).toLocaleDateString()}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">{item.title}</h4>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.subject} • {item.level} • {item.country}</p>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                Voir le contenu <ArrowRight size={14} />
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="col-span-full p-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
              <History size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400">Votre historique est vide.</p>
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 lg:bottom-8 right-8 z-[100] animate-in slide-in-from-right-full no-print">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p className="font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </Layout>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
      <div className="flex items-center gap-3 text-gray-400 mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function FileIcon({ type }: { type: string }) {
  switch (type) {
    case 'lesson_plan': return <BookOpen size={20} />;
    case 'quiz': return <Sparkles size={20} />;
    case 'exercises': return <History size={20} />;
    case 'simplification': return <Sparkles size={20} />;
    case 'activity': return <BookOpen size={20} />;
    case 'evaluation': return <AlertCircle size={20} />;
    case 'revision_sheet': return <History size={20} />;
    default: return <History size={20} />;
  }
}
