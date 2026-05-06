/**
 * Normaliza un texto eliminando acentos y convirtiéndolo a minúsculas
 * para comparaciones de búsqueda insensibles a acentos.
 */
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Comprueba si un texto contiene un término de búsqueda, ignorando acentos y mayúsculas.
 */
export function fuzzyMatch(text: string, searchTerm: string): boolean {
    if (!text || !searchTerm) return false;
    return normalizeText(text).includes(normalizeText(searchTerm));
}
