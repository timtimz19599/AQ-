import { create } from 'zustand';
import type { User, AuthSession, UserRole, TeacherType } from '@/types/user';
import { hashPassword } from '@/utils/hashPassword';
import { useSettingsStore } from './settingsStore';
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'aq_session';
const USERS_KEY = 'aq_users';

// Normalize users loaded from localStorage (handle missing fields from older data)
function normalizeUser(u: Partial<User> & { id: string; username: string }): User {
  return {
    teacherType: 'lead',
    approved: true, // existing users without flag are treated as approved
    displayName: u.username,
    passwordHash: '',
    role: 'teacher',
    createdAt: Date.now(),
    ...u,
  } as User;
}

function loadUsers(): User[] {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as Partial<User>[];
    return raw.map(u => normalizeUser(u as Partial<User> & { id: string; username: string }));
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
  users: User[];
  error: string | null;
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
  users: loadUsers(),
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
        approved: true,
      };
      saveSession(session);
      set({ session, error: null });
      return true;
    }

    // Teacher login
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
      approved: false, // requires admin approval
      createdAt: Date.now(),
    };
    const newUsers = [...users, newUser];
    saveUsers(newUsers);
    useSettingsStore.getState().ensureTeacherColor(username);
    set({ users: newUsers, error: null });
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
    const newUsers = users.map(u => u.username === session.username ? updatedUser : u);
    saveUsers(newUsers);
    set({ users: newUsers });

    const newSession: AuthSession = { ...session, displayName: updatedUser.displayName };
    saveSession(newSession);
    set({ session: newSession });
    return { ok: true };
  },

  clearError: () => set({ error: null }),

  getAllUsers: () => get().users,

  deleteUser: (userId: string) => {
    const newUsers = get().users.filter(u => u.id !== userId);
    saveUsers(newUsers);
    set({ users: newUsers });
  },

  approveTeacher: (userId: string) => {
    const newUsers = get().users.map(u => u.id === userId ? { ...u, approved: true } : u);
    saveUsers(newUsers);
    set({ users: newUsers });
  },

  rejectTeacher: (userId: string) => {
    // Rejecting = deleting the pending registration
    const newUsers = get().users.filter(u => u.id !== userId);
    saveUsers(newUsers);
    set({ users: newUsers });
  },

  updateUser: (userId: string, data: Partial<Pick<User, 'displayName' | 'teacherType'>>) => {
    const newUsers = get().users.map(u => u.id === userId ? { ...u, ...data } : u);
    saveUsers(newUsers);
    set({ users: newUsers });
  },

  resetPassword: async (userId, newPassword) => {
    if (newPassword.length < 6) return { ok: false, error: '密码至少6位' };
    const passwordHash = await hashPassword(newPassword);
    const newUsers = get().users.map(u => u.id === userId ? { ...u, passwordHash } : u);
    saveUsers(newUsers);
    set({ users: newUsers });
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
    const newUsers = [...users, newUser];
    saveUsers(newUsers);
    useSettingsStore.getState().ensureTeacherColor(username);
    set({ users: newUsers });
    return { ok: true };
  },
}));
