import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  FileText, 
  Stethoscope, 
  BarChart3, 
  ShieldAlert, 
  Activity 
} from 'lucide-react';

export const Sidebar = () => {
  const { isAdmin, isDoctor, isReceptionist } = useAuth();

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Administrador', 'Médico', 'Recepcionista']
    },
    {
      to: '/citas',
      label: 'Citas & Agenda',
      icon: CalendarDays,
      roles: ['Administrador', 'Médico', 'Recepcionista']
    },
    {
      to: '/pacientes',
      label: 'Pacientes',
      icon: Users,
      roles: ['Administrador', 'Médico', 'Recepcionista']
    },
    {
      to: '/expedientes',
      label: 'Expediente Clínico',
      icon: FileText,
      roles: ['Administrador', 'Médico'], // NOM-004 restricción para Recepción
      badge: isReceptionist ? 'Restringido' : null
    },
    {
      to: '/medicos',
      label: 'Médicos & Salas',
      icon: Stethoscope,
      roles: ['Administrador']
    },
    {
      to: '/reportes',
      label: 'Reportes & Métricas',
      icon: BarChart3,
      roles: ['Administrador', 'Médico']
    },
    {
      to: '/auditoria',
      label: 'Bitácora NOM-024',
      icon: ShieldAlert,
      roles: ['Administrador']
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-white text-base tracking-tight">ExpedienteMed</h1>
          <p className="text-[10px] text-slate-400 font-medium">Clínica México v1.0</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Menú Principal
        </div>

        {navItems.map((item) => {
          const hasAccess = item.roles.some(r => (r === 'Administrador' && isAdmin) || (r === 'Médico' && isDoctor) || (r === 'Recepcionista' && isReceptionist));
          
          if (!hasAccess && !item.badge) return null;

          if (!hasAccess && item.badge) {
            return (
              <div 
                key={item.to} 
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 opacity-60 cursor-not-allowed bg-slate-800/30"
                title="Acceso restringido por la NOM-004-SSA3-2012 para personal no médico"
              >
                <div className="flex items-center gap-3 text-xs font-medium">
                  <item.icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-900/60 text-amber-300 font-bold">
                  {item.badge}
                </span>
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="text-[11px] text-slate-400 leading-relaxed">
          <p className="font-semibold text-slate-300 mb-0.5">Cumplimiento Normativo:</p>
          <p>• NOM-004-SSA3-2012</p>
          <p>• NOM-024-SSA3-2012</p>
        </div>
      </div>
    </aside>
  );
};
