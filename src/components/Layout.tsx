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
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-white border-b border-black/5 flex items-center justify-between px-4 sticky top-0 z-50 no-print">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-lg">
          <BookOpen size={24} />
          <span>EduAfrica AI</span>
        </div>
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-black/5" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <User size={16} />
            </div>
          )}
          <button 
            onClick={() => signOut(auth)}
            className="text-gray-400 p-1"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-black/5 flex-col sticky top-0 h-screen no-print">
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
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        <header className="hidden lg:flex h-16 bg-white border-b border-black/5 items-center justify-between px-8 sticky top-0 z-40 no-print">
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
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
          {/* Mobile Tab Title */}
          <h2 className="lg:hidden text-2xl font-bold text-gray-900 mb-6">
            {activeTab === 'dashboard' && 'Tableau de bord'}
            {activeTab === 'create' && 'Générateur'}
            {activeTab === 'history' && 'Historique'}
          </h2>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 px-6 py-3 flex justify-between items-center z-50 no-print">
        <MobileNavItem 
          icon={<LayoutDashboard size={24} />} 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
        />
        <MobileNavItem 
          icon={<PlusCircle size={24} />} 
          active={activeTab === 'create'} 
          onClick={() => setActiveTab('create')} 
        />
        <MobileNavItem 
          icon={<History size={24} />} 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
        />
      </nav>
    </div>
  );
}

function MobileNavItem({ icon, active, onClick }: { icon: React.ReactNode, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-xl transition-all ${
        active 
          ? 'text-emerald-600 bg-emerald-50' 
          : 'text-gray-400'
      }`}
    >
      {icon}
    </button>
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
