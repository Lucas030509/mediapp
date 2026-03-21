"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    User, Activity, FileText, ClipboardList, Plus, Save, 
    ArrowLeft, History, Stethoscope, Pill, CheckCircle2,
    Thermometer, Heart, Wind, Gauge, AlertCircle, FilePlus
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function ConsultaPage() {
    const params = useParams();
    const appointmentId = params?.id as string;
    const router = useRouter();
    const supabase = createClient();

    // Estados de datos
    const [appointment, setAppointment] = useState<any>(null);
    const [patient, setPatient] = useState<any>(null);
    const [vitalSigns, setVitalSigns] = useState({
        weight_kg: '', height_cm: '', temperature_c: '', 
        blood_pressure: '', heart_rate: '', oxygen_saturation: ''
    });
    const [note, setNote] = useState({
        reason: '', subjective: '', objective: '', assessment: '', plan: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (appointmentId) fetchInitialData();
    }, [appointmentId]);

    const fetchInitialData = async () => {
        setLoading(true);
        // Buscar info de la cita y paciente
        const { data: appt } = await supabase
            .from('appointments')
            .select('*, patients(*), doctors(*)')
            .eq('id', appointmentId)
            .single();

        if (appt) {
            setAppointment(appt);
            setPatient(appt.patients);
            // Intentar cargar nota si ya existe una iniciada para esta cita
            const { data: existingNote } = await supabase
                .from('clinical_notes')
                .select('*')
                .eq('appointment_id', appointmentId)
                .maybeSingle();
            
            if (existingNote) {
                setNote({
                    reason: existingNote.reason || '',
                    subjective: existingNote.subjective || '',
                    objective: existingNote.objective || '',
                    assessment: existingNote.assessment || '',
                    plan: existingNote.plan || ''
                });
            }
        }
        setLoading(false);
    };

    const handleSaveConsultation = async (status: 'draft' | 'final') => {
        setSaving(true);
        
        try {
            // 1. Guardar Signos Vitales
            if (vitalSigns.weight_kg || vitalSigns.blood_pressure) {
                await supabase.from('vital_signs').insert([{
                    patient_id: patient.id,
                    weight_kg: vitalSigns.weight_kg ? parseFloat(vitalSigns.weight_kg) : null,
                    height_cm: vitalSigns.height_cm ? parseFloat(vitalSigns.height_cm) : null,
                    temperature_c: vitalSigns.temperature_c ? parseFloat(vitalSigns.temperature_c) : null,
                    blood_pressure: vitalSigns.blood_pressure,
                    heart_rate: vitalSigns.heart_rate ? parseInt(vitalSigns.heart_rate) : null,
                    oxygen_saturation: vitalSigns.oxygen_saturation ? parseInt(vitalSigns.oxygen_saturation) : null
                }]);
            }

            // 2. Guardar o actualizar la Nota Clínica
            const noteData = {
                patient_id: patient.id,
                doctor_id: appointment.doctor_id,
                appointment_id: appointmentId,
                ...note,
                status: status,
                locked_at: status === 'final' ? new Date().toISOString() : null
            };

            const { data: existingNote } = await supabase.from('clinical_notes').select('id').eq('appointment_id', appointmentId).maybeSingle();

            if (existingNote) {
                await supabase.from('clinical_notes').update(noteData).eq('id', existingNote.id);
            } else {
                await supabase.from('clinical_notes').insert([noteData]);
            }

            // 3. Si se finaliza, marcar cita como 'completed'
            if (status === 'final') {
                await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);
                toast.success("Consulta finalizada y guardada en el historial.");
                router.push('/agenda');
            } else {
                toast.success("Borrador guardado.");
            }
        } catch (err) {
            toast.error("Error al guardar consulta.");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400 gap-3">
        <Activity className="w-8 h-8 animate-pulse text-teal-500" /> Preparando expediente clínico...
    </div>;
    
    if (!appointment) return <div className="h-screen flex items-center justify-center text-red-500 font-bold">Error: No se encontró la cita médica.</div>;

    return (
        <div className="flex flex-col h-screen bg-white animate-in fade-in duration-500">
            {/* Cabecera de Consulta */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center shadow-2xl shrink-0">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="p-3 hover:bg-white/10 rounded-2xl text-white/60 transition-all active:scale-90">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black">{patient.first_name} {patient.last_name} {patient.second_last_name || ''}</h1>
                            <span className="bg-white/10 text-white font-black text-[10px] px-2 py-1 rounded-md uppercase tracking-[0.2em] border border-white/10">ID: {patient.id.slice(0,5)}</span>
                        </div>
                        <p className="text-white/40 font-bold text-xs flex items-center gap-2 mt-1 uppercase tracking-widest">
                            <Stethoscope className="w-4 h-4 text-teal-400" /> Dr. {appointment.doctors?.last_name} • {appointment.type}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => handleSaveConsultation('draft')}
                        disabled={saving}
                        className="px-6 py-3 rounded-2xl font-bold bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Pausar
                    </button>
                    <button 
                        onClick={() => handleSaveConsultation('final')}
                        disabled={saving}
                        className="px-8 py-3 rounded-2xl font-black bg-teal-500 text-slate-900 shadow-xl shadow-teal-500/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                        {saving ? 'Cerrando...' : <><CheckCircle2 className="w-6 h-6" /> Finalizar Consulta</>}
                    </button>
                </div>
            </div>

            {/* Cuerpo Columnares */}
            <div className="flex flex-1 overflow-hidden">
                {/* Columna Izquierda: Vitales */}
                <div className="w-[300px] bg-slate-50 p-6 border-r border-slate-100 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-teal-500" /> Constantes Vitales
                            </h3>
                            <div className="space-y-5">
                                <VitalInput icon={<Heart className="w-4 h-4 text-red-500" />} label="Presión Art." placeholder="120/80" value={vitalSigns.blood_pressure} onChange={(v:any) => setVitalSigns({...vitalSigns, blood_pressure: v})} />
                                <VitalInput icon={<Thermometer className="w-4 h-4 text-orange-400" />} label="Temperatura" placeholder="36.5 °C" value={vitalSigns.temperature_c} onChange={(v:any) => setVitalSigns({...vitalSigns, temperature_c: v})} />
                                <VitalInput icon={<Gauge className="w-4 h-4 text-blue-500" />} label="Peso Corporal" placeholder="70 kg" value={vitalSigns.weight_kg} onChange={(v:any) => setVitalSigns({...vitalSigns, weight_kg: v})} />
                                <VitalInput icon={<Wind className="w-4 h-4 text-cyan-400" />} label="Saturación O2" placeholder="98%" value={vitalSigns.oxygen_saturation} onChange={(v:any) => setVitalSigns({...vitalSigns, oxygen_saturation: v})} />
                            </div>
                        </div>

                        <div className="bg-teal-500/5 p-6 rounded-[2.5rem] border border-teal-500/10">
                            <h3 className="font-black text-teal-900 text-[10px] uppercase tracking-widest mb-4">Información Relevante</h3>
                            <div className="space-y-3">
                                <div className="p-3 bg-white rounded-2xl border border-teal-500/10">
                                    <p className="text-[10px] font-bold text-teal-800/40 uppercase">Alergias</p>
                                    <p className="text-sm font-black text-teal-900">Ninguna reportada</p>
                                </div>
                                <div className="p-3 bg-white rounded-2xl border border-teal-500/10">
                                    <p className="text-[10px] font-bold text-teal-800/40 uppercase">Grupo Sanguíneo</p>
                                    <p className="text-sm font-black text-teal-900">O positivo (+)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna Central: Nota SOAP */}
                <div className="flex-1 bg-white p-10 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-12 pb-32">
                        {/* Motivo */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-indigo-500 rounded-full"></div>
                                <label className="font-black text-slate-900 text-2xl tracking-tighter">Motivo de la Visita</label>
                            </div>
                            <textarea 
                                value={note.reason}
                                onChange={e => setNote({...note, reason: e.target.value})}
                                placeholder="Escriba aquí el motivo principal..."
                                className="w-full min-h-[100px] p-8 bg-slate-50 border-none rounded-[3rem] focus:ring-4 focus:ring-indigo-500/10 text-slate-800 font-bold text-xl resize-none placeholder-slate-300 transition-all shadow-inner"
                            />
                        </div>

                        {/* SOAP Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <SoapBox 
                                title="Subjetivo" 
                                label="S"
                                color="indigo" 
                                placeholder="Síntomas, antecedentes y relato del paciente..." 
                                value={note.subjective}
                                onChange={(v:any) => setNote({...note, subjective: v})}
                            />
                            <SoapBox 
                                title="Objetivo" 
                                label="O"
                                color="teal" 
                                placeholder="Examen físico, signos, hallazgos visuales..." 
                                value={note.objective}
                                onChange={(v:any) => setNote({...note, objective: v})}
                            />
                        </div>

                        {/* Análisis / Diagnóstico */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-8 bg-slate-900 rounded-full"></div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Análisis Clínico</h3>
                                </div>
                                <button className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95">
                                    <Plus className="w-4 h-4" /> BUSCAR CIE-10
                                </button>
                            </div>
                            <textarea 
                                value={note.assessment}
                                onChange={e => setNote({...note, assessment: e.target.value})}
                                placeholder="Diagnóstico presuntivo o definitivo..."
                                className="w-full min-h-[150px] p-8 bg-slate-900 text-teal-400 font-mono text-base border-none rounded-[3rem] shadow-2xl focus:ring-4 focus:ring-teal-500/20"
                            />
                        </div>

                        {/* Plan */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-8 bg-purple-600 rounded-full"></div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Plan de Tratamiento</h3>
                                </div>
                                <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 active:scale-95">
                                    <Pill className="w-4 h-4" /> GENERAR RECETA
                                </button>
                            </div>
                            <textarea 
                                value={note.plan}
                                onChange={e => setNote({...note, plan: e.target.value})}
                                placeholder="Medicamentos, dosis, estudios de laboratorio, recomendaciones..."
                                className="w-full min-h-[200px] p-8 bg-purple-50 border-2 border-purple-100 rounded-[3rem] text-purple-900 font-bold text-lg placeholder-purple-300 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-200 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Historial */}
                <div className="w-[340px] bg-slate-50 p-6 border-l border-slate-100 overflow-y-auto custom-scrollbar">
                    <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <History className="w-4 h-4 text-indigo-500" /> Historial Reciente
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 opacity-60 grayscale pointer-events-none">
                            <span className="text-[10px] font-black text-slate-400 uppercase">20 Mar 2024</span>
                            <h4 className="font-black text-slate-800 text-sm mt-1">Control General</h4>
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 font-medium">Paciente estable...</p>
                        </div>

                        <div className="p-10 text-center bg-slate-100/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest leading-relaxed">Sin registros <br/> adiciones</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
}

// Subcomponentes
function VitalInput({ icon, label, placeholder, value, onChange }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                {icon} {label}
            </label>
            <input 
                type="text" 
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-900 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 transition-all outline-none"
            />
        </div>
    );
}

function SoapBox({ title, label, color, placeholder, value, onChange }: any) {
    const configs: any = {
        indigo: "bg-indigo-50/50 border-indigo-100 text-indigo-900 focus:ring-indigo-500/10 placeholder-indigo-300",
        teal: "bg-teal-50/50 border-teal-100 text-teal-900 focus:ring-teal-500/10 placeholder-teal-300"
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl bg-${color}-500 flex items-center justify-center text-white font-black text-sm`}>{label}</div>
                <h4 className="font-black text-slate-800 tracking-tight text-lg">{title}</h4>
            </div>
            <textarea 
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full min-h-[180px] p-6 border rounded-[2.5rem] font-bold text-sm transition-all focus:border-transparent leading-relaxed ${configs[color]}`}
            />
        </div>
    );
}
