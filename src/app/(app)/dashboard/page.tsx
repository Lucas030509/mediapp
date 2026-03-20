"use client"

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, UserPlus, FileText, CheckCircle, TrendingUp, Sparkles, Video } from 'lucide-react';

const visitData = [
    { name: "Lun", consultas: 12, ingresos: 2400 },
    { name: "Mar", consultas: 19, ingresos: 3800 },
    { name: "Mié", consultas: 15, ingresos: 3000 },
    { name: "Jue", consultas: 22, ingresos: 4400 },
    { name: "Vie", consultas: 28, ingresos: 5600 },
    { name: "Sáb", consultas: 18, ingresos: 3600 },
    { name: "Dom", consultas: 5, ingresos: 1000 },
];

export default function MedicalDashboard() {
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
                        <p className="text-4xl font-extrabold text-slate-800">1,248</p>
                        <div className="text-xs font-semibold text-emerald-500 bg-emerald-50 inline-flex items-center justify-center px-2 py-1 rounded-md mt-3 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> +12% este mes
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <h3 className="text-slate-500 font-semibold mb-2 flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-amber-500" /> Citas Hoy
                        </h3>
                        <p className="text-4xl font-extrabold text-slate-800">24</p>
                        <div className="text-xs font-semibold text-amber-600 bg-amber-50 inline-flex items-center justify-center px-2 py-1 rounded-md mt-3">
                            3 requieren confirmación
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <h3 className="text-slate-500 font-semibold mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-500" /> Recetas Emitidas
                        </h3>
                        <p className="text-4xl font-extrabold text-slate-800">182</p>
                        <div className="text-xs font-semibold text-slate-500 bg-slate-100 inline-flex items-center justify-center px-2 py-1 rounded-md mt-3">
                            Últimos 7 días
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <h3 className="text-slate-500 font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" /> Tasa de Asistencia
                        </h3>
                        <p className="text-4xl font-extrabold text-slate-800">92%</p>
                        <div className="text-xs font-semibold text-emerald-500 bg-emerald-50 inline-flex items-center justify-center px-2 py-1 rounded-md mt-3 flex gap-1">
                            <TrendingUp className="w-3 h-3" /> Superior a la media
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico Principal */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Curva de Consultas Semanal</h3>
                        <select className="text-sm font-medium border-slate-200 bg-slate-50 rounded-lg text-slate-600 px-3 py-1.5 focus:ring-teal-500 focus:border-teal-500 outline-none">
                            <option>Esta Semana</option>
                            <option>Mes Pasado</option>
                        </select>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={visitData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }} dx={-10} />
                                <Tooltip
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="consultas" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorConsultas)" activeDot={{ r: 6, fill: '#0f766e', stroke: '#fff', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Próximas Citas Hoy */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
                        Próximos Pacientes
                        <span className="text-xs font-semibold bg-teal-50 text-teal-600 px-2 py-1 rounded-md">Hoy</span>
                    </h3>
                    <div className="space-y-4">
                        {/* Paciente 1 */}
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition cursor-pointer border border-transparent hover:border-slate-100 group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-700 transition-colors">
                                    EP
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">Elena Peña</p>
                                    <p className="text-xs font-semibold text-slate-500">Seguimiento Tratamiento</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-teal-600">10:30 AM</p>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Consultorio 1</p>
                            </div>
                        </div>

                        {/* Paciente 2 */}
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition cursor-pointer border border-transparent hover:border-slate-100 group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                                    MR
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">Mario Ruiz</p>
                                    <p className="text-xs font-semibold text-slate-500">Consulta Primera Vez</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-teal-600">11:15 AM</p>
                                <p className="text-xs font-semibold text-amber-500 mt-0.5">Recibir Docs</p>
                            </div>
                        </div>

                        {/* Paciente 3 */}
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition cursor-pointer border border-transparent hover:border-slate-100 group">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-700 transition-colors">
                                        AL
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-0.5 border-2 border-white">
                                        <Video className="w-2.5 h-2.5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">Ana López</p>
                                    <p className="text-xs font-semibold text-slate-500">Lectura de Estudios</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-teal-600">12:00 PM</p>
                                <p className="text-xs text-purple-600 font-semibold mt-0.5 bg-purple-50 px-1 py-0.5 rounded inline-block">Telemedicina</p>
                            </div>
                        </div>
                    </div>

                    <button className="w-full mt-6 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition">
                        Ver Agenda Completa
                    </button>
                </div>
            </div>
        </div>
    );
}
