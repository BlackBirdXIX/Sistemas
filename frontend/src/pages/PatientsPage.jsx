import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatDateMX, calculateAge } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  FileText, 
  Phone, 
  Mail, 
  ShieldAlert,
  AlertCircle
} from 'lucide-react';

export const PatientsPage = () => {
  const { isDoctor, isReceptionist } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    curp: '',
    nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    fecha_nacimiento: '',
    genero: 'Masculino',
    telefono: '',
    email: '',
    direccion: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    contacto_emergencia_parentesco: ''
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchPatients = async (query = '') => {
    try {
      setLoading(true);
      const res = await api.get('/patients', { params: { q: query } });
      setPatients(res.data);
    } catch (err) {
      console.error('Error al obtener pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(searchTerm);
  }, [searchTerm]);

  const handleOpenModal = (patient = null) => {
    setFormError('');
    if (patient) {
      setEditingPatient(patient);
      setFormData({
        curp: patient.curp,
        nombre: patient.nombre,
        primer_apellido: patient.primer_apellido,
        segundo_apellido: patient.segundo_apellido || '',
        fecha_nacimiento: patient.fecha_nacimiento,
        genero: patient.genero,
        telefono: patient.telefono,
        email: patient.email || '',
        direccion: patient.direccion || '',
        contacto_emergencia_nombre: patient.contacto_emergencia_nombre || '',
        contacto_emergencia_telefono: patient.contacto_emergencia_telefono || '',
        contacto_emergencia_parentesco: patient.contacto_emergencia_parentesco || ''
      });
    } else {
      setEditingPatient(null);
      setFormData({
        curp: '',
        nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
        fecha_nacimiento: '',
        genero: 'Masculino',
        telefono: '',
        email: '',
        direccion: '',
        contacto_emergencia_nombre: '',
        contacto_emergencia_telefono: '',
        contacto_emergencia_parentesco: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (editingPatient) {
        await api.put(`/patients/${editingPatient.id}`, formData);
      } else {
        await api.post('/patients', formData);
      }
      setIsModalOpen(false);
      fetchPatients(searchTerm);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al guardar los datos del paciente.';
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar (borrado lógico) a este paciente?')) return;
    try {
      await api.delete(`/patients/${id}`);
      fetchPatients(searchTerm);
    } catch (err) {
      alert('Error al eliminar paciente.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" /> Catálogo de Pacientes
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Búsqueda, alta y actualización de expediente administrativo e historial de contacto.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/25 transition-all flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Nuevo Paciente
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por Nombre, CURP o Teléfono..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-xs placeholder:text-slate-400"
        />
      </div>

      {/* Tabla de Pacientes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Cargando pacientes...</div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600 text-sm">No se encontraron pacientes.</p>
            <p className="text-xs text-slate-400">Intente modificar los términos de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-4">Paciente / CURP</th>
                  <th className="py-3.5 px-4">Edad / Género</th>
                  <th className="py-3.5 px-4">Contacto</th>
                  <th className="py-3.5 px-4">Contacto Emergencia</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{p.nombre} {p.primer_apellido} {p.segundo_apellido || ''}</div>
                      <div className="text-[11px] font-mono text-teal-700 font-semibold">{p.curp}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold">{calculateAge(p.fecha_nacimiento)} años</div>
                      <div className="text-[11px] text-slate-400">{formatDateMX(p.fecha_nacimiento)} ({p.genero})</div>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {p.telefono}
                      </div>
                      {p.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {p.email}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.contacto_emergencia_nombre ? (
                        <div>
                          <div className="font-semibold">{p.contacto_emergencia_nombre}</div>
                          <div className="text-[11px] text-slate-400">{p.contacto_emergencia_telefono} ({p.contacto_emergencia_parentesco})</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ver Expediente Clínico */}
                        {!isReceptionist ? (
                          <button
                            onClick={() => navigate(`/expedientes?paciente_id=${p.id}`)}
                            title="Ver Expediente Clínico"
                            className="p-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="hidden md:inline">Expediente</span>
                          </button>
                        ) : (
                          <span className="p-1.5 text-slate-300 cursor-not-allowed" title="Recepcionistas no acceden a expediente médico (NOM-004)">
                            <FileText className="w-4 h-4" />
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenModal(p)}
                          title="Editar Datos"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          title="Eliminar Paciente"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Crear/Editar Paciente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPatient ? 'Editar Paciente' : 'Registrar Nuevo Paciente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">CURP *</label>
              <input
                type="text"
                required
                maxLength={18}
                value={formData.curp}
                onChange={(e) => setFormData({ ...formData, curp: e.target.value.toUpperCase() })}
                placeholder="PESJ850315HDFRNN01"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-mono focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre(s) *</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Juan Manuel"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Primer Apellido *</label>
              <input
                type="text"
                required
                value={formData.primer_apellido}
                onChange={(e) => setFormData({ ...formData, primer_apellido: e.target.value })}
                placeholder="Pérez"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Segundo Apellido</label>
              <input
                type="text"
                value={formData.segundo_apellido}
                onChange={(e) => setFormData({ ...formData, segundo_apellido: e.target.value })}
                placeholder="Sánchez"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha de Nacimiento *</label>
              <input
                type="date"
                required
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Género *</label>
              <select
                value={formData.genero}
                onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Teléfono *</label>
              <input
                type="text"
                required
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="5551234567"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="paciente@correo.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Dirección Completa</label>
            <textarea
              rows={2}
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Calle, Número, Colonia, Alcaldía/Municipio, Estado, C.P."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 mb-2">Contacto de Emergencia</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.contacto_emergencia_nombre}
                  onChange={(e) => setFormData({ ...formData, contacto_emergencia_nombre: e.target.value })}
                  placeholder="Familiar de Contacto"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formData.contacto_emergencia_telefono}
                  onChange={(e) => setFormData({ ...formData, contacto_emergencia_telefono: e.target.value })}
                  placeholder="5550000000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Parentesco</label>
                <input
                  type="text"
                  value={formData.contacto_emergencia_parentesco}
                  onChange={(e) => setFormData({ ...formData, contacto_emergencia_parentesco: e.target.value })}
                  placeholder="Esposo(a), Madre, Hijo"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl font-semibold text-slate-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
            >
              {formSubmitting ? 'Guardando...' : 'Guardar Paciente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
