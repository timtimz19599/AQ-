import { create } from 'zustand';
import type { User, AuthSession, UserRole } from '@/types/user';
import { hashPassword } from '@/utils/hashPassword';
import { useSettingsStore } from './settingsStore';
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'aq_session';
const USERS_KEY = 'aq_users';

function loadUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as User[];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
  error: string | null;
  login: (username: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  register: (username: string, displayName: string, password: string) => Promise<boolean>;
  updateProfile: (displayName: string, newPassword?: string, currentPassword?: string) => Promise<{ ok: boolean; error?: string }>;
  clearError: () => void;
  getAllUsers: () => User[];
}

export const useAuthStore = create<AuthState>()((set) => ({
  session: loadSession(),
  error: null,

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
      };
      saveSession(session);
      set({ session, error: null });
      return true;
    }

    // Teacher login
    const users = loadUsers();
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
    const users = loadUsers();
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
      createdAt: Date.now(),
    };
    saveUsers([...users, newUser]);
    // Ensure color assigned
    useSettingsStore.getState().ensureTeacherColor(username);
    set({ error: null });
    return true;
  },

  updateProfile: async (displayName, newPassword, currentPassword) => {
    const state = useAuthStore.getState();
    const session = state.session;
    if (!session || session.role !== 'teacher') return { ok: false, error: '未登录' };

    const users = loadUsers();
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
    saveUsers(users.map(u => u.username === session.username ? updatedUser : u));

    const newSession: AuthSession = { ...session, displayName: updatedUser.displayName };
    saveSession(newSession);
    set({ session: newSession });
    return { ok: true };
  },

  clearError: () => set({ error: null }),

  getAllUsers: () => loadUsers(),
}));
