import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Modal } from '../components/common/Modal';
import { 
  Stethoscope, 
  Building, 
  Clock, 
  Plus, 
  UserCheck, 
  Award, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export const DoctorsPage = () => {
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors', 'specialties', 'rooms'

  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Forms
  const [docForm, setDocForm] = useState({
    usuario_id: '',
    cedula_profesional: '',
    especialidad_id: '',
    consultorio_id: '',
    duracion_consulta_min: 30
  });

  const [specForm, setSpecForm] = useState({ nombre: '', descripcion: '' });
  const [roomForm, setRoomForm] = useState({ codigo_sala: '', nombre: '', ubicacion_piso: '' });

  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dRes, sRes, rRes, uRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/specialties'),
        api.get('/consulting-rooms'),
        api.get('/users')
      ]);
      setDoctors(dRes.data);
      setSpecialties(sRes.data);
      setRooms(rRes.data);
      setUsers(uRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/doctors', {
        ...docForm,
        usuario_id: parseInt(docForm.usuario_id),
        especialidad_id: parseInt(docForm.especialidad_id),
        consultorio_id: docForm.consultorio_id ? parseInt(docForm.consultorio_id) : null,
        duracion_consulta_min: parseInt(docForm.duracion_consulta_min)
      });
      setIsDoctorModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Error al crear perfil de médico.');
    }
  };

  const handleCreateSpecialty = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/specialties', specForm);
      setIsSpecModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Error al crear especialidad.');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/consulting-rooms', roomForm);
      setIsRoomModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Error al crear consultorio.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Encabezado y Tabs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-600" /> Administración de Médicos & Especialidades
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gestión de cédulas profesionales, consultorios asignados y horarios de atención.
          </p>
        </div>

        <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'doctors' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Médicos
          </button>
          <button
            onClick={() => setActiveTab('specialties')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'specialties' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Especialidades
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'rooms' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Consultorios
          </button>
        </div>
      </div>

      {/* TAB 1: MÉDICOS */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setErrorMsg('');
                setDocForm({
                  usuario_id: users.find(u => u.rol?.nombre === 'Médico')?.id || '',
                  cedula_profesional: '',
                  especialidad_id: specialties[0]?.id || '',
                  consultorio_id: rooms[0]?.id || '',
                  duracion_consulta_min: 30
                });
                setIsDoctorModalOpen(true);
              }}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Asignar Perfil de Médico
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {doctors.map(d => (
              <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-lg">
                    Dr
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Dr(a). {d.usuario?.nombre} {d.usuario?.primer_apellido}
                    </h3>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-md">
                      {d.especialidad?.nombre}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-400" /> Cédula: <b>{d.cedula_profesional}</b>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" /> Consultorio: <b>{d.consultorio?.codigo_sala} ({d.consultorio?.nombre})</b>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> Duración Consulta: <b>{d.duracion_consulta_min} Minutos</b>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ESPECIALIDADES */}
      {activeTab === 'specialties' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setErrorMsg(''); setSpecForm({ nombre: '', descripcion: '' }); setIsSpecModalOpen(true); }}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nueva Especialidad
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {specialties.map(s => (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                <h3 className="font-extrabold text-slate-900 text-sm">{s.nombre}</h3>
                <p className="text-xs text-slate-500">{s.descripcion || 'Sin descripción.'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CONSULTORIOS */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setErrorMsg(''); setRoomForm({ codigo_sala: '', nombre: '', ubicacion_piso: '' }); setIsRoomModalOpen(true); }}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nuevo Consultorio
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {rooms.map(r => (
              <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold font-mono rounded-md">
                  {r.codigo_sala}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm">{r.nombre}</h3>
                <p className="text-xs text-slate-500">{r.ubicacion_piso || 'Ubicación general.'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL CREAR MÉDICO */}
      <Modal isOpen={isDoctorModalOpen} onClose={() => setIsDoctorModalOpen(false)} title="Asignar Perfil de Médico">
        <form onSubmit={handleCreateDoctor} className="space-y-3 text-xs">
          {errorMsg && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl font-semibold">{errorMsg}</div>}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Usuario Registrado *</label>
            <select
              value={docForm.usuario_id}
              onChange={(e) => setDocForm({ ...docForm, usuario_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.primer_apellido} ({u.email}) - {u.rol?.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Cédula Profesional *</label>
            <input
              type="text"
              required
              value={docForm.cedula_profesional}
              onChange={(e) => setDocForm({ ...docForm, cedula_profesional: e.target.value })}
              placeholder="MED-12345678"
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Especialidad *</label>
            <select
              value={docForm.especialidad_id}
              onChange={(e) => setDocForm({ ...docForm, especialidad_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl"
            >
              {specialties.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Consultorio Asignado</label>
            <select
              value={docForm.consultorio_id}
              onChange={(e) => setDocForm({ ...docForm, consultorio_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl"
            >
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.codigo_sala} - {r.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setIsDoctorModalOpen(false)} className="px-4 py-2 border rounded-xl font-semibold">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl">Guardar Médico</button>
          </div>
        </form>
      </Modal>

      {/* MODAL CREAR ESPECIALIDAD */}
      <Modal isOpen={isSpecModalOpen} onClose={() => setIsSpecModalOpen(false)} title="Nueva Especialidad Médica">
        <form onSubmit={handleCreateSpecialty} className="space-y-3 text-xs">
          {errorMsg && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl font-semibold">{errorMsg}</div>}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre de la Especialidad *</label>
            <input
              type="text"
              required
              value={specForm.nombre}
              onChange={(e) => setSpecForm({ ...specForm, nombre: e.target.value })}
              placeholder="Dermatología"
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Descripción</label>
            <textarea
              rows={2}
              value={specForm.descripcion}
              onChange={(e) => setSpecForm({ ...specForm, descripcion: e.target.value })}
              placeholder="Descripción opcional..."
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setIsSpecModalOpen(false)} className="px-4 py-2 border rounded-xl font-semibold">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* MODAL CREAR CONSULTORIO */}
      <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title="Nuevo Consultorio">
        <form onSubmit={handleCreateRoom} className="space-y-3 text-xs">
          {errorMsg && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl font-semibold">{errorMsg}</div>}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Código de Sala *</label>
            <input
              type="text"
              required
              value={roomForm.codigo_sala}
              onChange={(e) => setRoomForm({ ...roomForm, codigo_sala: e.target.value })}
              placeholder="CONS-301"
              className="w-full px-3 py-2 border rounded-xl font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre del Consultorio *</label>
            <input
              type="text"
              required
              value={roomForm.nombre}
              onChange={(e) => setRoomForm({ ...roomForm, nombre: e.target.value })}
              placeholder="Consultorio de Dermatología"
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ubicación / Piso</label>
            <input
              type="text"
              value={roomForm.ubicacion_piso}
              onChange={(e) => setRoomForm({ ...roomForm, ubicacion_piso: e.target.value })}
              placeholder="Piso 3 - Torre B"
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setIsRoomModalOpen(false)} className="px-4 py-2 border rounded-xl font-semibold">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl">Guardar Consultorio</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
