import { useState, useRef } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import type { CourseMode } from '@/types/course';

interface ParsedRow {
  date: string;
  startTime: string;
  endTime: string;
  courseName: string;
  teamName: string;
  teacher: string;
  mode: CourseMode;
  error?: string;
}

interface ImportCoursesModalProps {
  onClose: () => void;
}

const EXAMPLE_CSV = `日期,开始时间,结束时间,课程名称,队伍名称,教师用户名,形式
2026-03-10,09:00,10:30,BPA,Alpha Quants A队,teacher01,offline
2026-03-12,14:00,16:00,SIC,Beta School B队,teacher01,online
2026-03-15,09:00,10:30,BPA,Gamma Team,teacher02,offline`;

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  // Detect if first line is a header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('日期') || firstLine.includes('date') || firstLine.includes('开始');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line, i) => {
    // Support comma or tab delimiters
    const parts = line.includes('\t') ? line.split('\t') : line.split(',');
    const clean = parts.map(p => p.trim().replace(/^["']|["']$/g, ''));

    if (clean.length < 6) {
      return { date: '', startTime: '', endTime: '', courseName: '', teamName: '', teacher: '', mode: 'offline', error: `第${i + 1 + (hasHeader ? 1 : 0)}行：列数不足（需要至少6列）` };
    }

    const [date, startTime, endTime, courseName, teamName, teacher, rawMode] = clean;
    const mode: CourseMode = rawMode?.toLowerCase().includes('on') ? 'online' : 'offline';

    // Validate date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { date, startTime, endTime, courseName, teamName, teacher, mode, error: `第${i + 1 + (hasHeader ? 1 : 0)}行：日期格式错误，应为 YYYY-MM-DD` };
    }
    // Validate times
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      return { date, startTime, endTime, courseName, teamName, teacher, mode, error: `第${i + 1 + (hasHeader ? 1 : 0)}行：时间格式错误，应为 HH:MM` };
    }
    if (startTime >= endTime) {
      return { date, startTime, endTime, courseName, teamName, teacher, mode, error: `第${i + 1 + (hasHeader ? 1 : 0)}行：结束时间必须晚于开始时间` };
    }
    if (!courseName || !teamName) {
      return { date, startTime, endTime, courseName, teamName, teacher, mode, error: `第${i + 1 + (hasHeader ? 1 : 0)}行：课程名称或队伍名称为空` };
    }

    return { date, startTime, endTime, courseName, teamName, teacher, mode };
  });
}

export function ImportCoursesModal({ onClose }: ImportCoursesModalProps) {
  const addCourse = useCourseStore(s => s.addCourse);
  const session = useAuthStore(s => s.session)!;
  const getAllUsers = useAuthStore(s => s.getAllUsers);

  const allUsers = getAllUsers();

  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [imported, setImported] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleParse() {
    if (!text.trim()) return;
    const rows = parseCSV(text);
    setParsed(rows);
    setImported(false);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      setText(content);
      const rows = parseCSV(content);
      setParsed(rows);
      setImported(false);
    };
    reader.readAsText(file, 'UTF-8');
  }

  function handleImport() {
    if (!parsed) return;
    const validRows = parsed.filter(r => !r.error);
    for (const row of validRows) {
      // Resolve teacher: use the username if it exists, otherwise fall back to current user
      const teacherUser = allUsers.find(u => u.username === row.teacher);
      const teacher = teacherUser ? row.teacher : session.username;

      addCourse({
        courseName: row.courseName,
        teamName: row.teamName,
        teacher,
        date: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        mode: row.mode,
        createdBy: session.username,
      });
    }
    setImported(true);
  }

  const validCount = parsed?.filter(r => !r.error).length ?? 0;
  const errorCount = parsed?.filter(r => r.error).length ?? 0;

  return (
    <Modal title="导入课程" onClose={onClose}>
      <div className="flex flex-col gap-4">

        {/* Format description */}
        <div className="bg-[#f8fafc] rounded-xl p-3 border border-[#e2e8f0] text-xs text-[#64748b]">
          <div className="font-semibold text-[#1e3a5f] mb-1.5">支持 CSV / 制表符分隔的文本，每行一节课：</div>
          <div className="font-mono bg-white rounded border border-[#e2e8f0] px-2 py-1.5 text-[10px] leading-relaxed whitespace-pre text-[#334155] overflow-x-auto">
            {EXAMPLE_CSV}
          </div>
          <div className="mt-2 text-[11px] space-y-0.5">
            <div>· 形式填 <span className="font-mono bg-[#e2e8f0] px-1 rounded">online</span> 或 <span className="font-mono bg-[#e2e8f0] px-1 rounded">offline</span>（不填默认线下）</div>
            <div>· 教师用户名需与系统中的账号一致，否则将自动归属当前操作人</div>
            <div>· 第一行可选填标题行，会自动跳过</div>
          </div>
        </div>

        {/* Upload file or paste text */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-[#1e3a5f] font-medium bg-[#1e3a5f]/10 hover:bg-[#1e3a5f]/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />上传 CSV 文件
            </button>
            <span className="text-xs text-[#94a3b8]">或直接粘贴文本到下方</span>
            <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFileUpload} />
          </div>

          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setParsed(null); setImported(false); }}
            placeholder={EXAMPLE_CSV}
            className="w-full h-32 font-mono text-xs border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f] resize-none text-[#334155] placeholder:text-[#cbd5e1]"
          />
        </div>

        {/* Parse button */}
        {text.trim() && !parsed && (
          <Button type="button" onClick={handleParse}>
            <FileText className="w-4 h-4 mr-1.5" />解析数据
          </Button>
        )}

        {/* Parse results */}
        {parsed && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-emerald-700">
                <CheckCircle className="w-4 h-4" />
                <span className="font-semibold">{validCount} 条</span>可导入
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <X className="w-4 h-4" />
                  <span className="font-semibold">{errorCount} 条</span>有误
                </div>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
              {parsed.map((row, i) => (
                <div key={i} className={`rounded-lg px-2.5 py-1.5 text-xs border ${row.error ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  {row.error ? (
                    <div className="flex items-start gap-1.5 text-red-600">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{row.error}</span>
                    </div>
                  ) : (
                    <div className="text-emerald-800">
                      <span className="font-semibold">{row.date}</span>
                      <span className="mx-1 text-emerald-600">{row.startTime}–{row.endTime}</span>
                      <span>{row.courseName} · {row.teamName}</span>
                      <span className="ml-1.5 text-emerald-600">（{row.mode === 'online' ? '线上' : '线下'}）</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {imported ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4" />已成功导入 {validCount} 节课程！
              </div>
            ) : validCount > 0 ? (
              <Button type="button" onClick={handleImport}>
                确认导入 {validCount} 节课程
              </Button>
            ) : null}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            {imported ? '完成' : '取消'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
