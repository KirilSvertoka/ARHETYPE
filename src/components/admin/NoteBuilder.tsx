import React, { useState } from 'react';
import { Note } from '../../types';
import { Plus, Trash2, ChevronDown, Check, Circle as CircleIcon } from 'lucide-react';
import { IconMap, ICONS_LIST } from '../../utils/icons';

interface NoteBuilderProps {
  title: string;
  notes: Note[];
  onChange: (notes: Note[]) => void;
}

export default function NoteBuilder({ title, notes, onChange }: NoteBuilderProps) {
  const [openIconPickerIndex, setOpenIconPickerIndex] = useState<number | null>(null);

  const addNote = () => {
    onChange([...notes, { name: '', name_be: '', value: 50, icon: 'Leaf' }]);
  };

  const updateNote = (idx: number, updates: Partial<Note>) => {
    const copy = [...notes];
    copy[idx] = { ...copy[idx], ...updates };
    onChange(copy);
  };

  const removeNote = (idx: number) => {
    const copy = [...notes];
    copy.splice(idx, 1);
    onChange(copy);
  };

  return (
    <div className="bg-transparent border border-brand-border rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium uppercase tracking-wider text-brand-light">{title}</h4>
        <button
          type="button"
          onClick={addNote}
          className="text-xs flex items-center gap-1 text-brand-accent hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </div>

      {notes.map((note, idx) => {
        const CurrentIcon = note.icon && IconMap[note.icon] ? IconMap[note.icon] : CircleIcon;

        return (
          <div key={idx} className="flex flex-col gap-3 bg-brand-hover p-3 rounded-xl border border-brand-border/50">
            <div className="flex items-center gap-3">
              {/* Icon Picker Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenIconPickerIndex(openIconPickerIndex === idx ? null : idx)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-transparent hover:bg-brand-hover border border-brand-border transition-colors text-brand-light"
                  title="Выбрать иконку"
                >
                  <CurrentIcon className="w-5 h-5" />
                </button>
                
                {/* Icon Dropdown */}
                {openIconPickerIndex === idx && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setOpenIconPickerIndex(null)}
                    />
                    <div className="absolute top-12 left-0 z-50 w-64 h-64 overflow-y-auto bg-brand-bg border border-brand-border rounded-xl shadow-xl shadow-black/10 p-2 grid grid-cols-4 gap-2">
                      {ICONS_LIST.map((iconName) => {
                        const IconCmp = IconMap[iconName];
                        if (!IconCmp) return null;
                        const isSelected = note.icon === iconName;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => {
                              updateNote(idx, { icon: iconName });
                              setOpenIconPickerIndex(null);
                            }}
                            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                              isSelected ? 'bg-brand-accent text-white' : 'hover:bg-brand-hover text-brand-muted hover:text-brand-light'
                            }`}
                            title={iconName}
                          >
                            <IconCmp className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Names */}
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={note.name}
                  onChange={(e) => updateNote(idx, { name: e.target.value })}
                  placeholder="Название (RU)"
                  className="flex-1 min-w-0 px-3 py-2 bg-transparent border border-brand-border rounded-lg text-sm text-brand-light placeholder:text-brand-muted focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none"
                />
                <input
                  type="text"
                  value={note.name_be || ''}
                  onChange={(e) => updateNote(idx, { name_be: e.target.value })}
                  placeholder="Назва (BE)"
                  className="flex-1 min-w-0 px-3 py-2 bg-transparent border border-brand-border rounded-lg text-sm text-brand-light placeholder:text-brand-muted focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none"
                />
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeNote(idx)}
                className="p-2 text-brand-muted hover:text-red-500 transition-colors shrink-0"
                title="Удалить ноту"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })}
      
      {notes.length === 0 && (
        <div className="text-center py-4 text-brand-muted text-sm italic">
          Нет добавленных нот
        </div>
      )}
    </div>
  );
}
