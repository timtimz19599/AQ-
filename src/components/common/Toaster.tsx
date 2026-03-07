import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';

export function Toaster() {
  const { toasts, remove } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium w-[300px] pointer-events-auto animate-slide-in ${
            t.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
          }`}
        >
          {t.type === 'error'
            ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          }
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
