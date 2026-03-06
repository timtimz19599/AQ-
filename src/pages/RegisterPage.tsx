import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';
import { FloatingTextAnimation } from '@/components/common/FloatingTextAnimation';

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
      {/* Left panel — deep space tech */}
      <div className="hidden md:flex md:w-2/5 flex-col items-center justify-center p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #020817 0%, #060d1f 40%, #091428 70%, #0a1833 100%)' }}>

        {/* Canvas animation */}
        <FloatingTextAnimation />

        {/* Edge vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, transparent 40%, #020817 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #020817, transparent)' }} />
        <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, #020817, transparent)' }} />

        {/* Center glow spot */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(30,80,160,0.18) 0%, transparent 70%)' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo card */}
          <div className="rounded-2xl px-6 py-4 shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 0 40px rgba(96,165,250,0.25), 0 8px 32px rgba(0,0,0,0.5)' }}>
            <img src="/logo.png" alt="Alpha Quants" className="h-28 object-contain" />
          </div>

          {/* Gradient tagline */}
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-wide"
              style={{
                background: 'linear-gradient(90deg, #93c5fd 0%, #e2e8f0 50%, #93c5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              加入 AQ 团队
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'rgba(147,197,253,0.6)' }}>
              创建您的教师账号
            </p>
          </div>

          {/* Gold + blue accent lines */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-px" style={{ background: 'rgba(147,197,253,0.4)' }} />
            <div className="w-12 h-0.5 rounded-full bg-[#f59e0b]" />
            <div className="w-8 h-px" style={{ background: 'rgba(147,197,253,0.4)' }} />
          </div>
        </div>
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
