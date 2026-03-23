"use client"

import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, AlertTriangle, Pill, FileText, ChevronRight, Edit3, Trash2, Tag, Database, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function InventoryPage() {
    const supabase = createClient();
    const [medications, setMedications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingMedId, setEditingMedId] = useState<string | null>(null);

    // Formulario
    const [formData, setFormData] = useState({
        name: '', generic_name: '', presentation: '', category: 'Medicamento',
        stock_quantity: 0, minimum_stock: 5, purchase_price: 0, sale_price: '',
        location: '', expiration_date: ''
    });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('inventory_medications')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            toast.error("Error al cargar inventario. (Asegúrate de ejecutar el SQL Fase 12)");
        } else {
            setMedications(data || []);
        }
        setLoading(false);
    };

    const handleSaveMedication = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload = {
            ...formData,
            sale_price: formData.sale_price ? parseFloat(formData.sale_price.toString()) : null,
            purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price.toString()) : null,
            expiration_date: formData.expiration_date || null
        };

        if (editingMedId) {
            const { error } = await supabase.from('inventory_medications').update(payload).eq('id', editingMedId);
            if (!error) toast.success("Medicamento actualizado");
            else toast.error("Error al actualizar");
        } else {
            const { error } = await supabase.from('inventory_medications').insert([payload]);
            if (!error) toast.success("Medicamento añadido al catálogo");
            else toast.error("Error al registrar");
        }

        setIsAddModalOpen(false);
        setEditingMedId(null);
        resetForm();
        fetchInventory();
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar ${name} del inventario permanentemente?`)) return;
        
        await supabase.from('inventory_medications').delete().eq('id', id);
        toast.success("Registro eliminado");
        fetchInventory();
    };

    const resetForm = () => {
        setFormData({
            name: '', generic_name: '', presentation: '', category: 'Medicamento',
            stock_quantity: 0, minimum_stock: 5, purchase_price: 0, sale_price: '',
            location: '', expiration_date: ''
        });
    };

    const openEdit = (med: any) => {
        setFormData({
            name: med.name || '',
            generic_name: med.generic_name || '',
            presentation: med.presentation || '',
            category: med.category || 'Medicamento',
            stock_quantity: med.stock_quantity || 0,
            minimum_stock: med.minimum_stock || 5,
            purchase_price: med.purchase_price || 0,
            sale_price: med.sale_price || '',
            location: med.location || '',
            expiration_date: med.expiration_date || ''
        });
        setEditingMedId(med.id);
        setIsAddModalOpen(true);
    };

    const filteredMeds = medications.filter(m => 
        (m.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.generic_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.category?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const lowStockMeds = medications.filter(m => m.stock_quantity <= m.minimum_stock);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Cabecera */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <Package className="w-8 h-8 text-rose-500" />
                        Farmacia / Inventario Clínico
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Control de stock de medicamentos, consumibles y vitrinas.</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setEditingMedId(null); setIsAddModalOpen(true); }}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black tracking-wide text-sm transition-all shadow-md flex items-center gap-2 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Ingresar Nuevo Lote / Insumo
                </button>
            </div>

            {/* Panel de Estadísticas / Alertas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-teal-50 rounded-2xl text-teal-600"><Database className="w-6 h-6" /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Insumos</p>
                        <p className="text-2xl font-black text-slate-900">{medications.length}</p>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-[2rem] border border-amber-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 opacity-10 rounded-full blur-xl translate-x-8 -translate-y-8"></div>
                    <div className="p-4 bg-amber-50 rounded-2xl text-amber-500 animate-pulse"><AlertTriangle className="w-6 h-6" /></div>
                    <div>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Stock Crítico</p>
                        <p className="text-2xl font-black text-amber-700">{lowStockMeds.length}</p>
                    </div>
                </div>
            </div>

            {/* Listado Principal */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-indigo-500" /> Catálogo de Farmacia
                    </h3>
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Buscar medicamento..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm font-bold text-xs outline-none transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center text-slate-400 font-bold italic flex flex-col items-center gap-3">
                        <Activity className="w-8 h-8 animate-spin" /> Cargando inventario...
                    </div>
                ) : medications.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <Package className="w-16 h-16 text-slate-200" />
                        <p className="text-slate-400 font-bold">El inventario clínico está vacío.</p>
                        <button onClick={() => setIsAddModalOpen(true)} className="text-indigo-600 font-black text-xs uppercase tracking-widest mt-2 hover:underline">Añadir Primer Medicamento</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-black bg-slate-50/30">
                                    <th className="p-5 pl-8">Insumo Médico</th>
                                    <th className="p-5">Existencia</th>
                                    <th className="p-5">Ubicación</th>
                                    <th className="p-5 text-right pr-8">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50/80">
                                {filteredMeds.map((med) => {
                                    const isLow = med.stock_quantity <= med.minimum_stock;
                                    return (
                                        <tr key={med.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-5 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${isLow ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                                                        {med.category === 'Consumible' ? <Tag className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-sm tracking-tight">{med.name}</h4>
                                                        <p className="text-xs text-slate-500 font-medium mb-1 line-clamp-1">{med.generic_name} • {med.presentation}</p>
                                                        <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{med.category}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <span className={`text-xl font-black ${isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                        {med.stock_quantity}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">/ Min {med.minimum_stock}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-sm font-bold text-slate-700">{med.location || 'Sin asignar'}</span>
                                            </td>
                                            <td className="p-5 pr-8 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEdit(med)} className="p-2 bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-bold tooltip">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(med.id, med.name)} className="p-2 bg-slate-100 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Ingreso / Edición */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl relative z-10 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><Pill className="w-5 h-5" /></div>
                            <h3 className="text-xl font-black text-slate-800 flex-1">{editingMedId ? 'Modificar Registro de Farmacia' : 'Dar de Alta Insumo Médico'}</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all font-bold">X</button>
                        </div>

                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <form id="med-form" onSubmit={handleSaveMedication} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nombre Comercial *</label>
                                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none font-bold text-slate-800 text-sm" placeholder="Ej. Aspirina Protect" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nombre Genérico / Activo</label>
                                        <input value={formData.generic_name} onChange={e => setFormData({...formData, generic_name: e.target.value})} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none font-bold text-slate-800 text-sm" placeholder="Ej. Ácido Acetilsalicílico" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Presentación Física</label>
                                        <input value={formData.presentation} onChange={e => setFormData({...formData, presentation: e.target.value})} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none font-bold text-slate-800 text-sm" placeholder="Ej. Caja con 28 Tabletas (100mg)" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Categoría</label>
                                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none font-bold text-slate-800 text-sm appearance-none">
                                            <option value="Medicamento">Medicamento Base</option>
                                            <option value="Analgésico">Analgésico / Antiinflamatorio</option>
                                            <option value="Antibiótico">Antibiótico</option>
                                            <option value="Insumo">Insumo Quirúrgico / Curación</option>
                                            <option value="Consumible">Consumible Global</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-100/50 rounded-3xl border border-slate-200/60">
                                    <h5 className="font-black text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-emerald-500" /> Control de Stock e Inventario</h5>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Existencia Real</label>
                                            <input required value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})} type="number" min="0" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-emerald-400 outline-none font-black text-slate-800 text-lg text-center" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Stock Mínimo (Alarma)</label>
                                            <input value={formData.minimum_stock} onChange={e => setFormData({...formData, minimum_stock: parseInt(e.target.value) || 0})} type="number" min="0" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-emerald-400 outline-none font-bold text-slate-800 text-lg text-center" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ubicación (Pasillo/Estante)</label>
                                            <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} type="text" placeholder="Ej. Anaquel 4" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-emerald-400 outline-none font-bold text-slate-800 text-sm text-center" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Costo (Adquisición)</label>
                                        <input value={formData.purchase_price} onChange={e => setFormData({...formData, purchase_price: parseFloat(e.target.value) || 0})} type="number" step="0.01" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none font-bold text-slate-800 text-sm" placeholder="$0.00" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Vencimiento (Caducidad)</label>
                                        <input value={formData.expiration_date} onChange={e => setFormData({...formData, expiration_date: e.target.value})} type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 text-sm cursor-pointer" />
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-2xl transition-all">Cancelar</button>
                            <button type="submit" form="med-form" className="px-8 py-3 font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                                <Save className="w-5 h-5" /> {editingMedId ? 'Actualizar Medicamento' : 'Añadir al Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Icono Save
function Save(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}
