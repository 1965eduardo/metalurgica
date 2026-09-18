import React from 'react';
import { useContent } from '../contexts/ContentContext';
import { MapPin, Navigation } from 'lucide-react';

export const MapSection: React.FC = () => {
  const { content } = useContent();
  
  let locationData: {
    street: string;
    neighborhood: string;
    city_state: string;
    zip_code: string;
    google_maps_url: string;
    map_theme: string;
    map_height: number;
    map_height_desktop?: number;
    map_height_tablet?: number;
    map_height_mobile?: number;
  } = {
    street: 'Av. Délio Silva Britto, 55',
    neighborhood: 'Nossa Sra. da Penha',
    city_state: 'Vila Velha - ES',
    zip_code: '29110-090',
    google_maps_url: '',
    map_theme: 'dark',
    map_height: 400
  };

  if (content['company_location']) {
    try {
      const parsed = JSON.parse(content['company_location']);
      locationData = { ...locationData, ...parsed };
    } catch (e) {
      console.warn('Erro ao parsear company_location no MapSection:', e);
    }
  }

  const mapHeightDesktop = locationData.map_height_desktop ?? locationData.map_height ?? 400;
  const mapHeightTablet = locationData.map_height_tablet ?? locationData.map_height ?? 350;
  const mapHeightMobile = locationData.map_height_mobile ?? locationData.map_height ?? 280;

  // Tratamento da URL do Mapa
  let embedUrl = locationData.google_maps_url;
  
  if (embedUrl && embedUrl.includes('<iframe')) {
     const match = embedUrl.match(/src="([^"]+)"/);
     if (match) {
         embedUrl = match[1];
     }
  }

  const query = encodeURIComponent(`${locationData.street}, ${locationData.neighborhood}, ${locationData.city_state}`);
  const fallbackUrl = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  if (
    !embedUrl || 
    !embedUrl.includes('embed') || 
    embedUrl.includes('!4v1716912345678')
  ) {
      embedUrl = fallbackUrl;
  }

  const externalMapLink = `https://www.google.com/maps/search/?api=1&query=${query}`;

  let filterStyle = 'none';
  if (locationData.map_theme === 'dark' || !locationData.map_theme) {
    filterStyle = 'grayscale(80%) invert(100%) contrast(90%) hue-rotate(180deg)';
  } else if (locationData.map_theme === 'grayscale') {
    filterStyle = 'grayscale(100%) contrast(120%)';
  }

  return (
    <section 
      id="map-section"
      className="relative w-full overflow-hidden border-y border-[#2D3238] transition-all duration-300"
    >
      <style>{`
        .map-container-height {
          height: ${mapHeightMobile}px;
        }
        @media (min-width: 768px) {
          .map-container-height {
            height: ${mapHeightTablet}px;
          }
        }
        @media (min-width: 1024px) {
          .map-container-height {
            height: ${mapHeightDesktop}px;
          }
        }
      `}</style>

      {/* MOBILE LAYOUT: MAP ON TOP, CARD BELOW (NO OVERLAP) */}
      <div className="block md:hidden">
        <div className="relative w-full map-container-height">
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0, filter: filterStyle }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localização da Empresa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-theme-bg/30 pointer-events-none mix-blend-multiply" />
        </div>
        <div className="bg-theme-card border-t border-[#2D3238] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-theme-primary/10 flex items-center justify-center border border-theme-primary/20 shrink-0">
              <MapPin className="w-5 h-5 text-theme-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-theme-title">Nossa Localização</h3>
              <p className="text-xs font-medium text-theme-primary">Venha nos visitar</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <p className="font-bold text-theme-title">{locationData.street}</p>
              <p className="text-theme-body">{locationData.neighborhood}</p>
            </div>
            <div>
              <p className="font-semibold text-theme-body">{locationData.city_state}</p>
              <p className="text-theme-muted font-mono text-xs">CEP: {locationData.zip_code}</p>
            </div>
          </div>

          <a
            href={externalMapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-theme-primary text-white hover:brightness-110 transition-all shadow-md shadow-theme-primary/20"
          >
            <Navigation className="w-4 h-4" />
            <span>Abrir no Google Maps</span>
          </a>
        </div>
      </div>

      {/* TABLET & DESKTOP LAYOUT: FULL BACKGROUND MAP WITH RIGHT-ALIGNED CARD (UNOBSTRUCTED) */}
      <div className="hidden md:block relative w-full map-container-height">
        <div className="absolute inset-0 z-0 w-full h-full">
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0, filter: filterStyle }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localização da Empresa"
            className="w-full h-full object-cover transition-all duration-300"
          />
          <div className="absolute inset-0 bg-theme-bg/30 pointer-events-none mix-blend-multiply" />
        </div>

        {/* CARD POSITIONED ON THE RIGHT TO KEEP THE CENTER/LEFT MAP PIN FULLY VISIBLE */}
        <div className="relative z-10 container mx-auto px-6 h-full flex items-center justify-end pointer-events-none">
          <div className="bg-theme-card/95 backdrop-blur-xl border border-[#2D3238] p-7 rounded-2xl shadow-2xl max-w-sm w-full pointer-events-auto transform animate-in fade-in duration-700">
            
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-theme-primary/10 flex items-center justify-center border border-theme-primary/20 shrink-0">
                <MapPin className="w-6 h-6 text-theme-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-theme-title">Nossa Localização</h3>
                <p className="text-sm font-medium text-theme-primary">Venha nos visitar</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm font-bold text-theme-title">{locationData.street}</p>
                <p className="text-sm text-theme-body mt-0.5">{locationData.neighborhood}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-theme-body">{locationData.city_state}</p>
                <p className="text-sm text-theme-muted font-mono mt-0.5">CEP: {locationData.zip_code}</p>
              </div>
            </div>

            <a
              href={externalMapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-theme-primary text-white hover:brightness-110 transition-all shadow-lg shadow-theme-primary/20 group"
            >
              <Navigation className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              <span>Abrir no Google Maps</span>
            </a>

          </div>
        </div>
      </div>

    </section>
  );
};
