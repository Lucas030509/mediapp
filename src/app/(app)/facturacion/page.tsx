"use client"

import React from 'react';
import { DollarSign, FileText, ArrowUpRight, ArrowDownRight, MoreVertical, ShieldCheck, Download, Plus } from 'lucide-react';

const mockInvoices = [
    { id: "FAC-9821", patient: "Elena Peña Rodríguez", date: "5 Mar 2026", amount: "$1,200.00", method: "Tarjeta (Terminación 4021)", status: "paid", type: "Consulta Especialidad" },
    { id: "FAC-9820", patient: "Mario Ruiz Esparza", date: "2 Mar 2026", amount: "$800.00", method: "Efectivo", status: "paid", type: "Primera Vez" },
    { id: "FAC-9819", patient: "Aseguradora GNP (Siniestro 8A)", date: "28 Feb 2026", amount: "$14,500.00", method: "Transferencia Bancaria", status: "pending", type: "Procedimiento Quirúrgico" },
    { id: "FAC-9818", patient: "Carlos Slim Osorio", date: "20 Feb 2026", amount: "$1,500.00", method: "Tarjeta (Terminación 9912)", status: "paid", type: "Telemedicina Especializada" },
    { id: "FAC-9817", patient: "Lucía Méndez Silva", date: "15 Feb 2026", amount: "$1,200.00", method: "Terminal Clip", status: "paid", type: "Consulta Subsecuente" },
];

export default function FacturacionPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Control Financiero y Facturación</h1>
                    <p className="text-slate-500 mt-1 font-medium">Gestiona cobros, facturación electrónica y convenios con Aseguradoras.</p>
                </div>

                <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all hover:-translate-y-0.5">
                    <Plus className="w-5 h-5" />
                    Nueva Nota de Cargo
                </button>
            </div>

            {/* Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-md border border-emerald-400 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <h3 className="text-emerald-50 font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-white/80" /> Ingresos este mes
                    </h3>
                    <p className="text-4xl font-extrabold text-white">$142,500.00</p>
                    <div className="text-xs font-bold text-emerald-900 bg-emerald-100/90 inline-flex items-center justify-center px-2 py-1 rounded-md mt-4 backdrop-blur-sm shadow-sm flex gap-1">
                        <ArrowUpRight className="w-3 h-3" /> +18.5% respecto a Enero
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-slate-500 font-semibold mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-500" /> Cuentas por Cobrar (Aseguradoras)
                        </h3>
                        <p className="text-3xl font-extrabold text-slate-800">$48,200.00</p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-xs font-semibold text-amber-600 bg-amber-50 inline-flex items-center justify-center px-2 py-1 rounded-md">
                            3 Siniestros Pendientes
                        </div>
                        <button className="text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline transition">Reclamar Pagos</button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 font-semibold mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-500" /> Timbres Fiscales
                    </h3>
                    <p className="text-3xl font-extrabold text-slate-800">1,240 <span className="text-sm text-slate-400 font-medium tracking-wide">restantes</span></p>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden outline outline-1 outline-slate-200">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: '62%' }}></div>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-2">Paquete Anual (Renovación: Ene 2027)</p>
                </div>
            </div>

            {/* Transaction History Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-lg">Historial de Cargos y Facturas</h3>
                    <div className="flex gap-2">
                        <button className="text-sm font-bold text-slate-600 bg-white border border-slate-200 px-4 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition flex items-center gap-2">
                            <Download className="w-4 h-4" /> Exportar CSV
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider font-bold text-slate-500">
                                <th className="p-4 pl-6">Folio Interno</th>
                                <th className="p-4">Paciente / Institución</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Concepto</th>
                                <th className="p-4">Monto ($)</th>
                                <th className="p-4">Método de Pago</th>
                                <th className="p-4 text-center">Estado</th>
                                <th className="p-4 pr-6 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {mockInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50/70 transition group cursor-pointer">
                                    <td className="p-4 pl-6 font-bold text-slate-700">{inv.id}</td>
                                    <td className="p-4">
                                        <span className="font-bold text-slate-800 block">{inv.patient}</span>
                                    </td>
                                    <td className="p-4 text-sm font-semibold text-slate-500">{inv.date}</td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-xs">{inv.type}</span>
                                    </td>
                                    <td className="p-4 font-extrabold text-slate-900">{inv.amount}</td>
                                    <td className="p-4 font-medium text-slate-500 text-xs uppercase tracking-wide">{inv.method}</td>
                                    <td className="p-4 text-center">
                                        {inv.status === 'paid' && <span className="inline-flex items-center justify-center px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg uppercase tracking-wider">Pagado</span>}
                                        {inv.status === 'pending' && <span className="inline-flex items-center justify-center px-3 py-1 bg-amber-100 text-amber-700 font-bold text-xs rounded-lg uppercase tracking-wider">Pendiente</span>}
                                    </td>
                                    <td className="p-4 pr-6 text-right space-x-2">
                                        <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-block" title="Facturar SAT (Timbrar XML)">
                                            <ShieldCheck className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors inline-block">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
