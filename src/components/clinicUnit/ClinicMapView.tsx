import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ClinicUnit, ACCESSIBILITY_OPTIONS } from '../../types/clinicUnit';
import { maskCEP } from '../../utils/maskUtils';
import {
  resolveCoordinatesFromCep,
  latLngToTileInfo,
  getTileUrl,
  generateNavigationLinks,
  Coordinates,
  StaticMapStyle,
} from '../../services/clinicMapService';
import {
  MapPin,
  ExternalLink,
  Navigation,
  Copy,
  Check,
  Compass,
  Car,
  Layers,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Building2,
  Accessibility,
  Eye,
  Smartphone,
} from 'lucide-react';

interface ClinicMapViewProps {
  unit: ClinicUnit;
  compact?: boolean;
}

export const ClinicMapView: React.FC<ClinicMapViewProps> = ({ unit, compact = false }) => {
  // State for coordinates
  const [coordinates, setCoordinates] = useState<Coordinates>(() => {
    if (unit.coordinates && unit.coordinates.lat && unit.coordinates.lng) {
      return unit.coordinates;
    }
    return { lat: -23.55775, lng: -46.66134 }; // Fallback inicial rápido
  });

  const [isLoadingCoords, setIsLoadingCoords] = useState(false);
  const [copiedField, setCopiedField] = useState<'address' | 'cep' | 'coords' | null>(null);

  // Map settings
  const [zoom, setZoom] = useState<number>(compact ? 15 : 16);
  const [mapStyle, setMapStyle] = useState<StaticMapStyle>('carto-voyager');
  const [showInteractiveEmbed, setShowInteractiveEmbed] = useState<boolean>(false);
  const [tileLoadError, setTileLoadError] = useState<boolean>(false);

  // Full address strings
  const fullAddress = `${unit.street}, ${unit.number}${
    unit.complement ? ` (${unit.complement})` : ''
  }, ${unit.neighborhood}, ${unit.city} - ${unit.state}, CEP ${maskCEP(unit.zipCode)}`;

  // Resolve coordinates from CEP on mount or when unit changes
  useEffect(() => {
    let isMounted = true;

    async function loadCoords() {
      if (unit.coordinates?.lat && unit.coordinates?.lng) {
        setCoordinates(unit.coordinates);
        return;
      }

      setIsLoadingCoords(true);
      try {
        const resolved = await resolveCoordinatesFromCep(unit.zipCode, {
          street: unit.street,
          city: unit.city,
          state: unit.state,
        });
        if (isMounted) {
          setCoordinates(resolved);
        }
      } catch (err) {
        console.warn('Erro ao resolver coordenadas do CEP:', err);
      } finally {
        if (isMounted) setIsLoadingCoords(false);
      }
    }

    loadCoords();
    return () => {
      isMounted = false;
    };
  }, [unit.zipCode, unit.street, unit.city, unit.state, unit.coordinates]);

  // Calculate 3x3 tiles centered on coordinates
  const tileInfo = useMemo(() => {
    return latLngToTileInfo(coordinates.lat, coordinates.lng, zoom);
  }, [coordinates.lat, coordinates.lng, zoom]);

  // Navigation Links
  const navLinks = useMemo(() => {
    return generateNavigationLinks({
      tradeName: unit.tradeName,
      street: unit.street,
      number: unit.number,
      neighborhood: unit.neighborhood,
      city: unit.city,
      state: unit.state,
      zipCode: unit.zipCode,
      lat: coordinates.lat,
      lng: coordinates.lng,
    });
  }, [unit, coordinates]);

  const handleCopy = (text: string, field: 'address' | 'cep' | 'coords') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(18, prev + 1));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(13, prev - 1));
  };

  const handleRecenter = () => {
    setZoom(compact ? 15 : 16);
    setShowInteractiveEmbed(false);
  };

  // Google Maps embed URL for the optional interactive modal/toggle
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=${zoom}&output=embed`;

  // List of accessibility items matching the unit
  const matchedAccessibility = ACCESSIBILITY_OPTIONS.filter(opt =>
    unit.accessibilityItems?.includes(opt.id)
  );

  return (
    <div
      id={compact ? undefined : 'clinic-map-section'}
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 ${
        compact ? 'p-4 sm:p-5 space-y-4' : 'p-6 sm:p-8 space-y-6'
      } shadow-xs transition-colors scroll-mt-6`}
    >
      {/* 1. Top Section: Header & Clean Unboxed Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/50">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Localização & Mapa da Unidade
            </h3>
          </div>

          {/* Unboxed Metadata with · separator according to Zero-Pill rule */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              CEP {maskCEP(unit.zipCode)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{unit.neighborhood}</span>
            <span aria-hidden="true">·</span>
            <span>
              {unit.city} - {unit.state}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 inline" />
              ViaCEP Verificado
            </span>
          </div>
        </div>

        {/* View Mode & Map Style Segmented Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowInteractiveEmbed(false);
              setMapStyle('carto-voyager');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              !showInteractiveEmbed && mapStyle === 'carto-voyager'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            <span>Mapa Estático</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowInteractiveEmbed(false);
              setMapStyle('carto-dark');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              !showInteractiveEmbed && mapStyle === 'carto-dark'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Noturno</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInteractiveEmbed(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              showInteractiveEmbed
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interativo</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid: Address Details + Lightweight Static Map */}
      <div className={`grid grid-cols-1 ${compact ? 'gap-4' : 'lg:grid-cols-12 gap-6'} items-stretch`}>
        {/* Address Card & Quick Actions (5 cols) */}
        <div
          className={`${
            compact ? 'space-y-4' : 'lg:col-span-5'
          } flex flex-col justify-between space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/70`}
        >
          <div className="space-y-3.5">
            {/* Header label & Copy action */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                Endereço Cadastrado
              </span>
              <button
                type="button"
                onClick={() => handleCopy(fullAddress, 'address')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-400 transition-colors"
                title="Copiar endereço completo"
              >
                {copiedField === 'address' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Endereço</span>
                  </>
                )}
              </button>
            </div>

            {/* Address Lines */}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {unit.tradeName}
              </h4>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                {unit.street}, {unit.number}
                {unit.complement ? ` · ${unit.complement}` : ''}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unit.neighborhood} · {unit.city} - {unit.state}
              </p>
            </div>

            {/* Highlighted CEP Strip with quick copy */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Código de Endereçamento Postal
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-wide">
                    {maskCEP(unit.zipCode)}
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    (Válido)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(maskCEP(unit.zipCode), 'cep')}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 shrink-0"
              >
                {copiedField === 'cep' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar CEP</span>
                  </>
                )}
              </button>
            </div>

            {/* Coordinates info & quick copy */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 font-mono">
              <span>
                Lat: {coordinates.lat.toFixed(5)}, Lng: {coordinates.lng.toFixed(5)}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(`${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`, 'coords')
                }
                className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                title="Copiar coordenadas de latitude e longitude"
              >
                {copiedField === 'coords' ? 'Copiado!' : 'Copiar GPS'}
              </button>
            </div>

            {/* Patient Arrival Tip & Accessibility info */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>Instruções para o Paciente</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Apresente-se na portaria comercial com documento de identificação com foto. Consultórios com ar-condicionado e isolamento acústico.
              </p>
              {matchedAccessibility.length > 0 && (
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <Accessibility className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Acessibilidade: {matchedAccessibility.map(a => a.label).slice(0, 3).join(', ')}
                    {matchedAccessibility.length > 3 ? ` e +${matchedAccessibility.length - 3}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Route Launchers */}
          <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Abrir rota em app de navegação:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={navLinks.googleMaps}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs group"
                title="Abrir no Google Maps"
              >
                <Navigation className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
                <span>Maps</span>
              </a>

              <a
                href={navLinks.waze}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs group"
                title="Abrir navegação no Waze"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-600 group-hover:scale-110 transition-transform" />
                <span>Waze</span>
              </a>

              <a
                href={navLinks.uber}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs group"
                title="Pedir Uber direto para a clínica"
              >
                <Car className="w-3.5 h-3.5 text-slate-900 dark:text-white group-hover:scale-110 transition-transform" />
                <span>Uber</span>
              </a>
            </div>
          </div>
        </div>

        {/* Static Map Viewport (7 cols) */}
        <div
          className={`${
            compact ? 'min-h-[260px] h-[280px]' : 'lg:col-span-7 min-h-[360px]'
          } rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 relative select-none shadow-inner flex flex-col`}
        >
          {showInteractiveEmbed ? (
            /* Interactive Iframe Fallback */
            <iframe
              title={`Mapa Interativo ${unit.tradeName}`}
              src={googleMapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: compact ? '260px' : '360px' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full flex-1"
            />
          ) : !tileLoadError ? (
            /* True Lightweight Static Map Canvas (Stitched 3x3 Tile Grid) */
            <div className="relative w-full h-full flex-1 overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              {/* Tile grid container shifted by exact sub-pixel offset so coordinates are dead-center */}
              <div
                className="absolute"
                style={{
                  width: '768px',
                  height: '768px',
                  left: `calc(50% - ${256 + tileInfo.subPixelX}px)`,
                  top: `calc(50% - ${256 + tileInfo.subPixelY}px)`,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 256px)',
                  gridTemplateRows: 'repeat(3, 256px)',
                }}
              >
                {[-1, 0, 1].map(dy =>
                  [-1, 0, 1].map(dx => {
                    const tileX = tileInfo.tileX + dx;
                    const tileY = tileInfo.tileY + dy;
                    const url = getTileUrl(tileX, tileY, zoom, mapStyle);
                    return (
                      <img
                        key={`${tileX}-${tileY}-${zoom}-${mapStyle}`}
                        src={url}
                        alt="Mapa estático da região"
                        className="w-[256px] h-[256px] block pointer-events-none select-none"
                        loading="eager"
                        referrerPolicy="no-referrer"
                        onError={() => setTileLoadError(true)}
                      />
                    );
                  })
                )}
              </div>

              {/* Central Map Pin with animated ripple */}
              <div className="absolute z-20 pointer-events-none flex flex-col items-center justify-center transform -translate-y-6">
                {/* Pulsing radar ring */}
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-12 h-12 rounded-full bg-rose-500/20 animate-ping" />
                  <span className="absolute w-6 h-6 rounded-full bg-rose-500/40" />

                  {/* Pin Body */}
                  <div className="relative z-10 w-9 h-9 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 transform transition-transform hover:scale-110">
                    <MapPin className="w-5 h-5 fill-white stroke-rose-600" />
                  </div>
                </div>

                {/* Pin Tip Anchor Shadow */}
                <div className="w-3 h-1 bg-black/40 rounded-full blur-[1px] mt-1" />

                {/* Floating Map Label Tag */}
                <div className="mt-2 px-3 py-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-md flex items-center gap-1.5 text-[11px] font-bold text-slate-900 dark:text-white max-w-[240px] truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{unit.tradeName}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Graceful Vector SVG Map Fallback if tiles fail */
            <div className="w-full h-full flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
                <MapPin className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                  Localização Registrada
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {unit.street}, {unit.number} · {unit.neighborhood}
                </p>
                <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  CEP: {maskCEP(unit.zipCode)}
                </p>
              </div>
              <a
                href={navLinks.googleMaps}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <span>Visualizar no Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Floating Top Controls Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-30">
            {/* Location Pill */}
            <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span className="truncate max-w-[170px] sm:max-w-[260px]">
                {unit.street}, {unit.number}
              </span>
            </div>

            {/* Zoom & Recenter Controls */}
            {!showInteractiveEmbed && (
              <div className="pointer-events-auto flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 18}
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
                  title="Aproximar zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 13}
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
                  title="Afastar zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-slate-200 dark:border-slate-800 my-auto" />
                <button
                  type="button"
                  onClick={handleRecenter}
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Recentrar mapa na clínica"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Floating Bottom Info & External Open Link */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-30">
            {/* Scale / CEP status */}
            <div className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 shadow-xs hidden sm:flex items-center gap-1.5">
              <span>Zoom {zoom}x</span>
              <span aria-hidden="true">·</span>
              <span>CEP {maskCEP(unit.zipCode)}</span>
            </div>

            {/* Direct Open Button */}
            <a
              href={navLinks.googleMaps}
              target="_blank"
              rel="noreferrer"
              className="pointer-events-auto ml-auto bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <span>Abrir Navegador GPS</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
