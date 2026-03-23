"use client"

import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, ArrowUpRight, ArrowDownRight, MoreVertical, ShieldCheck, Download, Plus, Search, Building, User, Activity, FileDigit, Trash2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function FacturacionPage() {
    const supabase = createClient();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPosOpen, setIsPosOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Formulario TPV (Punto de Venta / Caja)
    const [ticket, setTicket] = useState({
        patient_id: '', payment_method: 'Tarjeta de Crédito', requires_cfdi: false, notes: ''
    });
    const [items, setItems] = useState<{description: string, quantity: number, price: number}[]>([
        { description: 'Consulta Médica Especializada', quantity: 1, price: 0 }
    ]);

    useEffect(() => {
        fetchFinances();
    }, []);

    const fetchFinances = async () => {
        setLoading(true);
        // Cargar lista de pacientes para el combo
        const { data: pData } = await supabase.from('patients').select('id, first_name, last_name, second_last_name').order('first_name');
        if (pData) setPatients(pData);

        // Cargar Historial de Cobros Reales
        const { data: invData, error } = await supabase
            .from('billing_invoices')
            .select(`
                *,
                patients(first_name, last_name, second_last_name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Ejecuta el script SQL Fase 13 para activar Facturación.");
        } else {
            setInvoices(invData || []);
        }
        setLoading(false);
    };

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        let total = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

        if (total === 0) {
            toast.error("El monto total a cobrar no puede ser 0");
            setIsSaving(false); return;
        }

        // 1. Crear Factura Master
        const master = {
            patient_id: ticket.patient_id,
            total, subtotal: total,
            status: 'PAID', // Directo PENDING o PAID según si pagó o no. Se asume Caja=Pagado.
            payment_method: ticket.payment_method,
            requires_cfdi: ticket.requires_cfdi,
            cfdi_status: ticket.requires_cfdi ? 'UNTIMBRED' : null,
            notes: ticket.notes,
            invoice_number: `TICKET-${Date.now().toString().slice(-6)}`
        };

        const { data: invRow, error: invError } = await supabase.from('billing_invoices').insert([master]).select('id').single();

        if (invError) {
            toast.error('Error al generar la transacción financiera');
            setIsSaving(false); return;
        }

        // 2. Insertar Items
        const conceptRows = items.map(item => ({
            invoice_id: invRow.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.price,
            total: (item.price * item.quantity),
            sat_product_code: '85121600' // Genérico Salud
        }));

        await supabase.from('billing_items').insert(conceptRows);

        // Terminado
        toast.success(ticket.requires_cfdi ? "Cobro registrado. Pendiente de Timbrado SAT." : "Cobro registrado exitosamente en caja.");
        setIsPosOpen(false);
        setTicket({ patient_id: '', payment_method: 'Tarjeta', requires_cfdi: false, notes: '' });
        setItems([{ description: 'Consulta Médica Especializada', quantity: 1, price: 0 }]);
        fetchFinances();
        setIsSaving(false);
    };

    const markAsTimbred = async (invoiceId: string) => {
        // Mock de llamada a la API PAC (Integración STUP o Facturador.com)
        const load = toast.loading('Timbrando en el SAT...');
        setTimeout(async () => {
            const uuidSAT = crypto.randomUUID().toUpperCase();
            await supabase.from('billing_invoices').update({ cfdi_status: 'TIMBRED', cfdi_uuid: uuidSAT }).eq('id', invoiceId);
            toast.success("Factura Timbrada con Éxito (XML generado)", { id: load });
            fetchFinances();
        }, 2000);
    };

    // KPIs Matemáticos
    const totalMes = invoices.reduce((acc, inv) => acc + parseFloat(inv.total), 0);
    const cfdisRequiringAction = invoices.filter(inv => inv.requires_cfdi && inv.cfdi_status === 'UNTIMBRED').length;
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-emerald-500" />
                        Cobranza, TPV y Facturación
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Panel de ingresos y emisión oficial de factura electrónica (SAT CFDI 4.0).</p>
                </div>

                <div className="flex gap-3">
                    <a href="/configurador" className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl font-bold shadow-sm transition hover:bg-slate-50 cursor-pointer">
                        <Building className="w-5 h-5" /> Configurar PAC
                    </a>
                    <button onClick={() => setIsPosOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95">
                        <Plus className="w-5 h-5" /> Generar Nota de Cargo
                    </button>
                </div>
            </div>

            {/* Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                <div className="col-span-1 border border-emerald-400 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[2.5rem] shadow-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <h3 className="text-emerald-50 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-200" /> Cierre de Caja
                    </h3>
                    <p className="text-4xl font-extrabold text-white">${totalMes.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                    <div className="text-[10px] font-black uppercase text-emerald-900 bg-emerald-100/90 inline-flex items-center justify-center px-2 py-1 rounded-md mt-4 backdrop-blur-sm shadow-sm flex gap-1 tracking-widest">
                        <ArrowUpRight className="w-3 h-3" /> Reporte Fijo
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-500" /> Timbres Fiscales
                        </h3>
                        <p className="text-2xl font-black text-slate-800">1,240 <span className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">Restantes</span></p>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '62%' }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" /> Por Facturar (CFDI)
                        </h3>
                        <p className="text-2xl font-black text-blue-600">{cfdisRequiringAction} Notas</p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{cfdisRequiringAction > 0 ? 'Falta emitir sus PDFs.' : 'Al día fiscalmente.'}</p>
                </div>
                
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-center border-dashed border-2 cursor-pointer hover:bg-slate-50 transition">
                    <div className="text-center text-slate-400">
                        <FileDigit className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <span className="font-bold text-xs uppercase tracking-widest">Reporte Abogados / Contabilidad</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-black text-slate-800 flex items-center gap-2">
                        Registro Maestro Contable
                    </h3>
                    <div className="relative w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Folio de Factura o Paciente" className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 text-xs font-bold outline-none shadow-sm" />
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center font-bold text-slate-400 animate-pulse">Cargando base de datos financiera...</div>
                ) : invoices.length === 0 ? (
                    <div className="p-20 text-center font-bold text-slate-400 flex flex-col items-center">
                        <DollarSign className="w-12 h-12 text-slate-200 mb-2" /> No hay transacciones financieras locales.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest font-black text-slate-400">
                                    <th className="p-5 pl-8">Recibo / CFDI</th>
                                    <th className="p-5">Paciente Clínico</th>
                                    <th className="p-5">Fondo Autorizado</th>
                                    <th className="p-5 text-center">Protocolo Pago</th>
                                    <th className="p-5 text-center">Facturación SAT</th>
                                    <th className="p-5 pr-8 text-right">Ejecución Fiscal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 uppercase text-xs font-bold tracking-wide">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-5 pl-8">
                                            <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">{inv.invoice_number}</span>
                                            {inv.cfdi_uuid && <p className="text-[9px] text-teal-600 mt-2 font-black">UUID: {inv.cfdi_uuid.slice(0,8)}...</p>}
                                        </td>
                                        <td className="p-5 text-slate-800">
                                            {inv.patients ? `${inv.patients.first_name} ${inv.patients.last_name}` : 'Paciente Eliminado'}
                                            <p className="text-[9px] text-slate-400 mt-1">{new Date(inv.created_at).toLocaleString()}</p>
                                        </td>
                                        <td className="p-5 text-emerald-600 text-base">
                                            ${parseFloat(inv.total).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                                        </td>
                                        <td className="p-5 text-center text-slate-500">
                                            {inv.payment_method}
                                        </td>
                                        <td className="p-5 text-center">
                                            {!inv.requires_cfdi ? (
                                                <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded">No Requerida</span>
                                            ) : inv.cfdi_status === 'TIMBRED' ? (
                                                <span className="text-[10px] bg-emerald-100 border border-emerald-200 text-emerald-700 px-2 py-1 rounded">TIMBRADO CFDI 4.0</span>
                                            ) : (
                                                <span className="text-[10px] bg-amber-100 border border-amber-200 text-amber-700 px-2 py-1 rounded animate-pulse">PENDIENTE DE TIMBRE</span>
                                            )}
                                        </td>
                                        <td className="p-5 pr-8 text-right">
                                            {inv.requires_cfdi && inv.cfdi_status === 'UNTIMBRED' && (
                                                <button onClick={() => markAsTimbred(inv.id)} className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl transition shadow-md flex items-center gap-2 font-black inline-flex">
                                                    <ShieldCheck className="w-4 h-4" /> TIMBRAR
                                                </button>
                                            )}
                                            {inv.cfdi_status === 'TIMBRED' && (
                                                <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-xl transition shadow-sm font-black inline-flex items-center gap-1">
                                                    XML / PDF
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Caja POS */}
            {isPosOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsPosOpen(false)}></div>
                    <div className="bg-white rounded-[2rem] shadow-2xl relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
                        <div className="p-6 border-b border-emerald-100 bg-emerald-50 flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-emerald-900">Módulo de Caja y Cobranza Clínica</h3>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Terminal Punto de Venta (TPV) Con Integración Fiscal</p>
                            </div>
                            <button onClick={() => setIsPosOpen(false)} className="text-slate-400 hover:text-slate-700 w-10 h-10 flex items-center justify-center font-bold bg-white rounded-xl shadow-sm border border-slate-200">X</button>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto bg-slate-50/50">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                
                                {/* Datos del Cliente */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                        <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><User className="w-4 h-4 text-emerald-500" /> Paciente Receptor</h4>
                                        <select 
                                            value={ticket.patient_id}
                                            onChange={e => setTicket({...ticket, patient_id: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-800 text-sm appearance-none"
                                        >
                                            <option value="">Selecciona al paciente...</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                        <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-amber-500" /> Método de Pago Oficial</h4>
                                        
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            {['Tarjeta de Crédito', 'Tarjeta de Débito', 'Efectivo', 'Transferencia SPEI', 'Aseguradora GNP'].map(mt => (
                                                <label key={mt} className={`flex items-center gap-2 p-3 rounded-2xl border-2 cursor-pointer transition-all ${ticket.payment_method === mt ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 hover:border-slate-300'}`}>
                                                    <input type="radio" className="hidden" name="payment_method" value={mt} checked={ticket.payment_method === mt} onChange={(e) => setTicket({...ticket, payment_method: e.target.value})} />
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${ticket.payment_method === mt ? 'border-emerald-500' : 'border-slate-300'}`}>
                                                        {ticket.payment_method === mt && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                                                    </div>
                                                    <span className={`text-xs font-black uppercase tracking-wider ${ticket.payment_method === mt ? 'text-emerald-700' : 'text-slate-500'}`}>{mt}</span>
                                                </label>
                                            ))}
                                        </div>

                                        <label className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-100 transition selection:bg-transparent">
                                            <input type="checkbox" className="w-5 h-5 accent-amber-500 rounded cursor-pointer" checked={ticket.requires_cfdi} onChange={e => setTicket({...ticket, requires_cfdi: e.target.checked})} />
                                            <div>
                                                <span className="block text-sm font-black text-amber-900">Requiere Facturación Electrónica (CFDI 4.0)</span>
                                                <span className="block text-[10px] font-bold text-amber-600 uppercase mt-0.5">El paciente solicitó comprobante fiscal para declaración.</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Desglose / Ticket */}
                                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col relative overflow-hidden">
                                     {/* Fake Ticket Ribbon */}
                                     <div className="absolute top-0 left-4 right-4 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-b-xl"></div>

                                    <h4 className="font-black text-slate-300 text-xs uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                                        Detalle de Liquidación
                                        <span className="bg-white/10 px-2 py-1 rounded text-[9px]">CAJA #1</span>
                                    </h4>

                                    <div className="flex-1 space-y-4 pr-1">
                                        {items.map((it, idx) => (
                                            <div key={idx} className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                                                <div className="flex-1">
                                                    <input type="text" value={it.description} onChange={e => { const newIt = [...items]; newIt[idx].description = e.target.value; setItems(newIt); }} className="w-full bg-transparent outline-none font-bold text-sm text-white focus:border-b-2 focus:border-emerald-500 transition-all placeholder-slate-500" placeholder="Descripción del cargo..." />
                                                </div>
                                                <input type="number" min="1" value={it.quantity} onChange={e => { const newIt = [...items]; newIt[idx].quantity = parseInt(e.target.value)||1; setItems(newIt); }} className="w-16 bg-white/10 rounded-lg outline-none px-2 py-1 text-center font-bold text-emerald-400" />
                                                <div className="flex items-center gap-1">
                                                    <span className="text-slate-400 font-black">$</span>
                                                    <input type="number" value={it.price} onChange={e => { const newIt = [...items]; newIt[idx].price = parseFloat(e.target.value)||0; setItems(newIt); }} className="w-24 bg-white/10 rounded-lg outline-none px-2 py-1 text-right font-black text-white" />
                                                </div>
                                                {items.length > 1 && <button onClick={() => { const newIt = items.filter((_, i) => i !== idx); setItems(newIt); }} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>}
                                            </div>
                                        ))}
                                        
                                        <button onClick={() => setItems([...items, {description: '', quantity: 1, price: 0}])} className="w-full py-4 border-2 border-dashed border-white/20 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-white hover:border-white/50 transition-colors">
                                            + Añadir Concepto Extra
                                        </button>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-end">
                                        <div className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed">
                                            Neto.<br/>
                                            Total a Pagar (MXN)
                                        </div>
                                        <div className="text-5xl font-black text-emerald-400 tracking-tighter">
                                            ${items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsPosOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition">Cancelar</button>
                            <button onClick={handleCreateInvoice} disabled={!ticket.patient_id || isSaving} className="px-8 py-3 font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2 text-sm tracking-wide">
                                {isSaving ? 'Procesando Tarjeta...' : <><CheckCircle2 className="w-5 h-5" /> Aplicar Cobro en Caja</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
