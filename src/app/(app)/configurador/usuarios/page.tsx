"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Shield, Edit, Search, CheckCircle2, AlertCircle, Trash2, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsuariosPage() {
    const supabase = createClient();
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Fetch users (profiles) with their assigned RBAC role
        const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select(`
                id, email, first_name, last_name, role, rb_role_id,
                clinic_roles!rb_role_id ( name, is_system_admin )
            `)
            .order('first_name');

        if (userData) setUsers(userData);

        // Fetch available roles
        const { data: roleData } = await supabase.from('clinic_roles').select('*').order('name');
        if (roleData) setRoles(roleData);

        setLoading(false);
    };

    const handleOpenEdit = (user: any) => {
        setEditingUserId(user.id);
        setSelectedRoleId(user.rb_role_id || '');
    };

    const handleSaveRole = async () => {
        if (!editingUserId) return;

        const loadToast = toast.loading('Actualizando permisos...');
        const { error } = await supabase
            .from('profiles')
            .update({ rb_role_id: selectedRoleId || null })
            .eq('id', editingUserId);

        if (error) {
            toast.error('Error al actualizar rol', { id: loadToast });
        } else {
            toast.success('Permisos actualizados con éxito', { id: loadToast });
            setEditingUserId(null);
            fetchData();
        }
    };

    const filteredUsers = users.filter(u => 
        (u.first_name || '').toLowerCase().includes(search.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-500" />
                        Directorio de Accesos (Staff)
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Asigna Grupos Laborales para definir qué puede ver y hacer cada empleado de la clínica.</p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o correo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-sm transition"
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold transition shadow-sm w-full sm:w-auto justify-center">
                        <Key className="w-4 h-4" /> Invitar Médico/Personal
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 font-bold text-xs uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="p-6 pl-8">Usuario</th>
                                <th className="p-6">Grupo Laboral Actual</th>
                                <th className="p-6 pr-8 text-right">Manejo de Acceso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="p-10 text-center animate-pulse text-indigo-500 font-bold">Cargando directorio...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-16 text-center text-slate-400 font-bold">No se encontraron usuarios activos.</td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6 pl-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                                                {user.first_name?.[0] || user.email?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-slate-800">{user.first_name} {user.last_name}</div>
                                                <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="p-6">
                                        {editingUserId === user.id ? (
                                            <div className="flex items-center gap-2">
                                                <select 
                                                    value={selectedRoleId}
                                                    onChange={(e) => setSelectedRoleId(e.target.value)}
                                                    className="w-full max-w-xs px-3 py-2 bg-white border border-indigo-300 rounded-xl font-bold text-sm text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/20"
                                                >
                                                    <option value="">-- Sin Grupo (Acceso Denegado) --</option>
                                                    {roles.map(r => (
                                                        <option key={r.id} value={r.id}>{r.name} {r.is_system_admin ? '⭐' : ''}</option>
                                                    ))}
                                                </select>
                                                <button onClick={handleSaveRole} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => setEditingUserId(null)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition text-xs font-bold px-3">
                                                    Cancelar
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                {user.clinic_roles ? (
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${user.clinic_roles.is_system_admin ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                                        {user.clinic_roles.is_system_admin ? <Shield className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                                                        {user.clinic_roles.name}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        Esperando Asignación
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    
                                    <td className="p-6 pr-8 text-right">
                                        {editingUserId !== user.id && (
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenEdit(user)}
                                                    className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
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
