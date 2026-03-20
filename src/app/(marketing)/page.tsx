import { Metadata } from 'next';
import Link from 'next/link';
import { Stethoscope, Calendar, FileText, ShieldCheck, ArrowRight, UserCircle, Activity, HeartPulse, Clock, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
    title: 'HealthCore OS - Software Médico Avanzado',
    description: 'La plataforma más avanzada para doctores, clínicas y especialistas. Historia clínica en la nube, agenda inteligente y recetas digitales.',
    openGraph: {
        title: 'HealthCore OS - Software Médico',
        description: 'Moderniza tu práctica médica con HealthCore OS. Todo tu consultorio en una sola plataforma segura y en tiempo real.',
    }
};

export default function MarketingPage() {
    return (
        <div className="min-h-screen flex flex-col font-sans selection:bg-teal-500 selection:text-white bg-slate-50">
            {/* Navbar Comercial */}
            <header className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-50 transition-all shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-slate-800">
                            HealthCare<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">OS</span>
                        </span>
                    </div>
                    
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#soluciones" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition">Soluciones</a>
                        <a href="#beneficios" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition">Beneficios</a>
                        <a href="#seguridad" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition">Seguridad</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-white font-bold text-sm hover:bg-slate-800 hover:-translate-y-0.5 transition-all shadow-md group">
                            <UserCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                            Iniciar Sesión
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col mt-20">
                <section className="relative pt-32 pb-40 overflow-hidden bg-white">
                    <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-100/50 via-white to-white pointer-events-none"></div>
                    
                    <div className="max-w-7xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-700 font-bold text-xs uppercase tracking-wider mb-8 animate-in slide-in-from-bottom-2 duration-700">
                            <Sparkles className="w-4 h-4 text-amber-500" /> Nuevo expediente 100% digital
                        </div>
                        
                        <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100">
                            El Software Médico que <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">Revoluciona</span> tu Práctica.
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-slate-500 max-w-2xl font-medium mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                            Ahorra horas de tareas administrativas con nuestra historia clínica moderna, agenda automatizada y videoconsultas integradas.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
                            <Link href="/registro" className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-lg hover:shadow-xl hover:shadow-teal-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                                Comenzar ahora gratis <ArrowRight className="w-5 h-5" />
                            </Link>
                            <a href="#soluciones" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center">
                                Explorar funciones
                            </a>
                        </div>
                        
                        {/* Mockup Preview de la App */}
                        <div className="w-full max-w-5xl bg-slate-900/5 p-4 rounded-3xl border border-slate-200/50 shadow-2xl relative animate-in fade-in fade-in zoom-in-95 duration-1000 delay-500">
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 rounded-b-3xl"></div>
                            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative h-[400px] flex">
                                {/* Pseud-sidebar */}
                                <div className="w-48 bg-slate-900 p-4 shrink-0 flex flex-col gap-4">
                                    <div className="w-8 h-8 rounded bg-teal-500/20 backdrop-blur mb-6"></div>
                                    <div className="w-full h-8 rounded-lg bg-white/5"></div>
                                    <div className="w-full h-8 rounded-lg bg-white/5"></div>
                                    <div className="w-full h-8 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center px-2 text-xs">Agenda Hoy</div>
                                </div>
                                {/* Pseudo-content */}
                                <div className="flex-1 bg-slate-50 p-6">
                                    <div className="w-64 h-8 bg-slate-200 rounded-lg mb-8"></div>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm col-span-2 h-40"></div>
                                        <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 shadow-sm h-40"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Secciones de Características */}
                <section id="soluciones" className="py-24 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-extrabold text-slate-800 mb-4">Todo tu consultorio en un solo lugar</h2>
                            <p className="text-lg text-slate-500 font-medium">Diseñado específicamente por doctores para doctores, optimizando tu tiempo clínico.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Featuere 1 */}
                            <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-100 transition-all group">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <FileText className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">Expediente Clínico Electrónico</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">Nota Médica bajo estándar SOAP, edición retroactiva segura, antecedentes vitales y línea de tiempo interactiva (Estilo ARMED).</p>
                            </div>

                            {/* Featuere 2 */}
                            <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100 transition-all group">
                                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                    <Calendar className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">Agenda Inteligente</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">Administra citas de todos tus consultorios. Integración con Google Calendar, colores según status y drag-n-drop ultra fluido.</p>
                            </div>

                            {/* Featuere 3 */}
                            <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100 transition-all group">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    <HeartPulse className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">Directorios Maestros</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">Centraliza asistentes, hospitales, farmacias y seguros médicos de confianza. Todo tu equipo de soporte a un solo clic.</p>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Call to Action Final */}
                <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                    
                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <ShieldCheck className="w-16 h-16 text-teal-400 mx-auto mb-6" />
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Seguridad Cumpliendo la NOM.</h2>
                        <p className="text-xl text-slate-400 font-medium mb-10 max-w-2xl mx-auto">
                            Tus datos y los de tus pacientes están encriptados y respaldados 24/7 en infraestructuras avaladas (AWS). Aislamiento real de secretos.
                        </p>
                        <Link href="/registro" className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-slate-900 font-extrabold text-lg hover:bg-slate-200 hover:scale-105 transition-all shadow-xl shadow-white/10">
                            Crear cuenta en 2 minutos <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-50 py-12 border-t border-slate-200 text-center">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Activity className="w-6 h-6 text-teal-600" />
                        <span className="text-xl font-extrabold tracking-tight text-slate-800">
                            HealthCare<span className="text-teal-600">OS</span>
                        </span>
                    </div>
                    <p className="text-slate-500 font-medium text-sm">
                        &copy; {new Date().getFullYear()} Creado para clínicas modernas. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
