import { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { hashPassword } from '@/utils/hashPassword';
import { Button } from '@/components/common/Button';

export function SettingsTab() {
  const setAdminPasswordHash = useSettingsStore(s => s.setAdminPasswordHash);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPw || !confirmPw || !currentPw) {
      setIsError(true); setMessage('请填写所有字段'); return;
    }
    if (newPw !== confirmPw) {
      setIsError(true); setMessage('两次输入的新密码不一致'); return;
    }
    if (newPw.length < 6) {
      setIsError(true); setMessage('新密码至少6位'); return;
    }

    const currentHash = await hashPassword(currentPw);
    const storedHash = useSettingsStore.getState().adminPasswordHash;
    if (currentHash !== storedHash) {
      setIsError(true); setMessage('当前密码错误'); return;
    }

    const newHash = await hashPassword(newPw);
    setAdminPasswordHash(newHash);
    setIsError(false); setMessage('密码已更新');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  }

  return (
    <div className="max-w-sm">
      <h3 className="font-semibold text-gray-700 mb-4">修改管理员密码</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">当前密码</span>
          <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">新密码</span>
          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">确认新密码</span>
          <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
        {message && <p className={`text-sm ${isError ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
        <Button type="submit">更新密码</Button>
      </form>
    </div>
  );
}
