"use client"

import React, { useState } from 'react';
import { Search, FileText, Activity, Pill, Scissors, FileCode2, Clock, ChevronDown, Award } from 'lucide-react';

export default function EHRPage() {
    const [activeTab, setActiveTab] = useState('timeline');

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Historia Clínica Electrónica</h1>
                    <p className="text-slate-500 mt-1 font-medium">Expediente Clínico Universal e interoperable (EHR).</p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input type="text" placeholder="Buscar expediente (ej. EXP-0921)" className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl outline-none font-medium text-sm transition-all shadow-sm text-slate-700" />
                </div>
            </div>

            {/* Patient Header Block */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20 flex flex-col items-center justify-center text-white font-bold tracking-tight">
                        EP
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                            Elena Peña Rodríguez
                            <span className="bg-blue-50 text-blue-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-blue-100">Exp. 0921-A</span>
                        </h2>
                        <div className="flex gap-4 text-sm font-semibold text-slate-500 mt-1.5">
                            <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-rose-400" /> O+</span>
                            <span>34 Años</span>
                            <span>Femenino</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl">
                        <span className="block text-xs font-bold text-rose-500 uppercase tracking-wider mb-0.5">Alergias</span>
                        <span className="text-sm font-semibold text-rose-700">Penicilina</span>
                    </div>
                    <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                        <span className="block text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Riesgo Quirúrgico</span>
                        <span className="text-sm font-semibold text-amber-700">Bajo (ASA I)</span>
                    </div>
                </div>
            </div>

            {/* EHR Navigation Module */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Navigation column */}
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 h-fit space-y-1.5">
                    <button onClick={() => setActiveTab('timeline')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'timeline' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}>
                        <Clock className={`w-5 h-5 ${activeTab === 'timeline' ? 'text-blue-600' : 'text-slate-400'}`} />
                        Línea del Tiempo
                    </button>
                    <button onClick={() => setActiveTab('notes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'notes' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}>
                        <FileText className={`w-5 h-5 ${activeTab === 'notes' ? 'text-blue-600' : 'text-slate-400'}`} />
                        Notas Clínicas
                    </button>
                    <button onClick={() => setActiveTab('rx')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'rx' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}>
                        <Pill className={`w-5 h-5 ${activeTab === 'rx' ? 'text-blue-600' : 'text-slate-400'}`} />
                        Recetas (Vademécum)
                    </button>
                    <button onClick={() => setActiveTab('surgical')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'surgical' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}>
                        <Scissors className={`w-5 h-5 ${activeTab === 'surgical' ? 'text-blue-600' : 'text-slate-400'}`} />
                        Historial Quirúrgico
                    </button>
                    <button onClick={() => setActiveTab('docs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'docs' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}>
                        <FileCode2 className={`w-5 h-5 ${activeTab === 'docs' ? 'text-blue-600' : 'text-slate-400'}`} />
                        Estudios y Consentimientos
                    </button>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">

                    {activeTab === 'timeline' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold text-slate-800">Cronología de Visitas</h3>
                                <button className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition">+ Nueva Nota Médica</button>
                            </div>

                            <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">

                                {/* Record 1 */}
                                <div className="relative pl-8">
                                    <div className="absolute -left-[21px] top-1 w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-sm">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                        <div className="flex justify-between mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-lg">Consulta de Seguimiento Cardiológico</h4>
                                                <p className="text-sm text-slate-500 font-semibold flex items-center gap-2 mt-0.5">
                                                    12 Octubre 2025 • Dr. Administrador
                                                </p>
                                            </div>
                                            <span className="bg-white border border-slate-200 px-3 py-1 rounded-md text-slate-600 font-bold text-xs h-fit shadow-sm flex items-center gap-1">
                                                <Award className="w-3 h-3 text-emerald-500" /> Firmado Electrónicamente
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Motivo de Consulta</span>
                                                <p className="text-sm text-slate-700 font-medium">Paciente acude a revisión de rutina y ajuste de tratamiento por cifras tensionales ocasionalmente elevadas por las mañanas.</p>
                                            </div>
                                            <div>
                                                <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Diagnóstico Específico (CIE-10)</span>
                                                <p className="text-sm text-blue-700 bg-blue-50 inline-block px-2 py-1 rounded font-semibold border border-blue-100">
                                                    I10 - Hipertensión esencial (primaria)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Record 2 */}
                                <div className="relative pl-8">
                                    <div className="absolute -left-[21px] top-1 w-10 h-10 rounded-full border-4 border-white bg-purple-100 text-purple-600 flex items-center justify-center font-bold shadow-sm">
                                        <FileCode2 className="w-4 h-4" />
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                        <div className="flex justify-between mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-lg">Recepción de Resultados: Electrocardiograma</h4>
                                                <p className="text-sm text-slate-500 font-semibold mt-0.5">
                                                    15 Septiembre 2025 • Laboratorio Externo
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                                                <span className="text-xs font-extrabold">PDF</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800">ECG_Reposo_ElenaP_Sep2025.pdf</p>
                                                <p className="text-xs text-slate-500 font-medium">1.2 MB • Interpretado por Dr. A. Méndez</p>
                                            </div>
                                            <button className="text-blue-600 font-bold text-sm px-3 hover:underline">Ver Documento</button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* Si es otra pestaña muestra mockup de vacío */}
                    {activeTab !== 'timeline' && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400 animate-in fade-in">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-600 mb-1">Sección en Construcción</h3>
                            <p className="text-sm font-medium">Selecciona 'Línea del Tiempo' para ver el demo completo.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
