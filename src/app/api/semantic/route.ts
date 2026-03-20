import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // Aquí consultarías el auth.user() y el Profile para ensamblar el JSON
    // dinámicamente según el permiso exacto. Este es el payload de capa semántica.
    const JSON_MAP = {
        semantic_version: "1.0",
        request_context: {
            tenant: {
                organization_id: "uuid-tenant-xxx",
                name: "PYME Ejemplo S.A. de C.V.",
                tier: "pro_fiscal"
            },
            user_identity: {
                user_id: "auth.uid()",
                position: "Gerente de Finanzas",
                active_features: ["buzon_tributario", "finanzas"]
            }
        },
        allowed_schema: [
            {
                table_identifier: "fiscal_invoices",
                human_alias: "Facturas Electrónicas SAT",
                context: "Contiene los registros CFDI XML descargados y validados desde el Buzón",
                columns: [
                    { name: "folio", type: "string", description: "UUID del SAT" },
                    { name: "total", type: "numeric", description: "Monto total de CFDI" },
                    { name: "emisor_rf", type: "string", description: "RFC del emisor" },
                    { name: "fecha", type: "date", description: "Fecha de facturación", is_filterable: true }
                ]
            },
            {
                table_identifier: "dynamic_catalogs",
                human_alias: "Catálogos de la Empresa",
                context: "Extrae metadatos. Consulta: data->>'propiedad'",
                available_catalogs: ["Tipos_De_Servicio", "Marcas_Registradas"]
            }
        ],
        ai_rules: {
            safety: "Utiliza SIEMPRE PostgreSQL. Inyecta organization_id en el WHERE.",
            dashboard_format: "Para graficar métricas, devuelve la respuesta en { 'chart_payload': { 'type': 'bar', 'data': [...] } }"
        }
    };

    return NextResponse.json(JSON_MAP);
}
