import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Landa - Plataforma SaaS',
    description: 'Haz crecer tu negocio con nuestra plataforma SaaS todo en uno.',
    openGraph: {
        title: 'Landa - Plataforma SaaS',
        description: 'Gestiona nómina, ventas y finanzas con un nivel empresarial de forma rápida.',
    }
};

export default function MarketingPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 text-white">
            <h1 className="text-6xl font-extrabold tracking-tight mb-4 drop-shadow-md">
                Core Engine SaaS Multi-Tenant
            </h1>
            <p className="text-xl max-w-2xl opacity-90 mb-8 font-light">
                La base ultra rápida para construir plataformas empresariales con aislamiento de datos, control de accesos granular e Inteligencia Artificial integrada.
            </p>

            <div className="flex space-x-4">
                <Link href="/dashboard" className="bg-white text-indigo-900 px-8 py-3 rounded-full font-semibold hover:bg-slate-100 transition shadow-lg">
                    Acceso al Dashboard
                </Link>
                <Link href="#" className="border border-white/40 bg-white/10 backdrop-blur-md text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition">
                    Saber más
                </Link>
            </div>

            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl w-full">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-2">Seguridad Multi-Tenant</h3>
                    <p className="text-sm opacity-80">Aislamiento de datos con Row Level Security y roles por puesto pre-configurados.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-2">Capa Semántica AI</h3>
                    <p className="text-sm opacity-80">Integra LLMS directamente de forma estructurada a tu Base de Datos con JSON schemas definidos.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-2">Componentes Inteligentes</h3>
                    <p className="text-sm opacity-80">Generación dinámica de gráficas a partir de consultas naturales de chat con Recharts y Next.js</p>
                </div>
            </div>
        </div>
    );
}
