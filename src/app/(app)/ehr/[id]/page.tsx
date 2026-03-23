"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Activity, Pill, Scissors, FileCode2, Clock, ChevronDown, Award, UploadCloud, Image as ImageIcon, Star, Trash2, X, ShieldAlert, Plus, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import ImageLightbox from '@/components/ImageLightbox';
import toast from 'react-hot-toast';
import { CIE10_DB } from '@/lib/data/cie10';

export default function PatientEHRPage() {
    const [activeTab, setActiveTab] = useState('timeline');
    const { id } = useParams();
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [allergies, setAllergies] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [surgeries, setSurgeries] = useState<any[]>([]);
    const [lastVitals, setLastVitals] = useState<any>(null); // Nuevo: Últimos signos reales
    const [doctorProfile, setDoctorProfile] = useState<any>(null); // Nuevo: Datos del Dr actual

    const [isAllergiesModalOpen, setIsAllergiesModalOpen] = useState(false);
    const [newAllergy, setNewAllergy] = useState({ name: '', severity: 'MEDIUM' });

    const [isUploading, setIsUploading] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<{ src: string, alt: string, id: string, isFavorite: boolean } | null>(null);
    const [notes, setNotes] = useState<any[]>([]);
    
    // Macro-Campo Resumen Clínico
    const [clinicalSummary, setClinicalSummary] = useState('');
    const [isSavingSummary, setIsSavingSummary] = useState(false);
    
    // Prescription State
    const [prescriptionText, setPrescriptionText] = useState('');
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [editNoteId, setEditNoteId] = useState<string | null>(null);
    const [noteSaving, setNoteSaving] = useState(false);
    const [noteData, setNoteData] = useState({
        subjective_text: '', objective_text: '', analysis_text: '', plan_text: '', consultation_date: new Date().toISOString().substring(0, 10)
    });
    // Modal CIE-10
    const [isCie10Open, setIsCie10Open] = useState(false);
    const [cieSearch, setCieSearch] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if(id) fetchPatient();
    }, [id]);

    const fetchPatient = async () => {
        // 1. Datos básicos
        const { data } = await supabase.from('patients').select('*').eq('id', id).single();
        if(data) {
            setPatient(data);
            setClinicalSummary(data.clinical_summary || '');
        }

        // 2. Perfil del Doctor Actual para Recetas (Rx)
        const { data: { user } } = await supabase.auth.getUser();
        const { data: prof } = await supabase.from('profiles').select('*, doctors(first_name, last_name, specialty)').eq('id', user?.id || '').single();
        if (prof) setDoctorProfile(prof);
        
        // 3. Cargar últimos Signos Vitales Reales
        const { data: vRes } = await supabase.from('vital_signs').select('*').eq('patient_id', id).order('created_at', { ascending: false }).limit(1);
        if (vRes && vRes.length > 0) setLastVitals(vRes[0]);
        
        // Cargar imágenes, notas, alergias, plantillas y cirugías
        const { data: docsRes } = await supabase.from('patient_documents').select('*').eq('patient_id', id).order('created_at', { ascending: false });
        if(docsRes) setDocuments(docsRes);

        const { data: notesRes } = await supabase.from('clinical_notes').select(`
            *,
            doctors(first_name, last_name)
        `).eq('patient_id', id).order('consultation_date', { ascending: false }).order('created_at', { ascending: false });
        if(notesRes) setNotes(notesRes);

        const { data: allergiesRes } = await supabase.from('patient_allergies').select('*').eq('patient_id', id).order('created_at', { ascending: false });
        if (allergiesRes) setAllergies(allergiesRes);

        const { data: templatesRes } = await supabase.from('ehr_templates').select('*').order('template_name', { ascending: true });
        if (templatesRes) setTemplates(templatesRes);

        const { data: surgRes } = await supabase.from('patient_surgeries').select('*').eq('patient_id', id).order('surgery_date', { ascending: false });
        if (surgRes) setSurgeries(surgRes);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;

        setIsUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${id}/${fileName}`;

        // 1. Subir al Storage (Bucket 'clinical_documents', requiere SQL fase 3)
        const { error: uploadError } = await supabase.storage.from('clinical_documents').upload(filePath, file);

        if (!uploadError) {
            // 2. Registrar en base de datos
            await supabase.from('patient_documents').insert({
                patient_id: id,
                file_path: filePath,
                file_name: file.name,
                file_type: file.type
            });
            fetchPatient(); // Recargar documentos
            toast.success('Estudio guardado en el expediente.');
        } else {
            toast.error('Error subiendo estudio. Verifica el Bucket en Supabase.');
        }
        setIsUploading(false);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;

        setIsUploadingPhoto(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${id}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('clinical_documents').upload(filePath, file);

        if (!uploadError) {
            const { data } = supabase.storage.from('clinical_documents').getPublicUrl(filePath);
            await supabase.from('patients').update({ photo_url: data.publicUrl }).eq('id', id);
            toast.success('Foto de perfil actualizada.');
            fetchPatient();
        } else {
            toast.error('Error al subir la fotografía.');
        }
        setIsUploadingPhoto(false);
    };

    const deleteDocument = async (docId: string, path: string) => {
        if (!confirm('¿Seguro de borrar este estudio?')) return;
        await supabase.storage.from('clinical_documents').remove([path]);
        await supabase.from('patient_documents').delete().eq('id', docId);
        fetchPatient();
    };

    const toggleFavorite = async (docId: string, currentFav: boolean) => {
        await supabase.from('patient_documents').update({ is_favorite: !currentFav }).eq('id', docId);
        fetchPatient();
        if (lightboxImage) setLightboxImage({ ...lightboxImage, isFavorite: !currentFav });
    };

    const getFileUrl = (path: string) => {
        return supabase.storage.from('clinical_documents').getPublicUrl(path).data.publicUrl;
    };

    const handleSaveSummary = async () => {
        setIsSavingSummary(true);
        const { error } = await supabase.from('patients').update({ clinical_summary: clinicalSummary }).eq('id', id);
        setIsSavingSummary(false);
        if (error) {
            toast.error("El campo 'clinical_summary' requiere actualización de Fase 7 en BD.");
        } else {
            toast.success("Resumen Guardado");
        }
    };

    const handleSaveNote = async (e: React.FormEvent) => {
        e.preventDefault();
        setNoteSaving(true);
        let error;
        
        if (editNoteId) {
            const { error: updateError } = await supabase.from('clinical_notes').update({
                subjective_text: noteData.subjective_text,
                objective_text: noteData.objective_text,
                analysis_text: noteData.analysis_text,
                plan_text: noteData.plan_text,
                consultation_date: noteData.consultation_date
            }).eq('id', editNoteId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('clinical_notes').insert({
                patient_id: id,
                consultation_date: new Date(noteData.consultation_date).toISOString(),
                subjective_text: noteData.subjective_text,
                objective_text: noteData.objective_text,
                analysis_text: noteData.analysis_text,
                plan_text: noteData.plan_text,
            });
            error = insertError;
        }

        if (!error) {
            setIsNoteModalOpen(false);
            setEditNoteId(null);
            setNoteData({ subjective_text: '', objective_text: '', analysis_text: '', plan_text: '', consultation_date: new Date().toISOString().substring(0, 10) });
            fetchPatient(); // Recargar línea de tiempo
            toast.success("Nota guardada correctamente");
        } else {
            toast.error('Error al guardar la nota: ' + error.message);
        }
        setNoteSaving(false);
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm('¿Seguro de eliminar esta nota?')) return;
        await supabase.from('clinical_notes').delete().eq('id', noteId);
        fetchPatient();
        toast.success("Nota eliminada");
    };

    const handleAddAllergy = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAllergy.name || !id) return;
        
        await supabase.from('patient_allergies').insert({
            patient_id: id,
            allergen_name: newAllergy.name,
            severity: newAllergy.severity
        });
        
        setNewAllergy({ name: '', severity: 'MEDIUM' });
        fetchPatient();
    };

    const handleDeleteAllergy = async (allergyId: string) => {
        await supabase.from('patient_allergies').delete().eq('id', allergyId);
        fetchPatient();
    };

    const applyTemplate = (content: string) => {
        if(activeTab === 'rx') {
             setPrescriptionText(prev => prev ? `${prev}\n\n${content}` : content);
        } else {
             setNoteData(prev => ({
                 ...prev,
                 plan_text: prev.plan_text ? `${prev.plan_text}\n\n${content}` : content
             }));
        }
    };

    const [isSavingRx, setIsSavingRx] = useState(false);

    const handlePrintPrescription = async () => {
        if (!prescriptionText.trim() && !confirm('La receta está vacía. ¿Aún así deseas imprimir el formato en blanco?')) {
            return;
        }

        // Registrar la receta en el Historial Evolutivo (DB)
        if (prescriptionText.trim()) {
            setIsSavingRx(true);
            const { error } = await supabase.from('clinical_notes').insert({
                patient_id: id,
                consultation_date: new Date().toISOString(),
                subjective_text: 'EMISIÓN DE RECETA MÉDICA (VADEMÉCUM)',
                plan_text: prescriptionText,
            });
            setIsSavingRx(false);
            
            if (error) {
                toast.error('Error al guardar registro de receta en DB');
                return;
            }
            toast.success('Receta foliada y archivada temporalmente en la base de datos.');
            fetchPatient(); // Refresca la línea del tiempo
        }

        // Disparar ventana de impresión del sistema
        window.print();
    };

    const handleAddSurgery = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const surgery = {
             patient_id: id,
             procedure_name: formData.get('procedure_name'),
             surgery_date: formData.get('surgery_date'),
             surgeon_name: formData.get('surgeon_name'),
             notes: formData.get('notes')
        };
        const { error } = await supabase.from('patient_surgeries').insert([surgery]);
        if(!error) {
             fetchPatient();
             (e.target as HTMLFormElement).reset();
        } else {
             toast.error("Error agregando cirugía. ¿Aseguraste ejecutar el SQL patient_surgeries?");
        }
    };

    const handleDeleteSurgery = async (surgId: string) => {
        if(confirm('¿Eliminar registro quirúrgico?')) {
             await supabase.from('patient_surgeries').delete().eq('id', surgId);
             fetchPatient();
        }
    };

    const filteredCie10 = cieSearch.trim() ? CIE10_DB.filter(c => {
        const terms = cieSearch.toLowerCase().split(' ').filter(Boolean);
        const searchTarget = (c.code + " " + c.desc).toLowerCase();
        return terms.every(term => searchTarget.includes(term));
    }) : CIE10_DB.slice(0, 20);

    const selectCie10 = (code: string, desc: string) => {
        const text = noteData.analysis_text ? `${noteData.analysis_text}\n[${code}] ${desc}` : `[${code}] ${desc}`;
        setNoteData({ ...noteData, analysis_text: text });
        setIsCie10Open(false);
        toast.success("Diagnóstico agregado.");
    };

    if(!patient) return <div className="p-8 text-center animate-pulse text-slate-500 font-medium">Cargando expediente...</div>;

    const getInitials = () => {
        return (patient.first_name?.[0] || '') + (patient.last_name?.[0] || '');
    };

    const calculateAge = (dob: string) => {
        if (!dob) return '-';
        const diff = Date.now() - new Date(dob).getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-start print:hidden">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Historia Clínica Electrónica</h1>
                    <p className="text-slate-500 mt-1 font-medium">Expediente Clínico Universal e interoperable (EHR).</p>
                </div>
                <div className="flex gap-3">
                   <button onClick={() => router.push('/pacientes')} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm">
                        Volver a Pacientes
                   </button>
                </div>
            </div>

            {/* Patient Header Block */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between print:hidden">
                <div className="flex gap-4 items-center">
                    <div 
                        onClick={() => photoInputRef.current?.click()}
                        className="w-16 h-16 rounded-2xl shadow-md shadow-blue-500/20 flex flex-col items-center justify-center text-white font-bold tracking-tight text-xl uppercase cursor-pointer hover:scale-105 transition-all group relative overflow-hidden shrink-0 border-2 border-white bg-gradient-to-br from-blue-500 to-indigo-600"
                    >
                        {isUploadingPhoto ? (
                            <Activity className="w-6 h-6 animate-pulse" />
                        ) : patient.photo_url ? (
                            <img src={patient.photo_url} alt="Profile" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                            getInitials()
                        )}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform">
                            <Camera className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                            {patient.first_name} {patient.last_name} {patient.second_last_name || ''}
                            <span className="bg-blue-50 text-blue-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-blue-100">
                                Exp. {patient.id.split('-')[0]}
                            </span>
                        </h2>
                        <div className="flex gap-4 text-sm font-semibold text-slate-500 mt-1.5">
                            <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-rose-400" /> {patient.blood_type || 'Desconocido'}</span>
                            <span>{calculateAge(patient.date_of_birth)} Años</span>
                            <span>{patient.gender === 'F' ? 'Femenino' : patient.gender === 'M' ? 'Masculino' : patient.gender === 'O' ? 'Otro' : 'No especificado'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div onClick={() => setIsAllergiesModalOpen(true)} className={`px-4 py-2 border rounded-xl cursor-pointer transition flex flex-col justify-center ${allergies.length > 0 ? 'bg-rose-50 border-rose-200 hover:bg-rose-100' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                        <span className={`block text-xs font-bold uppercase tracking-wider mb-0.5 ${allergies.length > 0 ? 'text-rose-500' : 'text-slate-400'}`}>Alergias</span>
                        <span className={`text-sm font-semibold ${allergies.length > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                            {allergies.length > 0 ? `${allergies.length} Registradas` : 'Sin Registrar'}
                        </span>
                    </div>
                    <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl flex flex-col justify-center">
                        <span className="block text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Riesgo Quirúrgico</span>
                        <span className="text-sm font-semibold text-amber-700 capitalize">{patient.status === 'low' ? 'Bajo' : patient.status === 'medium' ? 'Medio' : 'Alto'}</span>
                    </div>
                </div>
            </div>

            {/* Macro-Campo de Resumen General Infinito */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-in slide-in-from-bottom-2 duration-700 print:hidden">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500" /> Resumen Médico General (Persistente)</h3>
                    {isSavingSummary && <span className="text-xs font-semibold text-indigo-400 animate-pulse bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Guardando silenciosamente...</span>}
                </div>
                <textarea 
                    value={clinicalSummary}
                    onChange={(e) => setClinicalSummary(e.target.value)}
                    onBlur={handleSaveSummary}
                    placeholder="Escribe libremente aquí cualquier antecedente clínico importante, cirugías pasadas relevantes o resumen vital del paciente. Este campo es de texto infinito y funciona como Post-it principal del paciente. Se guarda solo al quitar el cursor de este recuadro."
                    className="w-full bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 min-h-[140px] focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:bg-white transition-all text-slate-700 text-sm font-medium leading-relaxed resize-y scrollbar-hide shadow-inner placeholder:text-amber-700/40"
                />
            </div>

            {/* EHR Navigation Module */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 print:block">
                {/* Navigation column */}
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 h-fit space-y-1.5 print:hidden">
                    <button onClick={() => setActiveTab('timeline')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'timeline' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}>
                        <Clock className={`w-5 h-5 ${activeTab === 'timeline' ? 'text-blue-600' : 'text-slate-400'}`} />
                        Línea del Tiempo
                    </button>
                    <button onClick={() => setActiveTab('notes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'notes' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}>
                        <FileText className={`w-5 h-5 ${activeTab === 'notes' ? 'text-blue-600' : 'text-slate-400'}`} />
                        Notas Clínicas
                    </button>
                    <button onClick={() => setActiveTab('rx')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'rx' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}>
                        <Pill className={`w-5 h-5 ${activeTab === 'rx' ? 'text-blue-600' : 'text-slate-400'}`} />
                        Recetas (Vademécum)
                    </button>
                    <button onClick={() => setActiveTab('surgical')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'surgical' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}>
                        <Scissors className={`w-5 h-5 ${activeTab === 'surgical' ? 'text-blue-600' : 'text-slate-400'}`} />
                        Historial Quirúrgico
                    </button>
                    <button onClick={() => setActiveTab('docs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'docs' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-semibold'}`}>
                        <FileCode2 className={`w-5 h-5 ${activeTab === 'docs' ? 'text-blue-600' : 'text-slate-400'}`} />
                        Estudios e Imagenología
                    </button>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 print:p-0 print:border-none print:shadow-none print:block">

                    {activeTab === 'timeline' && (
                        <div className="animate-in fade-in duration-300 print:hidden">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold text-slate-800">Cronología de Visitas</h3>
                                <button 
                                    onClick={() => {
                                        setEditNoteId(null);
                                        setNoteData({ subjective_text: '', objective_text: '', analysis_text: '', plan_text: '', consultation_date: new Date().toISOString().substring(0, 10) });
                                        setIsNoteModalOpen(true);
                                    }}
                                    className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition shadow-sm"
                                >
                                    + Nueva Nota Médica
                                </button>
                            </div>

                            <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
                                {notes.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-8">
                                        No hay notas clínicas registradas. Haz clic en "+ Nueva Nota Médica" para crear el primer registro clínico evolutivo. (Modelo SOAP).
                                    </div>
                                ) : (
                                    notes.map((note) => (
                                        <div key={note.id} className="relative pl-8 animate-in slide-in-from-bottom-4 duration-500">
                                            <div className="absolute -left-[21px] top-1 w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-sm">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 shadow-sm relative group">
                                                <div className="flex justify-between mb-4 pb-4 border-b border-slate-200/60">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-lg">Nota de Evolución</h4>
                                                        <p className="text-sm text-slate-500 font-semibold flex items-center gap-2 mt-0.5">
                                                            {new Date(note.consultation_date).toLocaleDateString()} • Dr. {note.doctors?.last_name || 'Admin'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                setEditNoteId(note.id);
                                                                setNoteData({
                                                                    subjective_text: note.subjective_text || '',
                                                                    objective_text: note.objective_text || '',
                                                                    analysis_text: note.analysis_text || '',
                                                                    plan_text: note.plan_text || '',
                                                                    consultation_date: note.consultation_date.substring(0, 10)
                                                                });
                                                                setIsNoteModalOpen(true);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-md text-indigo-600 font-bold text-xs h-fit shadow-sm"
                                                        >
                                                            Editar/Corregir
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteNote(note.id)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1 rounded-md text-red-600 font-bold text-xs h-fit shadow-sm mr-2"
                                                        >
                                                            Eliminar
                                                        </button>
                                                        <span className="bg-white border border-slate-200 px-3 py-1 rounded-md text-slate-600 font-bold text-xs h-fit shadow-sm flex items-center gap-1 group-hover:opacity-60 transition-opacity uppercase px-2">
                                                            {note.status === 'final' ? 'Finalizada' : 'Borrador'} 
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Representación Estilo ARMED (SOAP) */}
                                                <div className="space-y-4">
                                                    {note.subjective_text && (
                                                        <div>
                                                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Subjetivo / Motivo Consulta</span>
                                                            <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-slate-100">{note.subjective_text}</p>
                                                        </div>
                                                    )}
                                                    {note.objective_text && (
                                                        <div>
                                                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Objetivo / Exploración Física</span>
                                                            <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-slate-100">{note.objective_text}</p>
                                                        </div>
                                                    )}
                                                    {note.analysis_text && (
                                                        <div>
                                                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Análisis / Diagnóstico</span>
                                                            <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-slate-100">{note.analysis_text}</p>
                                                        </div>
                                                    )}
                                                    {note.plan_text && (
                                                        <div>
                                                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Plan (Tratamiento TX)</span>
                                                            <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-slate-100">{note.plan_text}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'docs' && (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Estudios Radiológicos y Clínicos</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-1">Sube el antes/después, RM, Labs o fotografías clínicas. Soporte ARMED Lightbox.</p>
                                </div>
                                <div className="flex gap-3">
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 transition px-5 py-2.5 rounded-xl font-bold shadow-md disabled:opacity-70 disabled:cursor-wait">
                                        <UploadCloud className="w-5 h-5" />
                                        {isUploading ? 'Subiendo...' : 'Subir Estudio (JPG/PNG/PDF)'}
                                    </button>
                                </div>
                            </div>

                            {documents.length === 0 ? (
                                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-slate-50/50">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                        <ImageIcon className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h4 className="font-bold text-slate-700 text-lg mb-1">El expediente no tiene estudios registrados</h4>
                                    <p className="text-slate-500 font-medium max-w-sm mb-6">Añade radiografías previas a la cirugía para crear la línea base del caso clínico.</p>
                                    <button onClick={() => fileInputRef.current?.click()} className="text-blue-600 font-extrabold uppercase text-xs tracking-wider bg-blue-50 px-6 py-2.5 rounded-lg hover:bg-blue-100 transition">Explorar Archivos Locales</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer" 
                                             onClick={() => {
                                                 if (doc.file_type?.startsWith('image/')) {
                                                     setLightboxImage({ src: getFileUrl(doc.file_path), alt: doc.file_name, id: doc.id, isFavorite: doc.is_favorite });
                                                 } else {
                                                     window.open(getFileUrl(doc.file_path), '_blank');
                                                 }
                                             }}>
                                            {doc.file_type?.startsWith('image/') ? (
                                                <img src={getFileUrl(doc.file_path)} alt={doc.file_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full text-slate-400">
                                                    <FileText className="w-12 h-12" />
                                                </div>
                                            )}
                                            
                                            {/* Overlays */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                <span className="text-white font-semibold text-xs truncate drop-shadow-md">{doc.file_name}</span>
                                            </div>

                                            {/* Badges and Actions */}
                                            {doc.is_favorite && (
                                                <div className="absolute top-3 left-3 bg-amber-400 text-amber-900 p-1.5 rounded-full shadow-lg">
                                                    <Star className="w-3.5 h-3.5 fill-amber-900" />
                                                </div>
                                            )}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id, doc.file_path); }}
                                                className="absolute top-3 right-3 bg-white/90 backdrop-blur text-red-600 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition hover:bg-red-50 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- PESTAÑA: RECETAS (ARMED FEATURE) --- */}
                    {activeTab === 'rx' && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-6 animate-in slide-in-from-bottom-2 print:p-0 print:border-none print:shadow-none print:block">
                            {/* Editor de Receta */}
                            <div className="flex-1 space-y-4 print:hidden">
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <Pill className="w-5 h-5 text-indigo-500" /> Generador de Recetas (Vademécum)
                                </h3>
                                
                                {/* Autocompletar con Plantillas de Receta */}
                                {templates.filter(t => t.category === 'RECETA').length > 0 && (
                                    <div className="flex gap-2 flex-wrap mb-4">
                                        <span className="text-xs font-bold text-slate-500 flex items-center">Plantillas Rápidas:</span>
                                        {templates.filter(t => t.category === 'RECETA').map(tpl => (
                                            <button key={tpl.id} onClick={() => applyTemplate(tpl.html_content)} className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition shadow-sm">
                                                {tpl.template_name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <p className="text-sm font-medium text-slate-500">
                                    Escribe el contenido de la receta aquí y visualiza cómo se verá el PDF impreso en el panel derecho.
                                </p>

                                <textarea 
                                    value={prescriptionText} 
                                    onChange={e => setPrescriptionText(e.target.value)}
                                    placeholder="Ej. Paracetamol 500mg, 1 tableta cada 8 horas por 3 días..."
                                    className="w-full h-80 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                                />

                                <div className="flex gap-3 justify-end items-center border-t border-slate-100 pt-4 mt-4">
                                    <button onClick={() => setPrescriptionText('')} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition">Limpiar Texto</button>
                                    <button onClick={handlePrintPrescription} disabled={isSavingRx} className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-2 shadow-md disabled:opacity-50">
                                        <FileText className="w-4 h-4" /> {isSavingRx ? 'Archivando...' : 'Generar e Imprimir PDF'}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Vista Previa de Receta (Visible in UI, formatted for Print via Tailwind print variants) */}
                            <div className="w-full xl:w-[450px] bg-white border border-slate-200 rounded-xl shadow-sm p-8 min-h-[600px] flex flex-col relative print:fixed print:inset-0 print:w-full print:h-[100vh] print:border-none print:shadow-none print:z-[9999] print:bg-white print:p-12 print:m-0 object-contain">
                                {/* Diseño de Receta Médica */}
                                <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-center">
                                    <div>
                                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter">HealthCoreOS</h1>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Clínica de Especialidades</p>
                                    </div>
                                    <div className="text-right text-xs text-slate-500 font-medium">
                                        <p>Fecha: {new Date().toLocaleDateString()}</p>
                                        <p>Folio: #{(Math.random() * 10000).toFixed(0)}</p>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6 print:bg-transparent print:border-slate-300 print:border-y print:rounded-none">
                                    <p className="text-sm font-bold text-slate-800 uppercase"><span className="text-slate-500 font-medium normal-case">Paciente:</span> {patient.first_name} {patient.last_name} {patient.second_last_name || ''}</p>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <p className="text-xs font-semibold text-slate-700"><span className="text-slate-400">Edad:</span> {calculateAge(patient.date_of_birth)} años</p>
                                        <p className="text-xs font-semibold text-slate-700"><span className="text-slate-400">Peso:</span> {lastVitals?.weight || '---'} kg</p>
                                        <p className="text-xs font-semibold text-slate-700"><span className="text-slate-400">Talla:</span> {lastVitals?.height || '---'} m</p>
                                        <p className="text-xs font-semibold text-slate-700"><span className="text-slate-400">Presión:</span> {lastVitals?.systolic || '--'}/{lastVitals?.diastolic || '--'}</p>
                                        <p className="text-xs font-semibold text-slate-700"><span className="text-slate-400">Temp:</span> {lastVitals?.temperature || '---'} °C</p>
                                    </div>
                                    {allergies.length > 0 && (
                                        <p className="text-xs font-bold text-red-600 mt-3 pt-3 border-t border-slate-200/50 uppercase tracking-wide">⚠ ALERGIAS: {allergies.map(a => a.allergen_name).join(', ')}</p>
                                    )}
                                </div>
                                
                                <div className="flex-1">
                                    <h4 className="text-3xl font-serif italic font-bold text-slate-300 mb-6">Rx</h4>
                                    <div className="whitespace-pre-wrap text-sm font-semibold text-slate-800 leading-loose">
                                        {prescriptionText || <span className="text-slate-300 italic font-medium">Escribe el medicamento en el panel izquierdo para previsualizarlo aquí...</span>}
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 text-center print:bottom-12 print:absolute print:left-0 print:right-0">
                                    <div className="w-64 border-b border-slate-800 mx-auto mb-2 h-16"></div>
                                    <p className="text-sm font-extrabold text-slate-800">Dr. {doctorProfile?.doctors?.first_name} {doctorProfile?.doctors?.last_name}</p>
                                    <p className="text-xs font-bold text-slate-500 mt-1">{doctorProfile?.doctors?.specialty || 'Médico General'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PESTAÑA: HISTORIAL QUIRÚRGICO (ARMED SURGICAL) --- */}
                    {activeTab === 'surgical' && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-bottom-2">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Scissors className="w-6 h-6 text-rose-500" /> Antecedentes Quirúrgicos
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Formulario de Alta */}
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                    <h4 className="font-bold text-slate-700 text-sm mb-4 uppercase tracking-wider">Añadir Procedimiento Previo</h4>
                                    <form onSubmit={handleAddSurgery} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Nombre de Procedimiento / Cirugía *</label>
                                            <input required name="procedure_name" type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-rose-500 text-sm font-medium" placeholder="Ej. Apendicectomía Laparoscópica" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Fecha de Cirugía *</label>
                                                <input required name="surgery_date" type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-rose-500 text-sm font-medium" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Cirujano Tratante</label>
                                                <input name="surgeon_name" type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-rose-500 text-sm font-medium" placeholder="Opcional" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Notas Quirúrgicas (Complicaciones, hallazgos)</label>
                                            <textarea name="notes" rows={2} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-rose-500 text-sm font-medium resize-none" placeholder="Ingreso a UCI, sangrado, etc..."></textarea>
                                        </div>
                                        <button type="submit" className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition shadow-sm">
                                            Añadir al Perfil Quirúrgico
                                        </button>
                                    </form>
                                </div>
                                
                                {/* Lista de Cirugías */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Cronología Intervenciones</h4>
                                    {surgeries.length === 0 ? (
                                        <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 font-medium">
                                            El paciente no cuenta con procedimientos quirúrgicos previos o no han sido capturados.
                                        </div>
                                    ) : (
                                        surgeries.map(surg => (
                                            <div key={surg.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
                                                <div className="absolute top-4 right-4 text-xs font-bold text-slate-400">
                                                    {new Date(surg.surgery_date).toLocaleDateString()}
                                                </div>
                                                <h5 className="font-bold text-rose-800 text-lg pr-20">{surg.procedure_name}</h5>
                                                {surg.surgeon_name && <p className="text-xs font-bold text-slate-500 mt-1 uppercase">Médico: {surg.surgeon_name}</p>}
                                                {surg.notes && <p className="text-sm font-medium text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">{surg.notes}</p>}
                                                
                                                <button onClick={() => handleDeleteSurgery(surg.id)} className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Si es otra pestaña muestra mockup de vacío */}
                    {activeTab !== 'timeline' && activeTab !== 'docs' && activeTab !== 'rx' && activeTab !== 'surgical' && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400 animate-in fade-in">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                                <FileText className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-600 mb-1">Sección en Construcción (Fase 3 y 4)</h3>
                            <p className="text-sm font-medium px-8 text-center">Selecciona 'Línea del Tiempo' para ver el historial general del perfil de {patient.first_name}. Aquí integraremos las plantillas de ARMED.</p>
                        </div>
                    )}

                </div>
            </div>

            {/* Lightbox / ARMED Image View */}
            {lightboxImage && (
                <ImageLightbox 
                    src={lightboxImage.src} 
                    alt={lightboxImage.alt}
                    isFavorite={lightboxImage.isFavorite}
                    onClose={() => setLightboxImage(null)}
                    onToggleFavorite={() => toggleFavorite(lightboxImage.id, lightboxImage.isFavorite)}
                />
            )}

            {/* Modal: Editar/Crear Nota Clínica */}
            {isNoteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsNoteModalOpen(false) }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in slide-in-from-bottom-4 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" /> Redactar Nota de Evolución
                            </h3>
                            <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-lg transition"><X className="w-5 h-5" /></button>
                        </div>
                        
                        {/* Selector de Plantillas Rápidas (ARMED Feature) */}
                        {templates.length > 0 && (
                            <div className="bg-blue-50/50 px-6 py-3 border-b border-blue-100 flex items-center gap-3">
                                <span className="text-sm font-bold text-blue-800">Cargar Plantilla:</span>
                                <div className="flex gap-2 flex-wrap">
                                    {templates.map(tpl => (
                                        <button 
                                            key={tpl.id} 
                                            onClick={() => applyTemplate(tpl.html_content)}
                                            className="px-3 py-1.5 bg-white border border-blue-200 rounded-full text-xs font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition shadow-sm"
                                        >
                                            {tpl.template_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="note-form" onSubmit={handleSaveNote} className="space-y-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Subjetivo (Motivo de consulta / Síntomas)</label>
                                        <textarea 
                                            required 
                                            rows={4} 
                                            value={noteData.subjective_text} 
                                            onChange={e => setNoteData({...noteData, subjective_text: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 resize-none"
                                            placeholder="Lo que el paciente refiere, síntomas, tiempo de evolución..." 
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Objetivo (Exploración Física / Signos)</label>
                                        <textarea 
                                            rows={4} 
                                            value={noteData.objective_text} 
                                            onChange={e => setNoteData({...noteData, objective_text: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 resize-none"
                                            placeholder="Signos vitales, hallazgos de exploración, resultados de inspección..." 
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Análisis (Diagnóstico)</label>
                                            <button type="button" onClick={() => setIsCie10Open(true)} className="text-[10px] font-black bg-amber-50 text-amber-600 hover:bg-amber-100 px-2 py-1 rounded-md flex items-center gap-1 transition">
                                                <Search className="w-3 h-3" /> BUSCAR CIE-10
                                            </button>
                                        </div>
                                        <textarea 
                                            rows={4} 
                                            value={noteData.analysis_text} 
                                            onChange={e => setNoteData({...noteData, analysis_text: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 resize-none"
                                            placeholder="Razonamiento médico, integración diagnóstica..." 
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Plan (Tratamiento TX / Estudios Previstos)</label>
                                        <textarea 
                                            rows={4} 
                                            value={noteData.plan_text} 
                                            onChange={e => setNoteData({...noteData, plan_text: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 resize-none"
                                            placeholder="Medicamentos, receta a generar, plan quirúrgico, reposo, interconsultas..." 
                                        />
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha Emulada de Consulta</label>
                                    <input 
                                        type="date" 
                                        value={noteData.consultation_date} 
                                        onChange={e => setNoteData({...noteData, consultation_date: e.target.value})}
                                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500" 
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Sirve por si el doctor está registrando las notas retroactivamente de forma manual (ej. capturando notas antiguas).</p>
                                </div>
                            </form>
                        </div>
                        
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsNoteModalOpen(false)} className="px-5 py-2 hover:bg-slate-200 font-bold text-slate-500 rounded-xl transition">Cancelar</button>
                            <button type="submit" form="note-form" disabled={noteSaving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 text-white font-bold rounded-xl transition disabled:opacity-50">
                                {noteSaving ? 'Guardando...' : 'Guardar al Expediente Fijo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Gestión de Alergias */}
            {isAllergiesModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsAllergiesModalOpen(false) }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-rose-100 flex justify-between items-center bg-rose-50">
                            <h3 className="text-xl font-bold text-rose-800 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-rose-600" /> Historial de Alergias
                            </h3>
                            <button onClick={() => setIsAllergiesModalOpen(false)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-200 p-1 rounded-lg transition"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleAddAllergy} className="flex gap-2 mb-6">
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Nombre activo (ej. Penicilina)" 
                                    value={newAllergy.name}
                                    onChange={e => setNewAllergy({...newAllergy, name: e.target.value})}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                                />
                                <select 
                                    value={newAllergy.severity}
                                    onChange={e => setNewAllergy({...newAllergy, severity: e.target.value})}
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 w-32"
                                >
                                    <option value="LOW">Leve</option>
                                    <option value="MEDIUM">Moderada</option>
                                    <option value="HIGH">Severa</option>
                                </select>
                                <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg transition shadow-sm">Añadir</button>
                            </form>

                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {allergies.length === 0 ? (
                                    <div className="text-center p-6 text-slate-400 font-medium">Ninguna alergia documentada en este momento.</div>
                                ) : (
                                    allergies.map(alg => (
                                        <div key={alg.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                            <div>
                                                <h5 className="font-bold text-slate-800">{alg.allergen_name}</h5>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${alg.severity === 'HIGH' ? 'bg-red-100 text-red-700' : alg.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    Riesgo {alg.severity === 'HIGH' ? 'Severo' : alg.severity === 'MEDIUM' ? 'Moderado' : 'Leve'}
                                                </span>
                                            </div>
                                            <button onClick={() => handleDeleteAllergy(alg.id)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
