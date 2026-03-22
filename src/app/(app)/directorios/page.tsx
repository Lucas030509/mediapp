"use client"

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Building2, Stethoscope, HeartPulse, ShieldCheck, Pill, X, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { id: 'rooms', title: 'Consultorios y Especialidades', icon: Stethoscope, color: 'blue' },
    { id: 'nurses', title: 'Enfermería y Asistencia', icon: HeartPulse, color: 'rose' },
    { id: 'hospitals', title: 'Hospitales y Quirófanos', icon: Building2, color: 'indigo' },
    { id: 'insurance_companies', title: 'Aseguradoras', icon: ShieldCheck, color: 'emerald' },
    { id: 'pharmacies', title: 'Farmacias y Laboratorios', icon: Pill, color: 'purple' },
];

export default function DirectoriosMaestrosPage() {
    const [activeTab, setActiveTab] = useState('rooms');
    const [searchTerm, setSearchTerm] = useState("");
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [schemaError, setSchemaError] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const fetchData = async (table: string) => {
        setLoading(true);
        setSchemaError(false);
        const { data: result, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
        
        if (error) {
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                setSchemaError(true);
                toast.error(`La tabla ${table} no existe. Por favor ejecuta el archivo SQL Fase 7 en tu Supabase.`);
            } else {
                toast.error("Error cargando directorio: " + error.message);
            }
            setData([]);
        } else {
            setData(result || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿Estás seguro de eliminar a ${name}?`)) {
            const { error } = await supabase.from(activeTab).delete().eq('id', id);
            if (!error) {
                toast.success("Registro eliminado");
                fetchData(activeTab);
            } else {
                toast.error("Error al eliminar el registro: " + error.message);
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        let error;

        if (editId) {
            const { error: updateError } = await supabase.from(activeTab).update(formData).eq('id', editId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from(activeTab).insert([formData]);
            error = insertError;
        }

        setSaving(false);
        if (!error) {
            setIsModalOpen(false);
            setEditId(null);
            setFormData({});
            fetchData(activeTab);
            toast.success("Registro guardado exitosamente");
        } else {
            toast.error("Error al guardar: " + error.message);
        }
    };

    const handleOpenModal = (item?: any) => {
        if (item) {
            setEditId(item.id);
            setFormData({ ...item });
        } else {
            setEditId(null);
            // Default empty fields based on tab
            const defaults: any = {
                rooms: { name: '', specialty: '' },
                nurses: { first_name: '', last_name: '', phone: '', license_number: '' },
                hospitals: { name: '', address: '', phone: '', contact_person: '' },
                insurance_companies: { name: '', contact_phone: '', portal_url: '' },
                pharmacies: { name: '', address: '', phone: '', type: 'Farmacia' }
            };
            setFormData(defaults[activeTab]);
        }
        setIsModalOpen(true);
    };

    const filteredData = data.filter(d => 
        JSON.stringify(d).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderFormFields = () => {
        switch (activeTab) {
            case 'rooms':
                return (
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Nombre del Consultorio *</label>
                            <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Ej. Consultorio 101" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Especialidad Base (Opcional)</label>
                            <input type="text" value={formData.specialty || ''} onChange={e => setFormData({ ...formData, specialty: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Ej. Pediatría, Medicina General..." />
                        </div>
                    </div>
                );
            case 'nurses':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-1">Nombre *</label>
                            <input required type="text" value={formData.first_name || ''} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-1">Apellidos *</label>
                            <input required type="text" value={formData.last_name || ''} onChange={e => setFormData({ ...formData, last_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono</label>
                            <input type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Cédula</label>
                            <input type="text" value={formData.license_number || ''} onChange={e => setFormData({ ...formData, license_number: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                    </div>
                );
            case 'hospitals':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Hospital / Clínica *</label>
                            <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1">Dirección</label>
                            <input type="text" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono (Urgencias)</label>
                            <input type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Contacto Administrativo</label>
                            <input type="text" value={formData.contact_person || ''} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                    </div>
                );
            case 'insurance_companies':
                return (
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Aseguradora *</label>
                            <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono Siniestros / Contacto</label>
                            <input type="tel" value={formData.contact_phone || ''} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">URL Portal Médico</label>
                            <input type="url" value={formData.portal_url || ''} onChange={e => setFormData({ ...formData, portal_url: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="https://" />
                        </div>
                    </div>
                );
            case 'pharmacies':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Farmacia / Lab *</label>
                            <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Institución</label>
                            <select value={formData.type || 'Farmacia'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                                <option value="Farmacia">Farmacia</option>
                                <option value="Laboratorio Clínico">Laboratorio Clínico</option>
                                <option value="Gabinete de Imagen">Gabinete de Imagen</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono</label>
                            <input type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1">Dirección / Sucursal</label>
                            <input type="text" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Directorios e Instituciones</h1>
                    <p className="text-slate-500 mt-1 font-medium">Gestiona enfermeras, hospitales, farmacias y seguros médicos.</p>
                </div>

                <div className="flex gap-2 p-1.5 bg-slate-200/50 rounded-2xl w-full xl:w-auto overflow-x-auto">
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const isActive = activeTab === cat.id;
                        return (
                            <button 
                                key={cat.id} 
                                onClick={() => setActiveTab(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all focus:outline-none whitespace-nowrap
                                    ${isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                                `}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? `text-${cat.color}-500` : ''}`} />
                                {cat.title}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={`Buscar en ${CATEGORIES.find(c => c.id === activeTab)?.title.toLowerCase()}...`}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl outline-none transition-all font-medium text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <button 
                    onClick={() => handleOpenModal()} 
                    disabled={schemaError}
                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all hover:-translate-y-0.5 w-full md:w-auto"
                >
                    <Plus className="w-5 h-5" />
                    Añadir Registro
                </button>
            </div>

            {/* Listado dinámico */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {schemaError ? (
                    <div className="p-16 text-center text-slate-500 font-semibold flex flex-col items-center">
                        <AlertCircle className="w-16 h-16 text-red-300 mb-4" />
                        <h3 className="text-xl text-slate-800">Actualización Requerida</h3>
                        <p className="max-w-md mt-2 text-slate-500 leading-relaxed">
                            No se encontraron las tablas de directorios. Pide a tu administrador que ejecute el archivo <code className="bg-slate-100 px-2 py-0.5 rounded text-rose-500 border border-slate-200">ehr_phase7_armed.sql</code> en el editor SQL de Supabase para activar esta función de ARMED.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="p-12 text-center text-slate-400 font-medium">Cargando directorio...</div>
                ) : filteredData.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 font-semibold flex flex-col items-center">
                        <Building2 className="w-12 h-12 text-slate-300 mb-4" />
                        El directorio está vacío.
                        <p className="text-sm font-normal text-slate-400 mt-2">Agrega instituciones o personal de apoyo usando el botón superior.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider font-bold text-slate-500">
                                    <th className="p-4 pl-6">Nombre Principal</th>
                                    <th className="p-4">Detalle / ID</th>
                                    <th className="p-4">Contacto</th>
                                    <th className="p-4 pr-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 transition group">
                                        <td className="p-4 pl-6 font-bold text-slate-800">
                                            {activeTab === 'nurses' ? `${item.first_name} ${item.last_name}` : item.name}
                                        </td>
                                        <td className="p-4">
                                            {activeTab === 'rooms' && <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100">{item.specialty || 'Uso General'}</span>}
                                            {activeTab === 'nurses' && <span className="text-xs font-semibold px-2 py-1 bg-rose-50 text-rose-700 rounded-md border border-rose-100">Enfermería / Cédula: {item.license_number || 'N/D'}</span>}
                                            {activeTab === 'pharmacies' && <span className="text-xs font-semibold px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-100">{item.type}</span>}
                                            {(activeTab === 'hospitals' || activeTab === 'pharmacies') && <p className="text-xs font-medium text-slate-500 mt-1 max-w-[200px] truncate">{item.address || 'Sin dirección'}</p>}
                                            {activeTab === 'insurance_companies' && <a href={item.portal_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">{item.portal_url || 'Sin Portal Clínico'}</a>}
                                        </td>
                                        <td className="p-4 font-medium text-slate-500 text-sm">
                                            {item.phone || item.contact_phone || 'N/A'}
                                            {item.contact_person && <span className="block text-xs mt-0.5">({item.contact_person})</span>}
                                        </td>
                                        <td className="p-4 pr-6 text-right space-x-2">
                                            <button onClick={() => handleOpenModal(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block" title="Editar">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(item.id, activeTab === 'nurses' ? item.first_name : item.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block" title="Eliminar">
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">{editId ? 'Editar Registro' : 'Nuevo Registro'} - {CATEGORIES.find(c => c.id === activeTab)?.title}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6">
                            {renderFormFields()}
                            
                            <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-8">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-md disabled:opacity-50">
                                    {saving ? 'Guardando...' : 'Guardar Datos'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
