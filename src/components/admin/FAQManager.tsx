import React, { useState, useEffect } from 'react';
import { FAQItem } from '../../types';
import { Plus, Trash2, Edit2, XCircle, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FAQManagerProps {
  token: string;
}

export default function FAQManager({ token }: FAQManagerProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit / Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<Partial<FAQItem> | null>(null);
  const [saving, setSaving] = useState(false);

  // Accordion toggle inside admin
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/faq', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      } else {
        throw new Error('Не удалось загрузить вопросы');
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при загрузке');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [token]);

  const handleOpenAdd = () => {
    setSelectedFaq({
      question: '',
      question_be: '',
      answer: '',
      answer_be: '',
      sort_order: faqs.length > 0 ? Math.max(...faqs.map(f => f.sort_order)) + 10 : 10
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (faq: FAQItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFaq(faq);
    setIsModalOpen(true);
  };

  const handleDelete = async (faqId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) return;

    try {
      const res = await fetch(`/api/admin/faq/${faqId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setFaqs(prev => prev.filter(f => f.id !== faqId));
      } else {
        alert('Не удалось удалить вопрос');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при удалении');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaq || !selectedFaq.question || !selectedFaq.answer) {
      alert('Вопрос и ответ обязательны для заполнения.');
      return;
    }

    try {
      setSaving(true);
      const isEdit = !!selectedFaq.id;
      const url = isEdit ? `/api/admin/faq/${selectedFaq.id}` : '/api/admin/faq';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selectedFaq)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setSelectedFaq(null);
        await fetchFaqs();
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка при сохранении');
      }
    } catch (err) {
      console.error(err);
      alert('Не удалось подключиться к серверу');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedFaqId(prev => prev === id ? null : id);
  };

  return (
    <div className="mt-12 border-t border-brand-border/40 pt-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-serif text-brand-light flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-accent" />
            Управление FAQ (Часто задаваемые вопросы)
          </h3>
          <p className="text-xs text-brand-muted mt-1">Отредактируйте вопросы, которые отображаются покупателям в специальном блоке на сайте</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Добавить вопрос
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-brand-muted text-sm">
          <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Загрузка базы вопросов...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm text-center">
          {error}
        </div>
      ) : faqs.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-brand-border rounded-3xl text-brand-muted text-sm space-y-2">
          <HelpCircle className="w-8 h-8 mx-auto opacity-40" />
          <p>Пока нет часто задаваемых вопросов.</p>
          <button onClick={handleOpenAdd} className="text-brand-accent hover:underline text-xs">Добавить первый вопрос</button>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 border border-brand-border rounded-2xl overflow-hidden hover:border-brand-border-hover transition-colors"
              >
                {/* Header Row */}
                <div 
                  onClick={() => toggleExpand(faq.id)}
                  className="flex items-center justify-between p-4 sm:p-5 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3 text-left">
                    <span className="text-[10px] uppercase font-mono bg-brand-border/40 text-brand-muted px-2 py-0.5 rounded-md mt-1">
                      №{faq.sort_order}
                    </span>
                    <div>
                      <h4 className="font-medium text-brand-light text-sm sm:text-base pr-4">
                        {faq.question}
                      </h4>
                      {faq.question_be && (
                        <p className="text-xs text-brand-muted mt-0.5 italic font-light">
                          BE: {faq.question_be}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleOpenEdit(faq, e)}
                        className="p-1.5 hover:bg-white/5 text-brand-muted hover:text-brand-light rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(faq.id, e)}
                        className="p-1.5 hover:bg-red-500/10 text-brand-muted hover:text-red-500 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-brand-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-brand-muted" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Answer Content Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="border-t border-brand-border/30 p-5 bg-black/20 text-left space-y-3 text-sm text-brand-muted">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-brand-accent block mb-1 font-mono font-bold">ОТВЕТ (RU)</span>
                          <p className="whitespace-pre-line text-brand-light/90 leading-relaxed font-light">{faq.answer}</p>
                        </div>
                        {faq.answer_be && (
                          <div className="border-t border-brand-border/20 pt-3">
                            <span className="text-[10px] uppercase tracking-wider text-brand-accent block mb-1 font-mono font-bold">ОТВЕТ (BE)</span>
                            <p className="whitespace-pre-line text-brand-light/90 leading-relaxed font-light italic">{faq.answer_be}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Interactive Modal for Add/Edit FAQ */}
      <AnimatePresence>
        {isModalOpen && selectedFaq && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-bg w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] border border-brand-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif text-brand-light">
                  {selectedFaq.id ? 'Редактировать вопрос' : 'Добавить новый вопрос'}
                </h3>
                <button type="button" onClick={() => { setIsModalOpen(false); setSelectedFaq(null); }}>
                  <XCircle className="w-6 h-6 text-brand-muted hover:text-brand-light transition-colors" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5 text-left">
                {/* Questions Inputs */}
                <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-brand-border/40">
                  <h4 className="text-xs uppercase font-bold text-brand-accent tracking-wider font-mono">Текст вопроса</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-brand-muted">Вопрос на русском языке *</label>
                    <input
                      type="text"
                      required
                      value={selectedFaq.question || ''}
                      onChange={e => setSelectedFaq({ ...selectedFaq, question: e.target.value })}
                      className="w-full px-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm text-white focus:border-brand-light transition-colors"
                      placeholder="Например: Оригинальная ли у вас продукция?"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-brand-muted">Вопрос на белорусском языке (Опционально)</label>
                    <input
                      type="text"
                      value={selectedFaq.question_be || ''}
                      onChange={e => setSelectedFaq({ ...selectedFaq, question_be: e.target.value })}
                      className="w-full px-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm text-white focus:border-brand-light transition-colors"
                      placeholder="Напрыклад: Ці арыгінальная ў вас прадукцыя?"
                    />
                  </div>
                </div>

                {/* Answers Inputs */}
                <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-brand-border/40">
                  <h4 className="text-xs uppercase font-bold text-brand-accent tracking-wider font-mono">Текст ответа</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-brand-muted">Ответ на русском языке *</label>
                    <textarea
                      required
                      rows={4}
                      value={selectedFaq.answer || ''}
                      onChange={e => setSelectedFaq({ ...selectedFaq, answer: e.target.value })}
                      className="w-full px-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm text-white focus:border-brand-light transition-colors resize-none"
                      placeholder="Напишите развернутый ответ на вопрос..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-brand-muted">Ответ на белорусском языке (Опционально)</label>
                    <textarea
                      rows={4}
                      value={selectedFaq.answer_be || ''}
                      onChange={e => setSelectedFaq({ ...selectedFaq, answer_be: e.target.value })}
                      className="w-full px-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm text-white focus:border-brand-light transition-colors resize-none"
                      placeholder="Напішыце разгорнуты адказ па-беларуску..."
                    />
                  </div>
                </div>

                {/* Sorting options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-brand-muted">Порядок сортировки</label>
                    <input
                      type="number"
                      value={selectedFaq.sort_order === undefined ? '' : selectedFaq.sort_order}
                      onChange={e => setSelectedFaq({ ...selectedFaq, sort_order: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-brand-border rounded-xl text-sm text-white focus:border-brand-light transition-colors font-mono"
                      placeholder="напр. 10, 20, 30..."
                    />
                    <p className="text-[10px] text-brand-muted">Вопросы выводятся по возрастанию этого числа.</p>
                  </div>
                </div>

                {/* Actions banner */}
                <div className="border-t border-brand-border pt-5 flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); setSelectedFaq(null); }}
                    className="px-6 py-2.5 border border-brand-border rounded-xl text-brand-muted hover:text-white transition-colors text-sm"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-muted text-white rounded-xl font-medium transition-colors text-sm flex items-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      'Сохранить'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
