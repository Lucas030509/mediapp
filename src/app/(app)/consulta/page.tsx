"use client"

import React, { useState, useEffect } from 'react';
import { Search, History, Calendar, User, Stethoscope, ChevronRight, FileText, ClipboardList, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ConsultasGeneralesPage() {
    const supabase = createClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState(''); // Estado para filtrar por fecha
    const [notes, setNotes] = useState<any[]>([]);
    const [todayAppointments, setTodayAppointments] = useState<any[]>([]); // Nuevo estado
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id || '').single();

        // 1. Cargar Notas Médicas (Historial)
        let notesQuery = supabase
            .from('clinical_notes')
            .select(`
                *,
                patients(id, first_name, last_name, second_last_name),
                doctors(id, first_name, last_name)
            `);
        
        // 2. Cargar Citas Pendientes (Hoy y Ayer) utilizando Fecha Local Robusta
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1); // Retrocedemos 1 día
        
        const getYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const yesterdayLocal = getYMD(yesterday);

        let apptQuery = supabase
            .from('appointments')
            .select('*, patients(first_name, last_name, second_last_name)')
            .gte('appointment_date', yesterdayLocal) // Desde ayer en adelante
            .neq('status', 'completed'); // Solo las que no han terminado

        if (profile?.role === 'doctor' && profile.doctor_id) {
            notesQuery = notesQuery.eq('doctor_id', profile.doctor_id);
            apptQuery = apptQuery.eq('doctor_id', profile.doctor_id);
        }

        const [{ data: notesData }, { data: apptsData }] = await Promise.all([
            notesQuery.order('created_at', { ascending: false }).limit(50),
            apptQuery.order('start_time', { ascending: true })
        ]);
        
        if (notesData) setNotes(notesData);
        if (apptsData) setTodayAppointments(apptsData);
        setLoading(false);
    };

    const filteredNotes = notes.filter(n => {
        const matchesName = `${n.patients?.first_name} ${n.patients?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Comparación con fecha local de la nota
        const nDate = new Date(n.created_at);
        const noteDateStr = `${nDate.getFullYear()}-${String(nDate.getMonth() + 1).padStart(2, '0')}-${String(nDate.getDate()).padStart(2, '0')}`;
        
        const matchesDate = filterDate ? noteDateStr === filterDate : true;
        return matchesName && matchesDate;
    });

    const setTodayFilter = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayFixed = `${year}-${month}-${day}`;
        setFilterDate(todayFixed === filterDate ? '' : todayFixed);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header Pro */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 italic">Expediente Clínico</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Historial centralizado de evoluciones y notas médicas.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Filtro Fecha */}
                    <div className="relative group flex items-center gap-2">
                        <button 
                            onClick={setTodayFilter}
                            className={`px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border ${filterDate === new Date().toISOString().split('T')[0] ? 'bg-teal-500 text-white border-teal-600 shadow-lg shadow-teal-500/20' : 'bg-white text-slate-400 border-slate-200'}`}
                        >
                            Hoy
                        </button>
                        <input 
                            type="date" 
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 shadow-sm font-bold text-xs outline-none transition-all text-slate-600 cursor-pointer"
                        />
                    </div>

                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Buscar por paciente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 shadow-sm font-bold text-xs outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN: PACIENTES EN ESPERA (SÓLO HOY Y AYER) */}
            {!filterDate && todayAppointments.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 ml-2">
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </div>
                        <h3 className="font-black text-slate-800 tracking-tight text-lg uppercase italic">Sala de Espera (Citas Pendientes)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {todayAppointments.map((appt) => (
                            <div key={appt.id} className="bg-white p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden active:scale-[0.98]">
                                <div className="absolute top-0 right-0 p-3 bg-indigo-50 text-indigo-700 font-black text-xs rounded-bl-2xl border-l border-b border-indigo-100">
                                    {appt.start_time.slice(0,5)} hs
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                        <User className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors text-lg tracking-tight line-clamp-1">
                                            {appt.patients?.first_name} {appt.patients?.last_name}
                                        </h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {new Date(appt.appointment_date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-5 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-300 uppercase">Tratamiento</span>
                                        <span className="text-xs font-bold text-indigo-900">{appt.type}</span>
                                    </div>
                                    <Link 
                                        href={`/consulta/${appt.id}`}
                                        className="text-white bg-indigo-600 hover:bg-slate-950 px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                                    >
                                        ATENDER
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid de Reportes Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<ClipboardList className="text-indigo-500" />} label="Total Notas" value={notes.length} color="indigo" />
                <StatCard icon={<Activity className="text-teal-500" />} label="Atenciones Hoy" value={notes.filter(n => new Date(n.created_at).toDateString() === new Date().toDateString()).length} color="teal" />
                <StatCard icon={<Stethoscope className="text-purple-500" />} label="Médico Activo" value="Dr. Admin" color="purple" />
            </div>

            {/* Listado de Consultas */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <History className="w-5 h-5 text-teal-500" /> Consultas Recientes
                    </h3>
                </div>

                {loading ? (
                    <div className="p-20 text-center text-slate-400 font-bold italic animate-pulse">Cargando historial clínico...</div>
                ) : filteredNotes.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <FileText className="w-16 h-16 text-slate-100" />
                        <p className="text-slate-400 font-bold italic">No se encontraron registros médicos.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {filteredNotes.map((note) => (
                            <Link 
                                key={note.id} 
                                href={`/consulta/${note.appointment_id}`}
                                className="flex items-center justify-between p-6 hover:bg-slate-50/80 transition-all group"
                            >
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs group-hover:scale-110 transition-transform">
                                        {note.patients?.first_name?.[0]}{note.patients?.last_name?.[0]}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-slate-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors">
                                                {note.patients?.first_name} {note.patients?.last_name} {note.patients?.second_last_name || ''}
                                            </h4>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${note.status === 'final' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {note.status === 'final' ? 'Completada' : 'Borrador'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 font-medium">
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(note.created_at).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> Dr. {note.doctors?.last_name}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2 font-medium italic line-clamp-1">Motivo: {note.reason || 'No especificado'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] font-black text-slate-300 uppercase leading-none">Último Cambio</p>
                                        <p className="text-xs font-bold text-slate-500 mt-1">{new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-white transition-all shadow-inner">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: any) {
    const colors: any = {
        indigo: "bg-indigo-50 border-indigo-100/50",
        teal: "bg-teal-50 border-teal-100/50",
        purple: "bg-purple-50 border-purple-100/50"
    };

    return (
        <div className={`p-6 rounded-[2rem] border ${colors[color]} shadow-sm flex items-center gap-4 transition-all hover:shadow-md active:scale-95`}>
            <div className="p-4 bg-white rounded-2xl shadow-sm">
                {React.cloneElement(icon, { className: "w-6 h-6" })}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
            </div>
        </div>
    );
}

