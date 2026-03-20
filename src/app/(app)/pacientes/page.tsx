"use client"

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, FileText, Calendar, ShieldAlert, X, Users, Trash2, Edit2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function PacientesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', second_last_name: '', alias: '', rfc: '', email: '', phone: '', date_of_birth: '', blood_type: '', main_condition: '', risk: 'low',
        // Fiscal Data (ARMED)
        business_name: '', postal_code: '', tax_regime: ''
    });
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchPatients();
        }, 300); // 300ms debounce
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchPatients = async () => {
        setLoading(true);
        let query = supabase.from('patients').select('*').order('created_at', { ascending: false });

        if (searchTerm) {
            // Using ilike searches across name, phone, etc. leveraging trgm on the backend
            const term = `%${searchTerm}%`;
            query = query.or(`first_name.ilike.${term},last_name.ilike.${term},second_last_name.ilike.${term},rfc.ilike.${term},phone.ilike.${term},main_condition.ilike.${term}`);
        }

        const { data, error } = await query;
        if (data) setPatients(data);
        setLoading(false);
    };

    const calculateAge = (dob: string) => {
        if (!dob) return '-';
        const diff = Date.now() - new Date(dob).getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿Estás seguro de eliminar al paciente ${name}? Esta acción no se puede deshacer.`)) {
            const { error } = await supabase.from('patients').delete().eq('id', id);
            if (!error) {
                fetchPatients();
            } else {
                toast.error("Error al eliminar el paciente.");
                console.error(error);
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // 🛑 SISTEMA DE ALERTAS ARMED: CHECK DE DUPLICADOS
        if (!editId) {
            // Revisión estricta si el usuario existe (Match nombre OR Fecha nacimiento)
            const term = `%${formData.first_name}%`;
            let orQuery = `first_name.ilike.${term}`;
            if (formData.date_of_birth !== '') {
                orQuery += `,date_of_birth.eq.${formData.date_of_birth}`;
            }

            const { data: duplicates } = await supabase
                .from('patients')
                .select('first_name, last_name, date_of_birth')
                .or(orQuery);

            if (duplicates && duplicates.length > 0) {
                const isConfirmed = confirm(
                    `⚠️ ¡PRECAUCIÓN!\nHemos detectado un posible paciente duplicado con Nombre similar (${duplicates[0].first_name} ${duplicates[0].last_name}) o Fecha de Nacimiento coincidente.\n\n¿Estás seguro de que deseas crear un nuevo expediente?`
                );
                if (!isConfirmed) return; // Se aborta la inserción
            }
        }

        setSaving(true);
        let error;

        if (editId) {
            const { error: updateError } = await supabase.from('patients').update({
                first_name: formData.first_name,
                last_name: formData.last_name,
                second_last_name: formData.second_last_name,
                alias: formData.alias,
                rfc: formData.rfc,
                email: formData.email,
                phone: formData.phone,
                date_of_birth: formData.date_of_birth === '' ? null : formData.date_of_birth,
                blood_type: formData.blood_type,
                main_condition: formData.main_condition,
                status: formData.risk,
            }).eq('id', editId);
            error = updateError;

            // Actualizar datos fiscales (upsert por si no existían antes)
            if (formData.business_name || formData.rfc) {
                await supabase.from('patient_billing').upsert({
                    patient_id: editId,
                    tax_id: formData.rfc,
                    business_name: formData.business_name,
                    postal_code: formData.postal_code,
                    tax_regime: formData.tax_regime
                }, { onConflict: 'patient_id' });
            }

        } else {
            const { data: newPatient, error: insertError } = await supabase.from('patients').insert([
                {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    second_last_name: formData.second_last_name,
                    alias: formData.alias,
                    rfc: formData.rfc,
                    email: formData.email,
                    phone: formData.phone,
                    date_of_birth: formData.date_of_birth === '' ? null : formData.date_of_birth,
                    blood_type: formData.blood_type,
                    main_condition: formData.main_condition,
                    status: formData.risk,
                }
            ]).select().single();
            
            error = insertError;

            // Insertar datos fiscales asociados
            if (newPatient && (formData.business_name || formData.rfc)) {
                await supabase.from('patient_billing').insert({
                    patient_id: newPatient.id,
                    tax_id: formData.rfc,
                    business_name: formData.business_name,
                    postal_code: formData.postal_code,
                    tax_regime: formData.tax_regime
                });
            }
        }

        setSaving(false);
        if (!error) {
            setIsModalOpen(false);
            setEditId(null);
            setFormData({ first_name: '', last_name: '', second_last_name: '', alias: '', rfc: '', email: '', phone: '', date_of_birth: '', blood_type: '', main_condition: '', risk: 'low', business_name: '', postal_code: '', tax_regime: '' });
            fetchPatients();
        } else {
            toast.error("Hubo un error al guardar el paciente.");
            console.error(error);
        }
    };

    // Eliminamos el filtrado local porque ahora es Server Side Search
    const filteredPatients = patients;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Gestión de Pacientes</h1>
                    <p className="text-slate-500 mt-1 font-medium">Administra el expediente clínico y demográficos (EHR Core).</p>
                </div>

                <button onClick={() => { setEditId(null); setFormData({ first_name: '', last_name: '', second_last_name: '', alias: '', rfc: '', email: '', phone: '', date_of_birth: '', blood_type: '', main_condition: '', risk: 'low', business_name: '', postal_code: '', tax_regime: '' }); setIsModalOpen(true); }} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all hover:-translate-y-0.5">
                    <Plus className="w-5 h-5" />
                    Alta de Paciente
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, diagnóstico o teléfono..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl outline-none transition-all font-medium text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition">
                        <Filter className="w-4 h-4" /> Filtros
                    </button>
                </div>
            </div>

            {/* Data table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 font-medium">Cargando base de datos de pacientes...</div>
                ) : filteredPatients.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 font-semibold flex flex-col items-center">
                        <Users className="w-12 h-12 text-slate-300 mb-4" />
                        Ingresa tu primer paciente a la base de datos de la Clínica.
                        <p className="text-sm font-normal text-slate-400 mt-2">Haz clic en el botón Alta de Paciente arriba.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider font-bold text-slate-500">
                                    <th className="p-4 pl-6">Paciente</th>
                                    <th className="p-4">Edad</th>
                                    <th className="p-4">Condición Principal</th>
                                    <th className="p-4">Contacto</th>
                                    <th className="p-4">Fecha de Alta</th>
                                    <th className="p-4 text-center">Riesgo</th>
                                    <th className="p-4 pr-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-slate-50/70 transition group cursor-pointer">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-teal-50 border border-teal-100 flex items-center justify-center font-bold text-teal-700 tracking-tighter uppercase">
                                                    {patient.first_name[0]}{patient.last_name?.[0] || ''}
                                                </div>
                                                <div className="font-bold text-slate-800">
                                                    {patient.first_name} {patient.last_name} {patient.second_last_name || ''}
                                                    {patient.alias && <span className="block text-xs font-semibold text-slate-500 mt-0.5 italic">"{patient.alias}"</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-600">{calculateAge(patient.date_of_birth)} a</td>
                                        <td className="p-4">
                                            <span className="font-medium text-slate-700 truncate max-w-[200px] block">{patient.main_condition || 'Sin diagnóstico registrado'}</span>
                                        </td>
                                        <td className="p-4 font-medium text-slate-500 text-sm">{patient.phone || 'N/A'}</td>
                                        <td className="p-4 text-sm font-semibold text-slate-500 flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(patient.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            {patient.status === 'low' && <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold" title="Riesgo Bajo"><ShieldAlert className="w-4 h-4" /></span>}
                                            {patient.status === 'medium' && <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-bold" title="Riesgo Medio"><ShieldAlert className="w-4 h-4" /></span>}
                                            {patient.status === 'high' && <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 animate-pulse font-bold" title="Riesgo Alto"><ShieldAlert className="w-4 h-4" /></span>}
                                        </td>
                                        <td className="p-4 pr-6 text-right space-x-2">
                                            {/* Link al módulo clínico individual detallado (Layout Perfil Paciente) */}
                                            <a href={`/ehr/${patient.id}`} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors inline-block" title="Abrir Expediente EHR">
                                                <FileText className="w-4 h-4" />
                                            </a>
                                            <button onClick={async (e) => { 
                                                e.stopPropagation(); 
                                                setEditId(patient.id); 
                                                
                                                // Descargar info fiscal previa
                                                const { data: billData } = await supabase.from('patient_billing').select('*').eq('patient_id', patient.id).single();
                                                
                                                setFormData({ 
                                                    first_name: patient.first_name, last_name: patient.last_name, second_last_name: patient.second_last_name || '', alias: patient.alias || '', rfc: patient.rfc || '', email: patient.email || '', phone: patient.phone || '', date_of_birth: patient.date_of_birth || '', blood_type: patient.blood_type || '', main_condition: patient.main_condition || '', risk: patient.status || 'low',
                                                    business_name: billData?.business_name || '',
                                                    postal_code: billData?.postal_code || '',
                                                    tax_regime: billData?.tax_regime || ''
                                                }); 
                                                setIsModalOpen(true); 
                                            }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block text-slate-600" title="Editar Demográficos">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(patient.id, patient.first_name); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block" title="Eliminar">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal for New Patient */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Plus className="w-5 h-5 text-teal-600" /> {editId ? 'Editar Paciente' : 'Alta de Nuevo Paciente'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Sección 1: Datos Personales */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Información Básica</h4>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Nombre(s) *</label>
                                        <input required type="text" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Apellido Paterno *</label>
                                            <input required type="text" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Apellido Materno</label>
                                            <input type="text" value={formData.second_last_name} onChange={e => setFormData({ ...formData, second_last_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Fecha Nacimiento</label>
                                            <input type="date" value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Tipo Sanguíneo</label>
                                            <select value={formData.blood_type} onChange={e => setFormData({ ...formData, blood_type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700 text-sm">
                                                <option value="">Selecciona</option>
                                                <option value="A+">A+</option><option value="A-">A-</option>
                                                <option value="B+">B+</option><option value="B-">B-</option>
                                                <option value="O+">O+</option><option value="O-">O-</option>
                                                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Descriptivo / Alias</label>
                                            <input type="text" value={formData.alias} onChange={e => setFormData({ ...formData, alias: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700 text-sm" placeholder="Ej. El de telcel, familiar de Dr..." />
                                        </div>
                                    </div>
                                </div>

                                {/* Sección 2: Contacto y Médico */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Contacto y Admisión</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono Móvil</label>
                                            <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700" placeholder="10 Dígitos" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">RFC</label>
                                            <input type="text" value={formData.rfc} onChange={e => setFormData({ ...formData, rfc: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700 uppercase" placeholder="13 Caracteres" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Diagnóstico / Condición Principal</label>
                                        <input type="text" value={formData.main_condition} onChange={e => setFormData({ ...formData, main_condition: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700" placeholder="Ej. Hipertensión (Opcional)" />
                                    </div>
                                    <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Nivel de Riesgo Clínico</label>
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                <button type="button" onClick={() => setFormData({ ...formData, risk: 'low' })} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${formData.risk === 'low' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>Bajo</button>
                                                <button type="button" onClick={() => setFormData({ ...formData, risk: 'medium' })} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${formData.risk === 'medium' ? 'bg-white shadow text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}>Medio</button>
                                                <button type="button" onClick={() => setFormData({ ...formData, risk: 'high' })} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${formData.risk === 'high' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:text-slate-700'}`}>Alto</button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Sección 3: Datos de Facturación / Fiscal (ARMED Feature) */}
                                    <div className="space-y-4 md:col-span-2 mt-4 pt-4 border-t border-slate-100">
                                        <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 pb-2 flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5" /> Ficha Fiscal (Facturación) <span className="font-normal text-slate-300 text-[10px]">- Opcional</span>
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-1">Razón Social</label>
                                                <input type="text" value={formData.business_name} onChange={e => setFormData({ ...formData, business_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700" placeholder="Ej. Empresa SA de CV" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-1">Código Postal</label>
                                                <input type="text" value={formData.postal_code} onChange={e => setFormData({ ...formData, postal_code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700" placeholder="5 Dígitos" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-1">Régimen Fiscal</label>
                                                <select value={formData.tax_regime} onChange={e => setFormData({ ...formData, tax_regime: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-medium text-slate-700 text-sm">
                                                    <option value="">No aplica</option>
                                                    <option value="601">601 General de Ley Personas Morales</option>
                                                    <option value="606">606 Arrendamiento</option>
                                                    <option value="612">612 Personas Físicas Actividades Empresariales</option>
                                                    <option value="626">626 RESICO</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-8">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-md disabled:opacity-50">
                                    {saving ? 'Registrando...' : 'Registrar Paciente'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}
