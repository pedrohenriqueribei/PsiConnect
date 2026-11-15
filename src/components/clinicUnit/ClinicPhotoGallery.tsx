import React, { useState, useRef, useEffect } from 'react';
import { ClinicUnitPhoto } from '../../types/clinicUnit';
import { processClinicPhotoFile } from '../../utils/imageUtils';
import { CameraCaptureModal } from '../CameraCaptureModal';
import { SAMPLE_CLINIC_PHOTOS } from '../../services/clinicUnitStorage';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  Edit2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Upload,
  Maximize2,
  Eye,
  Camera,
  LayoutGrid,
  Layers,
  Tv,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Building2,
  Tag,
  HelpCircle,
  CheckCircle2,
  Play,
  Pause,
  Info
} from 'lucide-react';

interface ClinicPhotoGalleryProps {
  photos: ClinicUnitPhoto[];
  unitName: string;
  onUpdatePhotos?: (photos: ClinicUnitPhoto[]) => void;
  readOnly?: boolean;
}

type PhotoCategory = 'todos' | 'fachada' | 'recepcao' | 'consultorio' | 'outro';
type ViewMode = 'grid' | 'grouped' | 'showcase' | 'manager';

const PRESET_HIGHLIGHT_TAGS = [
  'Isolamento Acústico',
  'Acessibilidade PCD',
  'Climatizado',
  'Poltronas Ergonômicas',
  'Wi-Fi 5G & Café',
  'Iluminação Aconchegante',
  'Sala de Ludoterapia & TEA',
  'Equipamento Teleconsulta',
  'Acesso Nível da Rua',
  'Segurança & Portaria',
];

