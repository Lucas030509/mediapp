"use client"

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Stethoscope, Mail, Phone, X, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function DoctoresPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });
    const [specialties, setSpecialties] = useState<{ id: string, name: string }[]>([]);

    const [formData, setFormData] = useState({
        first_name: '', last_name: '', second_last_name: '', rfc: '', specialty_id: '', license_number: '', phone: '', email: ''
    });
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchSpecialties();
        fetchDoctors();
    }, []);

    const fetchSpecialties = async () => {
        const { data } = await supabase.from('specialties').select('id, name').order('name', { ascending: true });
        if (data) setSpecialties(data);
    };

    const fetchDoctors = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('doctors').select('*, specialties(id, name)').order('created_at', { ascending: false });
        if (data) setDoctors(data);
        setLoading(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿Estás seguro de eliminar a ${name}? Esta acción no se puede deshacer.`)) {
            const { error } = await supabase.from('doctors').delete().eq('id', id);
            if (!error) {
                fetchDoctors();
            } else {
                toast.error("Error al eliminar el médico.");
                console.error(error);
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        let error;

        if (editId) {
            const specName = specialties.find(s => s.id === formData.specialty_id)?.name || '';
            const { error: updateError } = await supabase.from('doctors').update({
                first_name: formData.first_name,
                last_name: formData.last_name,
                second_last_name: formData.second_last_name,
                rfc: formData.rfc,
                specialty_id: formData.specialty_id || null,
                specialty: specName, // Defensive fallback for old schema
                license_number: formData.license_number,
                phone: formData.phone,
                email: formData.email
            }).eq('id', editId);
            error = updateError;
        } else {
            const specName = specialties.find(s => s.id === formData.specialty_id)?.name || '';
            const { error: insertError } = await supabase.from('doctors').insert([{
                first_name: formData.first_name,
                last_name: formData.last_name,
                second_last_name: formData.second_last_name,
                rfc: formData.rfc,
                specialty_id: formData.specialty_id || null,
                specialty: specName, // Defensive fallback for old schema
                license_number: formData.license_number,
                phone: formData.phone,
                email: formData.email
            }]);
            error = insertError;
        }

        setSaving(false);
        if (!error) {
            setIsModalOpen(false);
            setEditId(null);
            setFormData({ first_name: '', last_name: '', second_last_name: '', rfc: '', specialty_id: '', license_number: '', phone: '', email: '' });
            fetchDoctors();
        } else {
            setErrorModal({
                isOpen: true,
                title: "Error de Guardado",
                message: error.message || "Ocurrió un error inesperado al contactar con la base de datos."
            });
            console.error(error);
        }
    };

    const filteredDoctors = doctors.filter(d => {
        const specName = d.specialties?.name || d.specialty || '';
        return `${d.first_name} ${d.last_name} ${d.second_last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            specName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.license_number && d.license_number.includes(searchTerm));
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Directorio de Médicos</h1>
                    <p className="text-slate-500 mt-1 font-medium">Catálogo de especialistas y registros de cédula profesional.</p>
                </div>

                <button onClick={() => { setEditId(null); setFormData({ first_name: '', last_name: '', second_last_name: '', rfc: '', specialty_id: '', license_number: '', phone: '', email: '' }); setIsModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all hover:-translate-y-0.5">
                    <Plus className="w-5 h-5" />
                    Nuevo Doctor
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, especialidad o cédula..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl outline-none transition-all font-medium text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 font-medium">Cargando directorio...</div>
                ) : filteredDoctors.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 font-semibold flex flex-col items-center">
                        <Stethoscope className="w-12 h-12 text-slate-300 mb-4" />
                        No se encontraron doctores registrados en tu Clínica.
                        <p className="text-sm font-normal text-slate-400 mt-2">Agrega un especialista para que pueda aparecer en la agenda.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider font-bold text-slate-500">
                                    <th className="p-4 pl-6">Doctor</th>
                                    <th className="p-4">Especialidad</th>
                                    <th className="p-4">Cédula Prof.</th>
                                    <th className="p-4">Contacto</th>
                                    <th className="p-4 text-center">Estado</th>
                                    <th className="p-4 pr-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDoctors.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50/70 transition group cursor-pointer">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 tracking-tighter">
                                                    Dr
                                                </div>
                                                <div className="font-bold text-slate-800">{doc.first_name} {doc.last_name} {doc.second_last_name || ''}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md text-xs border border-indigo-100">{doc.specialties?.name || doc.specialty || 'Sin Especialidad'}</span>
                                        </td>
                                        <td className="p-4 font-bold text-slate-700">{doc.license_number}</td>
                                        <td className="p-4 font-medium text-slate-500 text-sm">
                                            <div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {doc.phone || 'N/A'}</div>
                                            <div className="flex items-center gap-1 mt-1 text-xs"><Mail className="w-3.5 h-3.5" /> {doc.email || 'N/A'}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center justify-center px-2 py-1 bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded uppercase">Activo</span>
                                        </td>
                                        <td className="p-4 pr-6 text-right space-x-2">
                                            <button onClick={(e) => { e.stopPropagation(); setEditId(doc.id); setFormData({ first_name: doc.first_name, last_name: doc.last_name, second_last_name: doc.second_last_name || '', rfc: doc.rfc || '', specialty_id: doc.specialty_id || '', license_number: doc.license_number, phone: doc.phone || '', email: doc.email || '' }); setIsModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block text-slate-600" title="Editar">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.first_name); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block text-slate-600" title="Eliminar">
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

            {/* Slide-over / Modal for New Doctor */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Stethoscope className="w-5 h-5 text-indigo-600" /> {editId ? 'Editar Especialista' : 'Alta de Médico Especialista'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Sección 1: Datos Personales */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Información Básica</h4>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Nombre (s) *</label>
                                        <input required type="text" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium text-slate-700" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Apellido Paterno *</label>
                                            <input required type="text" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium text-slate-700" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Apellido Materno</label>
                                            <input type="text" value={formData.second_last_name} onChange={e => setFormData({ ...formData, second_last_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium text-slate-700" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Especialidad *</label>
                                            <select required value={formData.specialty_id} onChange={e => setFormData({ ...formData, specialty_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium text-slate-700">
                                                <option value="" disabled>Selecciona una especialidad</option>
                                                {specialties.map(spec => (
                                                    <option key={spec.id} value={spec.id}>{spec.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Cédula Profesional *</label>
                                            <input required type="text" value={formData.license_number} onChange={e => setFormData({ ...formData, license_number: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium text-slate-700 font-mono" />
                                        </div>
                                    </div>
                                </div>

                                {/* Sección 2: Contacto y Administrativo */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Contacto y Admisión</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono Móvil</label>
                                            <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium text-slate-700" placeholder="10 Dígitos" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">RFC</label>
                                            <input type="text" value={formData.rfc} onChange={e => setFormData({ ...formData, rfc: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium text-slate-700 uppercase" placeholder="13 Caracteres" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Correo Electrónico</label>
                                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium text-slate-700" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-8">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md disabled:opacity-50">
                                    {saving ? 'Registrando...' : 'Registrar Médico'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {errorModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{errorModal.title}</h3>
                                <p className="text-sm text-slate-500 mt-2 font-medium">{errorModal.message}</p>
                            </div>
                            <button onClick={() => setErrorModal({ isOpen: false, title: '', message: '' })} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-colors mt-4">
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
