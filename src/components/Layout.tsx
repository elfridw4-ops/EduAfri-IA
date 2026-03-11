import React from 'react';
import { BookOpen, LayoutDashboard, LogOut, PlusCircle, History, User } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
}

export default function Layout({ children, activeTab, setActiveTab, user }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-black/5 flex flex-col">
        <div className="p-6 border-bottom border-black/5">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
            <BookOpen size={28} />
            <span>EduAfrica AI</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1 font-mono">
            Mission Control v1.0
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Tableau de bord" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<PlusCircle size={20} />} 
            label="Créer un contenu" 
            active={activeTab === 'create'} 
            onClick={() => setActiveTab('create')} 
          />
          <NavItem 
            icon={<History size={20} />} 
            label="Historique" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
        </nav>

        <div className="p-4 border-t border-black/5">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <User size={16} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName || 'Enseignant'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-8">
          <h2 className="text-lg font-medium text-gray-900">
            {activeTab === 'dashboard' && 'Tableau de bord'}
            {activeTab === 'create' && 'Générateur de contenu'}
            {activeTab === 'history' && 'Mes contenus sauvegardés'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-tighter">
              Status: <span className="text-emerald-500">Online</span>
            </span>
          </div>
        </header>
        <div className="p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
