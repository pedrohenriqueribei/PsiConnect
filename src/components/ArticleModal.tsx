import React, { useEffect } from 'react';
import { KnowledgeArticle } from '../data/knowledgeArticles';
import { BookOpen, Clock, X, ArrowRight, Tag, ShieldCheck, HeartHandshake, AlertTriangle } from 'lucide-react';

interface ArticleModalProps {
  article: KnowledgeArticle | null;
  onClose: () => void;
  onNavigateAction?: (tab: string) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  onNavigateAction,
}) => {
  useEffect(() => {
    if (!article) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [article, onClose]);

  if (!article) return null;

  const getCategoryStyles = (category: KnowledgeArticle['category']) => {
    switch (category) {
      case 'Ética & Sigilo':
        return {
          badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: ShieldCheck,
        };
      case 'Emergência':
        return {
          badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: AlertTriangle,
        };
      case 'Espiritualidade & Fé':
        return {
          badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: HeartHandshake,
        };
      default:
        return {
          badge: 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
          icon: BookOpen,
        };
    }
  };

  const catStyle = getCategoryStyles(article.category);
  const CategoryIcon = catStyle.icon;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 flex items-start sm:items-center justify-center"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[calc(100dvh-2rem)] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${catStyle.badge}`}>
                <CategoryIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{article.category}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{article.readTime}</span>
              </span>
            </div>
            <h2 id="article-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {article.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar artigo"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 font-medium">
            {article.summary}
          </p>

          <div className="space-y-4">
            {article.sections.map((section, idx) => (
              <section key={idx} className="space-y-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {section.heading}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          {/* Tags */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
            {article.tags.map(tag => (
              <span
                key={tag}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>

          {article.relatedTab && article.relatedActionLabel && onNavigateAction && (
            <button
              type="button"
              onClick={() => {
                const target = article.relatedTab!;
                onClose();
                onNavigateAction(target);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>{article.relatedActionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
