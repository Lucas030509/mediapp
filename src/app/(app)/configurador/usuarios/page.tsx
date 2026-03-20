"use client"

import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, Mail, Shield, User, Building2, CheckCircle2, X, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'ACCOUNTANT';
    organization_name: string;
    created_at: string;
}

export default function UsuariosPage() {
    const supabase = createClient();
    const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        email: '',
        password: '', // Solo para nuevos usuarios
        first_name: '',
        last_name: '',
        role: 'DOCTOR' as UserProfile['role'],
        organization_name: '',
    });

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const fetchUsuarios = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            toast.error('Error al cargar usuarios');
        } else {
            setUsuarios(data || []);
        }
        setLoading(false);
    };

    const handleOpenModal = (user: UserProfile | null = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                email: user.email,
                password: '',
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                organization_name: user.organization_name,
            });
        } else {
            setEditingUser(null);
            setFormData({
                email: '',
                password: '',
                first_name: '',
                last_name: '',
                role: 'DOCTOR',
                organization_name: '',
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingUser) {
            // Actualizar Perfil
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    role: formData.role,
                    organization_name: formData.organization_name,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingUser.id);

            if (error) {
                toast.error('Error al actualizar: ' + error.message);
            } else {
                toast.success('Usuario actualizado correctamente');
                setShowModal(false);
                fetchUsuarios();
            }
        } else {
            // Crear Usuario (Usando una API route para manejar Auth)
            try {
                const response = await fetch('/api/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const result = await response.json();

                if (response.ok) {
                    toast.success('Usuario creado con éxito');
                    setShowModal(false);
                    fetchUsuarios();
                } else {
                    toast.error(result.error || 'Error al crear usuario');
                }
            } catch (err) {
                toast.error('Error de red al crear usuario');
            }
        }
    };

    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar al usuario ${email}?`)) return;

        // Eliminamos perfil (Cascade en DB borrará auth.user si está configurado así, 
        // pero normalmente se requiere admin para borrar auth.user)
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Error al eliminar: ' + error.message);
        } else {
            toast.success('Usuario eliminado de la tabla de perfiles');
            // Nota: Para borrar de auth.users se necesita service_role en el backend
            fetchUsuarios();
        }
    };

    const filteredUsers = usuarios.filter(u => 
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-slate-500 mt-1">
                        ABC de personal de la plataforma. Crea cuentas y asigna roles.
                    </p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    Nuevo Usuario
                </button>
            </div>

            {/* Buscador y Filtros */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o correo..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 font-semibold text-slate-700 text-sm">Usuario</th>
                                <th className="p-4 font-semibold text-slate-700 text-sm">Organización</th>
                                <th className="p-4 font-semibold text-slate-700 text-sm">Rol</th>
                                <th className="p-4 font-semibold text-slate-700 text-sm">Fecha Registro</th>
                                <th className="p-4 font-semibold text-slate-700 text-sm text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({length: 3}).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                                        <td className="p-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                        <td className="p-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                        <td className="p-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                        <td className="p-4"><div className="h-4 bg-slate-100 rounded w-16 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                                        No se encontraron usuarios activos.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    {user.first_name?.[0] || 'U'}{user.last_name?.[0] || 'S'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{user.first_name} {user.last_name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium font-sans">
                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                {user.organization_name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${user.role === 'ADMIN' 
                                                ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                                : user.role === 'DOCTOR' 
                                                ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 font-sans">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenModal(user)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(user.id, user.email)}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal ABC */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                                </h2>
                                <p className="text-xs text-slate-500 font-sans mt-0.5">Completa los campos para {editingUser ? 'actualizar' : 'generar'} acceso.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4 font-sans">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-slate-400" /> NOMBRE
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">APELLIDOS</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Mail className="w-4 h-4 text-slate-400" /> CORREO ELECTRÓNICO
                                </label>
                                <input 
                                    type="email" 
                                    required
                                    disabled={!!editingUser}
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 disabled:opacity-50"
                                />
                            </div>

                            {!editingUser && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">CONTRASEÑA TEMPORAL</label>
                                    <input 
                                        type="password" 
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Shield className="w-4 h-4 text-slate-400" /> ROL ASIGNADO
                                    </label>
                                    <select 
                                        value={formData.role}
                                        onChange={(e) => setFormData({...formData, role: e.target.value as UserProfile['role']})}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                                    >
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="DOCTOR">DOCTOR</option>
                                        <option value="RECEPTIONIST">RECEPCIÓN</option>
                                        <option value="ACCOUNTANT">CONTADOR</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Building2 className="w-4 h-4 text-slate-400" /> INSTITUCIÓN
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.organization_name}
                                        onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 placeholder:text-slate-300"
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    {editingUser ? 'Actualizar Cambios' : 'Crear y Notificar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
