import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { Edit2, Check, X } from 'lucide-react';

interface EditableTextProps {
  contentKey: string;
  defaultText: string;
  as?: React.ElementType;
  className?: string;
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  contentKey,
  defaultText,
  as: Component = 'span',
  className = '',
  multiline = false,
}) => {
  const { isAdminLoggedIn, isEditMode } = useAuth();
  const { content, updateContent } = useContent();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content[contentKey] || defaultText);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLElement>(null);

  const canEdit = isAdminLoggedIn && isEditMode;

  useEffect(() => {
    setValue(content[contentKey] || defaultText);
  }, [content, contentKey, defaultText]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (value.trim() === (content[contentKey] || defaultText)) {
      setIsEditing(false);
      return;
    }
    
    setSaving(true);
    try {
      await updateContent(contentKey, value);
    } catch (e) {
      console.error(e);
      // Fallback
      setValue(content[contentKey] || defaultText);
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Isola completamente o evento para impedir que teclas como Espaço (Space) ou Enter subam para o <button> ou <a> pai
    e.stopPropagation();

    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setValue(content[contentKey] || defaultText);
      setIsEditing(false);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    // Impede que keyup (ex: soltar a barra de espaço ou Enter) acione o click nativo do button pai
    e.stopPropagation();
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleInputMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!canEdit) {
    return <Component className={className}>{content[contentKey] || defaultText}</Component>;
  }

  if (isEditing) {
    const commonProps = {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value),
      onKeyDown: handleKeyDown,
      onKeyUp: handleKeyUp,
      onKeyPress: (e: React.KeyboardEvent) => {
        e.stopPropagation();
      },
      onClick: handleInputClick,
      onMouseDown: handleInputMouseDown,
      onMouseUp: (e: React.MouseEvent) => {
        e.stopPropagation();
      },
      onPointerDown: (e: React.PointerEvent) => {
        e.stopPropagation();
      },
      onPointerUp: (e: React.PointerEvent) => {
        e.stopPropagation();
      },
      className: `${className} bg-theme-card border border-theme-primary rounded px-2.5 py-1 outline-none w-full text-white text-inherit font-inherit shadow-inner cursor-text`,
      disabled: saving,
      autoFocus: true,
    };

    return (
      <span 
        className="relative w-full group inline-block my-0.5"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
        }}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      >
        {multiline ? (
          <textarea
            {...commonProps}
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={4}
          />
        ) : (
          <input
            {...commonProps}
            ref={inputRef as React.RefObject<HTMLInputElement>}
          />
        )}
        <span 
          className="absolute -bottom-9 right-0 flex gap-2 z-30"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setValue(content[contentKey] || defaultText);
              setIsEditing(false);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setValue(content[contentKey] || defaultText);
              setIsEditing(false);
            }}
            className="p-1.5 bg-[#25292E] rounded text-theme-body hover:text-white border border-[#373E47] cursor-pointer inline-flex items-center justify-center shadow-lg hover:border-white/30 transition-colors"
            title="Cancelar edição (Esc)"
          >
            <X className="w-4 h-4" />
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!saving) handleSave();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!saving) handleSave();
            }}
            className={`p-1.5 rounded text-white border inline-flex items-center justify-center cursor-pointer shadow-lg transition-colors ${
              saving
                ? 'bg-theme-primary/50 border-theme-primary/50 cursor-not-allowed'
                : 'bg-theme-primary hover:bg-[#9E1A1A] border-theme-primary'
            }`}
            title="Salvar alterações (Enter)"
          >
            <Check className="w-4 h-4" />
          </span>
        </span>
      </span>
    );
  }

  return (
    <Component 
      className={`relative inline-block group ${canEdit ? 'cursor-pointer' : ''} ${className}`}
      onClick={(e: React.MouseEvent) => {
        if (canEdit) {
          e.preventDefault();
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
      onMouseDown={(e: React.MouseEvent) => {
        if (canEdit) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onPointerDown={(e: React.PointerEvent) => {
        if (canEdit) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
    >
      {content[contentKey] || defaultText}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsEditing(true);
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.key === 'Enter' || e.key === ' ') {
            setIsEditing(true);
          }
        }}
        className="absolute -right-7 top-1/2 -translate-y-1/2 opacity-100 p-1 bg-zinc-900 text-amber-300 rounded-md border border-white/30 hover:bg-black hover:text-amber-200 hover:border-white/60 inline-flex items-center justify-center cursor-pointer z-20 shadow-md transition-all"
        title="Editar Texto"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </span>
    </Component>
  );
};
