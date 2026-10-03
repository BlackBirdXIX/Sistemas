import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { formatDateMX, formatDateTimeMX, calculateAge } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Search, 
  PlusCircle, 
  Printer, 
  Stethoscope, 
  AlertTriangle, 
  Activity, 
  ShieldAlert, 
  Heart, 
  Thermometer, 
  Scale, 
  Ruler, 
  Check, 
  Plus, 
  Trash2,
  Lock
} from 'lucide-react';

export const ClinicalRecordPage = () => {
  const { isReceptionist, user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('paciente_id');

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '');
  const [record, setRecord] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal Antecedentes
  const [isAntecedentsModalOpen, setIsAntecedentsModalOpen] = useState(false);
  const [antecedentsForm, setAntecedentsForm] = useState({
    antecedentes_heredofamiliares: '',
    antecedentes_patologicos: '',
    antecedentes_no_patologicos: '',
    alergias: '',
    grupo_sanguineo: 'O+'
  });

  // Modal Nueva Consulta
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultForm, setConsultForm] = useState({
    motivo_consulta: '',
    exploracion_fisica: '',
    peso_kg: '',
    talla_cm: '',
    presion_arterial: '',
    frecuencia_cardiaca: '',
    temperatura_c: '',
    saturacion_oxigeno: '',
    plan_tratamiento: '',
    notas_evolucion: ''
  });

  // Diagnósticos CIE-10 dinámicos
  const [diagnoses, setDiagnoses] = useState([
    { codigo_cie10: 'I10', descripcion: 'Hipertensión Esencial (Primaria)', tipo: 'definitivo' }
  ]);

  // Receta Médica en la consulta
  const [includePrescription, setIncludePrescription] = useState(true);
  const [prescriptionForm, setPrescriptionForm] = useState({
    indicaciones_generales: 'Tomar los medicamentos indicados según los horarios establecidos.'
  });
  const [medications, setMedications] = useState([
    { medicamento: 'Paracetamol 500 mg', dosis: '1 tableta', frecuencia: 'Cada 8 horas', duracion_dias: 5, via_administracion: 'Oral' }
  ]);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data);
      if (!selectedPatientId && res.data.length > 0) {
        setSelectedPatientId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error al obtener pacientes:', err);
    }
  };

  const fetchRecordData = async (patientId) => {
    if (!patientId) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const [recRes, timeRes] = await Promise.all([
        api.get(`/medical-records/patient/${patientId}`),
        api.get(`/medical-records/patient/${patientId}/timeline`)
      ]);
      setRecord(recRes.data);
      setTimeline(timeRes.data);
      setAntecedentsForm({
        antecedentes_heredofamiliares: recRes.data.antecedentes_heredofamiliares || '',
        antecedentes_patologicos: recRes.data.antecedentes_patologicos || '',
        antecedentes_no_patologicos: recRes.data.antecedentes_no_patologicos || '',
        alergias: recRes.data.alergias || '',
        grupo_sanguineo: recRes.data.grupo_sanguineo || 'O+'
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'No tiene permisos para acceder a este expediente o no existe.');
      setRecord(null);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchRecordData(selectedPatientId);
    }
  }, [selectedPatientId]);

  // Si es Recepcionista, se muestra tarjeta de bloqueo normativo NOM-004
  if (isReceptionist) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center max-w-2xl mx-auto space-y-4 my-12 animate-in fade-in">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto font-bold">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Acceso Restringido por Norma Oficial Mexicana</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          De acuerdo con la <b>NOM-004-SSA3-2012 (Del Expediente Clínico)</b> y la <b>NOM-024-SSA3-2012</b>, el personal con rol de <b>Recepcionista</b> únicamente gestiona agendas y datos administrativos de contacto, sin acceso a diagnósticos, exploración física o notas de evolución clínica.
        </p>
        <div className="p-3 bg-slate-50 rounded-2xl text-[11px] font-semibold text-slate-600 inline-block">
          Consulte al médico responsable si requiere información del estado de cita del paciente.
        </div>
      </div>
    );
  }

  const handleUpdateAntecedents = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/medical-records/${record.id}`, antecedentsForm);
      setIsAntecedentsModalOpen(false);
      fetchRecordData(selectedPatientId);
    } catch (err) {
      alert('Error al actualizar antecedentes.');
    }
  };

  const handleAddDiagnosis = () => {
    setDiagnoses([...diagnoses, { codigo_cie10: '', descripcion: '', tipo: 'definitivo' }]);
  };

  const handleRemoveDiagnosis = (idx) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== idx));
  };

  const handleAddMedication = () => {
    setMedications([...medications, { medicamento: '', dosis: '', frecuencia: '', duracion_dias: 7, via_administracion: 'Oral' }]);
  };

  const handleRemoveMedication = (idx) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const handleCreateConsultation = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        expediente_id: record.id,
        motivo_consulta: consultForm.motivo_consulta,
        exploracion_fisica: consultForm.exploracion_fisica,
        peso_kg: consultForm.peso_kg ? parseFloat(consultForm.peso_kg) : null,
        talla_cm: consultForm.talla_cm ? parseFloat(consultForm.talla_cm) : null,
        presion_arterial: consultForm.presion_arterial || null,
        frecuencia_cardiaca: consultForm.frecuencia_cardiaca ? parseInt(consultForm.frecuencia_cardiaca) : null,
        temperatura_c: consultForm.temperatura_c ? parseFloat(consultForm.temperatura_c) : null,
        saturacion_oxigeno: consultForm.saturacion_oxigeno ? parseInt(consultForm.saturacion_oxigeno) : null,
        plan_tratamiento: consultForm.plan_tratamiento,
        notas_evolucion: consultForm.notas_evolucion,
        diagnosticos: diagnoses.filter(d => d.codigo_cie10 && d.descripcion),
        receta: includePrescription ? {
          indicaciones_generales: prescriptionForm.indicaciones_generales,
          medicamentos: medications.filter(m => m.medicamento && m.dosis)
        } : null
      };

      await api.post('/consultations', payload);
      setIsConsultModalOpen(false);
      fetchRecordData(selectedPatientId);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al registrar la consulta.');
    }
  };

  const currentPatient = record?.paciente;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Selector de Paciente y Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" /> Expediente Clínico Electrónico
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            NOM-004-SSA3-2012 / NOM-024-SSA3-2012 Compliant. Registro cronológico inmutable.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none w-full sm:w-64"
          >
            <option value="">Seleccione Paciente...</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.primer_apellido} ({p.curp})
              </option>
            ))}
          </select>

          {record && (
            <button
              onClick={() => setIsConsultModalOpen(true)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/25 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" /> Nueva Consulta
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" /> {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">Cargando expediente del paciente...</div>
      ) : record ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Ficha de Identificación y Antecedentes */}
          <div className="space-y-6">
            {/* Ficha Identificación */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ficha de Identificación</span>
                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 font-mono font-bold text-[10px] rounded-md">
                  {record.numero_expediente}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <h3 className="text-base font-extrabold text-slate-900">
                  {currentPatient?.nombre} {currentPatient?.primer_apellido} {currentPatient?.segundo_apellido || ''}
                </h3>
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="font-bold">{calculateAge(currentPatient?.fecha_nacimiento)} años</span>
                  <span>•</span>
                  <span>{currentPatient?.genero}</span>
                  <span>•</span>
                  <span className="font-semibold text-rose-600">O+</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">CURP: {currentPatient?.curp}</div>
                <div className="text-[11px] text-slate-500">Tel: {currentPatient?.telefono}</div>
              </div>
            </div>

            {/* Antecedentes NOM-004 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Antecedentes Clínicos</span>
                <button
                  onClick={() => setIsAntecedentsModalOpen(true)}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
                >
                  Editar
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl">
                  <span className="font-bold text-amber-900 block mb-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Alergias Conocidas:
                  </span>
                  <p className="text-amber-800 font-medium">{record.alergias || 'Sin alergias registradas.'}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-0.5">Antecedentes Heredofamiliares:</span>
                  <p className="text-slate-600">{record.antecedentes_heredofamiliares || 'No especificados.'}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-0.5">Antecedentes Personales Patológicos:</span>
                  <p className="text-slate-600">{record.antecedentes_patologicos || 'No especificados.'}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-0.5">Antecedentes No Patológicos:</span>
                  <p className="text-slate-600">{record.antecedentes_no_patologicos || 'No especificados.'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Timeline Histórico de Consultas (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" /> Historial de Consultas y Notas de Evolución
              </h3>

              {timeline.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600 text-sm">Aún no hay consultas registradas en el expediente.</p>
                  <p className="text-xs text-slate-400 mt-1">Haga clic en 'Nueva Consulta' para registrar la atención médica.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {timeline.map((c) => (
                    <div key={c.id} className="p-5 bg-slate-50/60 border border-slate-200/80 rounded-2xl space-y-4">
                      {/* Cabecera Consulta */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                        <div>
                          <span className="text-xs font-bold text-teal-700">{formatDateTimeMX(c.fecha_hora)}</span>
                          <span className="text-xs text-slate-500 block">
                            Atendido por: Dr. {c.medico?.usuario?.nombre} {c.medico?.usuario?.primer_apellido} ({c.medico?.especialidad?.nombre})
                          </span>
                        </div>

                        {c.receta && (
                          <a
                            href={`/api/v1/prescriptions/${c.receta.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5" /> Descargar Receta PDF
                          </a>
                        )}
                      </div>

                      {/* Motivo y Exploración */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-bold text-slate-700 block mb-1">Motivo de Consulta:</span>
                          <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">{c.motivo_consulta}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700 block mb-1">Exploración Física:</span>
                          <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">{c.exploracion_fisica || 'Sin hallazgos reportados.'}</p>
                        </div>
                      </div>

                      {/* Signos Vitales */}
                      {(c.presion_arterial || c.peso_kg || c.temperatura_c) && (
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          {c.presion_arterial && <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1"><Heart className="w-3 h-3 text-rose-500" /> T/A: {c.presion_arterial}</span>}
                          {c.peso_kg && <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1"><Scale className="w-3 h-3 text-teal-600" /> Peso: {c.peso_kg} kg</span>}
                          {c.temperatura_c && <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1"><Thermometer className="w-3 h-3 text-amber-500" /> Temp: {c.temperatura_c} °C</span>}
                          {c.frecuencia_cardiaca && <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg">FC: {c.frecuencia_cardiaca} bpm</span>}
                        </div>
                      )}

                      {/* Diagnósticos CIE-10 */}
                      {c.diagnosticos && c.diagnosticos.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-700 text-xs block mb-1.5">Diagnósticos (CIE-10):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {c.diagnosticos.map(d => (
                              <span key={d.id} className="px-2.5 py-1 bg-teal-50 text-teal-800 font-medium text-xs rounded-lg border border-teal-200">
                                <b>[{d.codigo_cie10}]</b> {d.descripcion} ({d.tipo})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Medicamentos Prescritos */}
                      {c.receta?.medicamentos && (
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-xs">
                          <span className="font-bold text-slate-800 block mb-2 text-teal-700">Prescripción Médica (Folio {c.receta.codigo_folio}):</span>
                          <ul className="space-y-1 text-slate-700 font-medium">
                            {c.receta.medicamentos.map(m => (
                              <li key={m.id} className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <span><b>{m.medicamento}</b> - {m.dosis} | {m.frecuencia} por {m.duracion_dias} días ({m.via_administracion})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl">
          Seleccione un paciente para ver su expediente clínico.
        </div>
      )}

      {/* MODAL EDITAR ANTECEDENTES */}
      <Modal
        isOpen={isAntecedentsModalOpen}
        onClose={() => setIsAntecedentsModalOpen(false)}
        title="Actualizar Antecedentes Clínicos (NOM-004)"
      >
        <form onSubmit={handleUpdateAntecedents} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Grupo Sanguíneo</label>
            <select
              value={antecedentsForm.grupo_sanguineo}
              onChange={(e) => setAntecedentsForm({ ...antecedentsForm, grupo_sanguineo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            >
              <option value="O+">O Positivo (O+)</option>
              <option value="O-">O Negativo (O-)</option>
              <option value="A+">A Positivo (A+)</option>
              <option value="A-">A Negativo (A-)</option>
              <option value="B+">B Positivo (B+)</option>
              <option value="B-">B Negativo (B-)</option>
              <option value="AB+">AB Positivo (AB+)</option>
              <option value="AB-">AB Negativo (AB-)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alergias Conocidas</label>
            <textarea
              rows={2}
              value={antecedentsForm.alergias}
              onChange={(e) => setAntecedentsForm({ ...antecedentsForm, alergias: e.target.value })}
              placeholder="Medicamentos, alimentos o sustancias..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Antecedentes Heredofamiliares</label>
            <textarea
              rows={2}
              value={antecedentsForm.antecedentes_heredofamiliares}
              onChange={(e) => setAntecedentsForm({ ...antecedentsForm, antecedentes_heredofamiliares: e.target.value })}
              placeholder="Diabetes, hipertensión, cardiopatías en familiares de primer grado..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Antecedentes Personales Patológicos</label>
            <textarea
              rows={2}
              value={antecedentsForm.antecedentes_patologicos}
              onChange={(e) => setAntecedentsForm({ ...antecedentsForm, antecedentes_patologicos: e.target.value })}
              placeholder="Cirugías, fracturas, enfermedades crónicas, transfusiones..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Antecedentes Personales No Patológicos</label>
            <textarea
              rows={2}
              value={antecedentsForm.antecedentes_no_patologicos}
              onChange={(e) => setAntecedentsForm({ ...antecedentsForm, antecedentes_no_patologicos: e.target.value })}
              placeholder="Tabaquismo, etilismo, actividad física, alimentación..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAntecedentsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md"
            >
              Guardar Antecedentes
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL REGISTRAR NUEVA CONSULTA MÉDICA */}
      <Modal
        isOpen={isConsultModalOpen}
        onClose={() => setIsConsultModalOpen(false)}
        title="Registrar Consulta Médica y Diagnóstico CIE-10"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreateConsultation} className="space-y-4 text-xs">
          {/* Motivo y Exploración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Motivo de Consulta *</label>
              <textarea
                required
                rows={3}
                value={consultForm.motivo_consulta}
                onChange={(e) => setConsultForm({ ...consultForm, motivo_consulta: e.target.value })}
                placeholder="Síntomas que refiere el paciente..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Exploración Física</label>
              <textarea
                rows={3}
                value={consultForm.exploracion_fisica}
                onChange={(e) => setConsultForm({ ...consultForm, exploracion_fisica: e.target.value })}
                placeholder="Inspección, palpación, auscultación..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Signos Vitales */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="font-bold text-slate-800 block">Signos Vitales</span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={consultForm.peso_kg}
                  onChange={(e) => setConsultForm({ ...consultForm, peso_kg: e.target.value })}
                  placeholder="70.5"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Talla (cm)</label>
                <input
                  type="number"
                  step="1"
                  value={consultForm.talla_cm}
                  onChange={(e) => setConsultForm({ ...consultForm, talla_cm: e.target.value })}
                  placeholder="170"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Presión T/A</label>
                <input
                  type="text"
                  value={consultForm.presion_arterial}
                  onChange={(e) => setConsultForm({ ...consultForm, presion_arterial: e.target.value })}
                  placeholder="120/80"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">FC (bpm)</label>
                <input
                  type="number"
                  value={consultForm.frecuencia_cardiaca}
                  onChange={(e) => setConsultForm({ ...consultForm, frecuencia_cardiaca: e.target.value })}
                  placeholder="75"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={consultForm.temperatura_c}
                  onChange={(e) => setConsultForm({ ...consultForm, temperatura_c: e.target.value })}
                  placeholder="36.5"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Sat O2 (%)</label>
                <input
                  type="number"
                  value={consultForm.saturacion_oxigeno}
                  onChange={(e) => setConsultForm({ ...consultForm, saturacion_oxigeno: e.target.value })}
                  placeholder="98"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Diagnósticos CIE-10 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Diagnósticos (Catálogo CIE-10)</span>
              <button
                type="button"
                onClick={handleAddDiagnosis}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Diagnóstico
              </button>
            </div>

            {diagnoses.map((d, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl">
                <input
                  type="text"
                  required
                  placeholder="CIE-10 (ej. I10, E11.9)"
                  value={d.codigo_cie10}
                  onChange={(e) => {
                    const newD = [...diagnoses];
                    newD[idx].codigo_cie10 = e.target.value.toUpperCase();
                    setDiagnoses(newD);
                  }}
                  className="w-28 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                />
                <input
                  type="text"
                  required
                  placeholder="Descripción del Diagnóstico"
                  value={d.descripcion}
                  onChange={(e) => {
                    const newD = [...diagnoses];
                    newD[idx].descripcion = e.target.value;
                    setDiagnoses(newD);
                  }}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
                <select
                  value={d.tipo}
                  onChange={(e) => {
                    const newD = [...diagnoses];
                    newD[idx].tipo = e.target.value;
                    setDiagnoses(newD);
                  }}
                  className="w-28 px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium"
                >
                  <option value="definitivo">Definitivo</option>
                  <option value="presuntivo">Presuntivo</option>
                </select>
                {diagnoses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDiagnosis(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Formulación de Receta Médica */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePrescription}
                  onChange={(e) => setIncludePrescription(e.target.checked)}
                  className="w-4 h-4 accent-teal-600 rounded"
                />
                <span>Generar Receta Médica en PDF</span>
              </label>

              {includePrescription && (
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Medicamento
                </button>
              )}
            </div>

            {includePrescription && (
              <div className="space-y-2 bg-teal-50/40 p-3 rounded-2xl border border-teal-100">
                {medications.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      required
                      placeholder="Medicamento (ej. Losartán 50mg)"
                      value={m.medicamento}
                      onChange={(e) => {
                        const newM = [...medications];
                        newM[idx].medicamento = e.target.value;
                        setMedications(newM);
                      }}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg font-semibold"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Dosis (ej. 1 tab)"
                      value={m.dosis}
                      onChange={(e) => {
                        const newM = [...medications];
                        newM[idx].dosis = e.target.value;
                        setMedications(newM);
                      }}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Frecuencia (ej. C/24 hrs)"
                      value={m.frecuencia}
                      onChange={(e) => {
                        const newM = [...medications];
                        newM[idx].frecuencia = e.target.value;
                        setMedications(newM);
                      }}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      required
                      placeholder="Días (ej. 30)"
                      value={m.duracion_dias}
                      onChange={(e) => {
                        const newM = [...medications];
                        newM[idx].duracion_dias = parseInt(e.target.value);
                        setMedications(newM);
                      }}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg"
                    />
                    <div className="flex items-center gap-1">
                      <select
                        value={m.via_administracion}
                        onChange={(e) => {
                          const newM = [...medications];
                          newM[idx].via_administracion = e.target.value;
                          setMedications(newM);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg"
                      >
                        <option value="Oral">Oral</option>
                        <option value="Tópica">Tópica</option>
                        <option value="Intramuscular">Intramuscular</option>
                        <option value="Intravenosa">Intravenosa</option>
                        <option value="Oftálmica">Oftálmica</option>
                      </select>
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsConsultModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md"
            >
              Guardar Consulta y Emitir Receta
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
