"use client"

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserPlus, FileText, CheckCircle, TrendingUp, Sparkles, Video, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const emptyVisitData = [
    { name: "Lun", consultas: 0 },
    { name: "Mar", consultas: 0 },
    { name: "Mié", consultas: 0 },
    { name: "Jue", consultas: 0 },
    { name: "Vie", consultas: 0 },
    { name: "Sáb", consultas: 0 },
    { name: "Dom", consultas: 0 },
];

export default function MedicalDashboard() {
    const supabase = createClient();
    const [stats, setStats] = useState({
        totalPatients: 0,
        appointmentsToday: 0,
        notesCreated: 0,
        attendanceRate: '0%'
    });
    const [chartData, setChartData] = useState<any[]>(emptyVisitData);
    const [upcomingPatients, setUpcomingPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        setLoading(true);
        const todayObj = new Date();
        const offset = todayObj.getTimezoneOffset() * 60000;
        const localTodayObj = new Date(todayObj.getTime() - offset);
        const todayStr = localTodayObj.toISOString().split('T')[0];
        
        // 1. Total Pacientes
        const { count: patientCount } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true });

        // 2. Notas Clínicas (Total)
        const { count: notesCount } = await supabase
            .from('clinical_notes')
            .select('*', { count: 'exact', head: true });

        // 3. (Móvil) Doctores Activos
        const { count: doctorsCount } = await supabase
            .from('doctors')
            .select('*', { count: 'exact', head: true });

        // 4. Citas de hoy
        const { count: appointmentsCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('appointment_date', todayStr);

        // 5. Próximos pacientes de hoy
        const { data: upcomingApps } = await supabase
            .from('appointments')
            .select(`
                id, start_time, type, status,
                patients(first_name, last_name)
            `)
            .eq('appointment_date', todayStr)
            .in('status', ['scheduled', 'in-progress'])
            .order('start_time', { ascending: true })
            .limit(5);

        // 6. Curva de consultas semanal
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(localTodayObj.getTime());
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }
        const { data: recentApps } = await supabase
            .from('appointments')
            .select('appointment_date')
            .gte('appointment_date', dates[0])
            .lte('appointment_date', dates[6]);

        const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const newChartData = dates.map(dateStr => {
            const dObj = new Date(dateStr + 'T00:00:00');
            return {
                name: weekDays[dObj.getDay()],
                consultas: recentApps?.filter(a => a.appointment_date === dateStr).length || 0
            };
        });

        setStats({
            totalPatients: patientCount || 0,
            appointmentsToday: appointmentsCount || 0,
            notesCreated: notesCount || 0,
            attendanceRate: doctorsCount ? `${doctorsCount} Docs` : '0 Docs'
        });
        setChartData(newChartData);
        setUpcomingPatients(upcomingApps || []);
        
        setLoading(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Visión Médica Integral</h1>
                    <p className="text-slate-500 mt-1 font-medium">Resumen de actividad clínica y operativa de hoy.</p>
                </div>
                <button className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-teal-500/30 transition-all hover:-translate-y-0.5">
                    <Sparkles className="w-4 h-4" />
                    IA: Analizar Patrones
                </button>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <h3 className="text-slate-500 font-semibold mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" /> Total Pacientes
                        </h3>
                        <p className="text-4xl font-extrabold text-slate-800">{loading ? '...' : stats.totalPatients}</p>
                        <div className="text-xs font-semibold text-slate-400 bg-slate-50 inline-flex items-center justify-center px-2 py-1 rounded-md mt-3 flex items-center gap-1">
                            Base de datos activa
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <h3 className="text-slate-500 font-semibold mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-500" /> Citas Hoy
                        </h3>
                        <p className="text-4xl font-extrabold text-slate-800">{stats.appointmentsToday}</p>
                        <div className="text-xs font-semibold text-amber-600 bg-amber-50 inline-flex items-center justify-center px-2 py-1 rounded-md mt-3">
                            Sin citas pendientes
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <h3 className="text-slate-500 font-semibold mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-500" /> Notas Clínicas
                        </h3>
                        <p className="text-4xl font-extrabold text-slate-800">{loading ? '...' : stats.notesCreated}</p>
                        <div className="text-xs font-semibold text-slate-500 bg-slate-100 inline-flex items-center justify-center px-2 py-1 rounded-md mt-3">
                            Expediente Electrónico
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <h3 className="text-slate-500 font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" /> Personal Médico
                        </h3>
                        <p className="text-4xl font-extrabold text-slate-800">{loading ? '...' : stats.attendanceRate.split(' ')[0]}</p>
                        <div className="text-xs font-semibold text-emerald-500 bg-emerald-50 inline-flex items-center justify-center px-2 py-1 rounded-md mt-3 flex gap-1">
                            Directorio Activo
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico Principal */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Curva de Consultas Semanal</h3>
                        <select className="text-sm font-medium border-slate-200 bg-slate-50 rounded-lg text-slate-600 px-3 py-1.5 focus:ring-teal-500 focus:border-teal-500 outline-none hover:bg-slate-100 transition-colors cursor-pointer">
                            <option>Esta Semana</option>
                            <option>Mes Pasado</option>
                        </select>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }} dx={-10} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="consultas" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorConsultas)" activeDot={{ r: 6, fill: '#0f766e', stroke: '#fff', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {chartData.every(d => d.consultas === 0) && (
                        <div className="mt-4 p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center">
                            <p className="text-xs font-medium text-slate-400">No hay suficientes datos históricos para mostrar una curva real.</p>
                        </div>
                    )}
                </div>

                {/* Próximas Citas Hoy */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
                        Próximos Pacientes
                        <span className="text-xs font-semibold bg-teal-50 text-teal-600 px-2 py-1 rounded-md">Hoy</span>
                    </h3>
                    
                    {upcomingPatients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Calendar className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="font-bold text-slate-800 text-sm">No hay citas para hoy</p>
                            <p className="text-xs font-medium text-slate-400 mt-1 max-w-[200px]">Agenda un nuevo paciente para comenzar el seguimiento.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin mt-4">
                            {upcomingPatients.map((app: any) => (
                                <div key={app.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                                    <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex flex-col items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold leading-none">{app.start_time.split(':')[0]}</span>
                                        <span className="text-[10px] font-semibold leading-none">{app.start_time.split(':')[1]}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-slate-800 truncate">
                                            {app.patients ? `${app.patients.first_name} ${app.patients.last_name}` : 'Paciente'}
                                        </p>
                                        <p className="text-xs font-medium text-slate-500 truncate">{app.type}</p>
                                    </div>
                                    {app.status === 'in-progress' && <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>}
                                </div>
                            ))}
                        </div>
                    )}

                    <Link href="/agenda">
                        <button className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-slate-200 active:scale-95">
                            Abrir Agenda Inteligente
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
