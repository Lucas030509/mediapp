"use client"

import React, { useState, useEffect } from 'react';
import { Search, User, ChevronRight, FileText, Database, Activity, Heart, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EHRSearchPage() {
    const supabase = createClient();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecentPatients();
    }, []);

    const fetchRecentPatients = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('patients')
            .select('id, first_name, last_name, second_last_name, date_of_birth, gender, blood_type')
            .order('last_name', { ascending: true })
            .limit(20);
        
        if (data) setPatients(data);
        setLoading(false);
    };

    const filteredPatients = patients.filter(p => 
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calculateAge = (dob: string) => {
        if (!dob) return '-';
        const diff = Date.now() - new Date(dob).getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Pro */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 italic uppercase">Historia Clínica Completa</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Acceso centralizado a todos los expedientes médicos de la clínica.</p>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Buscar paciente por nombre o apellido..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm font-bold text-sm outline-none transition-all placeholder:text-slate-300"
                    />
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatBox icon={<User className="text-blue-500" />} label="Pacientes Registrados" value="Real-time" />
                <StatBox icon={<Database className="text-indigo-500" />} label="Expedientes Activos" value={patients.length} />
                <StatBox icon={<Heart className="text-rose-500" />} label="Urgencias" value="0" />
                <StatBox icon={<Activity className="text-emerald-500" />} label="Sincronización" value="Ok" />
            </div>

            {/* Patients List Table/Cards */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg uppercase tracking-tight italic">
                        <FileText className="w-5 h-5 text-blue-500" /> Directorio de Expedientes
                    </h3>
                </div>

                {loading ? (
                    <div className="p-20 text-center text-slate-400 font-bold italic animate-pulse">Consultando base de datos médica...</div>
                ) : filteredPatients.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <Search className="w-16 h-16 text-slate-100" />
                        <p className="text-slate-400 font-bold italic">No se encontraron pacientes en tu base de datos clínica.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                        {filteredPatients.map((patient) => (
                            <Link 
                                key={patient.id} 
                                href={`/ehr/${patient.id}`}
                                className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-xl group-hover:scale-110 group-hover:from-blue-600 group-hover:to-indigo-700 group-hover:text-white transition-all shadow-inner">
                                        {patient.first_name?.[0]}{patient.last_name?.[0]}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors text-lg leading-tight uppercase italic line-clamp-2">
                                            {patient.first_name} {patient.last_name}
                                        </h4>
                                        <p className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-widest tracking-tighter">Expediente General</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Edad</p>
                                        <p className="text-sm font-bold text-slate-700">{calculateAge(patient.date_of_birth)} años</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Sangre</p>
                                        <p className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                            <Activity className="w-3 h-3 text-rose-500" /> {patient.blood_type || 'S/R'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Gén: {patient.gender === 'M' ? 'Masc' : 'Fem'}</span>
                                    </div>
                                    <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-tighter group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                                        Ver Historia Completa
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatBox({ icon, label, value }: any) {
    return (
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md active:scale-95">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                {React.cloneElement(icon, { className: "w-6 h-6" })}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-lg font-black text-slate-900 tracking-tighter italic">{value}</p>
            </div>
        </div>
    );
}
