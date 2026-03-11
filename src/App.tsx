import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import Layout from './components/Layout';
import GeneratorForm from './components/GeneratorForm';
import ContentDisplay from './components/ContentDisplay';
import { generatePedagogicalContent } from './services/ai';
import { PedagogicalContent } from './types';
import { BookOpen, Sparkles, History, ArrowRight, LogIn, Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{ title: string; content: string; type: string; subject: string; level: string; country: string } | null>(null);
  const [history, setHistory] = useState<PedagogicalContent[]>([]);

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
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PedagogicalContent));
      setHistory(docs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleGenerate = async (params: any) => {
    setIsGenerating(true);
    try {
      const content = await generatePedagogicalContent(params);
      const title = `${params.type.replace('_', ' ').toUpperCase()} : ${params.subject || params.concept}`;
      setGeneratedContent({ 
        title, 
        content: content || "", 
        type: params.type,
        subject: params.subject || params.concept,
        level: params.level,
        country: params.country
      });
      setActiveTab('create');
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user || !generatedContent) return;

    try {
      await addDoc(collection(db, 'contents'), {
        userId: user.uid,
        ...generatedContent,
        createdAt: serverTimestamp()
      });
      alert("Contenu sauvegardé avec succès !");
    } catch (error) {
      console.error("Save error:", error);
      alert("Erreur lors de la sauvegarde.");
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
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">EduAfrica AI</h1>
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
          <div className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-200">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">Bienvenue, {user.displayName?.split(' ')[0]} !</h2>
              <p className="text-emerald-100 max-w-md">Prêt à transformer votre prochain cours ? Utilisez nos outils d'IA pour gagner du temps.</p>
              <button 
                onClick={() => setActiveTab('create')}
                className="mt-6 px-6 py-3 bg-white text-emerald-700 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-50 transition-colors"
              >
                Commencer <ArrowRight size={18} />
              </button>
            </div>
            <Sparkles className="absolute -right-8 -bottom-8 text-white/10 w-64 h-64" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <ArrowRight size={16} className="text-gray-300" />
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
                className="text-sm text-emerald-600 font-medium flex items-center gap-1 hover:underline"
              >
                ← Créer un autre contenu
              </button>
              <ContentDisplay 
                title={generatedContent.title} 
                content={generatedContent.content} 
                onSave={handleSave} 
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <span className="text-[10px] font-mono text-gray-400 uppercase">{new Date((item.createdAt as any)?.seconds * 1000 || Date.now()).toLocaleDateString()}</span>
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
    default: return <History size={20} />;
  }
}
