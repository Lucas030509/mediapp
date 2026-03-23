"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, Users, Shield, Save, Check, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConfiguradorPage() {
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<'clinica' | 'roles' | 'facturacion'>('clinica');
    const [roles, setRoles] = useState<{ position: string, activeModules: string[] }[]>([]);
    
    // Clinic Settings State
    const [duration, setDuration] = useState(30);
    const [hours, setHours] = useState<any>({
        monday: { start: '09:00', end: '18:00', active: true },
        tuesday: { start: '09:00', end: '18:00', active: true },
        wednesday: { start: '09:00', end: '18:00', active: true },
        thursday: { start: '09:00', end: '18:00', active: true },
        friday: { start: '09:00', end: '18:00', active: true },
        saturday: { start: '09:00', end: '14:00', active: true },
        sunday: { start: '09:00', end: '14:00', active: false },
    });
    
    // PAC/SAT Settings State
    const [pacSettings, setPacSettings] = useState({
        rfc: '',
        regimen_fiscal: '601',
        zip_code: '',
        cer_file: null as any,
        key_file: null as any,
        pac_api_key: ''
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const { data, error } = await supabase.from('clinic_settings').select('*').single();
        if (data) {
            setDuration(data.consultation_duration_minutes);
            if (data.business_hours) setHours(data.business_hours);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        const { error } = await supabase.from('clinic_settings').upsert({
            id: (await supabase.from('clinic_settings').select('id').single()).data?.id,
            consultation_duration_minutes: duration,
            business_hours: hours,
            updated_at: new Date().toISOString()
        });

        setSaving(false);
        if (!error) toast.success("Configuración actualizada correctamente");
        else toast.error("Error al guardar: " + error.message);
    };

    const days = [
        { key: 'monday', label: 'Lunes' },
        { key: 'tuesday', label: 'Martes' },
        { key: 'wednesday', label: 'Miércoles' },
        { key: 'thursday', label: 'Jueves' },
        { key: 'friday', label: 'Viernes' },
        { key: 'saturday', label: 'Sábado' },
        { key: 'sunday', label: 'Domingo' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Configuración del Centro</h1>
                    <p className="text-slate-500 mt-1 font-medium">Ajusta los parámetros operativos y de seguridad de tu clínica.</p>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('clinica')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'clinica' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Clock className="w-4 h-4" /> Operación
                    </button>
                    <button 
                        onClick={() => setActiveTab('facturacion')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'facturacion' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Shield className="w-4 h-4" /> SAT y Facturación
                    </button>
                    <button 
                        onClick={() => setActiveTab('roles')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'roles' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users className="w-4 h-4" /> Accesos y Roles
                    </button>
                </div>
            </div>

            {activeTab === 'clinica' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Horarios Columna */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-indigo-500" /> Horario Semanal de Apertura
                            </h3>
                            
                            <div className="space-y-4">
                                {days.map((day) => (
                                    <div key={day.key} className={`flex flex-col md:flex-row items-center justify-between p-4 rounded-2xl border transition-all ${hours[day.key].active ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-transparent opacity-60'}`}>
                                        <div className="flex items-center gap-4 w-full md:w-48 mb-4 md:mb-0">
                                            <input 
                                                type="checkbox" 
                                                checked={hours[day.key].active}
                                                onChange={(e) => setHours({ ...hours, [day.key]: { ...hours[day.key], active: e.target.checked }})}
                                                className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500" 
                                            />
                                            <span className={`font-bold ${hours[day.key].active ? 'text-slate-800' : 'text-slate-400'}`}>{day.label}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="flex-1">
                                                <input 
                                                    type="time" 
                                                    disabled={!hours[day.key].active}
                                                    value={hours[day.key].start}
                                                    onChange={(e) => setHours({ ...hours, [day.key]: { ...hours[day.key], start: e.target.value }})}
                                                    className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700 disabled:opacity-50"
                                                />
                                            </div>
                                            <span className="text-slate-300 font-bold">a</span>
                                            <div className="flex-1">
                                                <input 
                                                    type="time" 
                                                    disabled={!hours[day.key].active}
                                                    value={hours[day.key].end}
                                                    onChange={(e) => setHours({ ...hours, [day.key]: { ...hours[day.key], end: e.target.value }})}
                                                    className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700 disabled:opacity-50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Ajustes Rápidos */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] shadow-xl text-white">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Clock className="w-6 h-6 text-teal-400" /> Tiempo Médico
                            </h3>
                            
                            <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Duración por Consulta</label>
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {[15, 20, 30, 45, 60, 90].map((t) => (
                                    <button 
                                        key={t}
                                        onClick={() => setDuration(t)}
                                        className={`py-3 rounded-xl font-bold transition-all border ${duration === t ? 'bg-teal-500 border-teal-400 text-white shadow-lg shadow-teal-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                    >
                                        {t}'
                                    </button>
                                ))}
                            </div>
                            
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
                                    * Este tiempo se usará para calcular automáticamente la hora de fin al agendar citas nuevas en la agenda inteligente.
                                </p>
                            </div>

                            <button 
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="w-full mt-8 bg-white text-slate-900 py-4 rounded-2xl font-extrabold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 shadow-xl"
                            >
                                {saving ? 'Guardando...' : <><Save className="w-5 h-5" /> Guardar Todo</>}
                            </button>
                        </div>
                        
                        <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
                             <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Check className="w-5 h-5" /> Configuración Activa</h4>
                             <p className="text-sm text-indigo-700/80 font-medium">
                                Tu agenda está configurada para consultas de <strong>{duration} minutos</strong> de 
                                {days.filter(d => hours[d.key].active).length} días a la semana.
                             </p>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'facturacion' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
                             <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Shield className="w-6 h-6 text-indigo-500" /> Credenciales y Timbres PAC
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2">RFC Emisor (Clínica/Médico)</label>
                                    <input value={pacSettings.rfc} onChange={e => setPacSettings({...pacSettings, rfc: e.target.value})} type="text" placeholder="GODE850312XX1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 outline-none font-bold text-slate-700 uppercase" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-2">Régimen Fiscal</label>
                                        <select value={pacSettings.regimen_fiscal} onChange={e => setPacSettings({...pacSettings, regimen_fiscal: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 outline-none font-bold text-slate-700">
                                            <option value="601">601 - General de Ley Personas Morales</option>
                                            <option value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                                            <option value="626">626 - RESICO Personas Físicas</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-2">C.P. Expedición</label>
                                        <input value={pacSettings.zip_code} onChange={e => setPacSettings({...pacSettings, zip_code: e.target.value})} type="text" placeholder="11000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 outline-none font-bold text-slate-700" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2 mt-4">API Key Proveedor PAC (Ej. Facturador.com)</label>
                                    <input value={pacSettings.pac_api_key} onChange={e => setPacSettings({...pacSettings, pac_api_key: e.target.value})} type="password" placeholder="******************" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 outline-none font-bold text-slate-700" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] shadow-xl p-8 border border-indigo-800 text-white">
                             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Save className="w-6 h-6 text-teal-400" /> Certificados CSD
                            </h3>
                            <p className="text-sm font-medium text-slate-300 mb-6">Sube tu Certificado de Sello Digital (.CER) y tu llave privada (.KEY) junto con su contraseña para poder timbrar CFDI 4.0 directamente.</p>
                            
                            <div className="space-y-4">
                                <div className="p-4 border-2 border-dashed border-indigo-700 rounded-xl bg-indigo-900/40 text-center hover:bg-indigo-800/50 cursor-pointer transition">
                                    <span className="font-bold text-sm text-indigo-300">📁 Seleccionar Archivo .CER</span>
                                </div>
                                <div className="p-4 border-2 border-dashed border-indigo-700 rounded-xl bg-indigo-900/40 text-center hover:bg-indigo-800/50 cursor-pointer transition">
                                    <span className="font-bold text-sm text-indigo-300">🔑 Seleccionar Archivo .KEY</span>
                                </div>
                                <div>
                                    <input type="password" placeholder="Contraseña de la Clave Privada" className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-indigo-700 rounded-xl focus:border-teal-400 outline-none font-bold text-white text-sm" />
                                </div>
                            </div>

                            <button className="w-full mt-8 bg-teal-500 hover:bg-teal-400 text-slate-900 py-3 rounded-xl font-black shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2">
                                <Check className="w-5 h-5" /> Guardar Configuración SAT
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in duration-300">
                    <div className="flex items-center gap-4 mb-6">
                        <p className="text-slate-500 max-w-2xl font-medium leading-relaxed">
                            Asigna a qué submódulos (Features) tiene acceso cada puesto laboral. Esto define los permisos globales de la plataforma.
                        </p>
                        <div className="flex-1"></div>
                        <a 
                            href="/configurador/usuarios"
                            className="flex items-center gap-2 bg-white border border-slate-200 text-indigo-600 px-5 py-2.5 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm group"
                        >
                            <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Gestionar Usuarios
                        </a>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 font-bold text-xs uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="p-6 pl-8">Puesto Laboral</th>
                                    <th className="p-6">Módulos Permitidos</th>
                                    <th className="p-6 pr-8 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {roles.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-16 text-center text-slate-400 font-bold italic">
                                            No hay roles o puestos configurados aún.
                                        </td>
                                    </tr>
                                ) : roles.map((rol, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-6 pl-8 font-extrabold text-slate-800">{rol.position}</td>
                                        <td className="p-6 text-sm flex gap-2">
                                            {rol.activeModules.map((m, j) => (
                                                <span key={j} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100">
                                                    {m}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="p-6 pr-8 text-right">
                                            <button className="text-indigo-600 hover:text-indigo-800 font-bold text-sm transition-all hover:underline">
                                                Editar Permisos
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
