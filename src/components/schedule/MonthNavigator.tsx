import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

interface MonthNavigatorProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onAddCourse: () => void;
}

export function MonthNavigator({ year, month, onPrev, onNext, onAddCourse }: MonthNavigatorProps) {
  const session = useAuthStore(s => s.session);
  const isTeacher = session?.role === 'teacher';

  return (
    <div className="flex items-center justify-between mb-4 px-1">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-bold text-[#1e3a5f]">
          <span className="text-[#f59e0b]">{year}</span>年 {MONTH_NAMES[month - 1]}
        </h2>
        <Button variant="ghost" size="sm" onClick={onNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      {isTeacher && (
        <Button variant="primary" size="sm" onClick={onAddCourse}>+ 添加课程</Button>
      )}
    </div>
  );
}
