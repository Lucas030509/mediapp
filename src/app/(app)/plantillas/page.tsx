"use client"

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, FileText, Trash2, Edit2, ClipboardList, Save, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function PlantillasPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    
    // Editor State
    const [formData, setFormData] = useState({
        template_name: '',
        category: 'NOTA_EVOLUCION',
        html_content: ''
    });

    const supabase = createClient();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('ehr_templates').select('*').order('template_name', { ascending: true });
        if (data) setTemplates(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        let error;

        if (editId) {
            const { error: updateError } = await supabase.from('ehr_templates').update({
                template_name: formData.template_name,
                category: formData.category,
                html_content: formData.html_content,
                updated_at: new Date().toISOString()
            }).eq('id', editId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('ehr_templates').insert([{
                template_name: formData.template_name,
                category: formData.category,
                html_content: formData.html_content
            }]);
            error = insertError;
        }

        setSaving(false);
        if (!error) {
            setIsModalOpen(false);
            setEditId(null);
            setFormData({ template_name: '', category: 'NOTA_EVOLUCION', html_content: '' });
            fetchTemplates();
        } else {
            toast.error("Error al guardar la plantilla.");
            console.error(error);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿Estás seguro de eliminar la plantilla "${name}"? No se podrá recuperar.`)) {
            const { error } = await supabase.from('ehr_templates').delete().eq('id', id);
            if (!error) {
                fetchTemplates();
            } else {
                toast.error("Error al eliminar la plantilla.");
            }
        }
    };

    const openEditModal = (tpl: any) => {
        setEditId(tpl.id);
        setFormData({
            template_name: tpl.template_name,
            category: tpl.category,
            html_content: tpl.html_content
        });
        setIsModalOpen(true);
    };

    const filteredTemplates = templates.filter(t => 
        t.template_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCategoryStyles = (category: string) => {
        switch(category) {
            case 'RECETA': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'NOTA_EVOLUCION': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PLAN_QUIRURGICO': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'NOTA_QUIRURGICA': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getCategoryLabel = (category: string) => {
        switch(category) {
            case 'RECETA': return 'Receta / Vademécum';
            case 'NOTA_EVOLUCION': return 'Nota de Evolución / SOAP';
            case 'PLAN_QUIRURGICO': return 'Plan Quirúrgico';
            case 'NOTA_QUIRURGICA': return 'Nota Quirúrgica';
            default: return 'Otro Formato';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Gestor de Plantillas Médicas</h1>
                    <p className="text-slate-500 mt-1 font-medium">Crea formatos predefinidos de autocompletado para acelerar tu captura en el EHR.</p>
                </div>
                <button 
                    onClick={() => { setEditId(null); setFormData({ template_name: '', category: 'NOTA_EVOLUCION', html_content: '' }); setIsModalOpen(true); }} 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Plantilla
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre de plantilla..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl outline-none transition-all font-medium text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid de Plantillas */}
            <div className="bg-transparent border-none shadow-none">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 font-medium">Cargando plantillas...</div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 font-semibold flex flex-col items-center">
                        <ClipboardList className="w-12 h-12 text-slate-300 mb-4" />
                        No tienes plantillas registradas.
                        <p className="text-sm font-normal text-slate-400 mt-2">Crea tus "machotes" habituales para recetar o evolucionar con un clic.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((tpl) => (
                            <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition group relative overflow-hidden flex flex-col justify-between">
                                {/* Decorator */}
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${getCategoryStyles(tpl.category)}`}>
                                            {getCategoryLabel(tpl.category)}
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditModal(tpl)} className="text-slate-400 hover:text-blue-600 transition" title="Editar">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(tpl.id, tpl.template_name)} className="text-slate-400 hover:text-red-500 transition" title="Eliminar">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-2">{tpl.template_name}</h3>
                                    
                                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 h-32 overflow-hidden relative">
                                        <p className="text-sm font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">
                                            {tpl.html_content.substring(0, 150)}
                                            {tpl.html_content.length > 150 ? '...' : ''}
                                        </p>
                                        {/* Fade out text at the bottom */}
                                        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-slate-50 to-transparent"></div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 font-medium">
                                    <span>Para Expediente Clínico</span>
                                    <span>ARMED Autocomplete</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Editor de Plantillas */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-blue-600" /> {editId ? 'Editar Plantilla' : 'Crear Nueva Plantilla Médica'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-lg transition"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <form id="template-form" onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-6">
                            
                            <div className="flex flex-col md:flex-row gap-5">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Descriptivo de Plantilla *</label>
                                    <input 
                                        required 
                                        type="text" 
                                        value={formData.template_name} 
                                        onChange={e => setFormData({ ...formData, template_name: e.target.value })} 
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-medium text-slate-800"
                                        placeholder="Ej. Receta Base Post-operatoria"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Así lo verás listado en los botones rápidos de tu EHR.</p>
                                </div>
                                <div className="w-full md:w-64">
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Impacto (Sección Médica) *</label>
                                    <select 
                                        required 
                                        value={formData.category} 
                                        onChange={e => setFormData({ ...formData, category: e.target.value })} 
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-bold text-slate-700"
                                    >
                                        <option value="NOTA_EVOLUCION">Nota de Evolución (SOAP)</option>
                                        <option value="RECETA">Receta Médica / Indicaciones</option>
                                        <option value="PLAN_QUIRURGICO">Plan Quirúrgico</option>
                                        <option value="NOTA_QUIRURGICA">Nota P. Quirúrgica</option>
                                        <option value="OTRO">Otro Formato</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="block text-xs font-bold text-slate-600 mb-1 flex justify-between items-center">
                                    <span>Contenido / Cuerpo de la Plantilla *</span>
                                    {formData.category === 'RECETA' && <span className="text-blue-500">Recuerda incluir gramaje y posología</span>}
                                </label>
                                <textarea 
                                    required 
                                    rows={12}
                                    value={formData.html_content} 
                                    onChange={e => setFormData({ ...formData, html_content: e.target.value })} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 resize-none font-mono"
                                    placeholder="Escribe aquí el esqueleto de tu formato médico...\n\nPor ejemplo:\n1. Paracetamol 500mg, 1 tableta cada 8 hrs.\n2. Curación local con isodine cada 24 hrs." 
                                />
                            </div>

                        </form>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 hover:bg-slate-200 font-bold text-slate-500 rounded-xl transition">Cancelar</button>
                            <button type="submit" form="template-form" disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                {saving ? 'Guardando...' : 'Guardar Plantilla Universal'}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
