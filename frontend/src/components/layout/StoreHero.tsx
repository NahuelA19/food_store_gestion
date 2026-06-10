import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function StoreHero() {
  const scrollToCatalog = () => {
    // Scroll a poco más abajo del hero si el ID no existe
    window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' });
  };

  return (
    <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px] rounded-b-3xl overflow-hidden bg-gradient-to-br from-brand-900 to-gray-900 flex items-center shadow-2xl mb-8">
      <div className="absolute inset-0 bg-black/50 z-10" />
      <img 
        src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"
        alt="Delicious Food"
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
      />
      
      <div className="relative z-20 px-8 md:px-16 w-full max-w-7xl mx-auto">
        <Badge className="bg-brand-500/20 text-brand-300 border border-brand-400/30 backdrop-blur-sm px-3 py-1 mb-6 inline-flex uppercase tracking-widest font-semibold">
          Experiencia Premium
        </Badge>
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
          Todo lo que te gusta, <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-amber-200">
            siempre cerca
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl font-medium drop-shadow-md">
          Descubrí nuestro menú diseñado para paladares exigentes. Calidad superior, ingredientes frescos y entrega rápida.
        </p>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={scrollToCatalog}
            className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-4 text-lg rounded-2xl font-black transition-all duration-300 shadow-[0_0_30px_-5px_rgba(234,88,12,0.5)] flex items-center gap-3 hover:scale-105 hover:-translate-y-1 active:scale-95"
          >
            Ver Catálogo
            <ArrowRight size={20} className="animate-pulse" />
          </button>
        </div>
      </div>
    </div>
  );
}
