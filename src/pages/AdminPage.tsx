import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { LogOut, ArrowLeft } from 'lucide-react';

export function AdminPage() {
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-[#1e3a5f] px-6 py-3 flex items-center justify-between" style={{ borderBottom: '2px solid #f59e0b' }}>
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-lg px-1.5 py-0.5 shrink-0">
            <img src="/logo.png" alt="AQ" className="h-7 object-contain" />
          </div>
          <h1 className="font-bold text-lg text-white">AQ 管理面板</h1>
          <Link to="/" className="text-sm text-white/70 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            返回课程表
          </Link>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="text-sm text-white/70 hover:text-white flex items-center gap-1.5">
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        <AdminPanel />
      </main>
    </div>
  );
}
