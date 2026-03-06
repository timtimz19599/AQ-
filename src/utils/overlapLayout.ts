import type { Course, DaySchedule, LayoutSlot, OverlapGroup } from '@/types/course';
import { parseMinutes } from './timeUtils';

function overlaps(a: Course, b: Course): boolean {
  return (
    parseMinutes(a.startTime) < parseMinutes(b.endTime) &&
    parseMinutes(b.startTime) < parseMinutes(a.endTime)
  );
}

// Union-Find
function buildUnionFind(courses: Course[]): number[] {
  const parent = courses.map((_, i) => i);
  function find(x: number): number {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(x: number, y: number) {
    parent[find(x)] = find(y);
  }
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      if (overlaps(courses[i], courses[j])) union(i, j);
    }
  }
  return parent.map((_, i) => {
    let x = i;
    while (parent[x] !== x) x = parent[x];
    return x;
  });
}

function greedyColumnAssign(group: Course[]): LayoutSlot[] {
  // Sort: startTime asc, then shorter duration first
  const sorted = [...group].sort((a, b) => {
    const startDiff = parseMinutes(a.startTime) - parseMinutes(b.startTime);
    if (startDiff !== 0) return startDiff;
    const durA = parseMinutes(a.endTime) - parseMinutes(a.startTime);
    const durB = parseMinutes(b.endTime) - parseMinutes(b.startTime);
    return durA - durB;
  });

  const colEnds: number[] = []; // end time (minutes) of last course in each column
  const assignments: number[] = [];

  for (const course of sorted) {
    const start = parseMinutes(course.startTime);
    let col = colEnds.findIndex(end => end <= start);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(0);
    }
    colEnds[col] = parseMinutes(course.endTime);
    assignments.push(col);
  }

  const totalColumns = colEnds.length;
  return sorted.map((course, i) => ({
    course,
    columnIndex: assignments[i],
    totalColumns,
  }));
}

export function buildDaySchedule(date: string, courses: Course[]): DaySchedule {
  if (courses.length === 0) return { date, groups: [] };

  // Sort all courses first
  const sorted = [...courses].sort((a, b) => {
    const startDiff = parseMinutes(a.startTime) - parseMinutes(b.startTime);
    if (startDiff !== 0) return startDiff;
    const durA = parseMinutes(a.endTime) - parseMinutes(a.startTime);
    const durB = parseMinutes(b.endTime) - parseMinutes(b.startTime);
    return durA - durB;
  });

  const roots = buildUnionFind(sorted);

  // Group by root
  const componentMap = new Map<number, Course[]>();
  sorted.forEach((course, i) => {
    const root = roots[i];
    if (!componentMap.has(root)) componentMap.set(root, []);
    componentMap.get(root)!.push(course);
  });

  // Sort groups by earliest startTime
  const groupList = Array.from(componentMap.values()).sort((a, b) =>
    parseMinutes(a[0].startTime) - parseMinutes(b[0].startTime)
  );

  const groups: OverlapGroup[] = groupList.map(group => ({
    slots: greedyColumnAssign(group),
  }));

  return { date, groups };
}
