"use client"

import React, { useState } from 'react';

export default function ConfiguradorPage() {
    const [roles, setRoles] = useState([
        { position: "Vendedor", activeModules: ["ventas"] },
        { position: "Contador", activeModules: ["finanzas", "buzon-tributario"] }
    ]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configurador de Accesos</h1>
            <div className="flex items-center gap-4 mt-2">
                <p className="text-slate-500 max-w-2xl">
                    Asigna a qué submódulos (Features) tiene acceso cada puesto laboral de tu empresa.
                    Esto se guarda en la tabla `permissions` y será verificado por el Middleware de Next.js antes de renderizar React.
                </p>
                <div className="flex-1"></div>
                <a 
                    href="/configurador/usuarios"
                    className="flex items-center gap-2 bg-white border border-slate-200 text-indigo-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Gestionar Usuarios (ABC)
                </a>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mt-6">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-4 font-semibold text-slate-700">Puesto Laboral</th>
                            <th className="p-4 font-semibold text-slate-700">Módulos Permitidos</th>
                            <th className="p-4 font-semibold text-slate-700 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {roles.map((rol, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="p-4 font-medium text-slate-800">{rol.position}</td>
                                <td className="p-4 text-sm flex gap-2">
                                    {rol.activeModules.map((m, j) => (
                                        <span key={j} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md mb-1 inline-block text-xs font-semibold">
                                            {m}
                                        </span>
                                    ))}
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition">
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
