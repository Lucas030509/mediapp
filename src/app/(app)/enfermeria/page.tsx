"use client"

import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, User, Search, Stethoscope, Heart, Info, Clock, CheckCircle2, AlertTriangle, Building, MapPin, ClipboardList, Weight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function TriagePage() {
    const supabase = createClient();
    const [patients, setPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // UI State
    const [activeTab, setActiveTab] = useState<'TRIAGE' | 'ROOMS'>('TRIAGE');
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    
    // Triage Form
    const [vitals, setVitals] = useState({
        blood_pressure: '', heart_rate: '', temperature: '', respiratory_rate: '',
        oxygen_saturation: '', weight: '', height: '', glucose: '', nurse_notes: '', triage_color: 'GREEN'
    });

    // Room Assignment Form
    const [assignForm, setAssignForm] = useState({ doctor_id: '', room_name: '', notes: 'Turno Actual' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Load Patients (For triage queue)
        const { data: pData } = await supabase.from('patients').select('id, first_name, last_name, status, photo_url').order('first_name');
        if (pData) setPatients(pData);

        // Load Doctors & Rooms
        const { data: dData } = await supabase.from('doctors').select('id, first_name, last_name, specialty, current_room');
        if (dData) setDoctors(dData);

        const { data: rData } = await supabase.from('clinic_rooms').select('*').order('name');
        if (rData) setRooms(rData);

        setLoading(false);
    };

    const handleSaveVitals = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId) {
            toast.error('Selecciona un paciente primero');
            return;
        }

        const parseOrNull = (val: string, type: 'int' | 'float') => {
            if (!val || val.trim() === '') return null;
            const parsed = type === 'int' ? parseInt(val) : parseFloat(val);
            return isNaN(parsed) ? null : parsed;
        };

        const weight = parseOrNull(vitals.weight, 'float');
        const height = parseOrNull(vitals.height, 'float');
        const bmi = (weight && height) ? (weight / Math.pow(height/100, 2)).toFixed(1) : null;

        const payload = {
            patient_id: selectedPatientId,
            blood_pressure: vitals.blood_pressure,
            heart_rate: parseOrNull(vitals.heart_rate, 'int'),
            temperature: parseOrNull(vitals.temperature, 'float'),
            respiratory_rate: parseOrNull(vitals.respiratory_rate, 'int'),
            oxygen_saturation: parseOrNull(vitals.oxygen_saturation, 'int'),
            weight: weight,
            height: height,
            glucose: vitals.glucose,
            bmi: bmi ? parseFloat(bmi) : null,
            nurse_notes: vitals.nurse_notes,
            triage_color: vitals.triage_color
        };

        const { error } = await supabase.from('vital_signs').insert([payload]);
        if (error) {
            console.error("Supabase Error:", error);
            toast.error(`Error guardando: ${error.message} - ¿Ejecutaste el SQL Fase 14 correctamente?`);
        } else {
            toast.success('Evaluación Pre-Clínica guardada exitosamente.');
            setVitals({
                blood_pressure: '', heart_rate: '', temperature: '', respiratory_rate: '',
                oxygen_saturation: '', weight: '', height: '', glucose: '', nurse_notes: '', triage_color: 'GREEN'
            });
            setSelectedPatientId(null);
        }
    };

    const handleAssignRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignForm.doctor_id || !assignForm.room_name) {
            toast.error('Falta seleccionar Médico o Consultorio'); return;
        }

        // Simplificado: Actualizamos el doctor con el cuarto directo, 
        // o creamos un "clinic_rooms" si no existe.
        const { error } = await supabase.from('doctors').update({
            current_room: assignForm.room_name
        }).eq('id', assignForm.doctor_id);

        if (!error) {
            toast.success("Consultorio asignado exitosamente.");
            fetchData();
        } else {
            toast.error("Error al asignar el consultorio.");
        }
    };

    const filteredPatients = patients.filter(p => 
        p.first_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activePatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <Activity className="w-8 h-8 text-rose-500" />
                        Triage y Enfermería
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Somatometría, Signos Vitales y Asignación de Consultorios Físicos.</p>
                </div>
                
                <div className="flex bg-slate-200/50 p-1.5 rounded-2xl shadow-inner">
                    <button onClick={() => setActiveTab('TRIAGE')} className={`px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeTab === 'TRIAGE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Toma de Signos</button>
                    <button onClick={() => setActiveTab('ROOMS')} className={`px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeTab === 'ROOMS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Mapa de Consultorios</button>
                </div>
            </div>

            {activeTab === 'TRIAGE' && (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Lista de Espera */}
                    <div className="w-full lg:w-96 shrink-0 space-y-4">
                        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 sticky top-24">
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                <User className="w-4 h-4 text-rose-400" /> Pacientes en Sala
                            </h3>
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar paciente para evaluar..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 outline-none text-xs font-bold transition"
                                />
                            </div>
                            
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                                {loading ? (
                                    <div className="p-10 text-center animate-pulse text-slate-400 font-bold text-xs"><Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />Cargando sala...</div>
                                ) : filteredPatients.map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => setSelectedPatientId(p.id)}
                                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${selectedPatientId === p.id ? 'border-rose-400 bg-rose-50/50 shadow-md shadow-rose-500/10' : 'border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm shrink-0">
                                            {p.photo_url ? <img src={p.photo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex justify-center items-center font-black text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200">{p.first_name[0]}</div>}
                                        </div>
                                        <div>
                                            <h4 className={`font-black tracking-tight ${selectedPatientId === p.id ? 'text-rose-900' : 'text-slate-700'}`}>{p.first_name} {p.last_name?.split(' ')[0]}</h4>
                                            <span className={`text-[9px] font-bold uppercase ${p.status === 'activo' ? 'text-emerald-500' : 'text-slate-400'}`}>• Paciente Activo</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Formulario de Signos y Triage */}
                    <div className="flex-1">
                        {!activePatient ? (
                            <div className="h-full bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-20 text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <Thermometer className="w-16 h-16 text-slate-300 mb-4 group-hover:scale-110 transition-transform duration-500 group-hover:text-rose-300 relative z-10" />
                                <h3 className="text-xl font-black text-slate-800 relative z-10">Selecciona un Paciente</h3>
                                <p className="text-slate-500 font-medium text-sm mt-2 relative z-10">Escoge a alguien de la sala de espera para iniciar la<br/>Evaluación Pre-Clínica (Somatometría).</p>
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-rose-100 animate-in fade-in slide-in-from-bottom-8">
                                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 shadow-lg shadow-rose-500/30 flex items-center justify-center border-4 border-white text-white font-black text-2xl">
                                        {activePatient.first_name[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{activePatient.first_name} {activePatient.last_name}</h2>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-widest border border-slate-200 flex items-center gap-1"><ClipboardList className="w-3 h-3" /> Evaluación en Curso</span>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSaveVitals} className="space-y-8">
                                    
                                    {/* Categorización TRIAGE (Opcional Médico) */}
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                        <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" /> Código Triage</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 ${vitals.triage_color === 'GREEN' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                                                <input type="radio" className="hidden" name="triage" checked={vitals.triage_color === 'GREEN'} onChange={() => setVitals({...vitals, triage_color: 'GREEN'})} />
                                                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50"></div>
                                                <span className="font-black text-emerald-900 text-sm">Verde / Rutina</span>
                                            </label>
                                            <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 ${vitals.triage_color === 'YELLOW' ? 'border-amber-500 bg-amber-50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                                                <input type="radio" className="hidden" name="triage" checked={vitals.triage_color === 'YELLOW'} onChange={() => setVitals({...vitals, triage_color: 'YELLOW'})} />
                                                <div className="w-4 h-4 rounded-full bg-amber-500 shadow-md shadow-amber-500/50"></div>
                                                <span className="font-black text-amber-900 text-sm">Amarillo / Urgencia Menor</span>
                                            </label>
                                            <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 ${vitals.triage_color === 'RED' ? 'border-rose-500 bg-rose-50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                                                <input type="radio" className="hidden" name="triage" checked={vitals.triage_color === 'RED'} onChange={() => setVitals({...vitals, triage_color: 'RED'})} />
                                                <div className="w-4 h-4 rounded-full bg-rose-500 shadow-md shadow-rose-500/50 animate-pulse"></div>
                                                <span className="font-black text-rose-900 text-sm">Rojo / Emergencia Real</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-black text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Heart className="w-4 h-4 text-rose-500" /> Signos Vitales (Somatometría)</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">P. Arterial (mmHg)</label>
                                                <input value={vitals.blood_pressure} onChange={e => setVitals({...vitals, blood_pressure: e.target.value})} type="text" placeholder="120/80" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-rose-400 outline-none font-black text-slate-700 text-center transition" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Frec. Cardíaca (lpm)</label>
                                                <input value={vitals.heart_rate} onChange={e => setVitals({...vitals, heart_rate: e.target.value})} type="number" placeholder="75" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-rose-400 outline-none font-black text-slate-700 text-center transition" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Temperatura (°C)</label>
                                                <input value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: e.target.value})} type="number" step="0.1" placeholder="36.5" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-rose-400 outline-none font-black text-slate-700 text-center transition" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Oxigenación (%)</label>
                                                <input value={vitals.oxygen_saturation} onChange={e => setVitals({...vitals, oxygen_saturation: e.target.value})} type="number" placeholder="98" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-rose-400 outline-none font-black text-slate-700 text-center transition" />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Peso (kg)</label>
                                                <input value={vitals.weight} onChange={e => setVitals({...vitals, weight: e.target.value})} type="number" step="0.1" placeholder="70.5" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-rose-400 outline-none font-black text-slate-700 text-center transition" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Talla (cm)</label>
                                                <input value={vitals.height} onChange={e => setVitals({...vitals, height: e.target.value})} type="number" step="0.1" placeholder="175" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-rose-400 outline-none font-black text-slate-700 text-center transition" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Frec. Respiratoria</label>
                                                <input value={vitals.respiratory_rate} onChange={e => setVitals({...vitals, respiratory_rate: e.target.value})} type="number" placeholder="16" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-rose-400 outline-none font-black text-slate-700 text-center transition" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Glucosa (mg/dL)</label>
                                                <input value={vitals.glucose} onChange={e => setVitals({...vitals, glucose: e.target.value})} type="text" placeholder="90" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-rose-400 outline-none font-black text-slate-700 text-center transition" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-black text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Info className="w-4 h-4 text-emerald-500" /> Nota Inicial de Enfermería (Motivo de Visita)</h4>
                                        <textarea 
                                            rows={2}
                                            value={vitals.nurse_notes}
                                            onChange={e => setVitals({...vitals, nurse_notes: e.target.value})}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 outline-none font-medium text-slate-700 text-sm transition"
                                            placeholder="Describa brevemente cómo llegó el paciente, dolores referidos al ingreso o motivo principal de consulta..."
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4 bg-white sticky bottom-0 z-10 border-t border-slate-50">
                                        <button type="submit" className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black shadow-xl shadow-slate-900/20 md:w-auto w-full flex justify-center items-center gap-3 transition-transform active:scale-95">
                                            <CheckCircle2 className="w-5 h-5" /> FOLIAR Y PASAR A CONSULTA
                                        </button>
                                    </div>
                                    
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ASIGNACIÓN DE CONSULTORIOS */}
            {activeTab === 'ROOMS' && (
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in">
                    <div className="mb-8">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Building className="w-6 h-6 text-indigo-500" /> Monitor Físico de Consultorios</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">Asigna de manera dinámica qué doctor está operando en cada cuarto o quirófano el día de hoy.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Panel de Asignación Rápida */}
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                            <h3 className="font-black text-indigo-900 text-sm tracking-widest uppercase mb-6 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Ejecutar Asignación
                            </h3>
                            <form onSubmit={handleAssignRoom} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Médico en Turno</label>
                                    <select value={assignForm.doctor_id} onChange={e=>setAssignForm({...assignForm, doctor_id: e.target.value})} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 shadow-sm appearance-none">
                                        <option value="">-- Seleccionar Médico Activo --</option>
                                        {doctors.map(d => (
                                            <option key={d.id} value={d.id}>DR. {d.first_name?.toUpperCase()} {d.last_name?.toUpperCase()} ({d.specialty})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Asignar a Cuarto / Espacio Físico</label>
                                    <input value={assignForm.room_name} onChange={e=>setAssignForm({...assignForm, room_name: e.target.value})} list="rooms-list" type="text" placeholder="Ej. Consultorio 1, Quirófano B..." className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 shadow-sm" />
                                    <datalist id="rooms-list">
                                        <option value="Consultorio 1" />
                                        <option value="Consultorio 2" />
                                        <option value="Consultorio Especialidades" />
                                        <option value="Quirófano A" />
                                        <option value="Sala de Triage" />
                                    </datalist>
                                </div>
                                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/30 transition">
                                    <CheckCircle2 className="w-5 h-5" /> Oficializar Asignación
                                </button>
                            </form>
                        </div>

                        {/* Estado Actual (Radar) */}
                        <div>
                            <h3 className="font-black text-slate-800 text-sm tracking-widest uppercase mb-6 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-slate-400" /> Médicos Activos en Piso
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {doctors.filter(d => d.current_room).map(doc => (
                                    <div key={doc.id} className="bg-white border-2 border-indigo-100 p-5 rounded-2xl shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                                        <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-indigo-400 to-purple-500"></div>
                                        <div className="w-12 h-12 rounded-full bg-slate-100 mb-3 flex items-center justify-center font-black text-slate-400">
                                            {doc.first_name?.[0]}
                                        </div>
                                        <h4 className="font-black text-slate-800 tracking-tight leading-tight">Dr. {doc.first_name}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">{doc.specialty}</p>
                                        <span className="inline-flex bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-lg text-xs font-black items-center gap-1.5 shadow-sm">
                                            <MapPin className="w-3 h-3 text-indigo-400" /> {doc.current_room}
                                        </span>
                                    </div>
                                ))}
                                {doctors.filter(d => d.current_room).length === 0 && (
                                    <div className="col-span-full p-10 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                                        <p className="text-slate-400 font-bold">No hay médicos operando físicamente en este momento.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
}
