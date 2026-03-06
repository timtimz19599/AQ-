import type { OverlapGroup } from '@/types/course';
import { CourseBlock } from './CourseBlock';

interface OverlapRowProps {
  group: OverlapGroup;
  onCourseClick: (courseId: string) => void;
}

export function OverlapRow({ group, onCourseClick }: OverlapRowProps) {
  return (
    <div className="flex gap-0.5 w-full">
      {group.slots.map(slot => (
        <CourseBlock
          key={slot.course.id}
          slot={slot}
          onClick={() => onCourseClick(slot.course.id)}
        />
      ))}
    </div>
  );
}
