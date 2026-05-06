"use client"

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Video, CheckCircle2, User, Stethoscope, Plus, X, Calendar as CalendarIcon, AlertCircle, Trash2, Play } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { syncAppointmentToGoogleCalendar } from '@/app/actions/calendar';

export default function AgendaPage() {
    const supabase = createClient();
    const router = useRouter();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'daily'|'weekly'|'monthly'>('daily');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [rescheduleModal, setRescheduleModal] = useState({ isOpen: false, id: '', date: '', start_time: '', end_time: '' });
    const [patients, setPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        patient_id: '',
        doctor_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '09:30',
        type: 'Consulta',
        room_id: '',
        is_video: false,
    });

    const [config, setConfig] = useState({ duration: 30, hours: {} });

    useEffect(() => {
        fetchBaseData();
        fetchClinicConfig();
    }, []);

    useEffect(() => {
        fetchAppointments(currentDate, viewMode);
    }, [currentDate, viewMode]);

    const fetchClinicConfig = async () => {
        const { data } = await supabase.from('clinic_settings').select('consultation_duration_minutes, business_hours').single();
        if (data) setConfig({ duration: data.consultation_duration_minutes, hours: data.business_hours });
    };

    const fetchBaseData = async () => {
        const [{ data: pData }, { data: dData }, { data: rData }] = await Promise.all([
            supabase.from('patients').select('id, first_name, last_name, second_last_name').order('first_name'),
            supabase.from('doctors').select('id, first_name, last_name, second_last_name, default_room_id').order('first_name'),
            supabase.from('rooms').select('id, name').order('name')
        ]);
        if (pData) setPatients(pData);
        if (dData) {
            setDoctors(dData);
            setSelectedDoctors(dData.map(d => d.id)); // Seleccionar todos por default
        }
        if (rData) setRooms(rData);
    };

    const handleDoctorChange = (docId: string) => {
        const doc = doctors.find(d => d.id === docId);
        setFormData(prev => ({
            ...prev,
            doctor_id: docId,
            room_id: doc?.default_room_id || ''
        }));
    };

    const fetchAppointments = async (date: Date, mode: string) => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id || '').single();

        const year = date.getFullYear();
        const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        let startDate, endDate;
        if (mode === 'daily') {
            startDate = ymd(date);
            endDate = startDate;
        } else if (mode === 'weekly') {
            const day = date.getDay(); 
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const s = new Date(date); s.setDate(diff);
            const e = new Date(s); e.setDate(s.getDate() + 6);
            startDate = ymd(s);
            endDate = ymd(e);
        } else {
            const s = new Date(year, date.getMonth(), 1);
            const e = new Date(year, date.getMonth() + 1, 0);
            startDate = ymd(s);
            endDate = ymd(e);
        }

        let query = supabase
            .from('appointments')
            .select(`
                *,
                patients(first_name, last_name, second_last_name),
                doctors(first_name, last_name, second_last_name),
                rooms(name)
            `)
            .gte('appointment_date', startDate)
            .lte('appointment_date', endDate);

        if (profile?.role === 'doctor' && profile.doctor_id) {
            query = query.eq('doctor_id', profile.doctor_id);
        }

        const { data, error } = await query.order('appointment_date', { ascending: true }).order('start_time', { ascending: true });
        if (data) setAppointments(data);
        setLoading(false);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
        if (!error) fetchAppointments(currentDate, viewMode);
        else toast.error("Error al actualizar estatus: " + error.message);
    };

    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '', name: '' });

    const deleteAppointment = async () => {
        const { id } = deleteModal;
        if (!id) return;
        
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        
        if (!error) {
            toast.success("Cita cancelada correctamente");
            setDeleteModal({ isOpen: false, id: '', name: '' });
            fetchAppointments(currentDate, viewMode);
        } else {
            toast.error("Error al cancelar cita: " + error.message);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        // 1. VALIDACIÓN DE CHOQUES (OVERLAP)
        // Buscamos colisiones para el mismo día
        const { data: conflicts } = await supabase
            .from('appointments')
            .select('id, start_time, end_time, doctor_id, room_id, status')
            .eq('appointment_date', formData.appointment_date)
            .neq('status', 'cancelled'); // Ignorar si está cancelada

        const hasOverlap = conflicts?.some(c => {
            // Un choque ocurre si: (Es el mismo doctor O es el mismo consultorio) Y (Los horarios se enciman)
            const sameDoctor = c.doctor_id === formData.doctor_id;
            const sameRoom = formData.room_id && c.room_id === formData.room_id;
            
            // Condición de solapamiento matemático: (A.inicio < B.fin) && (A.fin > B.inicio)
            const timeOverlap = (formData.start_time < c.end_time) && (formData.end_time > c.start_time);
            
            return (sameDoctor || sameRoom) && timeOverlap;
        });

        if (hasOverlap) {
            toast.error("¡ALERTA!: Cruce detectado. El médico o el consultorio ya están ocupados en este horario.", {
                duration: 5000,
                icon: '🚫'
            });
            setSaving(false);
            return;
        }

        // 2. PROCEDER SI TODO ESTÁ LIBRE
        const { error } = await supabase.from('appointments').insert([{
            patient_id: formData.patient_id,
            doctor_id: formData.doctor_id,
            appointment_date: formData.appointment_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            type: formData.type,
            room_id: formData.room_id || null,
            is_video: formData.is_video,
            status: 'scheduled'
        }]);

        setSaving(false);
        if (!error) {
            setIsModalOpen(false);
            setFormData({ ...formData, patient_id: '', start_time: '09:00', end_time: '09:30' });
            fetchAppointments(currentDate, viewMode);
            toast.success("Cita agendada correctamente");

            // --- SINCRONIZACIÓN GOOGLE CALENDAR ---
            const patient = patients.find(p => p.id === formData.patient_id);
            const doctor = doctors.find(d => d.id === formData.doctor_id);
            
            if (doctor) {
                syncAppointmentToGoogleCalendar(doctor.id, {
                    summary: `Consulta: ${patient?.first_name} ${patient?.last_name}`,
                    description: `Tipo: ${formData.type}. Gestionado vía AQUA SaaS.`,
                    start: `${formData.appointment_date}T${formData.start_time}:00`,
                    end: `${formData.appointment_date}T${formData.end_time}:00`
                }).then(res => {
                    if (res.success) toast.success("Sincronizado con Google Calendar", { icon: '📅' });
                });
            }
        } else {
            toast.error("Error al agendar cita: " + error.message);
        }
    };

    const handleStartTimeChange = (newStartTime: string) => {
        const [h, m] = newStartTime.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m + config.duration, 0);
        
        const endH = date.getHours().toString().padStart(2, '0');
        const endM = date.getMinutes().toString().padStart(2, '0');
        
        setFormData({ ...formData, start_time: newStartTime, end_time: `${endH}:${endM}` });
    };

    const handleReschedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const currentApt = appointments.find(a => a.id === rescheduleModal.id);

        // VALIDACIÓN DE CHOQUES EN REAGENDADO
        const { data: conflicts } = await supabase
            .from('appointments')
            .select('id, start_time, end_time, doctor_id, room_id, status')
            .eq('appointment_date', rescheduleModal.date)
            .neq('status', 'cancelled')
            .neq('id', rescheduleModal.id); // Ignorar la cita actual que estamos moviendo

        const hasOverlap = conflicts?.some(c => {
            const sameDoctor = c.doctor_id === currentApt?.doctor_id;
            const sameRoom = currentApt?.room_id && c.room_id === currentApt.room_id;
            const timeOverlap = (rescheduleModal.start_time < c.end_time) && (rescheduleModal.end_time > c.start_time);
            return (sameDoctor || sameRoom) && timeOverlap;
        });

        if (hasOverlap) {
            toast.error("¡ALERTA!: Cruce detectado. El horario choca con otra cita al intentar reagendar.", { icon: '🚫' });
            setSaving(false);
            return;
        }

        const { error } = await supabase.from('appointments').update({
            appointment_date: rescheduleModal.date,
            start_time: rescheduleModal.start_time,
            end_time: rescheduleModal.end_time,
            status: 'scheduled'
        }).eq('id', rescheduleModal.id);

        setSaving(false);
        if (!error) {
            toast.success("Cita reagendada exitosamente");
            setRescheduleModal({ isOpen: false, id: '', date: '', start_time: '', end_time: '' });
            fetchAppointments(currentDate, viewMode);

            // --- SINCRONIZACIÓN GOOGLE CALENDAR (UPDATE) ---
            const currentApt = appointments.find(a => a.id === rescheduleModal.id);
            if (currentApt?.doctor_id) {
                syncAppointmentToGoogleCalendar(currentApt.doctor_id, {
                    summary: `REAGENDADO: ${currentApt.patients?.first_name} ${currentApt.patients?.last_name}`,
                    description: `Cita movida al ${rescheduleModal.date}.`,
                    start: `${rescheduleModal.date}T${rescheduleModal.start_time}:00`,
                    end: `${rescheduleModal.date}T${rescheduleModal.end_time}:00`
                }).then(res => {
                    if (res.success) toast.success("Google Calendar actualizado", { icon: '📅' });
                });
            }
        } else {
            toast.error("Error al reagendar cita: " + error.message);
        }
    };

    const nextDay = () => {
        const d = new Date(currentDate);
        if (viewMode === 'daily') d.setDate(d.getDate() + 1);
        else if (viewMode === 'weekly') d.setDate(d.getDate() + 7);
        else d.setMonth(d.getMonth() + 1);
        setCurrentDate(d);
    };

    const prevDay = () => {
        const d = new Date(currentDate);
        if (viewMode === 'daily') d.setDate(d.getDate() - 1);
        else if (viewMode === 'weekly') d.setDate(d.getDate() - 7);
        else d.setMonth(d.getMonth() - 1);
        setCurrentDate(d);
    };

    const formatTime = (time24: string) => {
        if (!time24) return '';
        const [h, m] = time24.split(':');
        const hInt = parseInt(h, 10);
        const ampm = hInt >= 12 ? 'PM' : 'AM';
        const h12 = hInt % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    const getTypeColor = (type: string, status: string) => {
        if (status === 'blocked') return 'bg-slate-100 text-slate-500';
        if (status === 'in-progress') return 'bg-teal-100 text-teal-700 font-bold border border-teal-200';
        if (type.toLowerCase().includes('tele')) return 'bg-purple-100 text-purple-700 border border-purple-200';
        if (type.toLowerCase().includes('proced')) return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
        return 'bg-blue-50 text-blue-700 border border-blue-100';
    };

    const openNewAppointmentModal = () => {
        const now = new Date();
        const minutes = now.getMinutes();
        const addMinutes = minutes < 30 ? 30 - minutes : 60 - minutes;

        const startTimeDate = new Date(now.getTime() + addMinutes * 60000);
        const endTimeDate = new Date(startTimeDate.getTime() + config.duration * 60000);

        const formatTimeStr = (date: Date) => {
            const h = date.getHours().toString().padStart(2, '0');
            const m = date.getMinutes().toString().padStart(2, '0');
            return `${h}:${m}`;
        };

        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset);
        const dateString = localDate.toISOString().split('T')[0];

        setFormData(prev => ({
            ...prev,
            appointment_date: viewMode === 'daily' ? currentDate.toISOString().split('T')[0] : dateString,
            start_time: formatTimeStr(startTimeDate),
            end_time: formatTimeStr(endTimeDate)
        }));
        setIsModalOpen(true);
    };

    const getRangeLabel = () => {
        if (viewMode === 'daily') return currentDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
        if (viewMode === 'weekly') {
            const day = currentDate.getDay(); 
            const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
            const s = new Date(currentDate); s.setDate(diff);
            const e = new Date(s); e.setDate(s.getDate() + 6);
            return `${s.toLocaleDateString('es-ES', {day:'numeric', month:'short'})} - ${e.toLocaleDateString('es-ES', {day:'numeric', month:'short'})}`;
        }
        return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    };

    // Aplicar filtro de doctores y agrupar citas por fecha
    const filteredAppointments = appointments.filter(a => selectedDoctors.length === 0 || selectedDoctors.includes(a.doctor_id));
    const groupedAppointments = filteredAppointments.reduce((acc: any, curr: any) => {
        if (!acc[curr.appointment_date]) acc[curr.appointment_date] = [];
        acc[curr.appointment_date].push(curr);
        return acc;
    }, {});

    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' } as const;

    const completedCount = filteredAppointments.filter(a => a.status === 'completed').length;
    const pendingCount = filteredAppointments.filter(a => a.status === 'scheduled').length;
    let aiMessage = "La agenda fluye excelente.";
    if (filteredAppointments.length === 0) aiMessage = "Día sin citas programadas.";
    else if (pendingCount > 6) aiMessage = "Alta densidad de citas. Sugerimos agilizar tiempos.";
    else if (pendingCount > 0 && completedCount > 0) aiMessage = `Buen ritmo de atención, llevas ${completedCount} cita(s) terminada(s).`;

    return (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 ease-out">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Agenda Inteligente</h1>
                    <p className="text-slate-500 mt-1 font-medium">Sincronización en tiempo real de citas y procedimientos.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Botonera Vistas */}
                    <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner border border-slate-200">
                        <button onClick={() => setViewMode('daily')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${viewMode === 'daily' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:bg-slate-200'}`}>Día</button>
                        <button onClick={() => setViewMode('weekly')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${viewMode === 'weekly' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:bg-slate-200'}`}>Semana</button>
                        <button onClick={() => setViewMode('monthly')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${viewMode === 'monthly' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:bg-slate-200'}`}>Mes</button>
                    </div>

                    <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                        <button onClick={prevDay} className="px-4 py-2 hover:bg-slate-50 rounded-lg text-slate-600 font-semibold transition"><ChevronLeft className="w-5 h-5" /></button>
                        <div className="px-4 py-2 text-slate-800 font-extrabold flex items-center capitalize w-auto min-w-[120px] justify-center text-center">
                            {getRangeLabel()}
                        </div>
                        <button onClick={nextDay} className="px-4 py-2 hover:bg-slate-50 rounded-lg text-slate-600 font-semibold transition"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Panel Lateral */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">Doctores Disponibles</h3>
                        </div>
                        <div className="space-y-3">
                            {doctors.length === 0 ? <p className="text-xs text-slate-400">Cargando...</p> : doctors.map(doc => (
                                <label key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedDoctors.includes(doc.id)} 
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedDoctors([...selectedDoctors, doc.id]);
                                            else setSelectedDoctors(selectedDoctors.filter(id => id !== doc.id));
                                        }}
                                        className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500" 
                                    />
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs uppercase">
                                        {doc.first_name?.[0]}{doc.last_name?.[0]}
                                    </div>
                                    <span className="font-semibold text-sm text-slate-700 truncate w-32">Dr. {doc.last_name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Info Block AI (MOCKUP ESTÉTICO -> Dinámico) */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-md text-white relative overflow-hidden hidden md:block group hover:scale-[1.02] transition-transform">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-amber-300 animate-pulse" /> Predicción AI
                        </h3>
                        <p className="text-sm font-medium text-indigo-100 opacity-90 leading-relaxed">
                            {aiMessage}
                        </p>
                        {pendingCount > 0 && (
                            <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-center">
                                <span className="text-xs text-white/70">Citas en espera:</span>
                                <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-white">{pendingCount}</span>
                            </div>
                        )}
                    </div>

                    {/* Botón de Google Calendar para Médicos */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronización Externa</h4>
                        <button 
                            onClick={async () => {
                                const { data: { user } } = await supabase.auth.getUser();
                                const { data: profile } = await supabase.from('profiles').select('doctor_id').eq('id', user?.id || '').single();
                                if (profile?.doctor_id) {
                                    window.location.href = `/api/integrations/google/auth?doctorId=${profile.doctor_id}`;
                                } else {
                                    toast.error("Debes tener un perfil de médico vinculado para usar esta función.");
                                }
                            }}
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700 shadow-sm"
                        >
                            <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" alt="Google Calendar" className="w-5 h-5" />
                            Vincular Google Calendar
                        </button>
                    </div>
                </div>

                {/* Citas del Día */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[500px]">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                        <div className="flex gap-2">
                            <button className="bg-white border border-slate-200 px-4 py-1.5 rounded-lg text-sm font-bold text-slate-700 shadow-sm">Lista</button>
                            <button className="px-4 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition">Calendario</button>
                        </div>
                        <button onClick={openNewAppointmentModal} className="bg-teal-600 hover:bg-teal-700 text-white shadow-md px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Agendar Cita
                        </button>
                    </div>

                    <div className="p-6 flex-1">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-slate-400 font-semibold pt-16">Cargando agenda...</div>
                        ) : appointments.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 font-semibold pt-16">
                                <CalendarIcon className="w-16 h-16 text-slate-200 mb-4" />
                                No hay citas programadas para este día.
                                <p className="text-sm font-normal text-slate-400 mt-2">Haz clic en &quot;Agendar Cita&quot; para empezar.</p>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {Object.keys(groupedAppointments).sort().map(dateString => (
                                    <div key={dateString} className="mb-4">
                                        {viewMode !== 'daily' && (
                                            <h3 className="font-extrabold text-slate-800 text-lg border-b-2 border-slate-100 pb-2 mb-6 capitalize text-indigo-900">
                                                {new Date(dateString + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </h3>
                                        )}
                                        <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
                                            {groupedAppointments[dateString].map((cita:any) => (
                                                <div key={cita.id} className={`relative flex items-start group ${cita.status === 'blocked' ? 'opacity-60' : ''}`}>
                                                    <div className={`absolute -left-[29px] w-[14px] h-[14px] rounded-full border-4 border-white ${cita.status === 'completed' ? 'bg-slate-300' : cita.status === 'in-progress' ? 'bg-teal-500 animate-pulse' : 'bg-slate-200'}`}></div>

                                                    <div className="w-24 flex-shrink-0 pt-0.5">
                                                        <span className={`font-extrabold text-sm ${cita.status === 'completed' ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}>
                                                            {formatTime(cita.start_time)}
                                                        </span>
                                                        <span className="block text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {formatTime(cita.end_time)}
                                                        </span>
                                                    </div>

                                                    <div className={`flex-1 min-h-[4rem] rounded-xl p-4 border transition-all hover:shadow-md ${cita.status === 'in-progress' ? 'bg-white border-teal-200 shadow-lg shadow-teal-500/10 scale-[1.02]' : cita.status === 'no-show' ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className={`text-base font-bold ${cita.status === 'blocked' || cita.status === 'no-show' ? 'text-slate-500' : 'text-slate-800'}`}>
                                                                    {cita.patients ? `${cita.patients.first_name} ${cita.patients.last_name} ${cita.patients.second_last_name || ''}` : 'Paciente Eliminado'}
                                                                </h4>
                                                                <div className="flex flex-wrap gap-2 items-center mt-2.5">
                                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${getTypeColor(cita.type, cita.status)}`}>{cita.type}</span>
                                                                    {cita.rooms && (
                                                                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                                                                            {cita.is_video ? <Video className="w-3 h-3 text-purple-500" /> : <MapPin className="w-3 h-3 text-slate-400" />} {cita.rooms?.name}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                                                                        <Stethoscope className="w-3 h-3" /> Dr. {cita.doctors?.last_name}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col items-end justify-between gap-2 border-l border-slate-100 pl-4">
                                                                <div className="flex items-center gap-2">
                                                                    {(cita.status === 'scheduled' || cita.status === 'no-show') && (
                                                                        <button 
                                                                            onClick={() => setRescheduleModal({ isOpen: true, id: cita.id, date: cita.appointment_date, start_time: cita.start_time, end_time: cita.end_time })} 
                                                                            className="text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2 py-1.5 rounded transition shadow-sm active:scale-95 flex items-center gap-1"
                                                                        >
                                                                            <CalendarIcon className="w-3 h-3"/> Reagendar
                                                                        </button>
                                                                    )}

                                                                    {cita.status === 'scheduled' && (
                                                                        <>
                                                                            <button 
                                                                                onClick={() => updateStatus(cita.id, 'no-show')} 
                                                                                className="text-[10px] font-bold bg-slate-500 hover:bg-slate-600 text-white px-2 py-1.5 rounded transition shadow-sm active:scale-95"
                                                                            >
                                                                                No Asistió
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    updateStatus(cita.id, 'in-progress');
                                                                                    router.push(`/consulta/${cita.id}`);
                                                                                }} 
                                                                                className="text-[10px] font-bold bg-indigo-600 text-white hover:bg-slate-900 px-3 py-1.5 rounded-xl transition shadow-lg shadow-indigo-500/20 border border-indigo-100 flex items-center gap-1 active:scale-95"
                                                                            >
                                                                                <Play className="w-3 h-3" /> Atender
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    
                                                                    {cita.status === 'in-progress' && (
                                                                        <button onClick={() => updateStatus(cita.id, 'completed')} className="text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1.5 rounded transition shadow-sm">Completar</button>
                                                                    )}
                                                                    
                                                                    {(cita.status === 'no-show' || cita.status === 'scheduled') && (
                                                                        <button 
                                                                            onClick={() => setDeleteModal({ 
                                                                                isOpen: true, 
                                                                                id: cita.id, 
                                                                                name: cita.patients ? `${cita.patients.first_name} ${cita.patients.last_name}` : 'esta cita' 
                                                                            })} 
                                                                            className="p-1 px-1.5 hover:bg-red-50 text-red-400 hover:text-red-500 rounded transition" 
                                                                            title="Cancelar Cita"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <div>
                                                                    {cita.status === 'completed' && <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><CheckCircle2 className="w-4 h-4" /> Finalizada</div>}
                                                                    {cita.status === 'in-progress' && <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-1 rounded animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.2)]">En Consulta</span>}
                                                                    {cita.status === 'scheduled' && <span className="bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Agendada</span>}
                                                                    {cita.status === 'no-show' && <div className="flex items-center gap-1 text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded"><AlertCircle className="w-3 h-3" /> No se presentó</div>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal para Nueva Cita */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-teal-600" /> Agendar Nueva Cita</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Columna 1 */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Participantes</h4>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Paciente *</label>
                                        <select required value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700">
                                            <option value="" disabled>Selecciona un paciente</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} {p.second_last_name || ''}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Médico Tratante *</label>
                                        <select required value={formData.doctor_id} onChange={e => handleDoctorChange(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700">
                                            <option value="" disabled>Selecciona un médico</option>
                                            {doctors.map(d => <option key={d.id} value={d.id}>{"Dr. " + d.first_name + " " + d.last_name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Cita *</label>
                                        <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700">
                                            <option value="Consulta Primera Vez">Consulta Primera Vez</option>
                                            <option value="Seguimiento">Seguimiento</option>
                                            <option value="Procedimiento">Procedimiento</option>
                                            <option value="Telemedicina">Telemedicina (Videollamada)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Columna 2 */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Fecha y Hora</h4>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Fecha de la Cita *</label>
                                        <input required type="date" value={formData.appointment_date} onChange={e => setFormData({ ...formData, appointment_date: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Hora Inicio *</label>
                                            <input required type="time" value={formData.start_time} onChange={e => handleStartTimeChange(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Hora Fin *</label>
                                            <input required type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Consultorio / Ubicación</label>
                                        <select value={formData.room_id} onChange={e => setFormData({ ...formData, room_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700">
                                            <option value="">Sin consultorio asignado previamente...</option>
                                            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>

                                    <label className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer transition border border-purple-100 group">
                                        <input type="checkbox" checked={formData.is_video} onChange={e => setFormData({ ...formData, is_video: e.target.checked })} className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500" />
                                        <Video className="w-4 h-4 text-purple-600" />
                                        <span className="font-bold text-sm text-purple-900 group-hover:text-purple-700">Habilitar Link de Telemedicina</span>
                                    </label>

                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-8">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-md disabled:opacity-50">
                                    {saving ? 'Guardando...' : 'Confirmar Cita'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Borrado */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setDeleteModal({ isOpen: false, id: '', name: '' })}>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">¿Cancelar esta cita?</h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                Estás a punto de eliminar la cita de <strong className="text-slate-800 underline decoration-red-200">{deleteModal.name}</strong>. Esta acción no se puede deshacer.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
                                    className="py-4 px-6 rounded-2xl font-extrabold text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
                                >
                                    No, mantener
                                </button>
                                <button 
                                    onClick={deleteAppointment}
                                    className="py-4 px-6 rounded-2xl font-extrabold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all active:scale-95"
                                >
                                    Sí, eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Mover/Reagendar Cita */}
            {rescheduleModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-4" onClick={(e) => { if (e.target === e.currentTarget) setRescheduleModal({...rescheduleModal, isOpen: false}) }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-amber-50">
                            <h3 className="text-xl font-bold text-amber-800 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-amber-600" /> Reagendar Cita</h3>
                            <button onClick={() => setRescheduleModal({...rescheduleModal, isOpen: false})} className="text-amber-400 hover:text-amber-600 p-1"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleReschedule} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Nueva Fecha</label>
                                <input required type="date" value={rescheduleModal.date} onChange={e => setRescheduleModal({ ...rescheduleModal, date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition font-bold text-slate-700" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Hora Inicio</label>
                                    <input required type="time" value={rescheduleModal.start_time} onChange={e => {
                                        const [h, m] = e.target.value.split(':').map(Number);
                                        const d = new Date(); d.setHours(h, m + config.duration, 0);
                                        setRescheduleModal({ ...rescheduleModal, start_time: e.target.value, end_time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` });
                                    }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition font-bold text-slate-700" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Hora Fin</label>
                                    <input required type="time" value={rescheduleModal.end_time} onChange={e => setRescheduleModal({ ...rescheduleModal, end_time: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition font-bold text-slate-700" />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-8">
                                <button type="button" onClick={() => setRescheduleModal({...rescheduleModal, isOpen: false})} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 transition shadow-md disabled:opacity-50">
                                    {saving ? 'Guardando...' : 'Reagendar Ahora'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function SparklesIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
    );
}
