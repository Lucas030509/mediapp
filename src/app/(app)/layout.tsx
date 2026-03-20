import { ReactNode } from 'react';
import Link from 'next/link';
import { Home, Settings, Users, Calendar, FileText, Video, Receipt, Activity, LogOut, Stethoscope, ClipboardList, Building2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-teal-500 selection:text-white">
            {/* Sidebar de alta fidelidad estética */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 text-slate-300 min-h-screen flex flex-col relative overflow-hidden transition-all duration-300">

                {/* Efecto Glow Decorativo */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-teal-500/20 to-transparent pointer-events-none" />
                <Toaster position="top-right" toastOptions={{ className: 'font-sans font-medium', style: { borderRadius: '12px' } }} />

                <div className="p-6 pb-2 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">HealthCore<span className="text-teal-400">OS</span></h2>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto z-10 scrollbar-hide">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3 mt-4">General</div>

                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-white active:bg-white/10 transition-all group">
                        <Home className="w-5 h-5 text-slate-400 group-hover:text-teal-400 transition-colors" />
                        <span className="font-medium">Panel Principal</span>
                    </Link>

                    <Link href="/pacientes" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-white active:bg-white/10 transition-all group">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-slate-400 group-hover:text-teal-400 transition-colors" />
                            <span className="font-medium">Gestión de Pacientes</span>
                        </div>
                        <span className="bg-teal-500/10 text-teal-400 py-0.5 px-2 rounded-full text-xs font-bold border border-teal-500/20">CRM</span>
                    </Link>

                    <Link href="/agenda" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-white active:bg-white/10 transition-all group">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                            <span className="font-medium">Agenda Inteligente</span>
                        </div>
                        {/* Indicador de Badges */}
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                    </Link>

                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3 mt-8">Clínica & EHR</div>

                    <Link href="/ehr" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-white active:bg-white/10 transition-all group">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                        <span className="font-medium">Historia Clínica</span>
                    </Link>

                    <Link href="/plantillas" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-white active:bg-white/10 transition-all group">
                        <ClipboardList className="w-5 h-5 text-slate-400 group-hover:text-pink-400 transition-colors" />
                        <span className="font-medium">Gestor Plantillas</span>
                    </Link>

                    <Link href="/telemedicina" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-white active:bg-white/10 transition-all group">
                        <Video className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" />
                        <span className="font-medium">Telemedicina</span>
                    </Link>

                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3 mt-8">Administración</div>

                    <Link href="/doctores" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-white active:bg-white/10 transition-all group">
                        <Stethoscope className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        <span className="font-medium">Directorio Médico</span>
                    </Link>

                    <Link href="/directorios" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-white active:bg-white/10 transition-all group">
                        <Building2 className="w-5 h-5 text-slate-400 group-hover:text-teal-400 transition-colors" />
                        <span className="font-medium">Instituciones</span>
                    </Link>

                    <Link href="/facturacion" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-white active:bg-white/10 transition-all group">
                        <Receipt className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                        <span className="font-medium">Facturación</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl z-10 w-full relative">
                    <Link href="/configurador" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-all group mb-1">
                        <Settings className="w-5 h-5 text-slate-400 group-hover:text-slate-200" />
                        <span className="font-medium text-sm">Ajustes Generales</span>
                    </Link>
                    <form action="/api/auth/logout" method="POST">
                        <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-all text-slate-400 hover:text-red-400 text-left group">
                            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="font-medium text-sm">Cerrar Sesión</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Área del Dashboard principal */}
            <main className="flex-1 overflow-x-hidden pt-4 pb-12 px-8 z-0">
                <header className="flex justify-between items-center mb-8 bg-white/50 backdrop-blur-xs border border-slate-200/60 p-4 rounded-2xl shadow-sm sticky top-4 z-50">
                    <div className="flex items-center gap-2">
                        <span className="bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide border border-teal-100 flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            En Línea
                        </span>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="flex flex-col text-right">
                            <span className="text-sm font-bold text-slate-800">Dr. Administrador</span>
                            <span className="text-xs font-medium text-slate-500">Cardiología</span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white shadow-md"></div>
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
}
