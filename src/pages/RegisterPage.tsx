import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ username: '', displayName: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    clearError();
    setLocalError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.displayName || !form.password) {
      setLocalError('请填写所有字段'); return;
    }
    if (form.password !== form.confirm) {
      setLocalError('两次密码不一致'); return;
    }
    if (form.password.length < 6) {
      setLocalError('密码至少6位'); return;
    }
    setLoading(true);
    const ok = await register(form.username, form.displayName, form.password);
    setLoading(false);
    if (ok) navigate('/login');
  }

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden md:flex md:w-2/5 bg-[#1e3a5f] dot-grid flex-col items-center justify-center p-10 relative overflow-hidden">
        <div className="absolute top-[-60px] left-[-60px] w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full bg-[#f59e0b]/10 blur-3xl" />
        <div className="bg-white/95 rounded-2xl px-6 py-4 mb-6 relative z-10 shadow-lg">
          <img src="/logo.png" alt="Alpha Quants" className="h-20 object-contain" />
        </div>
        <h2 className="text-white text-2xl font-bold text-center relative z-10">加入 AQ 团队</h2>
        <p className="text-white/60 text-sm mt-2 text-center relative z-10">创建您的教师账号</p>
        <div className="mt-8 w-16 h-1 bg-[#f59e0b] rounded-full relative z-10" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="bg-white rounded-2xl shadow-md w-full max-w-sm p-8 border border-[#e2e8f0]">
          <h1 className="text-2xl font-bold text-[#0f172a] mb-1 text-center">注册教师账号</h1>
          <p className="text-sm text-[#64748b] mb-6 text-center">AQ 课程管理系统</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[#64748b]">用户名</span>
              <input name="username" value={form.username} onChange={handleChange}
                className="border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f]"
                placeholder="登录时使用" autoComplete="username" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[#64748b]">显示名称</span>
              <input name="displayName" value={form.displayName} onChange={handleChange}
                className="border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f]"
                placeholder="显示在课程上的名字" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[#64748b]">密码</span>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                className="border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f]"
                autoComplete="new-password" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[#64748b]">确认密码</span>
              <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
                className="border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f]"
                autoComplete="new-password" />
            </label>
            {displayError && <p className="text-red-500 text-sm">{displayError}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? '注册中…' : '注册'}
            </Button>
          </form>

          <p className="text-center text-sm text-[#64748b] mt-4">
            已有账号？<Link to="/login" className="text-[#1e3a5f] font-medium hover:underline">登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
