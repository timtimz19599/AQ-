import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { CheckCircle2, Users, ChevronRight, CalendarDays, Clock, User } from 'lucide-react';
import type { Course } from '@/types/course';

interface FeedbackHistoryModalProps {
  onClose: () => void;
  /** If set, only show courses by this teacher (teacher view) */
  filterTeacher?: string;
}

interface TeamSummary {
  teamName: string;
  sessions: Course[];
  lastDate: string;
}

export function FeedbackHistoryModal({ onClose, filterTeacher }: FeedbackHistoryModalProps) {
  const courses = useCourseStore(s => s.courses);
  const getAllUsers = useAuthStore(s => s.getAllUsers);
  const getTeacherColor = useSettingsStore(s => s.getTeacherColor);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const allUsers = getAllUsers();
  function displayName(username: string) {
    return allUsers.find(u => u.username === username)?.displayName ?? username;
  }

  // Filter completed courses (with feedback) by teacher if needed
  const completedCourses = courses.filter(c => {
    if (c.status !== 'completed' || !c.feedback) return false;
    if (filterTeacher) return c.teacher === filterTeacher || (c.coTeachers ?? []).includes(filterTeacher);
    return true;
  });

  // Group by teamName and sort by last session date desc
  const teamMap = new Map<string, Course[]>();
  for (const c of completedCourses) {
    if (!teamMap.has(c.teamName)) teamMap.set(c.teamName, []);
    teamMap.get(c.teamName)!.push(c);
  }

  const teams: TeamSummary[] = Array.from(teamMap.entries())
    .map(([teamName, sessions]) => ({
      teamName,
      sessions: sessions.sort((a, b) => a.date.localeCompare(b.date)),
      lastDate: sessions.reduce((max, c) => c.date > max ? c.date : max, ''),
    }))
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate));

  const filteredTeams = searchTerm
    ? teams.filter(t => t.teamName.toLowerCase().includes(searchTerm.toLowerCase()))
    : teams;

  const selectedSessions = selectedTeam
    ? (teamMap.get(selectedTeam) ?? []).sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return (
    <Modal title="课程反馈历史" onClose={onClose} width="max-w-4xl">
      <div className="flex gap-4 min-h-[420px]">

        {/* Left: team list */}
        <div className="w-52 shrink-0 flex flex-col gap-2">
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="搜索队伍..."
            className="border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
          />
          <div className="flex flex-col gap-1 overflow-y-auto flex-1 max-h-[380px] pr-0.5">
            {filteredTeams.length === 0 ? (
              <div className="text-xs text-[#94a3b8] text-center py-8">暂无已完成的课程反馈</div>
            ) : filteredTeams.map(t => (
              <button
                key={t.teamName}
                onClick={() => setSelectedTeam(t.teamName)}
                className={`text-left rounded-xl px-3 py-2.5 border transition-all ${
                  selectedTeam === t.teamName
                    ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                    : 'bg-white border-[#e2e8f0] hover:border-[#1e3a5f]/40 hover:bg-[#f8fafc]'
                }`}
              >
                <div className={`text-xs font-semibold truncate ${selectedTeam === t.teamName ? 'text-white' : 'text-[#0f172a]'}`}>
                  {t.teamName}
                </div>
                <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${selectedTeam === t.teamName ? 'text-white/70' : 'text-[#64748b]'}`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {t.sessions.length} 节已完成
                </div>
                <div className={`text-[10px] ${selectedTeam === t.teamName ? 'text-white/60' : 'text-[#94a3b8]'}`}>
                  最近：{t.lastDate}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-[#e2e8f0] shrink-0" />

        {/* Right: session detail */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-y-auto max-h-[420px]">
          {!selectedTeam ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-[#94a3b8] gap-2">
              <Users className="w-10 h-10 opacity-30" />
              <p className="text-sm">← 选择左侧队伍，查看课程反馈历史</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedTeam(null)} className="text-[#94a3b8] hover:text-[#64748b]">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <div>
                  <div className="font-semibold text-[#0f172a] text-sm">{selectedTeam}</div>
                  <div className="text-xs text-[#64748b]">共 {selectedSessions.length} 节课 · {selectedSessions.filter(c => c.feedback).length} 节有反馈</div>
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#f8fafc] rounded-xl p-2.5 border border-[#e2e8f0] text-center">
                  <div className="text-lg font-bold text-[#1e3a5f]">{selectedSessions.length}</div>
                  <div className="text-[10px] text-[#64748b]">总课次</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200 text-center">
                  <div className="text-lg font-bold text-emerald-700">{selectedSessions.filter(c => c.feedback).length}</div>
                  <div className="text-[10px] text-emerald-600">已反馈</div>
                </div>
                <div className="bg-[#f8fafc] rounded-xl p-2.5 border border-[#e2e8f0] text-center">
                  <div className="text-xs font-bold text-[#1e3a5f] leading-tight">{selectedSessions[0]?.date ?? '—'}</div>
                  <div className="text-[10px] text-[#64748b]">首次上课</div>
                </div>
              </div>

              {/* Session timeline */}
              <div className="flex flex-col gap-2">
                {selectedSessions.map((c, i) => {
                  const color = getTeacherColor(c.teacher);
                  return (
                    <div key={c.id} className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                      {/* Course header */}
                      <div className="flex items-center gap-2 px-3 py-2" style={{ background: `${color}18`, borderLeft: `3px solid ${color}` }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#94a3b8]">Day {i + 1}</span>
                            <span className="text-xs font-semibold text-[#0f172a]">{c.courseName}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${c.mode === 'online' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {c.mode === 'online' ? '线上' : '线下'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[#64748b]">
                            <span className="flex items-center gap-0.5"><CalendarDays className="w-3 h-3" />{c.date}</span>
                            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{c.startTime}–{c.endTime}</span>
                            <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{displayName(c.teacher)}</span>
                          </div>
                        </div>
                        {c.feedback && (
                          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color }} />
                        )}
                      </div>

                      {/* Feedback content */}
                      {c.feedback ? (
                        <div className="px-3 py-2.5 bg-white flex flex-col gap-2">
                          <div>
                            <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide mb-0.5">课程内容简述</div>
                            <p className="text-xs text-[#0f172a] leading-relaxed">{c.feedback.contentSummary}</p>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide mb-0.5">学生出勤情况</div>
                            <p className="text-xs text-[#0f172a]">{c.feedback.attendance}</p>
                          </div>
                          <div className="text-[9px] text-[#94a3b8]">
                            提交于 {new Date(c.feedback.submittedAt).toLocaleString('zh-CN')}
                          </div>
                        </div>
                      ) : (
                        <div className="px-3 py-2 bg-white">
                          <p className="text-xs text-[#94a3b8]">暂无课堂反馈</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
