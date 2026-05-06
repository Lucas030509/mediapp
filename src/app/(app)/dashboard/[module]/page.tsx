import { notFound } from 'next/navigation';

export default async function ModuleDynamicPage({ params }: { params: Promise<{ module: string }> }) {
    const allowedModules = ['finanzas', 'ventas', 'buzon-tributario'];
    const resolvedParams = await params;

    if (!allowedModules.includes(resolvedParams.module)) {
        notFound();
    }

    const title = resolvedParams.module.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 min-h-[60vh]">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Módulo: {title}</h1>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold tracking-wide shadow-sm">
                    Activo y Asignado
                </span>
            </div>
            <p className="text-slate-500 max-w-2xl mb-8">
                Vista dinámica para el módulo de {title}. Si no tuvieras pagado este feature
                (Feature Flagging), el middleware lo habría interceptado y rechazado tu petición
                antes de renderizar esta página.
            </p>

            {resolvedParams.module === 'buzon-tributario' && (
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                    <h4 className="font-semibold text-slate-700 mb-2">Conexión Asíncrona con el SAT Lista</h4>
                    <p className="text-sm text-slate-600">Simulación del listado de XMLs descargados.</p>
                </div>
            )}
        </div>
    );
}
