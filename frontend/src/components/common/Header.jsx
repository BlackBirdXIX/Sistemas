import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, ShieldCheck, Stethoscope, UserCheck, Bell } from 'lucide-react';

export const Header = () => {
  const { user, logout, rolNombre, isAdmin, isDoctor, isReceptionist } = useAuth();

  const getRoleBadge = () => {
    if (isAdmin) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800"><ShieldCheck className="w-3 h-3 mr-1" /> Admin</span>;
    if (isDoctor) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800"><Stethoscope className="w-3 h-3 mr-1" /> Médico</span>;
    if (isReceptionist) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><UserCheck className="w-3 h-3 mr-1" /> Recepción</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{rolNombre}</span>;
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center space-x-3">
        <h2 className="text-lg font-bold bg-gradient-to-r from-teal-700 to-emerald-600 bg-clip-text text-transparent">
          Clínica Médica México
        </h2>
        <span className="hidden md:inline-block text-xs text-slate-400 font-medium border-l border-slate-200 pl-3">
          Sistema de Citas y Expediente Clínico (NOM-004 / NOM-024)
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {user?.nombre?.[0] || 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              {user?.nombre} {user?.primer_apellido}
            </div>
            <div className="mt-0.5">{getRoleBadge()}</div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Cerrar Sesión"
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1 text-xs font-medium cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
};
