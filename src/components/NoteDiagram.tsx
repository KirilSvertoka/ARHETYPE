import { Note } from '../types';
import { useLanguage } from './LanguageProvider';
import { motion } from 'motion/react';

interface NoteDiagramProps {
  topNotes: Note[];
  heartNotes: Note[];
  baseNotes: Note[];
}

export default function NoteDiagram({ topNotes, heartNotes, baseNotes }: NoteDiagramProps) {
  const { language, t } = useLanguage();
  
  const getNoteName = (note: Note) => language === 'be' && note.name_be ? note.name_be : note.name;

  const NoteGroup = ({ title, notes, delay }: { title: string, notes: Note[], delay: number }) => {
    // Show notes in the order they were provided
    const displayNotes = [...notes];

    return (
      <div className="bg-white/5 border border-brand-border rounded-3xl p-6 md:p-8 hover:bg-white/[0.07] transition-colors">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-sm font-medium uppercase tracking-[0.2em] text-brand-light">
            {title}
          </h4>
          <span className="text-xs font-mono text-brand-muted">
            {notes.length} {t('notes').toLowerCase()}
          </span>
        </div>
        <div className="space-y-4">
          {displayNotes.map((note, idx) => {
            return (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-sm font-medium text-brand-light/80">
                  {getNoteName(note)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <NoteGroup title={t('topNotes')} notes={topNotes} delay={0.1} />
      <NoteGroup title={t('heartNotes')} notes={heartNotes} delay={0.3} />
      <NoteGroup title={t('baseNotes')} notes={baseNotes} delay={0.5} />
    </div>
  );
}
