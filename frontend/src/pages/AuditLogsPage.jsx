import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatDateTimeMX } from '../utils/formatters';
import { ShieldAlert, Filter, Clock, User, Terminal } from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedModule) params.modulo = selectedModule;
      if (selectedAction) params.accion = selectedAction;

      const res = await api.get('/audit-logs', { params });
      setLogs(res.data);
    } catch (err) {
      console.error('Error al obtener bitácora de auditoría:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedModule, selectedAction]);

  const getActionBadge = (acc) => {
    switch (acc) {
      case 'CREACION':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">CREACIÓN</span>;
      case 'MODIFICACION':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">MODIFICACIÓN</span>;
      case 'ELIMINACION_LOGICA':
        return <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md">ELIMINACIÓN LÓGICA</span>;
      case 'LECTURA':
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">LECTURA</span>;
      case 'LOGIN_EXITOSO':
        return <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-md">LOGIN OK</span>;
      default:
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md">{acc}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-600" /> Bitácora de Auditoría (NOM-024-SSA3-2012)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Registro inalterable de quién consultó, creó, modificó o eliminó expedientes y datos personales sensibles.
          </p>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Módulo</label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">Todos los módulos</option>
              <option value="Autenticación">Autenticación</option>
              <option value="Pacientes">Pacientes</option>
              <option value="Citas">Citas</option>
              <option value="ExpedienteClínico">Expediente Clínico</option>
              <option value="ConsultaMédica">Consulta Médica</option>
              <option value="Recetas">Recetas</option>
              <option value="Usuarios">Usuarios</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Acción</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">Todas las acciones</option>
              <option value="LECTURA">LECTURA</option>
              <option value="CREACION">CREACIÓN</option>
              <option value="MODIFICACION">MODIFICACIÓN</option>
              <option value="ELIMINACION_LOGICA">ELIMINACIÓN LÓGICA</option>
              <option value="LOGIN_EXITOSO">LOGIN EXITOSO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Cargando registros de auditoría...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Sin registros de auditoría.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-4">Fecha / Hora</th>
                  <th className="py-3.5 px-4">Usuario</th>
                  <th className="py-3.5 px-4">Acción</th>
                  <th className="py-3.5 px-4">Módulo</th>
                  <th className="py-3.5 px-4">Entidad ID / Detalles</th>
                  <th className="py-3.5 px-4">IP Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 font-medium">
                    <td className="py-3 px-4 font-bold text-slate-900">{formatDateTimeMX(log.created_at)}</td>
                    <td className="py-3 px-4">
                      {log.usuario ? (
                        <div>
                          <div className="font-bold">{log.usuario.nombre} {log.usuario.primer_apellido}</div>
                          <div className="text-[10px] text-slate-400">{log.usuario.email} ({log.usuario.rol?.nombre})</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Sistema / Anónimo</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getActionBadge(log.accion)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.modulo}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-[11px] font-bold text-purple-700">{log.entidad_id || '-'}</div>
                      {log.detalles_json && (
                        <div className="text-[10px] font-mono text-slate-500 max-w-xs truncate" title={log.detalles_json}>
                          {log.detalles_json}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.ip_origen || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
