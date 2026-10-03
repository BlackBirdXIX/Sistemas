import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart3, TrendingUp, Users, CalendarCheck, Percent, PieChart } from 'lucide-react';

export const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Error al obtener reportes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando métricas y reportes...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-teal-600" /> Reportes Estadísticos y KPIs de Ocupación
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Visualización de rendimiento operativo de la clínica, inasistencias y nuevos registros.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pacientes</div>
              <div className="text-2xl font-black text-slate-800">{data?.total_pacientes_activos || 0}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Médicos Activos</div>
              <div className="text-2xl font-black text-slate-800">{data?.total_medicos || 0}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Tasa de Inasistencia</div>
              <div className="text-2xl font-black text-slate-800">{data?.tasa_inasistencia_porcentaje || 0}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" /> Pacientes Nuevos por Mes
          </h3>
          <div className="space-y-3 text-xs">
            {data?.pacientes_nuevos_mes?.map((m, idx) => (
              <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-700">{m.mes}</span>
                <span className="px-3 py-1 bg-teal-100 text-teal-800 font-extrabold rounded-lg">
                  +{m.total_pacientes} pacientes
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-teal-600" /> Citas por Médico
          </h3>
          <div className="space-y-3 text-xs">
            {data?.citas_por_medico?.map((med, idx) => (
              <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-700">{med.medico_nombre}</span>
                <span className="px-3 py-1 bg-slate-200 text-slate-800 font-extrabold rounded-lg">
                  {med.total_citas} citas
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
