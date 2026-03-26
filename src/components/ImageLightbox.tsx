import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, RotateCw, Star } from 'lucide-react';

interface LightboxProps {
    src: string;
    alt: string;
    isFavorite?: boolean;
    onClose: () => void;
    onToggleFavorite?: () => void;
}

export default function ImageLightbox({ src, alt, isFavorite = false, onClose, onToggleFavorite }: LightboxProps) {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement>(null);

    // Cerrar al presionar Esc
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Zoom con la rueda del ratón
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        const newScale = Math.min(Math.max(0.5, scale + delta), 5); // Entre 0.5x y 5x
        setScale(newScale);
    };

    // Funciones de Drag & Drop (Arrumado / Panning)
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Toolbar Superior */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-[110] text-white" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-4 items-center">
                    <button 
                        type="button" 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }} 
                        className="p-2 hover:bg-white/10 rounded-full transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <span className="font-semibold truncate max-w-[200px] md:max-w-md">{alt}</span>
                </div>
                
                <div className="flex gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setScale(s => Math.min(s + 0.2, 5)); }} className="p-2 hover:bg-white/20 rounded-xl transition" title="Acercar">
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setScale(s => Math.max(s - 0.2, 0.5)); }} className="p-2 hover:bg-white/20 rounded-xl transition" title="Alejar">
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-white/20 mx-1 self-center" />
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRotation(r => r - 90); }} className="p-2 hover:bg-white/20 rounded-xl transition" title="Reotación Izquierda">
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRotation(r => r + 90); }} className="p-2 hover:bg-white/20 rounded-xl transition" title="Rotación Derecha">
                        <RotateCw className="w-5 h-5" />
                    </button>
                    
                    {onToggleFavorite && (
                        <>
                            <div className="w-px h-6 bg-white/20 mx-1 self-center" />
                            <button 
                                type="button" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleFavorite();
                                }} 
                                className={`p-2 rounded-xl transition flex items-center gap-2 px-4 ${isFavorite ? 'bg-amber-500/20 text-amber-400 font-bold' : 'hover:bg-white/20 text-white'}`} 
                                title="Marcar Caso de Éxito / Top 1"
                            >
                                <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
                                <span className="hidden md:inline text-sm">{isFavorite ? "Destacado" : "Destacar"}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Contenedor Interactivo */}
            <div 
                ref={containerRef}
                className="w-full h-full overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <img 
                    src={src} 
                    alt={alt} 
                    className="max-w-full max-h-screen object-contain drop-shadow-2xl select-none"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                        transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
                    }}
                    draggable={false}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
            
            {/* Overlay Informativo */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-2 rounded-full text-white/80 text-xs font-semibold tracking-wider flex gap-4 pointer-events-none">
                <span>Zoom: {Math.round(scale * 100)}%</span>
                <span>Rotación: {rotation}°</span>
            </div>
        </div>
    );
}
