import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  UserX, 
  Users, 
  Stethoscope, 
  PlusCircle, 
  UserPlus, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { user, isAdmin, isDoctor, isReceptionist } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/reports/dashboard');
        setData(response.data);
      } catch (error) {
        console.error('Error al cargar métricas del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 md:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            ¡Hola, {user?.nombre}! 👋
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Bienvenido al panel principal de la clínica. Gestión de citas, expedientes clínicos bajo NOM-004 y control de atención del día.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <Link
            to="/citas"
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/30 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Agendar Cita
          </Link>
          <Link
            to="/pacientes"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Registrar Paciente
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Citas Hoy</div>
            <div className="text-2xl font-black text-slate-800">{data?.citas_hoy || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Atendidas Hoy</div>
            <div className="text-2xl font-black text-slate-800">{data?.citas_completadas_hoy || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Inasistencia %</div>
            <div className="text-2xl font-black text-slate-800">{data?.tasa_inasistencia_porcentaje || 0}%</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Pacientes</div>
            <div className="text-2xl font-black text-slate-800">{data?.total_pacientes_activos || 0}</div>
          </div>
        </div>
      </div>

      {/* Gráficos / Tablas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ocupación Semanal */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" /> Ocupación Semanal (Citas)
            </h3>
            <span className="text-xs font-semibold text-slate-400">Esta Semana</span>
          </div>

          <div className="space-y-3">
            {data?.ocupacion_semanal?.map((item, idx) => {
              const maxCitas = Math.max(...(data?.ocupacion_semanal?.map(d => d.total_citas) || [1]), 5);
              const percentage = Math.round((item.total_citas / maxCitas) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>{item.dia}</span>
                    <span>{item.total_citas} citas</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Citas por Médico */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" /> Ocupación por Médico
            </h3>
            <Link to="/citas" className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              Ver Citas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.citas_por_medico?.map((med, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    Dr
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{med.medico_nombre}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Médico de la clínica</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold">
                  {med.total_citas} citas asignadas
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
