import { create } from 'zustand';
import type { User, AuthSession, UserRole, TeacherType } from '@/types/user';
import { hashPassword } from '@/utils/hashPassword';
import { useSettingsStore } from './settingsStore';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/utils/supabase';

const SESSION_KEY = 'aq_session';

function normalizeUser(u: Partial<User> & { id: string; username: string }): User {
  return {
    teacherType: 'lead',
    approved: true,
    displayName: u.username,
    passwordHash: '',
    role: 'teacher',
    createdAt: Date.now(),
    ...u,
  } as User;
}

function loadSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession | null): void {
  if (session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

interface AuthState {
  session: AuthSession | null;
  users: User[];
  error: string | null;
  initUsers: () => Promise<void>;
  login: (username: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  register: (username: string, displayName: string, password: string) => Promise<boolean>;
  updateProfile: (displayName: string, newPassword?: string, currentPassword?: string) => Promise<{ ok: boolean; error?: string }>;
  clearError: () => void;
  getAllUsers: () => User[];
  deleteUser: (userId: string) => void;
  approveTeacher: (userId: string) => void;
  rejectTeacher: (userId: string) => void;
  updateUser: (userId: string, data: Partial<Pick<User, 'displayName' | 'teacherType'>>) => void;
  createTeacherByAdmin: (username: string, displayName: string, password: string, teacherType: TeacherType) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (userId: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  session: loadSession(),
  users: [],
  error: null,

  initUsers: async () => {
    const { data } = await supabase.from('AQUser').select('*').order('createdAt', { ascending: true });
    const users = (data ?? []).map(u => normalizeUser(u as Partial<User> & { id: string; username: string }));
    set({ users });
    // 按注册顺序分配颜色，保证各端颜色一致
    const { ensureTeacherColor } = useSettingsStore.getState();
    users.forEach(u => ensureTeacherColor(u.username));
  },

  login: async (username, password, role) => {
    const hash = await hashPassword(password);

    if (role === 'admin') {
      const { adminPasswordHash } = useSettingsStore.getState();
      if (hash !== adminPasswordHash) {
        set({ error: '管理员密码错误' });
        return false;
      }
      const session: AuthSession = {
        userId: 'admin',
        username: 'AQ001',
        displayName: '管理员',
        role: 'admin',
        approved: true,
      };
      saveSession(session);
      set({ session, error: null });
      return true;
    }

    const users = get().users;
    const user = users.find(u => u.username === username && u.role === 'teacher');
    if (!user || user.passwordHash !== hash) {
      set({ error: '用户名或密码错误' });
      return false;
    }
    const session: AuthSession = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      approved: user.approved,
    };
    saveSession(session);
    set({ session, error: null });
    return true;
  },

  logout: () => {
    saveSession(null);
    set({ session: null, error: null });
  },

  register: async (username, displayName, password) => {
    const users = get().users;
    if (users.some(u => u.username === username)) {
      set({ error: '用户名已存在' });
      return false;
    }
    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: uuidv4(),
      username,
      displayName,
      passwordHash,
      role: 'teacher',
      teacherType: 'lead',
      approved: false,
      createdAt: Date.now(),
    };
    const { error } = await supabase.from('AQUser').insert([newUser]);
    if (error) {
      set({ error: '注册失败，请重试' });
      return false;
    }
    useSettingsStore.getState().ensureTeacherColor(username);
    set({ users: [...users, newUser], error: null });
    return true;
  },

  updateProfile: async (displayName, newPassword, currentPassword) => {
    const state = get();
    const session = state.session;
    if (!session || session.role !== 'teacher') return { ok: false, error: '未登录' };

    const users = get().users;
    const user = users.find(u => u.username === session.username);
    if (!user) return { ok: false, error: '用户不存在' };

    if (newPassword) {
      if (!currentPassword) return { ok: false, error: '请输入当前密码' };
      const currentHash = await hashPassword(currentPassword);
      if (currentHash !== user.passwordHash) return { ok: false, error: '当前密码错误' };
      if (newPassword.length < 6) return { ok: false, error: '新密码至少6位' };
    }

    const updatedUser: User = {
      ...user,
      displayName: displayName.trim() || user.displayName,
      ...(newPassword ? { passwordHash: await hashPassword(newPassword) } : {}),
    };
    const { error } = await supabase.from('AQUser').update(updatedUser).eq('id', user.id);
    if (error) return { ok: false, error: '更新失败，请重试' };

    const newUsers = users.map(u => u.username === session.username ? updatedUser : u);
    set({ users: newUsers });
    const newSession: AuthSession = { ...session, displayName: updatedUser.displayName };
    saveSession(newSession);
    set({ session: newSession });
    return { ok: true };
  },

  clearError: () => set({ error: null }),

  getAllUsers: () => get().users,

  deleteUser: (userId: string) => {
    set(s => ({ users: s.users.filter(u => u.id !== userId) }));
    supabase.from('AQUser').delete().eq('id', userId).then(({ error }) => {
      if (error) console.error('删除用户同步失败：', error.message);
    });
  },

  approveTeacher: (userId: string) => {
    set(s => ({ users: s.users.map(u => u.id === userId ? { ...u, approved: true } : u) }));
    supabase.from('AQUser').update({ approved: true }).eq('id', userId).then(({ error }) => {
      if (error) console.error('审批用户同步失败：', error.message);
    });
  },

  rejectTeacher: (userId: string) => {
    set(s => ({ users: s.users.filter(u => u.id !== userId) }));
    supabase.from('AQUser').delete().eq('id', userId).then(({ error }) => {
      if (error) console.error('拒绝用户同步失败：', error.message);
    });
  },

  updateUser: (userId: string, data: Partial<Pick<User, 'displayName' | 'teacherType'>>) => {
    set(s => ({ users: s.users.map(u => u.id === userId ? { ...u, ...data } : u) }));
    supabase.from('AQUser').update(data).eq('id', userId).then(({ error }) => {
      if (error) console.error('更新用户同步失败：', error.message);
    });
  },

  resetPassword: async (userId, newPassword) => {
    if (newPassword.length < 6) return { ok: false, error: '密码至少6位' };
    const passwordHash = await hashPassword(newPassword);
    const { error } = await supabase.from('AQUser').update({ passwordHash }).eq('id', userId);
    if (error) return { ok: false, error: '重置失败，请重试' };
    set(s => ({ users: s.users.map(u => u.id === userId ? { ...u, passwordHash } : u) }));
    return { ok: true };
  },

  createTeacherByAdmin: async (username, displayName, password, teacherType) => {
    const users = get().users;
    if (users.some(u => u.username === username)) {
      return { ok: false, error: '用户名已存在' };
    }
    if (password.length < 6) {
      return { ok: false, error: '密码至少6位' };
    }
    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: uuidv4(),
      username,
      displayName,
      passwordHash,
      role: 'teacher',
      teacherType,
      approved: true,
      createdAt: Date.now(),
    };
    const { error } = await supabase.from('AQUser').insert([newUser]);
    if (error) return { ok: false, error: '创建失败，请重试' };
    useSettingsStore.getState().ensureTeacherColor(username);
    set({ users: [...users, newUser] });
    return { ok: true };
  },
}));
