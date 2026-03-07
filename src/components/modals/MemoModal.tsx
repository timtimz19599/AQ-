import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useMemoStore } from '@/store/memoStore';
import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { Plus, Trash2, SquareCheck, Square, StickyNote } from 'lucide-react';

interface MemoModalProps {
  onClose: () => void;
}

export function MemoModal({ onClose }: MemoModalProps) {
  const session = useAuthStore(s => s.session)!;
  const courses = useCourseStore(s => s.courses);
  const { memos, addMemo, updateMemo, deleteMemo } = useMemoStore();

  const myMemos = memos
    .filter(m => m.teacher === session.username)
    .sort((a, b) => b.createdAt - a.createdAt);

  // My teams from existing courses
  const myTeams = [...new Set(
    courses.filter(c => c.teacher === session.username || (c.coTeachers ?? []).includes(session.username))
      .map(c => c.teamName)
  )].sort();

  const [showForm, setShowForm] = useState(false);
  const [formTeam, setFormTeam] = useState('');
  const [formTeamCustom, setFormTeamCustom] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formError, setFormError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'done'>('all');

  const isCustomTeam = formTeam === '__custom__';
  const resolvedTeam = isCustomTeam ? formTeamCustom.trim() : formTeam;

  function handleAdd() {
    if (!resolvedTeam) { setFormError('请填写队伍名称'); return; }
    if (!formContent.trim()) { setFormError('请填写备忘内容'); return; }
    addMemo({ teacher: session.username, teamName: resolvedTeam, content: formContent.trim(), status: 'pending' });
    setFormTeam('');
    setFormTeamCustom('');
    setFormContent('');
    setFormError('');
    setShowForm(false);
  }

  const displayed = myMemos.filter(m => filterStatus === 'all' || m.status === filterStatus);
  const pendingCount = myMemos.filter(m => m.status === 'pending').length;
  const doneCount = myMemos.filter(m => m.status === 'done').length;

  return (
    <Modal title="备忘录" onClose={onClose} width="max-w-xl">
      <div className="flex flex-col gap-4">

        {/* Stats + filter */}
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'done'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterStatus === s
                  ? s === 'pending' ? 'bg-amber-500 text-white' : s === 'done' ? 'bg-emerald-600 text-white' : 'bg-[#1e3a5f] text-white'
                  : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
              }`}
            >
              {s === 'all' ? `全部 ${myMemos.length}` : s === 'pending' ? `待完成 ${pendingCount}` : `已完成 ${doneCount}`}
            </button>
          ))}
          <button
            onClick={() => setShowForm(v => !v)}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-[#1e3a5f] bg-[#1e3a5f]/10 hover:bg-[#1e3a5f]/20 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />新建备忘
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="border border-[#e2e8f0] rounded-xl p-3 bg-[#f8fafc] flex flex-col gap-3">
            <div className="text-xs font-semibold text-[#1e3a5f]">新建备忘</div>

            {/* Team selector */}
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-[#64748b]">相关队伍</span>
              <select
                value={formTeam}
                onChange={e => setFormTeam(e.target.value)}
                className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
              >
                <option value="">请选择队伍</option>
                {myTeams.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="__custom__">手动输入...</option>
              </select>
              {isCustomTeam && (
                <input
                  value={formTeamCustom}
                  onChange={e => setFormTeamCustom(e.target.value)}
                  className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                  placeholder="输入队伍名称"
                />
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#64748b]">备忘内容</span>
              <textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                rows={3}
                className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 resize-y"
                placeholder="记录进度、待办事项、注意事项..."
              />
            </div>

            {formError && <p className="text-xs text-red-500">{formError}</p>}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setFormError(''); }}>取消</Button>
              <Button type="button" onClick={handleAdd}>添加备忘</Button>
            </div>
          </div>
        )}

        {/* Memo list */}
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#94a3b8]">
              <StickyNote className="w-8 h-8 opacity-40" />
              <p className="text-sm">暂无备忘记录</p>
            </div>
          ) : displayed.map(m => (
            <div
              key={m.id}
              className={`border rounded-xl p-3 flex gap-2.5 transition-colors ${
                m.status === 'done'
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : 'border-[#e2e8f0] bg-white'
              }`}
            >
              {/* Toggle status */}
              <button
                onClick={() => updateMemo(m.id, { status: m.status === 'pending' ? 'done' : 'pending' })}
                className={`mt-0.5 shrink-0 ${m.status === 'done' ? 'text-emerald-600' : 'text-[#94a3b8] hover:text-[#1e3a5f]'}`}
              >
                {m.status === 'done'
                  ? <SquareCheck className="w-4 h-4" />
                  : <Square className="w-4 h-4" />
                }
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-semibold ${m.status === 'done' ? 'text-emerald-700' : 'text-[#1e3a5f]'}`}>
                    {m.teamName}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                    m.status === 'done'
                      ? 'bg-emerald-200 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {m.status === 'done' ? '已完成' : '待完成'}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed whitespace-pre-wrap ${m.status === 'done' ? 'text-emerald-800/70 line-through' : 'text-[#0f172a]'}`}>
                  {m.content}
                </p>
                <div className="text-[9px] text-[#94a3b8] mt-1">
                  {new Date(m.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteMemo(m.id)}
                className="shrink-0 text-[#cbd5e1] hover:text-red-400 transition-colors mt-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
