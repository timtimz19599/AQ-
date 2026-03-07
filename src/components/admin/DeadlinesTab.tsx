import { useState } from 'react';
import { useDeadlineStore } from '@/store/deadlineStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';
import { Plus, Trash2, Trophy, CalendarDays, Pencil, Check, X } from 'lucide-react';

export function DeadlinesTab() {
  const { deadlines, addDeadline, updateDeadline, deleteDeadline } = useDeadlineStore();
  const session = useAuthStore(s => s.session)!;

  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formError, setFormError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const sorted = [...deadlines].sort((a, b) => a.date.localeCompare(b.date));
  const todayStr = new Date().toISOString().split('T')[0];

  function handleAdd() {
    if (!formDate) { setFormError('请选择日期'); return; }
    if (!formTitle.trim()) { setFormError('请填写比赛名称'); return; }
    addDeadline({ date: formDate, title: formTitle.trim(), description: formDesc.trim() || undefined, createdBy: session.username });
    setFormDate('');
    setFormTitle('');
    setFormDesc('');
    setFormError('');
    setShowForm(false);
  }

  function startEdit(d: typeof deadlines[0]) {
    setEditId(d.id);
    setEditDate(d.date);
    setEditTitle(d.title);
    setEditDesc(d.description ?? '');
  }

  function handleSaveEdit() {
    if (!editId) return;
    updateDeadline(editId, { date: editDate, title: editTitle.trim(), description: editDesc.trim() || undefined });
    setEditId(null);
  }

  const inputCls = 'border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f] w-full bg-white';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-[#0f172a]">比赛截止日期</div>
          <div className="text-xs text-[#64748b] mt-0.5">添加后会在日历上高亮标注，提醒教师关注</div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(v => !v)}>
          <Plus className="w-3.5 h-3.5 mr-1" />添加截止日
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border border-[#e2e8f0] rounded-xl p-4 bg-[#f8fafc] flex flex-col gap-3">
          <div className="text-sm font-semibold text-[#1e3a5f]">新增比赛截止日期</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#64748b]">截止日期</span>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#64748b]">比赛名称</span>
              <input value={formTitle} onChange={e => setFormTitle(e.target.value)} className={inputCls} placeholder="如 BPA Regional Deadline" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[#64748b]">备注说明 <span className="text-[#94a3b8]">（可选）</span></span>
            <input value={formDesc} onChange={e => setFormDesc(e.target.value)} className={inputCls} placeholder="如：提交网址、注意事项..." />
          </div>
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setShowForm(false); setFormError(''); }}>取消</Button>
            <Button size="sm" onClick={handleAdd}>确认添加</Button>
          </div>
        </div>
      )}

      {/* Deadline list */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-[#94a3b8] gap-2">
          <Trophy className="w-10 h-10 opacity-30" />
          <p className="text-sm">暂无比赛截止日期，点击「添加截止日」开始设置</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map(d => {
            const isPast = d.date < todayStr;
            const isToday = d.date === todayStr;
            const daysLeft = Math.ceil((new Date(d.date).getTime() - new Date(todayStr).getTime()) / 86400000);
            const isEditing = editId === d.id;

            return (
              <div
                key={d.id}
                className={`border rounded-xl p-3 flex gap-3 items-start ${
                  isPast ? 'border-[#e2e8f0] bg-[#f8fafc] opacity-60' :
                  isToday ? 'border-red-400 bg-red-50' :
                  daysLeft <= 7 ? 'border-amber-300 bg-amber-50' :
                  'border-[#e2e8f0] bg-white'
                }`}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isPast ? 'bg-[#e2e8f0]' :
                  isToday ? 'bg-red-500' :
                  daysLeft <= 7 ? 'bg-amber-400' :
                  'bg-[#1e3a5f]'
                }`}>
                  <Trophy className="w-4 h-4 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className={inputCls} />
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className={inputCls} />
                      </div>
                      <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className={inputCls} placeholder="备注（可选）" />
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit} className="flex items-center gap-1 text-xs text-emerald-700 font-medium hover:underline">
                          <Check className="w-3.5 h-3.5" />保存
                        </button>
                        <button onClick={() => setEditId(null)} className="flex items-center gap-1 text-xs text-[#64748b] hover:underline">
                          <X className="w-3.5 h-3.5" />取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#0f172a]">{d.title}</span>
                        {isToday && <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">今天截止！</span>}
                        {!isPast && !isToday && daysLeft <= 7 && (
                          <span className="text-[9px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded-full">还有 {daysLeft} 天</span>
                        )}
                        {isPast && <span className="text-[9px] text-[#94a3b8]">已过期</span>}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#64748b] mt-0.5">
                        <CalendarDays className="w-3 h-3" />
                        {d.date}
                        {!isPast && !isToday && <span className="ml-1 text-[#94a3b8]">（{daysLeft} 天后）</span>}
                      </div>
                      {d.description && (
                        <p className="text-xs text-[#64748b] mt-1">{d.description}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(d)} className="text-[#94a3b8] hover:text-[#1e3a5f] p-1 rounded transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteDeadline(d.id)} className="text-[#94a3b8] hover:text-red-500 p-1 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