export const ClinicPhotoGallery: React.FC<ClinicPhotoGalleryProps> = ({
  photos,
  unitName,
  onUpdatePhotos,
  readOnly = false,
}) => {
  // Navigation & View Mode states
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeCategory, setActiveCategory] = useState<PhotoCategory>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Showcase state
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [isPlayingShowcase, setIsPlayingShowcase] = useState(false);

  // Lightbox Zoom state
  const [lightboxZoom, setLightboxZoom] = useState<1 | 1.5 | 2>(1);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showSampleDrawer, setShowSampleDrawer] = useState(false);

  // Editing state
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [editingCategory, setEditingCategory] = useState<'fachada' | 'recepcao' | 'consultorio' | 'outro'>('consultorio');
  const [editingTag, setEditingTag] = useState('');

  // Add photo form state
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoLabel, setNewPhotoLabel] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState<'fachada' | 'recepcao' | 'consultorio' | 'outro'>('fachada');
  const [newPhotoTag, setNewPhotoTag] = useState('');
  const [isCover, setIsCover] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (selectedPhotoIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
        setLightboxZoom(1);
      } else if (e.key === 'ArrowLeft') {
        handlePrevLightboxPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextLightboxPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, photos]);

  // Autoplay for Showcase Mode
  useEffect(() => {
    if (!isPlayingShowcase || photos.length <= 1) return;
    const timer = setInterval(() => {
      setShowcaseIndex(prev => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlayingShowcase, photos.length]);

  // Ensure showcase index is valid
  useEffect(() => {
    if (showcaseIndex >= photos.length && photos.length > 0) {
      setShowcaseIndex(0);
    }
  }, [photos.length, showcaseIndex]);

  // Category counts
  const counts = {
    todos: photos.length,
    fachada: photos.filter(p => p.category === 'fachada').length,
    recepcao: photos.filter(p => p.category === 'recepcao').length,
    consultorio: photos.filter(p => p.category === 'consultorio').length,
    outro: photos.filter(p => p.category === 'outro').length,
  };

  // Filtered photos based on category & search query
  const filteredPhotos = photos.filter(p => {
    if (activeCategory !== 'todos' && p.category !== activeCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLabel = p.label?.toLowerCase().includes(q);
      const matchTag = p.highlightTag?.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      return matchLabel || matchTag || matchCat;
    }
    return true;
  });

  // Upload handler with quality image compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingUpload(true);
    try {
      if (files.length === 1) {
        const dataUrl = await processClinicPhotoFile(files[0], 1400, 0.88);
        setNewPhotoUrl(dataUrl);
      } else if (onUpdatePhotos) {
        // Multi-file upload batch
        const newBatch: ClinicUnitPhoto[] = [];
        for (let i = 0; i < files.length; i++) {
          const dataUrl = await processClinicPhotoFile(files[i], 1400, 0.88);
          newBatch.push({
            id: `photo_${Date.now()}_${i}`,
            url: dataUrl,
            category: newPhotoCategory,
            label: files[i].name.replace(/\.[^/.]+$/, ''),
            highlightTag: newPhotoTag || undefined,
            isCover: photos.length === 0 && i === 0,
            createdAt: new Date().toISOString(),
          });
        }
        onUpdatePhotos([...photos, ...newBatch]);
        showToast(`${newBatch.length} fotos importadas com sucesso!`);
        setIsAddModalOpen(false);
      }
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      alert('Erro ao carregar imagem. Verifique se o formato é JPG ou PNG.');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Submit single photo
  const handleAddPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim() || !onUpdatePhotos) return;

    const newPhoto: ClinicUnitPhoto = {
      id: `photo_${Date.now()}`,
      url: newPhotoUrl.trim(),
      category: newPhotoCategory,
      label: newPhotoLabel.trim() || undefined,
      highlightTag: newPhotoTag.trim() || undefined,
      isCover: isCover || photos.length === 0,
      createdAt: new Date().toISOString(),
    };

    let updatedList = [...photos];
    if (newPhoto.isCover) {
      updatedList = updatedList.map(p => ({ ...p, isCover: false }));
    }
    updatedList.push(newPhoto);

    onUpdatePhotos(updatedList);
    setNewPhotoUrl('');
    setNewPhotoLabel('');
    setNewPhotoTag('');
    setNewPhotoCategory('consultorio');
    setIsCover(false);
    setIsAddModalOpen(false);
    showToast('Foto adicionada com sucesso à galeria da unidade!');
  };

  const handleCameraCapture = (dataUrl: string) => {
    setNewPhotoUrl(dataUrl);
    setIsCameraOpen(false);
    setIsAddModalOpen(true);
    showToast('Foto capturada pela câmera! Preencha a legenda e salve.');
  };

  const handleToggleCover = (photoId: string) => {
    if (!onUpdatePhotos || readOnly) return;
    const updated = photos.map(p => ({
      ...p,
      isCover: p.id === photoId,
    }));
    onUpdatePhotos(updated);
    showToast('Foto de capa principal atualizada!');
  };

  const handleDeletePhoto = (photoId: string) => {
    if (!onUpdatePhotos || readOnly) return;
    const confirmed = window.confirm('Deseja realmente remover esta foto da galeria da unidade?');
    if (!confirmed) return;

    let updated = photos.filter(p => p.id !== photoId);
    if (updated.length > 0 && !updated.some(p => p.isCover)) {
      updated[0] = { ...updated[0], isCover: true };
    }
    onUpdatePhotos(updated);
    showToast('Foto removida com sucesso.');
    if (selectedPhotoIndex !== null) {
      setSelectedPhotoIndex(null);
    }
  };

  // Reorder photos
  const handleMovePhoto = (index: number, direction: 'up' | 'down') => {
    if (!onUpdatePhotos || readOnly) return;
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= photos.length) return;

    const copy = [...photos];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    onUpdatePhotos(copy);
  };

  const startEditPhoto = (photo: ClinicUnitPhoto) => {
    setEditingPhotoId(photo.id);
    setEditingLabel(photo.label || '');
    setEditingCategory(photo.category);
    setEditingTag(photo.highlightTag || '');
  };

  const saveEditPhoto = (photoId: string) => {
    if (!onUpdatePhotos) return;
    const updated = photos.map(p => {
      if (p.id === photoId) {
        return {
          ...p,
          label: editingLabel.trim() || undefined,
          category: editingCategory,
          highlightTag: editingTag.trim() || undefined,
        };
      }
      return p;
    });
    onUpdatePhotos(updated);
    setEditingPhotoId(null);
    showToast('Informações da foto salvas com sucesso!');
  };

  // Add sample photo from library
  const handleAddSample = (sample: ClinicUnitPhoto) => {
    if (!onUpdatePhotos) return;
    if (photos.some(p => p.url === sample.url)) {
      showToast('Esta foto demonstrativa já está presente na unidade.');
      return;
    }
    const cloned: ClinicUnitPhoto = {
      ...sample,
      id: `sample_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    onUpdatePhotos([...photos, cloned]);
    showToast(`Foto de ${sample.label} adicionada à galeria!`);
  };

  // Lightbox handlers
  const handleOpenLightbox = (photo: ClinicUnitPhoto) => {
    const idx = photos.findIndex(p => p.id === photo.id);
    if (idx !== -1) {
      setSelectedPhotoIndex(idx);
      setLightboxZoom(1);
    }
  };

  const handlePrevLightboxPhoto = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + photos.length) % photos.length);
    setLightboxZoom(1);
  };

  const handleNextLightboxPhoto = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length);
    setLightboxZoom(1);
  };

  const currentLightboxPhoto =
    selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  const currentShowcasePhoto = photos[showcaseIndex] || photos[0];

  const getCategoryTitle = (cat: 'fachada' | 'recepcao' | 'consultorio' | 'outro') => {
    switch (cat) {
      case 'fachada':
        return 'Fachada & Entrada Principal';
      case 'recepcao':
        return 'Recepção & Sala de Espera';
      case 'consultorio':
        return 'Consultórios & Salas Clínicas';
      case 'outro':
        return 'Acessibilidade & Espaços de Apoio';
    }
  };

  const getCategoryDesc = (cat: 'fachada' | 'recepcao' | 'consultorio' | 'outro') => {
    switch (cat) {
      case 'fachada':
        return 'Entrada ao nível da rua, identificação visual do imóvel e portaria com segurança.';
      case 'recepcao':
        return 'Ambiente de acolhimento climatizado com poltronas confortáveis, água e café.';
      case 'consultorio':
        return 'Salas com isolamento acústico, iluminação suave e recursos ergonômicos ou de ludoterapia.';
      case 'outro':
        return 'Sanitários adaptados para PCD, rampas de acesso e corredores amplos.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs rounded-2xl flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{feedbackToast}</span>
        </div>
      )}

      {/* Main Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 flex items-center justify-center shadow-2xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Galeria de Fotos dos Ambientes
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800">
                  {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Exiba fachada, recepção acolhedora e consultórios para passar credibilidade e segurança aos pacientes.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: View Modes & Add */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-sky-800 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Visualização em Grade Filtrada"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grade</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'grouped'
                  ? 'bg-white dark:bg-slate-900 text-sky-800 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Visualização por Ambientes Agrupados"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Por Ambientes</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('showcase')}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'showcase'
                  ? 'bg-white dark:bg-slate-900 text-sky-800 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Modo Apresentação / Showcase"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Apresentação</span>
            </button>

            {!readOnly && onUpdatePhotos && (
              <button
                type="button"
                onClick={() => setViewMode('manager')}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'manager'
                    ? 'bg-white dark:bg-slate-900 text-sky-800 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Modo Gerenciador e Reordenação"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gerenciar</span>
              </button>
            )}
          </div>

          {/* Quick Sample Library Button */}
          {!readOnly && onUpdatePhotos && (
            <button
              type="button"
              onClick={() => setShowSampleDrawer(!showSampleDrawer)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
              title="Explorar biblioteca de fotos sugeridas para consultórios"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Fotos Sugeridas</span>
            </button>
          )}

          {/* Add Photo Button */}
          {!readOnly && onUpdatePhotos && (
            <button
              type="button"
              onClick={() => {
                setNewPhotoCategory('consultorio');
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-sky-700 hover:bg-sky-800 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Foto</span>
            </button>
          )}
        </div>
      </div>

      {/* Suggested Demo Library Drawer */}
      {showSampleDrawer && (
        <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-3xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                Biblioteca de Fotos Demonstrativas de Consultórios & Recepções
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowSampleDrawer(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Clique em qualquer imagem para adicioná-la instantaneamente ao acervo fotográfico da sua unidade:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {SAMPLE_CLINIC_PHOTOS.map(sample => {
              const alreadyHas = photos.some(p => p.url === sample.url);
              return (
                <div
                  key={sample.id}
                  onClick={() => !alreadyHas && handleAddSample(sample)}
                  className={`group relative rounded-2xl overflow-hidden border transition-all text-left ${
                    alreadyHas
                      ? 'border-emerald-300 dark:border-emerald-800 opacity-60 cursor-default'
                      : 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 hover:shadow-md cursor-pointer bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="aspect-4/3 overflow-hidden bg-slate-900 relative">
                    <img
                      src={sample.url}
                      alt={sample.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[9px] font-bold text-white capitalize">
                      {sample.category}
                    </div>
                    {alreadyHas && (
                      <div className="absolute inset-0 bg-emerald-950/70 flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Adicionada</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {sample.label}
                    </p>
                    {sample.highlightTag && (
                      <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
                        {sample.highlightTag}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. VIEW MODE: GRID (GRADE FILTRADA) */}
      {/* ============================================================== */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {/* Filter Bar with Categories & Search Input */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
              {(['todos', 'fachada', 'recepcao', 'consultorio', 'outro'] as const).map(cat => {
                const isActive = activeCategory === cat;
                const count = counts[cat];
                const label =
                  cat === 'todos'
                    ? 'Todas'
                    : cat === 'fachada'
                    ? 'Fachada'
                    : cat === 'recepcao'
                    ? 'Recepção'
                    : cat === 'consultorio'
                    ? 'Consultórios'
                    : 'Outros';

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-sky-800 dark:text-sky-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick search input */}
            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por legenda ou tag..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600 text-slate-800 dark:text-slate-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Grid Cards */}
          {filteredPhotos.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {searchQuery ? 'Nenhuma foto encontrada para a busca' : 'Nenhuma foto nesta categoria'}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-0.5">
                  Adicione fotos para ilustrar a infraestrutura física e os diferenciais da unidade clínica.
                </p>
              </div>
              {!readOnly && onUpdatePhotos && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeCategory !== 'todos') {
                      setNewPhotoCategory(activeCategory);
                    }
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-sky-700 hover:bg-sky-800 text-white shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Inserir Foto Agora</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo, pIdx) => {
                const isEditing = editingPhotoId === photo.id;

                return (
                  <div
                    key={photo.id}
                    className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all flex flex-col"
                  >
                    {/* Image Area */}
                    <div
                      className="aspect-4/3 relative overflow-hidden bg-slate-900 cursor-pointer"
                      onClick={() => handleOpenLightbox(photo)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.label || 'Foto da clínica'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1.5 z-10">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-black/75 backdrop-blur-xs text-white capitalize">
                          {photo.category}
                        </span>
                        {photo.isCover && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Capa
                          </span>
                        )}
                      </div>

                      {/* Highlight Tag Badge */}
                      {photo.highlightTag && (
                        <div className="absolute top-2 right-2 z-10">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-600/90 text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                            <Tag className="w-2.5 h-2.5" />
                            {photo.highlightTag}
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                          <Maximize2 className="w-3.5 h-3.5" />
                          Ampliar Foto
                        </span>
                      </div>
                    </div>

                    {/* Details / Inline Edit Footer */}
                    <div className="p-3 bg-white dark:bg-slate-900 flex-1 flex flex-col justify-between border-t border-slate-100 dark:border-slate-800">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingLabel}
                            onChange={e => setEditingLabel(e.target.value)}
                            placeholder="Legenda da foto..."
                            className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                            autoFocus
                          />
                          <div className="grid grid-cols-2 gap-1.5">
                            <select
                              value={editingCategory}
                              onChange={e =>
                                setEditingCategory(
                                  e.target.value as 'fachada' | 'recepcao' | 'consultorio' | 'outro'
                                )
                              }
                              className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white capitalize"
                            >
                              <option value="fachada">Fachada</option>
                              <option value="recepcao">Recepção</option>
                              <option value="consultorio">Consultório</option>
                              <option value="outro">Outros</option>
                            </select>
                            <input
                              type="text"
                              value={editingTag}
                              onChange={e => setEditingTag(e.target.value)}
                              placeholder="Tag (ex: Climatizado)"
                              className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingPhotoId(null)}
                              className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditPhoto(photo.id)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                            {photo.label || `${unitName} - ${getCategoryTitle(photo.category)}`}
                          </p>
                          <p className="text-[11px] text-slate-400 capitalize flex items-center gap-1">
                            <span>{getCategoryTitle(photo.category)}</span>
                            {photo.highlightTag && (
                              <>
                                <span>•</span>
                                <span className="text-sky-600 dark:text-sky-400 font-medium">
                                  {photo.highlightTag}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Action Bar */}
                      {!readOnly && onUpdatePhotos && !isEditing && (
                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/70 text-slate-500">
                          <button
                            type="button"
                            onClick={() => handleToggleCover(photo.id)}
                            className={`p-1 text-xs transition-colors flex items-center gap-1 rounded-md ${
                              photo.isCover
                                ? 'text-amber-500 font-bold'
                                : 'hover:text-amber-500 text-slate-400'
                            }`}
                            title={photo.isCover ? 'Foto principal da unidade' : 'Definir como foto de capa'}
                          >
                            <Star className={`w-3.5 h-3.5 ${photo.isCover ? 'fill-current' : ''}`} />
                            <span className="text-[10px]">
                              {photo.isCover ? 'Capa Principal' : 'Definir capa'}
                            </span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditPhoto(photo)}
                              className="p-1 text-slate-400 hover:text-sky-600 rounded-md"
                              title="Editar legenda e tag"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                              title="Excluir foto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. VIEW MODE: GROUPED BY ENVIRONMENT (POR AMBIENTES) */}
      {/* ============================================================== */}
      {viewMode === 'grouped' && (
        <div className="space-y-8">
          {(['fachada', 'recepcao', 'consultorio', 'outro'] as const).map(catKey => {
            const catPhotos = photos.filter(p => p.category === catKey);

            return (
              <div
                key={catKey}
                className="bg-slate-50/70 dark:bg-slate-800/30 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4"
              >
                {/* Environment Group Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{getCategoryTitle(catKey)}</span>
                        <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold font-mono">
                          {catPhotos.length}
                        </span>
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {getCategoryDesc(catKey)}
                    </p>
                  </div>

                  {!readOnly && onUpdatePhotos && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewPhotoCategory(catKey);
                        setIsAddModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-700 hover:bg-sky-800 text-white self-start sm:self-auto shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar a este ambiente</span>
                    </button>
                  )}
                </div>

                {/* Environment Photos Grid */}
                {catPhotos.length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Nenhuma foto de <strong>{getCategoryTitle(catKey)}</strong> cadastrada ainda.
                    </p>
                    {!readOnly && onUpdatePhotos && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewPhotoCategory(catKey);
                          setIsAddModalOpen(true);
                        }}
                        className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Inserir primeira foto deste espaço</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {catPhotos.map(photo => (
                      <div
                        key={photo.id}
                        className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all flex flex-col"
                      >
                        <div
                          className="aspect-4/3 relative overflow-hidden bg-slate-900 cursor-pointer"
                          onClick={() => handleOpenLightbox(photo)}
                        >
                          <img
                            src={photo.url}
                            alt={photo.label || 'Foto da clínica'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {photo.isCover && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              Capa Principal
                            </span>
                          )}
                          {photo.highlightTag && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-600/90 text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                              <Tag className="w-2.5 h-2.5" />
                              {photo.highlightTag}
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 text-xs font-bold flex items-center gap-1">
                              <Maximize2 className="w-3 h-3" />
                              Ampliar
                            </span>
                          </div>
                        </div>

                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                            {photo.label || `${unitName} - ${getCategoryTitle(catKey)}`}
                          </p>

                          {!readOnly && onUpdatePhotos && (
                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
                              <button
                                type="button"
                                onClick={() => handleToggleCover(photo.id)}
                                className={`text-[10px] flex items-center gap-1 ${
                                  photo.isCover ? 'text-amber-500 font-bold' : 'hover:text-amber-500'
                                }`}
                              >
                                <Star className={`w-3 h-3 ${photo.isCover ? 'fill-current' : ''}`} />
                                <span>{photo.isCover ? 'Capa' : 'Definir Capa'}</span>
                              </button>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditPhoto(photo)}
                                  className="p-1 hover:text-sky-600 rounded"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhoto(photo.id)}
                                  className="p-1 hover:text-red-600 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. VIEW MODE: SHOWCASE / SLIDER (APRESENTAÇÃO) */}
      {/* ============================================================== */}
      {viewMode === 'showcase' && (
        <div className="space-y-4">
          {photos.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
              <p className="text-xs text-slate-500">Nenhuma foto adicionada para apresentação.</p>
            </div>
          ) : (
            <div className="bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
              {/* Theater Stage */}
              <div className="relative aspect-16/9 sm:aspect-21/9 max-h-[500px] w-full bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={currentShowcasePhoto.url}
                  alt={currentShowcasePhoto.label || 'Foto da clínica'}
                  className="w-full h-full object-contain mx-auto select-none transition-all duration-500"
                />

                {/* Top Overlay Bar */}
                <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-900/90 text-sky-200 border border-sky-700/60 capitalize">
                      {getCategoryTitle(currentShowcasePhoto.category)}
                    </span>
                    {currentShowcasePhoto.highlightTag && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-white border border-white/30 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {currentShowcasePhoto.highlightTag}
                      </span>
                    )}
                    {currentShowcasePhoto.isCover && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-current" />
                        Foto de Capa
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlayingShowcase(!isPlayingShowcase)}
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-colors flex items-center gap-1.5 text-xs font-bold"
                      title={isPlayingShowcase ? 'Pausar apresentação automática' : 'Iniciar apresentação automática'}
                    >
                      {isPlayingShowcase ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pausar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Reproduzir</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenLightbox(currentShowcasePhoto)}
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-colors"
                      title="Tela cheia"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Left / Right Nav Arrows */}
                <button
                  type="button"
                  onClick={() => setShowcaseIndex((showcaseIndex - 1 + photos.length) % photos.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-colors"
                  title="Foto anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowcaseIndex((showcaseIndex + 1) % photos.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-colors"
                  title="Próxima foto"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Bottom Caption Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">
                      {currentShowcasePhoto.label || `${unitName} - Ambiente`}
                    </h4>
                    <p className="text-xs text-slate-300">{unitName}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {showcaseIndex + 1} de {photos.length}
                  </span>
                </div>
              </div>

              {/* Bottom Thumbnail Strip */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
                {photos.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setShowcaseIndex(idx)}
                    className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      showcaseIndex === idx
                        ? 'border-sky-500 scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. VIEW MODE: MANAGER & REORDER (GERENCIADOR) */}
      {/* ============================================================== */}
      {viewMode === 'manager' && !readOnly && onUpdatePhotos && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                <span>Gerenciador de Ordem e Metadados das Imagens</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Use os botões de subir e descer para definir a ordem em que as imagens são apresentadas aos pacientes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-700 hover:bg-sky-800 text-white self-start sm:self-auto shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Foto</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {photos.map((photo, idx) => {
              const isEditing = editingPhotoId === photo.id;

              return (
                <div
                  key={photo.id}
                  className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Index & Order Buttons */}
                    <div className="flex flex-col items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-sky-600 disabled:opacity-20"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, 'down')}
                        disabled={idx === photos.length - 1}
                        className="p-1 text-slate-400 hover:text-sky-600 disabled:opacity-20"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <div
                      className="w-16 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 cursor-pointer border border-slate-200 dark:border-slate-700 relative group"
                      onClick={() => handleOpenLightbox(photo)}
                    >
                      <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Metadata or Form */}
                    {isEditing ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={editingLabel}
                          onChange={e => setEditingLabel(e.target.value)}
                          placeholder="Legenda"
                          className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                        />
                        <select
                          value={editingCategory}
                          onChange={e => setEditingCategory(e.target.value as any)}
                          className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white capitalize"
                        >
                          <option value="fachada">Fachada</option>
                          <option value="recepcao">Recepção</option>
                          <option value="consultorio">Consultório</option>
                          <option value="outro">Outros</option>
                        </select>
                        <input
                          type="text"
                          value={editingTag}
                          onChange={e => setEditingTag(e.target.value)}
                          placeholder="Tag (ex: Climatizado)"
                          className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {photo.label || `${unitName} - ${getCategoryTitle(photo.category)}`}
                          </p>
                          {photo.isCover && (
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              Capa
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="capitalize">{getCategoryTitle(photo.category)}</span>
                          {photo.highlightTag && (
                            <>
                              <span>•</span>
                              <span className="text-sky-600 dark:text-sky-400 font-medium">
                                {photo.highlightTag}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEditPhoto(photo.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPhotoId(null)}
                          className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs text-slate-700 dark:text-slate-300"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleCover(photo.id)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
                            photo.isCover
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600'
                          }`}
                          title="Definir foto de capa"
                        >
                          <Star className={`w-3 h-3 ${photo.isCover ? 'fill-current' : ''}`} />
                          <span className="text-[11px]">{photo.isCover ? 'Capa Principal' : 'Tornar Capa'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditPhoto(photo)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. LIGHTBOX / FULLSCREEN VIEWER MODAL */}
      {/* ============================================================== */}
      {currentLightboxPhoto && (
        <div
          onClick={() => {
            setSelectedPhotoIndex(null);
            setLightboxZoom(1);
          }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="max-w-5xl w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl relative border border-slate-800 flex flex-col max-h-[95vh]"
          >
            {/* Header */}
            <div className="p-4 bg-slate-900/90 backdrop-blur-xs flex items-center justify-between border-b border-slate-800 z-10 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-900/90 text-sky-200 capitalize border border-sky-700/60">
                  {getCategoryTitle(currentLightboxPhoto.category)}
                </span>
                {currentLightboxPhoto.isCover && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Foto Principal da Unidade
                  </span>
                )}
                {currentLightboxPhoto.highlightTag && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/20 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {currentLightboxPhoto.highlightTag}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  ({(selectedPhotoIndex ?? 0) + 1} de {photos.length})
                </span>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2">
                {/* Zoom buttons */}
                <div className="flex items-center bg-slate-800 rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setLightboxZoom(prev => (prev === 2 ? 1.5 : 1))}
                    className={`p-1.5 rounded-lg text-slate-300 hover:text-white ${
                      lightboxZoom === 1 ? 'opacity-40' : ''
                    }`}
                    title="Diminuir zoom"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxZoom(prev => (prev === 1 ? 1.5 : 2))}
                    className={`p-1.5 rounded-lg text-slate-300 hover:text-white ${
                      lightboxZoom === 2 ? 'opacity-40' : ''
                    }`}
                    title="Aumentar zoom"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxZoom(1)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white"
                    title="Redefinir escala"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPhotoIndex(null);
                    setLightboxZoom(1);
                  }}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Fechar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Image Stage */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-auto min-h-[340px] max-h-[68vh] p-4">
              <div
                style={{
                  transform: `scale(${lightboxZoom})`,
                  transition: 'transform 0.25s ease-out',
                }}
                className="max-h-full max-w-full flex items-center justify-center"
              >
                <img
                  src={currentLightboxPhoto.url}
                  alt={currentLightboxPhoto.label || 'Foto da clínica'}
                  className="max-h-[64vh] w-auto max-w-full object-contain mx-auto select-none rounded-lg"
                />
              </div>

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevLightboxPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-colors"
                    title="Foto anterior (Seta esquerda)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextLightboxPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-colors"
                    title="Próxima foto (Seta direita)"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Lightbox Footer & Thumbnail Strip */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div>
                <p className="text-sm font-bold text-slate-100">
                  {currentLightboxPhoto.label || `${unitName} - Ambiente`}
                </p>
                <p className="text-xs text-slate-400">
                  {unitName} · {getCategoryTitle(currentLightboxPhoto.category)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!readOnly && onUpdatePhotos && (
                  <button
                    type="button"
                    onClick={() => handleToggleCover(currentLightboxPhoto.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      currentLightboxPhoto.isCover
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>{currentLightboxPhoto.isCover ? 'Foto Principal' : 'Tornar Capa'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Thumbnail Nav Track */}
            {photos.length > 1 && (
              <div className="p-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
                {photos.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPhotoIndex(idx);
                      setLightboxZoom(1);
                    }}
                    className={`relative w-14 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      selectedPhotoIndex === idx
                        ? 'border-sky-500 scale-105 shadow-md'
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. ADD PHOTO MODAL */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div
          onClick={() => setIsAddModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Adicionar Foto à Galeria
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cadastre a imagem do ambiente clínico para enriquecer o perfil da unidade.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPhotoSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ambiente / Categoria *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'fachada', label: 'Fachada', icon: Building2 },
                      { id: 'recepcao', label: 'Recepção', icon: ImageIcon },
                      { id: 'consultorio', label: 'Consultório', icon: Sparkles },
                      { id: 'outro', label: 'Apoio/PCD', icon: Tag },
                    ] as const
                  ).map(cat => {
                    const isSelected = newPhotoCategory === cat.id;
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewPhotoCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 ring-1 ring-sky-600/30'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Identificação / Legenda do Espaço
                </label>
                <input
                  type="text"
                  placeholder="Ex: Consultório 01 - Poltronas e Iluminação Quente"
                  value={newPhotoLabel}
                  onChange={e => setNewPhotoLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              {/* Tag Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tag de Destaque (opcional)
                  </label>
                  <span className="text-[10px] text-slate-400">Ajuda o paciente a filtrar</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_HIGHLIGHT_TAGS.slice(0, 6).map(presetTag => (
                    <button
                      key={presetTag}
                      type="button"
                      onClick={() => setNewPhotoTag(presetTag)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                        newPhotoTag === presetTag
                          ? 'bg-sky-700 text-white border-sky-700'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {presetTag}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Ou digite uma tag personalizada (ex: Sala de Psicanálise)"
                  value={newPhotoTag}
                  onChange={e => setNewPhotoTag(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Upload Actions (File / Camera / Direct URL) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Arquivo da Imagem *
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingUpload}
                    className="py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-600" />
                    <span>Upload de Arquivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Câmera ao Vivo</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="relative">
                  <input
                    type="url"
                    placeholder="Ou cole a URL direta da foto (https://...)"
                    value={newPhotoUrl}
                    onChange={e => setNewPhotoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Preview Thumbnail */}
                {newPhotoUrl && (
                  <div className="mt-2 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-16/9 bg-slate-100 dark:bg-slate-800 relative">
                    <img
                      src={newPhotoUrl}
                      alt="Prévia"
                      className="w-full h-full object-cover"
                      onError={() => alert('URL de imagem inválida ou inacessível')}
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-[10px] text-white">
                      Prévia da Foto
                    </div>
                  </div>
                )}
              </div>

              {/* Cover toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isCover}
                  onChange={e => setIsCover(e.target.checked)}
                  className="rounded text-sky-700 focus:ring-sky-600"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Definir como foto de capa principal da unidade clínica
                </span>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newPhotoUrl.trim()}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-sky-700 hover:bg-sky-800 text-white disabled:opacity-50 shadow-xs"
                >
                  Salvar Foto na Galeria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
