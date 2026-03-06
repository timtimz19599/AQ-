import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';
import { Eye, EyeOff } from 'lucide-react';
import { FloatingTextAnimation } from '@/components/common/FloatingTextAnimation';
import type { UserRole } from '@/types/user';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, error, clearError } = useAuthStore();
  const [role, setRole] = useState<UserRole>('teacher');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setLoading(true);
    const ok = await login(username, password, role);
    setLoading(false);
    if (ok) navigate(role === 'admin' ? '/admin' : '/');
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — deep space tech */}
      <div className="hidden md:flex md:w-2/5 flex-col items-center justify-center p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #020817 0%, #060d1f 40%, #091428 70%, #0a1833 100%)' }}>

        {/* Canvas animation */}
        <FloatingTextAnimation />

        {/* Edge vignette: left/bottom fade */}
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
            <img src="/logo.png" alt="Alpha Quants" className="h-20 object-contain" />
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
              专业课程管理平台
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'rgba(147,197,253,0.6)' }}>
              Alpha Quants · AQ 课程系统
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
          <h1 className="text-2xl font-bold text-[#0f172a] mb-1 text-center">欢迎回来</h1>
          <p className="text-sm text-[#64748b] mb-6 text-center">登录 AQ 课程管理系统</p>

          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            {(['teacher', 'admin'] as UserRole[]).map(r => (
              <button key={r} type="button"
                onClick={() => { setRole(r); clearError(); setPassword(''); setShowPassword(false); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  role === r ? 'bg-white shadow text-[#1e3a5f]' : 'text-[#64748b]'
                }`}>
                {r === 'teacher' ? '教师' : '管理员'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {role === 'teacher' && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-[#64748b]">用户名</span>
                <input value={username} onChange={e => setUsername(e.target.value)}
                  className="border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f]"
                  placeholder="输入用户名" autoComplete="username" />
              </label>
            )}
            {role === 'admin' && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-[#64748b]">用户名</span>
                <input value="AQ001" readOnly
                  className="border border-[#e2e8f0] rounded-lg px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed" />
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[#64748b]">密码</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f]"
                  placeholder="输入密码"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#1e3a5f] px-1" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </label>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? '登录中…' : '登录'}
            </Button>
          </form>

          {role === 'teacher' && (
            <p className="text-center text-sm text-[#64748b] mt-4">
              还没有账号？<Link to="/register" className="text-[#1e3a5f] font-medium hover:underline">注册</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
