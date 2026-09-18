import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Check, RotateCcw, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';

interface SectionColorControlProps {
  contentKey: string;
  defaultColor: string;
  sectionName: string;
  positionClassName?: string;
}

const PRESET_COLORS = [
  { name: 'Escuro Industrial', value: '#1A1D20' },
  { name: 'Card Escuro', value: '#151719' },
  { name: 'Preto Técnico', value: '#121417' },
  { name: 'Preto Profundo', value: '#0D0F11' },
  { name: 'Cinza Carvão', value: '#22262B' },
  { name: 'Cinza Aço', value: '#2D3238' },
  { name: 'Vermelho Fardin', value: '#8B1515' },
  { name: 'Fardin Primário', value: '#B82020' },
  { name: 'Branco / Claro', value: '#F8F9FA' },
];

export const SectionColorControl: React.FC<SectionColorControlProps> = ({
  contentKey,
  defaultColor,
  sectionName,
  positionClassName = 'top-4 right-4',
}) => {
  const { isAdminLoggedIn, isEditMode } = useAuth();
  const { content, updateContent } = useContent();

  const [isOpen, setIsOpen] = useState(false);
  const currentColor = content[contentKey] || defaultColor;
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [isSaving, setIsSaving] = useState(false);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    setSelectedColor(content[contentKey] || defaultColor);
  }, [content, contentKey, defaultColor]);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverHeight = 350;
    const popoverWidth = 290;

    let top = rect.bottom + 8;
    // Se estourar a parte inferior da tela e houver espaço acima, posiciona acima do botão
    if (top + popoverHeight > window.innerHeight && rect.top > popoverHeight) {
      top = Math.max(12, rect.top - popoverHeight - 8);
    }

    let right = window.innerWidth - rect.right;
    if (right < 12) right = 12;
    if (window.innerWidth - right < popoverWidth) {
      right = Math.max(12, window.innerWidth - popoverWidth - 12);
    }

    setCoords({ top, right });
  }, []);

  // Recalcula coordenadas ao abrir e em eventos de scroll / resize
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  if (!isAdminLoggedIn || !isEditMode) {
    return null;
  }

  const handleApplyColor = async (color: string) => {
    setSelectedColor(color);
    setIsSaving(true);
    try {
      await updateContent(contentKey, color);
    } catch (err) {
      console.error('Erro ao salvar cor da seção:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = async () => {
    await handleApplyColor(defaultColor);
  };

  const toggleOpen = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className={`absolute ${positionClassName} z-40 pointer-events-auto`}>
      {/* Botão Gatilho */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E2227]/95 text-amber-300 border border-amber-400/40 hover:bg-[#121417] hover:text-amber-200 hover:border-amber-300 shadow-2xl backdrop-blur-md text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 group"
        title={`Alterar cor de fundo da seção: ${sectionName}`}
      >
        <Palette className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">Cor da Seção</span>
        <span
          className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-inner shrink-0"
          style={{ backgroundColor: currentColor }}
        />
      </button>

      {/* Popover Renderizado em Portal no Body para Nunca Ser Cortado por Overflow ou Z-Index */}
      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            right: `${coords.right}px`,
          }}
          className="w-72 p-4 rounded-2xl bg-[#1E2227] border border-[#373E47] shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-white text-xs space-y-3.5 z-[10000] pointer-events-auto animate-in fade-in zoom-in-95 duration-150 overflow-visible"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between pb-2 border-b border-[#2D3238]">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-theme-primary" />
              <div>
                <span className="font-bold text-white block text-xs">Cor de Fundo</span>
                <span className="text-[11px] text-gray-400 truncate max-w-[170px] block">
                  {sectionName}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-[#25292E] transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Paleta de Cores Pré-definidas */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-gray-300 block">
              Paletas Recomendadas
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_COLORS.map((preset) => {
                const isSelected = currentColor.toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleApplyColor(preset.value)}
                    disabled={isSaving}
                    className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-[#25292E] ring-1 ring-amber-400'
                        : 'border-[#2D3238] bg-[#16181B] hover:border-gray-500'
                    }`}
                    title={preset.name}
                  >
                    <span
                      className="w-4 h-4 rounded-lg border border-white/20 shrink-0"
                      style={{ backgroundColor: preset.value }}
                    />
                    <span className="text-[10px] text-gray-200 truncate leading-tight">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor Customizado Hex / Color Picker */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-gray-300 block">
              Cor Personalizada (HEX)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedColor.startsWith('#') ? selectedColor : '#1A1D20'}
                onChange={(e) => handleApplyColor(e.target.value)}
                disabled={isSaving}
                className="w-10 h-9 rounded-xl cursor-pointer border border-[#373E47] bg-transparent p-0.5"
                title="Escolher no seletor de cores"
              />
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                onBlur={() => handleApplyColor(selectedColor)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyColor(selectedColor);
                  }
                }}
                disabled={isSaving}
                placeholder="#1A1D20"
                className="flex-1 px-3 py-2 rounded-xl bg-[#16181B] border border-[#2D3238] text-xs text-white font-mono uppercase focus:border-amber-400 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => handleApplyColor(selectedColor)}
                disabled={isSaving}
                className="p-2 rounded-xl bg-theme-primary text-white hover:brightness-110 transition-all cursor-pointer"
                title="Salvar cor"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Rodapé do Popover */}
          <div className="pt-2 border-t border-[#2D3238] flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefault}
              disabled={isSaving}
              className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-amber-300 transition-colors cursor-pointer"
              title="Restaurar cor padrão desta seção"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar padrão</span>
            </button>
            <span className="text-[10px] text-emerald-400 font-medium">
              {isSaving ? 'Salvando...' : 'Salvo no banco'}
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
