import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { ChevronLeft, ChevronRight, Layers, Download, Upload } from 'lucide-react';

const MONTH_NAMES = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

export type ViewMode = 'month' | 'week';

interface MonthNavigatorProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onAddCourse: () => void;
  onBatchAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  weekStart?: Date;
}

function weekTitle(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const sy = weekStart.getFullYear();
  const sm = weekStart.getMonth() + 1;
  const sd = weekStart.getDate();
  const em = end.getMonth() + 1;
  const ed = end.getDate();
  if (sm === em) {
    return `${sy}年 ${sm}月${sd}日 – ${ed}日`;
  }
  return `${sy}年 ${sm}月${sd}日 – ${em}月${ed}日`;
}

export function MonthNavigator({
  year, month, onPrev, onNext, onAddCourse, onBatchAdd, onExport, onImport,
  viewMode, onViewChange, weekStart,
}: MonthNavigatorProps) {
  const session = useAuthStore(s => s.session);
  const canEdit = session?.role === 'teacher' || session?.role === 'admin';
  const isAdmin = session?.role === 'admin';

  return (
    <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-2">
      {/* Date navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-bold text-[#1e3a5f] min-w-[160px] text-center">
          {viewMode === 'month' ? (
            <><span className="text-[#f59e0b]">{year}</span>年 {MONTH_NAMES[month - 1]}</>
          ) : (
            weekStart ? weekTitle(weekStart) : ''
          )}
        </h2>
        <Button variant="ghost" size="sm" onClick={onNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View toggle */}
        <div className="flex rounded-lg border border-[#e2e8f0] overflow-hidden text-sm">
          <button
            onClick={() => onViewChange('month')}
            className={`px-3 py-1.5 font-medium transition-colors ${
              viewMode === 'month' ? 'bg-[#1e3a5f] text-white' : 'bg-white text-[#64748b] hover:bg-[#f8fafc]'
            }`}
          >
            月
          </button>
          <button
            onClick={() => onViewChange('week')}
            className={`px-3 py-1.5 font-medium transition-colors border-l border-[#e2e8f0] ${
              viewMode === 'week' ? 'bg-[#1e3a5f] text-white' : 'bg-white text-[#64748b] hover:bg-[#f8fafc]'
            }`}
          >
            周
          </button>
        </div>

        {/* Export */}
        <Button variant="secondary" size="sm" onClick={onExport} title="导出课表为 PDF">
          <Download className="w-4 h-4 md:mr-1" /><span className="hidden md:inline">导出</span>
        </Button>

        {/* Import – admin only */}
        {isAdmin && (
          <Button variant="secondary" size="sm" onClick={onImport} title="导入课程">
            <Upload className="w-4 h-4 md:mr-1" /><span className="hidden md:inline">导入</span>
          </Button>
        )}

        {/* Batch add */}
        {canEdit && (
          <Button variant="secondary" size="sm" onClick={onBatchAdd} title="批量添加多节课">
            <Layers className="w-4 h-4 md:mr-1" /><span className="hidden md:inline">一键排课</span>
          </Button>
        )}

        {/* Single add – hidden on mobile (top bar has its own add button) */}
        {canEdit && (
          <span className="hidden md:inline-flex">
            <Button variant="primary" size="sm" onClick={onAddCourse}>+ 添加课程</Button>
          </span>
        )}
      </div>
    </div>
  );
}
