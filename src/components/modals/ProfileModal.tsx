import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const session = useAuthStore(s => s.session)!;
  const updateProfile = useAuthStore(s => s.updateProfile);

  const [displayName, setDisplayName] = useState(session.displayName);
  const [changePw, setChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) { setError('显示名称不能为空'); return; }
    if (changePw) {
      if (newPw !== confirmPw) { setError('两次密码不一致'); return; }
      if (newPw.length < 6) { setError('新密码至少6位'); return; }
    }

    setLoading(true);
    const result = await updateProfile(
      displayName,
      changePw ? newPw : undefined,
      changePw ? currentPw : undefined,
    );
    setLoading(false);

    if (!result.ok) { setError(result.error ?? '保存失败'); return; }
    setSuccess(true);
  }

  const inputCls = 'border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f] text-sm w-full';

  if (success) {
    return (
      <Modal title="保存成功" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
          <p className="text-[#0f172a] font-medium">个人资料已更新</p>
          <p className="text-[#64748b] text-sm">显示名称已变更为「{displayName}」</p>
          <Button className="w-full mt-2" onClick={onClose}>关闭</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="编辑个人资料" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Username (read-only) */}
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-[#64748b]">用户名</span>
          <input value={session.username} readOnly
            className="border border-[#e2e8f0] rounded-lg px-3 py-2 bg-gray-50 text-[#64748b] cursor-not-allowed text-sm" />
          <span className="text-[10px] text-[#94a3b8]">用户名注册后不可修改</span>
        </div>

        {/* Display name */}
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-[#64748b]">显示名称</span>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)}
            className={inputCls} placeholder="显示在课程上的名字" />
        </div>

        {/* Change password toggle */}
        <div className="flex items-center gap-2">
          <button type="button"
            onClick={() => { setChangePw(v => !v); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}
            className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${changePw ? 'bg-[#1e3a5f]' : 'bg-[#e2e8f0]'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${changePw ? 'left-4' : 'left-0.5'}`} />
          </button>
          <span className="text-sm text-[#64748b]">修改密码</span>
        </div>

        {changePw && (
          <div className="flex flex-col gap-3 p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            {/* Current password */}
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-[#64748b]">当前密码</span>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  className={inputCls + ' pr-10'} placeholder="输入当前密码" />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#1e3a5f] px-1">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-[#64748b]">新密码</span>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  className={inputCls + ' pr-10'} placeholder="至少6位" />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#1e3a5f] px-1">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm new password */}
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-[#64748b]">确认新密码</span>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                className={inputCls} placeholder="再次输入新密码" />
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
          <Button type="submit" disabled={loading}>{loading ? '保存中…' : '保存'}</Button>
        </div>
      </form>
    </Modal>
  );
}
