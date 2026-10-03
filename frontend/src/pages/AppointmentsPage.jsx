import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatDateTimeMX, formatDateMX, formatTimeMX } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarDays, 
  PlusCircle, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Stethoscope, 
  Building, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  List,
  Grid
} from 'lucide-react';

export const AppointmentsPage = () => {
  const { isDoctor } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [consultingRooms, setConsultingRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  // Modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Form State
  const [newFormData, setNewFormData] = useState({
    paciente_id: '',
    medico_id: '',
    consultorio_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '09:00',
    duracion_minutos: 30,
    tipo_recordatorio: 'email'
  });
  const [rescheduleData, setRescheduleData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: '09:00',
    consultorio_id: ''
  });
  const [statusData, setStatusData] = useState({
    estado: 'confirmada',
    motivo_cancelacion: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCatalogs = async () => {
    try {
      const [docRes, patRes, roomRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/patients'),
        api.get('/consulting-rooms')
      ]);
      setDoctors(docRes.data);
      setPatients(patRes.data);
      setConsultingRooms(roomRes.data);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDoctor) params.medico_id = selectedDoctor;
      if (selectedDate && viewMode === 'list') params.fecha = selectedDate;
      if (selectedStatus) params.estado = selectedStatus;

      const res = await api.get('/appointments', { params });
      setAppointments(res.data);
    } catch (err) {
      console.error('Error al cargar citas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDoctor, selectedDate, selectedStatus, viewMode]);

  const handleOpenNewModal = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setNewFormData({
      paciente_id: patients[0]?.id || '',
      medico_id: doctors[0]?.id || '',
      consultorio_id: doctors[0]?.consultorio_id || consultingRooms[0]?.id || '',
      fecha: new Date().toISOString().split('T')[0],
      hora: '09:00',
      duracion_minutos: 30,
      tipo_recordatorio: 'email'
    });
    setIsNewModalOpen(true);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      const fechaHoraInicio = `${newFormData.fecha}T${newFormData.hora}:00`;
      await api.post('/appointments', {
        paciente_id: parseInt(newFormData.paciente_id),
        medico_id: parseInt(newFormData.medico_id),
        consultorio_id: parseInt(newFormData.consultorio_id),
        fecha_hora_inicio: fechaHoraInicio,
        duracion_minutos: parseInt(newFormData.duracion_minutos),
        tipo_recordatorio: newFormData.tipo_recordatorio
      });

      setIsNewModalOpen(false);
      fetchAppointments();
    } catch (err) {
      const detail = err.response?.data?.detail || 'No se pudo agendar la cita.';
      setErrorMessage(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReschedule = (apt) => {
    setErrorMessage('');
    setSelectedAppointment(apt);
    const dt = new Date(apt.fecha_hora_inicio);
    setRescheduleData({
      fecha: dt.toISOString().split('T')[0],
      hora: dt.toTimeString().substring(0, 5),
      consultorio_id: apt.consultorio_id
    });
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      const nuevaFechaHora = `${rescheduleData.fecha}T${rescheduleData.hora}:00`;
      await api.put(`/appointments/${selectedAppointment.id}/reschedule`, {
        nueva_fecha_hora_inicio: nuevaFechaHora,
        consultorio_id: parseInt(rescheduleData.consultorio_id)
      });
      setIsRescheduleModalOpen(false);
      fetchAppointments();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Error al reagendar la cita.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenStatus = (apt) => {
    setErrorMessage('');
    setSelectedAppointment(apt);
    setStatusData({
      estado: apt.estado,
      motivo_cancelacion: apt.motivo_cancelacion || ''
    });
    setIsStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      await api.put(`/appointments/${selectedAppointment.id}/status`, statusData);
      setIsStatusModalOpen(false);
      fetchAppointments();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Error al actualizar el estado de la cita.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReminder = async (aptId) => {
    try {
      const res = await api.post(`/appointments/${aptId}/reminder`);
      alert(res.data.message);
      fetchAppointments();
    } catch (err) {
      alert('Error al enviar el recordatorio.');
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'programada':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Programada</span>;
      case 'confirmada':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Confirmada</span>;
      case 'en_curso':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">En Curso</span>;
      case 'completada':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Completada</span>;
      case 'cancelada':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Cancelada</span>;
      case 'no_asistio':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">No Asistió</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{st}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header y Filtros */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-teal-600" /> Gestión de Citas y Agenda
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Agendamiento con validación estricta de no empalmes de horario para Médico y Consultorio.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-4 h-4" /> Lista
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Grid className="w-4 h-4" /> Calendario
              </button>
            </div>

            <button
              onClick={handleOpenNewModal}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Agendar Cita
            </button>
          </div>
        </div>

        {/* Filtros Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Médico Tratante</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
            >
              <option value="">Todos los médicos</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  Dr. {d.usuario?.nombre} {d.usuario?.primer_apellido} ({d.especialidad?.nombre})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Fecha de Agenda</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Estado de Cita</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="programada">Programada</option>
              <option value="confirmada">Confirmada</option>
              <option value="en_curso">En Curso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
              <option value="no_asistio">No Asistió</option>
            </select>
          </div>
        </div>
      </div>

      {/* VISTA DE LISTA */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Cargando agenda de citas...</div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600 text-sm">No hay citas programadas para el filtro seleccionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3.5 px-4">Fecha y Hora</th>
                    <th className="py-3.5 px-4">Paciente</th>
                    <th className="py-3.5 px-4">Médico / Especialidad</th>
                    <th className="py-3.5 px-4">Consultorio</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{formatDateTimeMX(apt.fecha_hora_inicio)}</div>
                        <div className="text-[11px] text-slate-400">
                          {formatTimeMX(apt.fecha_hora_inicio)} - {formatTimeMX(apt.fecha_hora_fin)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{apt.paciente?.nombre} {apt.paciente?.primer_apellido}</div>
                        <div className="text-[11px] font-mono text-slate-400">{apt.paciente?.curp}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          Dr. {apt.medico?.usuario?.nombre} {apt.medico?.usuario?.primer_apellido}
                        </div>
                        <div className="text-[11px] text-teal-700 font-medium">{apt.medico?.especialidad?.nombre}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold">
                          {apt.consultorio?.codigo_sala} ({apt.consultorio?.nombre})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(apt.estado)}
                        {apt.motivo_cancelacion && (
                          <div className="text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={apt.motivo_cancelacion}>
                            Motivo: {apt.motivo_cancelacion}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Recordatorio */}
                          <button
                            onClick={() => handleSendReminder(apt.id)}
                            title="Simular envío de recordatorio"
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* Cambiar Estado */}
                          <button
                            onClick={() => handleOpenStatus(apt)}
                            title="Cambiar Estado"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* Reagendar */}
                          {apt.estado !== 'completada' && apt.estado !== 'cancelada' && (
                            <button
                              onClick={() => handleOpenReschedule(apt)}
                              title="Reagendar Cita"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VISTA DE CALENDARIO DE CITAS */}
      {viewMode === 'calendar' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-teal-600" /> Vista Visual de Citas Programadas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-xs">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-center text-slate-700">
                {d}
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-100">
            {appointments.map((apt) => (
              <div key={apt.id} className="py-3 flex items-center justify-between hover:bg-slate-50 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                    {formatTimeMX(apt.fecha_hora_inicio)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{apt.paciente?.nombre} {apt.paciente?.primer_apellido}</p>
                    <p className="text-xs text-slate-500">Dr. {apt.medico?.usuario?.nombre} | {apt.consultorio?.codigo_sala}</p>
                  </div>
                </div>
                <div>{getStatusBadge(apt.estado)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: AGENDAR CITA CON VALIDACIÓN ANTI-EMPALMES */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Agendar Nueva Cita Médica"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Conflicto de Disponibilidad:</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Paciente *</label>
            <select
              required
              value={newFormData.paciente_id}
              onChange={(e) => setNewFormData({ ...newFormData, paciente_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
            >
              <option value="">Seleccione paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.primer_apellido} ({p.curp})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Médico Tratante *</label>
              <select
                required
                value={newFormData.medico_id}
                onChange={(e) => {
                  const mId = parseInt(e.target.value);
                  const docObj = doctors.find(d => d.id === mId);
                  setNewFormData({
                    ...newFormData,
                    medico_id: mId,
                    consultorio_id: docObj?.consultorio_id || newFormData.consultorio_id
                  });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
              >
                <option value="">Seleccione médico...</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.usuario?.nombre} {d.usuario?.primer_apellido} ({d.especialidad?.nombre})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Consultorio Asignado *</label>
              <select
                required
                value={newFormData.consultorio_id}
                onChange={(e) => setNewFormData({ ...newFormData, consultorio_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
              >
                <option value="">Seleccione consultorio...</option>
                {consultingRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.codigo_sala} - {r.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha *</label>
              <input
                type="date"
                required
                value={newFormData.fecha}
                onChange={(e) => setNewFormData({ ...newFormData, fecha: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hora Inicio *</label>
              <input
                type="time"
                required
                value={newFormData.hora}
                onChange={(e) => setNewFormData({ ...newFormData, hora: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Duración (Min)</label>
              <select
                value={newFormData.duracion_minutos}
                onChange={(e) => setNewFormData({ ...newFormData, duracion_minutos: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
              >
                <option value="15">15 Minutos</option>
                <option value="30">30 Minutos</option>
                <option value="45">45 Minutos</option>
                <option value="60">60 Minutos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tipo de Recordatorio</label>
            <select
              value={newFormData.tipo_recordatorio}
              onChange={(e) => setNewFormData({ ...newFormData, tipo_recordatorio: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
            >
              <option value="email">Correo Electrónico</option>
              <option value="whatsapp">Mensaje WhatsApp</option>
              <option value="ninguno">Sin Recordatorio</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Validando disponibilidad...' : 'Confirmar Cita'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: REAGENDAR CITA */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reagendar Fecha de Cita"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nueva Fecha</label>
              <input
                type="date"
                required
                value={rescheduleData.fecha}
                onChange={(e) => setRescheduleData({ ...rescheduleData, fecha: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nueva Hora</label>
              <input
                type="time"
                required
                value={rescheduleData.hora}
                onChange={(e) => setRescheduleData({ ...rescheduleData, hora: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Consultorio</label>
            <select
              value={rescheduleData.consultorio_id}
              onChange={(e) => setRescheduleData({ ...rescheduleData, consultorio_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            >
              {consultingRooms.map(r => (
                <option key={r.id} value={r.id}>{r.codigo_sala} - {r.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRescheduleModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
            >
              {submitting ? 'Guardando...' : 'Reagendar Cita'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CAMBIAR ESTADO */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Actualizar Estado de la Cita"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Estado de Cita *</label>
            <select
              value={statusData.estado}
              onChange={(e) => setStatusData({ ...statusData, estado: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
            >
              <option value="programada">Programada</option>
              <option value="confirmada">Confirmada</option>
              <option value="en_curso">En Curso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
              <option value="no_asistio">No Asistió</option>
            </select>
          </div>

          {statusData.estado === 'cancelada' && (
            <div>
              <label className="block font-bold text-rose-700 mb-1">Motivo de Cancelación *</label>
              <textarea
                required
                rows={3}
                value={statusData.motivo_cancelacion}
                onChange={(e) => setStatusData({ ...statusData, motivo_cancelacion: e.target.value })}
                placeholder="Escriba la razón de cancelación de la cita..."
                className="w-full px-3 py-2 border border-rose-200 rounded-xl focus:border-rose-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md"
            >
              Actualizar Estado
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
