import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Trash2, UserCircle, Pencil, Plus, Check, X, ShieldCheck, KeyRound } from 'lucide-react';
import type { User, TeacherType } from '@/types/user';
import { Button } from '@/components/common/Button';

const TYPE_LABEL: Record<TeacherType, string> = { lead: '主教', assistant: '助教' };
const TYPE_COLOR: Record<TeacherType, string> = {
  lead: 'bg-[#1e3a5f]/10 text-[#1e3a5f]',
  assistant: 'bg-amber-100 text-amber-700',
};

// ─── Add Teacher Modal ────────────────────────────────────────────────────────
function AddTeacherModal({ onClose }: { onClose: () => void }) {
  const createTeacherByAdmin = useAuthStore(s => s.createTeacherByAdmin);
  const [form, setForm] = useState({ username: '', displayName: '', password: '', teacherType: 'lead' as TeacherType });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.displayName || !form.password) {
      setError('请填写所有字段'); return;
    }
    setLoading(true);
    const result = await createTeacherByAdmin(form.username, form.displayName, form.password, form.teacherType);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? '创建失败'); return; }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-96 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-[#0f172a]">新增教师</h4>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#0f172a]"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[#64748b]">用户名</span>
            <input name="username" value={form.username} onChange={handle} autoComplete="off"
              className="border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f]"
              placeholder="登录时使用" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[#64748b]">显示名称</span>
            <input name="displayName" value={form.displayName} onChange={handle}
              className="border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f]"
              placeholder="显示在课程上的名字" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[#64748b]">初始密码</span>
            <input type="password" name="password" value={form.password} onChange={handle} autoComplete="new-password"
              className="border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f]"
              placeholder="至少6位" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[#64748b]">教师类型</span>
            <select name="teacherType" value={form.teacherType} onChange={handle}
              className="border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f] bg-white">
              <option value="lead">主教</option>
              <option value="assistant">助教</option>
            </select>
          </label>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-gray-50 transition-colors">
              取消
            </button>
            <Button type="submit" disabled={loading}>{loading ? '创建中…' : '创建'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Teacher Modal ───────────────────────────────────────────────────────
function EditTeacherModal({ teacher, onClose }: { teacher: User; onClose: () => void }) {
  const updateUser = useAuthStore(s => s.updateUser);
  const resetPassword = useAuthStore(s => s.resetPassword);
  const [displayName, setDisplayName] = useState(teacher.displayName);
  const [teacherType, setTeacherType] = useState<TeacherType>(teacher.teacherType);
  const [error, setError] = useState('');

  // Reset password section
  const [showReset, setShowReset] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) { setError('显示名称不能为空'); return; }
    updateUser(teacher.id, { displayName: displayName.trim(), teacherType });
    onClose();
  }

  async function handleResetPwd(e: React.FormEvent) {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess(false);
    setPwdLoading(true);
    const result = await resetPassword(teacher.id, newPwd);
    setPwdLoading(false);
    if (!result.ok) { setPwdError(result.error ?? '重置失败'); return; }
    setPwdSuccess(true);
    setNewPwd('');
    setTimeout(() => setPwdSuccess(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-80 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-[#0f172a]">编辑教师</h4>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#0f172a]"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-[#64748b]">@{teacher.username}</p>

        {/* Info form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[#64748b]">显示名称</span>
            <input value={displayName} onChange={e => { setDisplayName(e.target.value); setError(''); }}
              className="border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f]" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[#64748b]">教师类型</span>
            <select value={teacherType} onChange={e => setTeacherType(e.target.value as TeacherType)}
              className="border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f] bg-white">
              <option value="lead">主教</option>
              <option value="assistant">助教</option>
            </select>
          </label>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-gray-50 transition-colors">
              取消
            </button>
            <Button type="submit">保存</Button>
          </div>
        </form>

        {/* Reset password section */}
        <div className="border-t border-[#e2e8f0] pt-3">
          <button
            type="button"
            onClick={() => { setShowReset(v => !v); setPwdError(''); setPwdSuccess(false); setNewPwd(''); }}
            className="flex items-center gap-1.5 text-xs text-[#64748b] hover:text-[#1e3a5f] transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {showReset ? '收起重置密码' : '重置密码'}
          </button>
          {showReset && (
            <form onSubmit={handleResetPwd} className="flex flex-col gap-2 mt-2">
              <input
                type="password"
                value={newPwd}
                onChange={e => { setNewPwd(e.target.value); setPwdError(''); setPwdSuccess(false); }}
                placeholder="输入新密码（至少6位）"
                autoComplete="new-password"
                className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f]"
              />
              {pwdError && <p className="text-red-500 text-xs">{pwdError}</p>}
              {pwdSuccess && <p className="text-emerald-600 text-xs font-medium">密码重置成功</p>}
              <button
                type="submit"
                disabled={pwdLoading}
                className="self-start px-3 py-1.5 text-xs font-medium text-white bg-[#1e3a5f] hover:bg-[#162d4a] rounded-lg transition-colors disabled:opacity-50"
              >
                {pwdLoading ? '重置中…' : '确认重置'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TeachersTab() {
  const users = useAuthStore(s => s.users);
  const { approveTeacher, rejectTeacher, deleteUser } = useAuthStore();

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [rejectTarget, setRejectTarget] = useState<User | null>(null);

  const pending = users.filter(u => u.role === 'teacher' && !u.approved);
  const approved = users.filter(u => u.role === 'teacher' && u.approved);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Pending Approval ── */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-amber-700">待审批注册</h3>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
          </div>
          {pending.map(user => (
            <div key={user.id}
              className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-3">
                <UserCircle className="w-8 h-8 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{user.displayName}</p>
                  <p className="text-xs text-[#64748b]">@{user.username} · {new Date(user.createdAt).toLocaleDateString('zh-CN')} 申请</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => approveTeacher(user.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors font-medium">
                  <Check className="w-3.5 h-3.5" />通过
                </button>
                <button onClick={() => setRejectTarget(user)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-red-400 hover:bg-red-500 rounded-lg transition-colors font-medium">
                  <X className="w-3.5 h-3.5" />拒绝
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Approved Teachers ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#0f172a]">已通过教师</h3>
            <span className="text-xs text-[#64748b]">共 {approved.length} 位</span>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />新增教师
          </Button>
        </div>

        {approved.length === 0 ? (
          <div className="text-center py-12 text-[#94a3b8] text-sm border border-dashed border-[#e2e8f0] rounded-xl">
            暂无已审批教师
          </div>
        ) : (
          approved.map(user => (
            <div key={user.id}
              className="flex items-center justify-between px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl hover:border-[#cbd5e1] transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <UserCircle className="w-8 h-8 text-[#94a3b8]" />
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 absolute -bottom-0.5 -right-0.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#0f172a]">{user.displayName}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TYPE_COLOR[user.teacherType]}`}>
                      {TYPE_LABEL[user.teacherType]}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b]">@{user.username} · 注册于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditTarget(user)}
                  className="p-1.5 text-[#94a3b8] hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/5 rounded-lg transition-colors"
                  title="编辑">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(user)}
                  className="p-1.5 text-[#94a3b8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && <AddTeacherModal onClose={() => setShowAdd(false)} />}
      {editTarget && <EditTeacherModal teacher={editTarget} onClose={() => setEditTarget(null)} />}

      {/* Confirm delete */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 flex flex-col gap-4">
            <h4 className="text-base font-semibold text-[#0f172a]">确认删除教师</h4>
            <p className="text-sm text-[#64748b]">
              将删除教师 <span className="font-semibold text-[#0f172a]">{deleteTarget.displayName}</span>（@{deleteTarget.username}），该账号将无法登录，此操作不可撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-gray-50 transition-colors">
                取消
              </button>
              <button onClick={() => { deleteUser(deleteTarget.id); setDeleteTarget(null); }}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm reject */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 flex flex-col gap-4">
            <h4 className="text-base font-semibold text-[#0f172a]">拒绝注册申请</h4>
            <p className="text-sm text-[#64748b]">
              拒绝后将删除 <span className="font-semibold text-[#0f172a]">{rejectTarget.displayName}</span>（@{rejectTarget.username}）的注册申请，该操作不可撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectTarget(null)}
                className="px-4 py-2 text-sm text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-gray-50 transition-colors">
                取消
              </button>
              <button onClick={() => { rejectTeacher(rejectTarget.id); setRejectTarget(null); }}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
