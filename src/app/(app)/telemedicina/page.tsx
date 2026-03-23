"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Video, Mic, MicOff, VideoOff, PhoneMissed, MessageSquare, Send, FileCode2, UserCircle, Share2, Maximize } from 'lucide-react';

export default function TelemedicinaPage() {
    const [micOn, setMicOn] = useState(false);
    const [camOn, setCamOn] = useState(false);
    const [chatOpen, setChatOpen] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    const toggleCamera = async () => {
        if (!camOn && !micOn) {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                setCamOn(true);
                setMicOn(true);
            } catch (err) {
                console.error("Camera access denied:", err);
            }
        } else {
            // Already have stream, just toggle tracks
            if (stream) {
                stream.getVideoTracks().forEach(track => track.enabled = !camOn);
            }
            setCamOn(!camOn);
        }
    };

    const toggleMic = async () => {
        if (!camOn && !micOn) {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                setCamOn(true);
                setMicOn(true);
            } catch (err) {
                console.error("Mic access denied:", err);
            }
        } else {
            if (stream) {
                stream.getAudioTracks().forEach(track => track.enabled = !micOn);
            }
            setMicOn(!micOn);
        }
    };

    const stopStream = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setCamOn(false);
        setMicOn(false);
    };

    useEffect(() => {
        if (localVideoRef.current && stream) {
            localVideoRef.current.srcObject = stream;
        }
    }, [stream, camOn]);


    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 sticky top-0 z-10 shrink-0">
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
                        Sesión Virtual <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse mr-1"></span>
                        <span className="text-sm font-semibold text-slate-500">Consultorio Digital Secundario</span>
                    </h1>
                    <p className="text-xs text-slate-500 font-bold mt-1">Tiempo de la llamada: 12:44</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-sm gap-1">
                    <button className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white rounded-lg shadow-sm">Paciente</button>
                    <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Exploración</button>
                    <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Consentimiento</button>
                </div>
            </div>

            <div className="flex gap-6 h-full min-h-0 flex-1 relative">

                {/* Main Video Area */}
                <div className="flex-1 bg-gradient-to-br from-slate-900 to-black rounded-2xl border-4 border-slate-800 overflow-hidden relative shadow-2xl flex flex-col group">

                    {/* PIP Doctor (Local Stream) */}
                    <div className="absolute top-4 right-4 w-40 h-56 bg-slate-800 rounded-xl border-2 border-slate-600 shadow-xl overflow-hidden z-20 transition-all hover:scale-105">
                        {camOn && stream ? (
                            <video 
                                ref={localVideoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className="w-full h-full object-cover -scale-x-100" // -scale-x-100 creates mirror effect
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-t from-teal-900/50 to-slate-800 flex flex-col items-center justify-center opacity-90">
                                <UserCircle className="w-10 h-10 text-slate-400 mb-2" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Cámara Apagada</span>
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded backdrop-blur">
                            {!micOn && <MicOff className="w-3 h-3 text-red-400" />}
                            <span className="text-[10px] font-bold text-white uppercase">Tú (Dr.)</span>
                        </div>
                    </div>

                    {/* Patient Video Placeholder */}
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        <div className="absolute inset-0 bg-blue-900/10 z-0 pattern-dots opacity-20"></div>

                        {/* Simulated Video Feed Subject */}
                        <div className="w-32 h-32 bg-slate-700 rounded-full mb-4 flex items-center justify-center z-10 animate-pulse outline outline-[8px] outline-slate-800">
                            <UserCircle className="w-16 h-16 text-slate-400" />
                        </div>
                        <div className="z-10 text-center">
                            <h3 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Ana López Castro</h3>
                            <p className="text-slate-400 font-semibold text-sm flex items-center justify-center gap-2 mt-1">
                                <Mic className="w-3 h-3" /> Audio HD Activado
                            </p>
                        </div>
                    </div>

                    {/* Call Controls Overlay */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-2xl flex p-2 gap-2 border border-white/10 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={toggleMic} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg ${micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </button>
                        <button onClick={toggleCamera} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg ${camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                            {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        </button>
                        <button className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-all shadow-lg">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button onClick={stopStream} className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-all font-bold px-8 shadow-lg shadow-red-500/30" title="Finalizar Sesión">
                            <PhoneMissed className="w-5 h-5" />
                        </button>
                        <button onClick={() => setChatOpen(!chatOpen)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-l border-white/20 rounded-l-none pl-4 ${chatOpen ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-300'}`}>
                            <MessageSquare className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Chat & Shared Docs Panel */}
                {chatOpen && (
                    <div className="w-80 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden shrink-0">

                        {/* Panel Tabs */}
                        <div className="flex border-b border-slate-100 bg-slate-50/50">
                            <button className="flex-1 py-3 text-sm font-bold text-purple-600 border-b-2 border-purple-600">Chat y Notas</button>
                            <button className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition">Estudios (2)</button>
                        </div>

                        {/* Chat History */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">

                            {/* System Msg */}
                            <div className="text-center my-4">
                                <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">La sesión ha comenzado - Cifrado E2E</span>
                            </div>

                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 font-bold text-slate-500 text-xs flex items-center justify-center">AL</div>
                                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-sm text-sm font-medium text-slate-700 shadow-sm">
                                    Doctor, ya tengo los resultados de laboratorio que me pidió ayer.
                                    <span className="block text-[10px] text-slate-400 mt-2 font-bold text-right">12:31 PM</span>
                                </div>
                            </div>

                            <div className="flex gap-3 flex-row-reverse">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 shrink-0 font-bold text-xs flex items-center justify-center">TU</div>
                                <div className="bg-purple-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm font-medium shadow-md shadow-purple-500/20">
                                    Excelente Ana, por favor envíalos usando el botón del clip para poder revisarlos juntos.
                                    <span className="block text-[10px] text-purple-200 mt-2 font-bold text-left">12:32 PM</span>
                                </div>
                            </div>

                            {/* Attachment Block */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 font-bold text-slate-500 text-xs flex items-center justify-center">AL</div>
                                <div className="bg-white border border-slate-200 p-3 flex gap-4 rounded-2xl rounded-tl-sm text-sm font-medium text-slate-700 shadow-sm w-[85%]">
                                    <div className="bg-red-50 p-2 rounded-lg text-red-500 shrink-0"><FileCode2 className="w-5 h-5" /></div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-xs truncate">Quimica_Sanguinea.pdf</p>
                                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">2 Páginas • Recibido</p>
                                    </div>
                                </div>
                            </div>

                            {/* Autosave Note Indicator */}
                            <div className="flex items-center gap-2 justify-center pt-2">
                                <div className="w-2 h-2 rounded-full border border-slate-300 border-t-purple-500 animate-spin"></div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generando resumen clínico AI en base a la transcripción...</span>
                            </div>

                        </div>

                        {/* Chat Input */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <div className="relative flex items-center group">
                                <button className="absolute left-2 w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-purple-600 flex items-center justify-center transition">
                                    +
                                </button>
                                <input type="text" placeholder="Escribe un mensaje..." className="w-full bg-slate-50 border border-slate-200 rounded-full pl-12 pr-12 py-2.5 text-sm font-medium focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition" />
                                <button className="absolute right-2 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition shadow-md shadow-purple-500/30">
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
