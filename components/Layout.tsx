
import React from 'react';
import { View, UserSG, UserRole, UserSpecialty } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  setView: (view: View) => void;
  user: UserSG | null;
  onLogout: () => void;
  canLogout: boolean;
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.OPERATOR]: 'S/G Operador',
  [UserRole.SG_ENGINEERING]: 'S/G Ingeniería',
  [UserRole.CHIEF_GUARD]: 'Jefe de Guardia',
  [UserRole.CHIEF_ENGINEER]: 'Ingeniero Jefe'
};

const SPECIALTY_LABELS: Record<UserSpecialty, string> = {
  [UserSpecialty.PROPULSION]: 'Motorista',
  [UserSpecialty.ELECTRICITY]: 'Electricista',
  [UserSpecialty.ALL]: 'Administración'
};

export const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, user, onLogout, canLogout }) => {
  const showNav = ![View.LOGIN, View.REGISTER_SG].includes(activeView);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {showNav && (
        <header className="bg-[#003366] text-white shadow-lg sticky top-0 z-50 pt-safe">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between pl-safe pr-safe">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 cursor-pointer hover:scale-105 transition-transform" onClick={() => setView(View.DASHBOARD)}>
                 <span className="text-[#003366] font-bold text-xs text-center">ARC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight hidden sm:block">ARC Simón Bolívar</h1>
                <h1 className="text-[15px] font-black tracking-tighter sm:hidden uppercase leading-none">ARC Simón Bolívar</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-6">
              <div className="text-right hidden sm:block border-r border-white/20 pr-4">
                <p className="text-[10px] uppercase font-black opacity-75 tracking-widest leading-none mb-1">
                  {user ? `${ROLE_LABELS[user.role]} - ${SPECIALTY_LABELS[user.specialty]}` : 'Usuario'}
                </p>
                <p className="text-sm font-semibold leading-none">{user?.grade} {user?.name}</p>
              </div>
              
              <div className="flex items-center gap-2 pr-safe">
                <button 
                  onClick={() => setView(View.DASHBOARD)}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-md uppercase tracking-wider"
                >
                  Menú
                </button>
                <button 
                  onClick={onLogout}
                  title="Cambiar Usuario / Cerrar Sesión"
                  className="p-2 rounded-lg transition-all group hover:bg-white/10"
                >
                  <span className="text-xl transition-transform inline-block group-hover:scale-110">🚪</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl pl-safe pr-safe pb-safe">
        {children}
      </main>

      {showNav && (
        <footer className="bg-slate-100 border-t py-6 text-center text-slate-500 text-xs">
          <p>© {new Date().getFullYear()} ARC Simón Bolívar - Departamento de Ingeniería</p>
          <p className="mt-1 font-bold opacity-60 italic uppercase tracking-widest">
            {user ? `División: ${SPECIALTY_LABELS[user.specialty]}` : 'Sistema de Control Naval'}
          </p>
        </footer>
      )}
    </div>
  );
};
