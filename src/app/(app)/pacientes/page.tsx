"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter, MoreVertical, FileText, Calendar, ShieldAlert, X, Users, Trash2, Edit2, Camera, CameraOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function PacientesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', second_last_name: '', alias: '', rfc: '', email: '', phone: '', date_of_birth: '', blood_type: '', main_condition: '', risk: 'low',
        gender: '', photo_url: '',
        // Fiscal Data (ARMED)
        business_name: '', postal_code: '', tax_regime: ''
    });
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Camera State
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    const supabase = createClient();

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setMediaStream(stream);
            setIsCameraOpen(true);
        } catch (err) {
            toast.error("No se pudo acceder a la cámara: " + err);
        }
    };

    useEffect(() => {
        if (isCameraOpen && videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [isCameraOpen, mediaStream]);

    const stopCamera = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
        setMediaStream(null);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
                setFormData(prev => ({ ...prev, photo_url: dataUrl }));
                stopCamera();
            }
        }
    };

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

    const [confirmModal, setConfirmModal] = useState<{ 
        isOpen: boolean; 
        title: string; 
        message: string; 
        onConfirm: () => void;
        type: 'danger' | 'warning';
        confirmText: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'danger',
        confirmText: 'Confirmar'
    });

    const handleDelete = async (id: string, name: string) => {
        setConfirmModal({
            isOpen: true,
            title: '¿Eliminar Paciente?',
            message: `Estas a punto de eliminar permanentemente el expediente de ${name}. Esta acción no se puede deshacer.`,
            type: 'danger',
            confirmText: 'Sí, eliminar',
            onConfirm: async () => {
                const { error } = await supabase.from('patients').delete().eq('id', id);
                if (!error) {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    fetchPatients();
                    toast.success("Paciente eliminado correctamente");
                } else {
                    toast.error("Error al eliminar el paciente.");
                }
            }
        });
    };

    const handleSave = async (e?: React.FormEvent, force: boolean = false) => {
        if (e) e.preventDefault();

        // 🛑 SISTEMA DE ALERTAS ARMED: CHECK DE DUPLICADOS
        if (!editId && !force) {
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
                setConfirmModal({
                    isOpen: true,
                    title: '¡Paciente Duplicado!',
                    message: `Hemos detectado un paciente similar (${duplicates[0].first_name} ${duplicates[0].last_name}) o con la misma fecha de nacimiento. ¿Estás seguro de crear un nuevo expediente?`,
                    type: 'warning',
                    confirmText: 'Sí, crear nuevo',
                    onConfirm: () => handleSave(undefined, true)
                });
                return;
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
                gender: formData.gender === '' ? null : formData.gender,
                photo_url: formData.photo_url,
            }).eq('id', editId);
            error = updateError;

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
                    gender: formData.gender === '' ? null : formData.gender,
                    photo_url: formData.photo_url,
                }
            ]).select().single();
            
            error = insertError;

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
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            setEditId(null);
            setFormData({ first_name: '', last_name: '', second_last_name: '', alias: '', rfc: '', email: '', phone: '', date_of_birth: '', blood_type: '', main_condition: '', risk: 'low', gender: '', photo_url: '', business_name: '', postal_code: '', tax_regime: '' });
            fetchPatients();
        } else {
            console.error("Error saving patient:", error);
            toast.error("Error al guardar: " + (error?.message || "Desconocido"));
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

                <button onClick={() => { setEditId(null); setFormData({ first_name: '', last_name: '', second_last_name: '', alias: '', rfc: '', email: '', phone: '', date_of_birth: '', blood_type: '', main_condition: '', risk: 'low', gender: '', photo_url: '', business_name: '', postal_code: '', tax_regime: '' }); setIsModalOpen(true); }} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all hover:-translate-y-0.5">
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
                                                {patient.photo_url ? (
                                                    <img src={patient.photo_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-teal-50 border border-teal-100 flex items-center justify-center font-bold text-teal-700 tracking-tighter uppercase whitespace-nowrap">
                                                        {patient.first_name[0]}{patient.last_name?.[0] || ''}
                                                    </div>
                                                )}
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
                                                    first_name: patient.first_name, last_name: patient.last_name, second_last_name: patient.second_last_name || '', alias: patient.alias || '', rfc: patient.rfc || '', email: patient.email || '', phone: patient.phone || '', date_of_birth: patient.date_of_birth || '', blood_type: patient.blood_type || '', main_condition: patient.main_condition || '', risk: patient.status || 'low', gender: patient.gender || '', photo_url: patient.photo_url || '',
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in p-4 sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* HEADER */}
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
                                    <Users className="w-5 h-5" />
                                </div>
                                {editId ? 'Editar Información del Paciente' : 'Alta de Nuevo Paciente'}
                            </h3>
                            <button onClick={() => { stopCamera(); setIsModalOpen(false); }} className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 p-2 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* BODY */}
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar p-8">
                            <div className="flex flex-col md:flex-row gap-10">
                                
                                {/* COLUMNA IZQUIERDA: WEBCAM / FOTO */}
                                <div className="w-full md:w-64 shrink-0 space-y-4">
                                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-3 flex items-center gap-2 drop-shadow-sm">Fotografía</h4>
                                    
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl h-[280px] w-full flex flex-col items-center justify-center overflow-hidden relative group transition-all">
                                        {isCameraOpen ? (
                                            <>
                                                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover scale-[1.02]" />
                                                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 px-4 z-10 animate-in slide-in-from-bottom-2">
                                                    <button type="button" onClick={capturePhoto} className="flex-1 py-3 bg-teal-500 text-white text-xs font-black rounded-xl shadow-lg hover:bg-teal-600 hover:scale-105 transition-all">Capturar</button>
                                                    <button type="button" onClick={stopCamera} className="w-12 bg-slate-900 text-white flex items-center justify-center rounded-xl shadow-lg hover:bg-slate-800 transition-all"><X className="w-4 h-4"/></button>
                                                </div>
                                            </>
                                        ) : formData.photo_url ? (
                                            <>
                                                <img src={formData.photo_url} alt="Paciente" className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                                                    <button type="button" onClick={startCamera} className="w-12 h-12 bg-white text-slate-900 rounded-full hover:bg-slate-100 hover:scale-110 flex items-center justify-center transition-all shadow-xl">
                                                        <Camera className="w-5 h-5"/>
                                                    </button>
                                                    <button type="button" onClick={() => setFormData({...formData, photo_url: ''})} className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all shadow-xl">
                                                        <Trash2 className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-6 flex flex-col items-center justify-center h-full w-full">
                                                <div className="w-20 h-20 bg-white border border-slate-100 shadow-sm rounded-full flex items-center justify-center mb-4 text-slate-300">
                                                    <Camera className="w-8 h-8" />
                                                </div>
                                                <p className="text-xs font-bold text-slate-400 mb-4 px-4 leading-relaxed">Agrega una fotografía para identificar rápidamente al paciente.</p>
                                                <button type="button" onClick={startCamera} className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all hover:-translate-y-0.5">
                                                    <Camera className="w-4 h-4" /> Activar Cámara
                                                </button>
                                            </div>
                                        )}
                                        <canvas ref={canvasRef} className="hidden" />
                                    </div>
                                </div>

                                {/* COLUMNA DERECHA: FORMULARIO */}
                                <div className="flex-1 space-y-10">
                                    
                                    {/* Sección 1: Información Básica */}
                                    <div className="space-y-5">
                                        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-teal-600 border-b border-slate-100 pb-3 flex items-center gap-2">Información Básica</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                            <div className="xl:col-span-3">
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">Nombre(s) *</label>
                                                <input required type="text" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 transition-all font-bold text-slate-800 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">Apellido Paterno *</label>
                                                <input required type="text" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 transition-all font-bold text-slate-800 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">Apellido Materno</label>
                                                <input type="text" value={formData.second_last_name} onChange={e => setFormData({ ...formData, second_last_name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 transition-all font-bold text-slate-800 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">Fecha de Nacimiento</label>
                                                <input type="date" value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 transition-all font-bold text-slate-800 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">Género</label>
                                                <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 transition-all font-bold text-slate-800 text-sm">
                                                    <option value="">No especificado</option>
                                                    <option value="M">Masculino</option>
                                                    <option value="F">Femenino</option>
                                                    <option value="O">Otro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">Tipo Sanguíneo</label>
                                                <select value={formData.blood_type} onChange={e => setFormData({ ...formData, blood_type: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 transition-all font-bold text-slate-800 text-sm">
                                                    <option value="">Selecciona</option>
                                                    <option value="A+">A+</option><option value="A-">A-</option>
                                                    <option value="B+">B+</option><option value="B-">B-</option>
                                                    <option value="O+">O+</option><option value="O-">O-</option>
                                                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">Alias Descriptivo</label>
                                                <input type="text" value={formData.alias} onChange={e => setFormData({ ...formData, alias: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium text-slate-700 text-sm" placeholder="Opcional" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sección 2: Contacto y Relevante */}
                                    <div className="space-y-5">
                                        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-500 border-b border-slate-100 pb-3 flex items-center gap-2">Contacto y Admisión</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">Teléfono Móvil</label>
                                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800 text-sm" placeholder="10 Dígitos" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">RFC</label>
                                                <input type="text" value={formData.rfc} onChange={e => setFormData({ ...formData, rfc: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800 text-sm uppercase" placeholder="13 Caracteres" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">Nivel de Riesgo Clínico</label>
                                                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1">
                                                    <button type="button" onClick={() => setFormData({ ...formData, risk: 'low' })} className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${formData.risk === 'low' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>Bajo</button>
                                                    <button type="button" onClick={() => setFormData({ ...formData, risk: 'medium' })} className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${formData.risk === 'medium' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}>Medio</button>
                                                    <button type="button" onClick={() => setFormData({ ...formData, risk: 'high' })} className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${formData.risk === 'high' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>Alto</button>
                                                </div>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">Diagnóstico Principal (Opcional)</label>
                                                <input type="text" value={formData.main_condition} onChange={e => setFormData({ ...formData, main_condition: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 text-sm" placeholder="Ej. Hipertensión controlada" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sección 3: Fiscal */}
                                    <div className="space-y-5 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 pb-2 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-slate-400" /> Facturación
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                            <div className="xl:col-span-1">
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">Código Postal</label>
                                                <input type="text" value={formData.postal_code} onChange={e => setFormData({ ...formData, postal_code: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10 transition-all font-bold text-slate-700 text-sm" placeholder="5 Dígitos" />
                                            </div>
                                            <div className="xl:col-span-2">
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">Razón Social</label>
                                                <input type="text" value={formData.business_name} onChange={e => setFormData({ ...formData, business_name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10 transition-all font-bold text-slate-700 text-sm" placeholder="Ej. Empresa SA de CV" />
                                            </div>
                                            <div className="xl:col-span-3">
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 truncate">Régimen Fiscal</label>
                                                <select value={formData.tax_regime} onChange={e => setFormData({ ...formData, tax_regime: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10 transition-all font-bold text-slate-700 text-sm">
                                                    <option value="">No aplica</option>
                                                    <option value="601">601 - LEY PERSONAS MORALES</option>
                                                    <option value="606">606 - ARRENDAMIENTO</option>
                                                    <option value="612">612 - PF ACTIVIDADES EMPRESA</option>
                                                    <option value="626">626 - RESICO</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
                            
                            {/* FOOTER ACTIONS */}
                            <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white shadow-[0_-20px_20px_-15px_rgba(255,255,255,1)]">
                                <button type="button" onClick={() => { stopCamera(); setIsModalOpen(false); }} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all active:scale-95">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl font-black text-white bg-slate-900 hover:bg-black transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] active:scale-95 disabled:opacity-50 flex items-center gap-2">
                                    {saving ? 'Registrando...' : <><Users className="w-4 h-4"/> Guardar Expediente</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal de Confirmación Premium (Reutilizable) */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}></div>
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${confirmModal.type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                                {confirmModal.type === 'danger' ? <Trash2 className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">{confirmModal.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                {confirmModal.message}
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <button 
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                className="flex-1 px-4 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmModal.onConfirm}
                                className={`flex-1 px-4 py-4 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg ${confirmModal.type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
                            >
                                {confirmModal.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
